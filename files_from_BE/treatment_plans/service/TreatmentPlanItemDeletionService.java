package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.account.domain.Account;
import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.treatment_plans.domain.*;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.dto.response.DeletePlanItemResponse;
import com.dental.clinic.management.treatment_plans.repository.PlanAuditLogRepository;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Service cho API 5.11: Xóa Hạng mục khỏi Lộ trình
 *
 * Business Logic:
 * - 2 Guards: Item status check, Approval status check
 * - Financial calculation TRƯỚC KHI delete (tránh lost reference)
 * - Audit log với format chuẩn: "Item {id} ({name}): -{price} VND"
 * - Keep DRAFT status (no auto-trigger)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanItemDeletionService {

        private final PatientPlanItemRepository itemRepository;
        private final PatientTreatmentPlanRepository planRepository;
        private final PlanAuditLogRepository auditLogRepository;
        private final EmployeeRepository employeeRepository;
        private final AccountRepository accountRepository;
        private final TreatmentPlanRBACService rbacService;

        /**
         * Xóa một hạng mục khỏi lộ trình điều trị
         *
         * @param itemId ID của hạng mục cần xóa
         * @return DeletePlanItemResponse chứa thông tin item đã xóa và tác động tài
         *         chính
         * @throws NotFoundException nếu item không tồn tại
         * @throws ConflictException nếu item đã scheduled/in-progress/completed hoặc
         *                           plan không ở DRAFT
         */
        @Transactional
        public DeletePlanItemResponse deleteItem(Long itemId) {
                log.info("🗑️ API 5.11: Deleting plan item with id: {}", itemId);

                // 1️⃣ Validate: Find item
                PatientPlanItem item = itemRepository.findById(itemId)
                                .orElseThrow(() -> {
                                        log.error("Item not found: {}", itemId);
                                        return new NotFoundException("Hạng mục không tồn tại");
                                });

                // 2️⃣ Get parent entities and item data (BEFORE delete)
                PatientPlanPhase phase = item.getPhase();
                PatientTreatmentPlan plan = phase.getTreatmentPlan();
                BigDecimal deletedPrice = item.getPrice();
                String deletedItemName = item.getItemName();

                // 2.5️⃣ RBAC verification (EMPLOYEE can only modify plans they created)
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                rbacService.verifyEmployeeCanModifyPlan(plan, authentication);

                log.info("📋 Item details: id={}, name='{}', price={}, status={}, plan_id={}",
                                itemId, deletedItemName, deletedPrice, item.getStatus(), plan.getPlanId());

                // 3️⃣ GUARD 1: Item Status Check (CRITICAL!)
                validateItemNotScheduledOrCompleted(item);

                // 4️⃣ GUARD 2: Approval Status Check (CRITICAL!)
                validatePlanNotApprovedOrPendingReview(plan);

                // 5️⃣ Update Finances (BEFORE delete - tránh lost reference)
                updatePlanFinances(plan, deletedPrice);

                // 6️⃣ Execute Delete
                itemRepository.delete(item);
                log.info("Item {} deleted from database", itemId);

                // 7️⃣ Create Audit Log (AFTER delete - using saved data)
                Integer performedBy = getCurrentEmployeeId();
                createAuditLog(plan, performedBy, itemId, deletedItemName, deletedPrice);

                // 8️⃣ Build Response (Option B)
                DeletePlanItemResponse response = DeletePlanItemResponse.of(
                                itemId,
                                deletedItemName,
                                deletedPrice,
                                plan.getTotalPrice(),
                                plan.getFinalCost());

                log.info("API 5.11 completed: Item {} deleted. Price reduction: {} VND. New plan total: {} VND",
                                itemId, deletedPrice, plan.getTotalPrice());

                return response;
        }

        /**
         * GUARD 1: Item must be PENDING (not scheduled, in-progress, or completed)
         *
         * @throws ConflictException if item is SCHEDULED/IN_PROGRESS/COMPLETED
         */
        private void validateItemNotScheduledOrCompleted(PatientPlanItem item) {
                if (item.getStatus() == PlanItemStatus.SCHEDULED
                                || item.getStatus() == PlanItemStatus.IN_PROGRESS
                                || item.getStatus() == PlanItemStatus.COMPLETED) {

                        String errorMsg = String.format(
                                        "Không thể xóa hạng mục đã được đặt lịch hoặc đang thực hiện (Trạng thái: %s). "
                                                        +
                                                        "Vui lòng hủy lịch hẹn hoặc đánh dấu 'Bỏ qua' (Skip) nếu cần.",
                                        item.getStatus());

                        log.error("GUARD 1 FAILED: Item {} has status {}", item.getItemId(), item.getStatus());

                        // Use specific error code for better frontend handling
                        throw new ConflictException("ITEM_SCHEDULED_CANNOT_DELETE", errorMsg);
                }

                log.debug("GUARD 1 PASSED: Item {} is in status {}", item.getItemId(), item.getStatus());
        }

        /**
         * GUARD 2: Plan must be DRAFT (not APPROVED or PENDING_REVIEW)
         *
         * @throws ConflictException if plan is APPROVED or PENDING_REVIEW
         */
        private void validatePlanNotApprovedOrPendingReview(PatientTreatmentPlan plan) {
                if (plan.getApprovalStatus() == ApprovalStatus.APPROVED
                                || plan.getApprovalStatus() == ApprovalStatus.PENDING_REVIEW) {

                        String errorMsg = String.format(
                                        "Không thể xóa hạng mục khỏi lộ trình đã được duyệt hoặc đang chờ duyệt (Trạng thái: %s). "
                                                        +
                                                        "Yêu cầu Quản lý 'Từ chối' (Reject) về DRAFT trước khi sửa.",
                                        plan.getApprovalStatus());

                        log.error("GUARD 2 FAILED: Plan {} has approval status {}",
                                        plan.getPlanId(), plan.getApprovalStatus());

                        // Use specific error code for better frontend handling
                        throw new ConflictException("PLAN_APPROVED_CANNOT_DELETE", errorMsg);
                }

                log.debug("GUARD 2 PASSED: Plan {} is in approval status {}",
                                plan.getPlanId(), plan.getApprovalStatus());
        }

        /**
         * Update plan financial totals (BEFORE delete)
         *
         * Assumption: Discount amount is fixed, so both totalCost and finalCost
         * decrease by deletedPrice
         */
        private void updatePlanFinances(PatientTreatmentPlan plan, BigDecimal deletedPrice) {
                BigDecimal oldTotalPrice = plan.getTotalPrice();
                BigDecimal oldFinalCost = plan.getFinalCost();

                plan.setTotalPrice(plan.getTotalPrice().subtract(deletedPrice));
                plan.setFinalCost(plan.getFinalCost().subtract(deletedPrice));

                planRepository.save(plan);

                log.info("💰 Financial update: TotalPrice {} -> {}, FinalCost {} -> {}",
                                oldTotalPrice, plan.getTotalPrice(),
                                oldFinalCost, plan.getFinalCost());
        }

        /**
         * Create audit log với format chuẩn hóa: "Item {id} ({name}): -{price} VND"
         *
         * Format giống API 5.10 để dễ parse/search logs
         */
        private void createAuditLog(PatientTreatmentPlan plan, Integer performedBy,
                        Long itemId, String itemName, BigDecimal price) {
                // Standardized format (consistent with API 5.10)
                String notes = String.format("Item %d (%s): -%.0f VND", itemId, itemName, price);

                Employee performer = employeeRepository.findById(performedBy)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                PlanAuditLog auditLog = PlanAuditLog.builder()
                                .treatmentPlan(plan)
                                .actionType("ITEM_DELETED")
                                .performedBy(performer)
                                .notes(notes)
                                .oldApprovalStatus(plan.getApprovalStatus())
                                .newApprovalStatus(plan.getApprovalStatus()) // No change (keep DRAFT)
                                .build();

                auditLogRepository.save(auditLog);

                log.info("Audit log created: action=ITEM_DELETED, notes='{}'", notes);
        }

        /**
         * Get current employee ID from security context
         */
        private Integer getCurrentEmployeeId() {
                Optional<String> currentLogin = SecurityUtil.getCurrentUserLogin();
                if (currentLogin.isEmpty()) {
                        log.error("No authenticated user found in security context");
                        throw new ConflictException("AUTH_USER_NOT_FOUND", "Không thể xác định người thực hiện");
                }

                Account account = accountRepository.findByUsernameWithRoleAndPermissions(currentLogin.get())
                                .orElseThrow(() -> new NotFoundException("Account not found"));

                if (account.getEmployee() == null || account.getEmployee().getEmployeeId() == null) {
                        log.error("Account {} has no linked employee", currentLogin.get());
                        throw new ConflictException("EMPLOYEE_NOT_LINKED", "Tài khoản không liên kết với nhân viên");
                }

                return account.getEmployee().getEmployeeId();
        }
}
