package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.domain.PlanAuditLog;
import com.dental.clinic.management.treatment_plans.dto.request.UpdatePlanItemRequest;
import com.dental.clinic.management.treatment_plans.dto.response.UpdatePlanItemResponse;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.treatment_plans.repository.PlanAuditLogRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Service for API 5.10: Update Treatment Plan Item.
 * Handles updating item details (name, price, estimated time) with business
 * rules validation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanItemUpdateService {

    private final PatientPlanItemRepository itemRepository;
    private final PatientTreatmentPlanRepository planRepository;
    private final PlanAuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;
    private final TreatmentPlanRBACService rbacService;

    /**
     * API 5.10: Update a treatment plan item.
     *
     * Business Rules:
     * 1. Item must exist
     * 2. Item must NOT be SCHEDULED, IN_PROGRESS, or COMPLETED
     * 3. Plan must NOT be APPROVED or PENDING_REVIEW
     * 4. Update item fields (only non-null values)
     * 5. Recalculate plan finances if price changed
     * 6. Create audit log (action: ITEM_UPDATED)
     * 7. Keep approval status as DRAFT (no auto-trigger to PENDING_REVIEW)
     *
     * @param itemId  The item ID to update
     * @param request The update request with optional fields
     * @return Response with updated item and financial impact
     */
    @Transactional
    public UpdatePlanItemResponse updatePlanItem(Long itemId, UpdatePlanItemRequest request) {

        log.info("Starting update for plan item: {}", itemId);

        // 0. Validate request has at least one field
        if (!request.hasAnyUpdate()) {
            throw new BadRequestException("Phải có ít nhất một trường cần cập nhật");
        }

        // 1. Find item
        PatientPlanItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Hạng mục không tồn tại"));

        // 2. Get treatment plan
        PatientTreatmentPlan plan = item.getPhase().getTreatmentPlan();

        // 2.5. RBAC verification (EMPLOYEE can only modify plans they created)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        rbacService.verifyEmployeeCanModifyPlan(plan, authentication);

        // 3. GUARD 1: Item status check
        validateItemNotScheduledOrCompleted(item);

        // 4. GUARD 2: Approval status check
        validatePlanNotApprovedOrPendingReview(plan);

        // 5. Store old price for financial calculation
        BigDecimal oldPrice = item.getPrice();

        // 6. Update item fields (only non-null)
        boolean updated = updateItemFields(item, request);

        if (!updated) {
            throw new BadRequestException("Không có thay đổi nào được thực hiện");
        }

        // 7. Save item
        item = itemRepository.save(item);
        log.info("Updated item {} successfully", itemId);

        // 8. Calculate financial impact
        BigDecimal newPrice = item.getPrice();
        BigDecimal priceChange = BigDecimal.ZERO;

        if (!oldPrice.equals(newPrice)) {
            priceChange = newPrice.subtract(oldPrice);
            updatePlanFinances(plan, priceChange);
            log.info("Updated plan finances. Price change: {}", priceChange);
        }

        // 9. Create audit log
        createAuditLog(plan, item, oldPrice, newPrice);

        // 10. Build response
        return buildResponse(item, plan, priceChange);
    }

    /**
     * GUARD 1: Validate item is not scheduled or completed
     */
    private void validateItemNotScheduledOrCompleted(PatientPlanItem item) {
        PlanItemStatus status = item.getStatus();

        if (status == PlanItemStatus.SCHEDULED ||
                status == PlanItemStatus.IN_PROGRESS ||
                status == PlanItemStatus.COMPLETED) {

            throw new ConflictException(
                    String.format("Không thể sửa hạng mục đã được đặt lịch hoặc đã hoàn thành (Trạng thái: %s). " +
                            "Vui lòng hủy lịch hẹn trước khi sửa.", status));
        }
    }

    /**
     * GUARD 2: Validate plan is not approved or pending review
     */
    private void validatePlanNotApprovedOrPendingReview(PatientTreatmentPlan plan) {
        ApprovalStatus approvalStatus = plan.getApprovalStatus();

        if (approvalStatus == ApprovalStatus.APPROVED ||
                approvalStatus == ApprovalStatus.PENDING_REVIEW) {

            String errorMsg = String
                    .format("Không thể sửa lộ trình đã được duyệt hoặc đang chờ duyệt (Trạng thái: %s). " +
                            "Yêu cầu Quản lý 'Từ chối' (Reject) về DRAFT trước khi sửa.", approvalStatus);

            // Use specific error code for better frontend handling
            throw new ConflictException("PLAN_APPROVED_CANNOT_UPDATE", errorMsg);
        }
    }

    /**
     * Update item fields (only non-null values from request)
     * Returns true if any field was updated
     */
    private boolean updateItemFields(PatientPlanItem item, UpdatePlanItemRequest request) {
        boolean updated = false;

        if (request.getItemName() != null) {
            item.setItemName(request.getItemName());
            updated = true;
            log.debug("Updated itemName to: {}", request.getItemName());
        }

        if (request.getPrice() != null) {
            item.setPrice(request.getPrice());
            updated = true;
            log.debug("Updated price to: {}", request.getPrice());
        }

        if (request.getEstimatedTimeMinutes() != null) {
            item.setEstimatedTimeMinutes(request.getEstimatedTimeMinutes());
            updated = true;
            log.debug("Updated estimatedTimeMinutes to: {}", request.getEstimatedTimeMinutes());
        }

        return updated;
    }

    /**
     * Update plan finances when price changes
     */
    private void updatePlanFinances(PatientTreatmentPlan plan, BigDecimal priceChange) {
        // Update total price
        BigDecimal newTotalPrice = plan.getTotalPrice().add(priceChange);
        plan.setTotalPrice(newTotalPrice);

        // Update final cost (assuming discount is fixed and doesn't change)
        BigDecimal newFinalCost = plan.getFinalCost().add(priceChange);
        plan.setFinalCost(newFinalCost);

        planRepository.save(plan);
    }

    /**
     * Create audit log for item update
     */
    private void createAuditLog(PatientTreatmentPlan plan, PatientPlanItem item,
            BigDecimal oldPrice, BigDecimal newPrice) {

        Integer doctorId = getCurrentEmployeeId();
        Employee doctor = employeeRepository.findById(doctorId)
                .orElseThrow(() -> new NotFoundException("Nhân viên không tồn tại"));

        String notes = buildAuditNotes(item, oldPrice, newPrice);

        PlanAuditLog auditLog = PlanAuditLog.builder()
                .treatmentPlan(plan)
                .actionType("ITEM_UPDATED")
                .performedBy(doctor)
                .notes(notes)
                .oldApprovalStatus(plan.getApprovalStatus())
                .newApprovalStatus(plan.getApprovalStatus()) // No change (keep DRAFT)
                .build();

        auditLogRepository.save(auditLog);
        log.info("Created audit log for item update: {}", item.getItemId());
    }

    /**
     * Build audit log notes
     */
    private String buildAuditNotes(PatientPlanItem item, BigDecimal oldPrice, BigDecimal newPrice) {
        if (!oldPrice.equals(newPrice)) {
            return String.format("Cập nhật item %d (%s): Giá thay đổi từ %s -> %s",
                    item.getItemId(),
                    item.getItemName(),
                    oldPrice,
                    newPrice);
        } else {
            return String.format("Cập nhật item %d (%s): Sửa tên hoặc thời gian ước tính",
                    item.getItemId(),
                    item.getItemName());
        }
    }

    /**
     * Build response DTO
     */
    private UpdatePlanItemResponse buildResponse(PatientPlanItem item,
            PatientTreatmentPlan plan,
            BigDecimal priceChange) {

        UpdatePlanItemResponse.UpdatedItemDTO itemDTO = UpdatePlanItemResponse.UpdatedItemDTO.builder()
                .itemId(item.getItemId())
                .sequenceNumber(item.getSequenceNumber())
                .itemName(item.getItemName())
                .serviceId(item.getServiceId())
                .price(item.getPrice())
                .estimatedTimeMinutes(item.getEstimatedTimeMinutes())
                .status(item.getStatus().name())
                .build();

        UpdatePlanItemResponse.FinancialImpactDTO financialImpact = UpdatePlanItemResponse.FinancialImpactDTO.builder()
                .planTotalCost(plan.getTotalPrice())
                .planFinalCost(plan.getFinalCost())
                .priceChange(priceChange)
                .build();

        return UpdatePlanItemResponse.builder()
                .updatedItem(itemDTO)
                .financialImpact(financialImpact)
                .build();
    }

    /**
     * Get current employee ID from security context
     */
    private Integer getCurrentEmployeeId() {
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));

        return accountRepository.findOneByUsername(username)
                .map(account -> account.getEmployee().getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
    }
}
