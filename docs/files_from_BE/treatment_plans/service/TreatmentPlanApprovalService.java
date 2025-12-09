package com.dental.clinic.management.treatment_plans.service;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.domain.PatientPlanItem;
import com.dental.clinic.management.treatment_plans.domain.PatientTreatmentPlan;
import com.dental.clinic.management.treatment_plans.domain.PlanAuditLog;
import com.dental.clinic.management.treatment_plans.dto.TreatmentPlanDetailResponse;
import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import com.dental.clinic.management.treatment_plans.dto.request.ApproveTreatmentPlanRequest;
import com.dental.clinic.management.treatment_plans.dto.response.ApprovalMetadataDTO;
import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import com.dental.clinic.management.treatment_plans.repository.PlanAuditLogRepository;
import com.dental.clinic.management.utils.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for Treatment Plan Approval Workflow (API 5.9 - V20).
 * Handles approval/rejection of treatment plans by managers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TreatmentPlanApprovalService {

    private final PatientTreatmentPlanRepository planRepository;
    private final PlanAuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;

    // V21: Clinical Rules Validation
    private final com.dental.clinic.management.service.service.ClinicalRulesValidationService clinicalRulesValidationService;
    private final com.dental.clinic.management.booking_appointment.repository.PatientPlanItemRepository itemRepository;

    /**
     * API 5.9: Approve or Reject a treatment plan.
     *
     * Business Rules:
     * 1. Plan must exist
     * 2. Plan must be in PENDING_REVIEW status
     * 3. If REJECTED, notes are mandatory
     * 4. (REMOVED) Zero-price validation - plans with free services can be approved
     * 5. Log audit trail
     *
     * @param planCode The unique plan code
     * @param request  The approval request with status and notes
     * @return Updated treatment plan detail
     */
    @Transactional
    public TreatmentPlanDetailResponse approveTreatmentPlan(
            String planCode,
            ApproveTreatmentPlanRequest request) {

        log.info("Starting approval process for plan: {}", planCode);

        // 1. Get current manager from security context
        Integer managerId = getCurrentEmployeeId();

        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new NotFoundException("Nhân viên không tồn tại"));

        // 2. Find treatment plan
        PatientTreatmentPlan plan = planRepository.findByPlanCode(planCode)
                .orElseThrow(() -> new NotFoundException("Lộ trình điều trị không tồn tại"));

        // 3. GUARD: Must be in PENDING_REVIEW status
        if (plan.getApprovalStatus() != ApprovalStatus.PENDING_REVIEW) {
            throw new ConflictException(
                    String.format("Không thể duyệt lộ trình ở trạng thái '%s'. Chỉ duyệt được lộ trình 'Chờ duyệt'.",
                            plan.getApprovalStatus()));
        }

        // 4. GUARD: Notes required for REJECTION
        if (request.isRejection() && !StringUtils.hasText(request.getNotes())) {
            throw new BadRequestException("Phải có lý do khi từ chối lộ trình điều trị");
        }

        // 5. GUARD (P1): Check for zero-price items if APPROVED
        // FE Issue #3 Fix: Removed zero-price validation to allow approval of plans with free services
        // Finance can adjust prices later via API 5.13 (Update Prices)
        // if (request.isApproval()) {
        //     validateNoPriceItemsForApproval(plan);
        // }

        // 6. Store old status for audit log
        ApprovalStatus oldStatus = plan.getApprovalStatus();

        // 7. Update plan based on approval decision
        ApprovalStatus newStatus = determineNewApprovalStatus(request);
        plan.setApprovalStatus(newStatus);
        plan.setApprovedBy(manager);
        plan.setApprovedAt(LocalDateTime.now());

        // Store notes (could be approval reason or rejection reason)
        if (StringUtils.hasText(request.getNotes())) {
            plan.setRejectionReason(request.getNotes()); // Reuse rejection_reason column for all notes
        }

        // 8. Save plan
        plan = planRepository.save(plan);
        log.info("Updated plan {} to approval status: {}", planCode, newStatus);

        // 8B. V21: If APPROVED, activate items with clinical rules check
        if (newStatus == ApprovalStatus.APPROVED) {
            activateItemsWithClinicalRulesCheck(plan);
        }

        // 9. Create audit log (P0 requirement)
        PlanAuditLog auditLog = PlanAuditLog.createApprovalLog(
                plan,
                manager,
                oldStatus,
                newStatus,
                request.getNotes());
        auditLogRepository.save(auditLog);
        log.info("Created audit log for plan {} approval action", planCode);

        // 10. Map to response DTO
        TreatmentPlanDetailResponse response = mapToDetailResponse(plan);

        // 11. Add approval metadata to response (P1 requirement)
        if (plan.getApprovedBy() != null && plan.getApprovedAt() != null) {
            response.setApprovalMetadata(buildApprovalMetadata(plan));
        }

        log.info("Approval process completed for plan: {}", planCode);
        return response;
    }

    /**
     * Map PatientTreatmentPlan entity to TreatmentPlanDetailResponse.
     * Simplified mapping for approval response - focuses on plan-level data.
     */
    private TreatmentPlanDetailResponse mapToDetailResponse(PatientTreatmentPlan plan) {
        // Build doctor info
        Employee doctor = plan.getCreatedBy();
        TreatmentPlanDetailResponse.DoctorInfoDTO doctorInfo = null;
        if (doctor != null) {
            doctorInfo = TreatmentPlanDetailResponse.DoctorInfoDTO.builder()
                    .employeeCode(doctor.getEmployeeCode())
                    .fullName(doctor.getFirstName() + " " + doctor.getLastName())
                    .build();
        }

        // Build patient info
        TreatmentPlanDetailResponse.PatientInfoDTO patientInfo = TreatmentPlanDetailResponse.PatientInfoDTO.builder()
                .patientCode(plan.getPatient().getPatientCode())
                .fullName(plan.getPatient().getFirstName() + " " + plan.getPatient().getLastName())
                .build();

        // Retrieve submit notes from audit log (if plan was submitted for review)
        String submitNotes = getSubmitNotesFromAuditLog(plan.getPlanId());

        // Build response
        return TreatmentPlanDetailResponse.builder()
                .planId(plan.getPlanId())
                .planCode(plan.getPlanCode())
                .planName(plan.getPlanName())
                .status(plan.getStatus() != null ? plan.getStatus().name() : null)
                .approvalStatus(plan.getApprovalStatus() != null ? plan.getApprovalStatus().name() : null)
                .doctor(doctorInfo)
                .patient(patientInfo)
                .startDate(plan.getStartDate())
                .expectedEndDate(plan.getExpectedEndDate())
                .createdAt(plan.getCreatedAt())
                .totalPrice(plan.getTotalPrice())
                .discountAmount(plan.getDiscountAmount())
                .finalCost(plan.getFinalCost())
                .paymentType(plan.getPaymentType() != null ? plan.getPaymentType().name() : null)
                .submitNotes(submitNotes)
                // Phases will be loaded separately if needed, or can be mapped here
                .build();
    }

    /**
     * Retrieve submit notes from audit log.
     * Looks for the most recent SUBMITTED_FOR_REVIEW action and returns its notes.
     *
     * @param planId Treatment plan ID
     * @return Submit notes, or null if not found
     */
    private String getSubmitNotesFromAuditLog(Long planId) {
        List<PlanAuditLog> logs = auditLogRepository.findByPlanIdOrderByCreatedAtDesc(planId);
        
        return logs.stream()
                .filter(log -> "SUBMITTED_FOR_REVIEW".equals(log.getActionType()))
                .findFirst()
                .map(PlanAuditLog::getNotes)
                .orElse(null);
    }

    /**
     * Validate that all items have price > 0 before approval (P1 Guard)
     */
    @SuppressWarnings("unused")
    private void validateNoPriceItemsForApproval(PatientTreatmentPlan plan) {
        boolean hasZeroPriceItem = plan.getPhases().stream()
                .flatMap(phase -> phase.getItems().stream())
                .anyMatch(item -> {
                    BigDecimal price = item.getPrice();
                    return price == null || price.compareTo(BigDecimal.ZERO) <= 0;
                });

        if (hasZeroPriceItem) {
            throw new BadRequestException(
                    "Không thể duyệt: Còn hạng mục có giá 0đ hoặc chưa có giá. " +
                            "Yêu cầu Bác sĩ cập nhật lại giá trước khi duyệt.");
        }
    }

    /**
     * Get current employee ID from security context.
     */
    private Integer getCurrentEmployeeId() {
        String username = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not authenticated"));

        return accountRepository.findOneByUsername(username)
                .map(account -> account.getEmployee().getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found for user: " + username));
    }

    /**
     * Determine new approval status based on request.
     * APPROVED -> APPROVED
     * REJECTED -> DRAFT (return to draft for doctor to revise)
     */
    private ApprovalStatus determineNewApprovalStatus(ApproveTreatmentPlanRequest request) {
        if (request.isApproval()) {
            return ApprovalStatus.APPROVED;
        } else if (request.isRejection()) {
            return ApprovalStatus.DRAFT; // Return to DRAFT for revision
        }
        throw new IllegalStateException("Invalid approval status: " + request.getApprovalStatus());
    }

    /**
     * Build approval metadata DTO for response (P1 requirement)
     */
    private ApprovalMetadataDTO buildApprovalMetadata(PatientTreatmentPlan plan) {
        Employee approver = plan.getApprovedBy();

        ApprovalMetadataDTO.EmployeeBasicDTO approverInfo = ApprovalMetadataDTO.EmployeeBasicDTO.builder()
                .employeeCode(approver.getEmployeeCode())
                .fullName(approver.getFirstName() + " " + approver.getLastName())
                .build();

        return ApprovalMetadataDTO.builder()
                .approvedBy(approverInfo)
                .approvedAt(plan.getApprovedAt())
                .notes(plan.getRejectionReason()) // Reusing this field for all approval notes
                .build();
    }

    // ====================================================================
    // V21: Clinical Rules Integration for Plan Activation
    // ====================================================================

    /**
     * V21: Activate plan items with clinical rules awareness.
     *
     * When plan is APPROVED, iterate through all items in PENDING status.
     * For each item with a service_id:
     * - If service has prerequisites → set status to WAITING_FOR_PREREQUISITE
     * - Else → set status to READY_FOR_BOOKING
     *
     * This ensures items are not bookable until prerequisites are met.
     *
     * @param plan The approved treatment plan
     */
    private void activateItemsWithClinicalRulesCheck(PatientTreatmentPlan plan) {
        log.info("V21: Activating plan {} items with clinical rules check", plan.getPlanCode());

        int itemsActivated = 0;
        int itemsWaiting = 0;

        for (var phase : plan.getPhases()) {
            for (PatientPlanItem item : phase.getItems()) {
                // Only process PENDING items
                if (item.getStatus() != PlanItemStatus.PENDING) {
                    continue;
                }

                // Skip items without service (shouldn't happen, but safety check)
                if (item.getServiceId() == null) {
                    log.warn("V21: Item {} has no service, skipping", item.getItemId());
                    continue;
                }

                Long serviceId = item.getServiceId().longValue();

                // Check if service has prerequisites
                boolean hasPrereqs = clinicalRulesValidationService.hasPrerequisites(serviceId);

                if (hasPrereqs) {
                    // Service requires prerequisites → WAITING
                    item.setStatus(PlanItemStatus.WAITING_FOR_PREREQUISITE);
                    itemsWaiting++;
                    log.debug("V21: Item {} (service {}) → WAITING_FOR_PREREQUISITE (has prerequisites)",
                            item.getItemId(), serviceId);
                } else {
                    // No prerequisites → READY
                    item.setStatus(PlanItemStatus.READY_FOR_BOOKING);
                    itemsActivated++;
                    log.debug("V21: Item {} (service {}) → READY_FOR_BOOKING (no prerequisites)",
                            item.getItemId(), serviceId);
                }

                itemRepository.save(item);
            }
        }

        log.info("V21:  Plan {} activation complete - {} items READY, {} items WAITING for prerequisites",
                plan.getPlanCode(), itemsActivated, itemsWaiting);
    }

    /**
     * API 5.12: Submit Treatment Plan for Review.
     * Changes plan status from DRAFT → PENDING_REVIEW.
     *
     * Business Rules:
     * 1. Plan must exist
     * 2. Plan must be in DRAFT status
     * 3. Plan must have at least 1 phase and 1 item
     * 4. Log audit trail
     *
     * @param planCode The unique plan code
     * @param request  The submit request with optional notes
     * @return Updated treatment plan detail
     */
    @Transactional
    public TreatmentPlanDetailResponse submitForReview(
            String planCode,
            com.dental.clinic.management.treatment_plans.dto.request.SubmitForReviewRequest request) {
        log.info("API 5.12: Submitting treatment plan {} for review", planCode);

        // STEP 1: Find plan
        PatientTreatmentPlan plan = planRepository.findByPlanCode(planCode)
                .orElseThrow(() -> new NotFoundException(
                        "PLAN_NOT_FOUND",
                        "Không tìm thấy lộ trình điều trị với mã: " + planCode));

        log.debug("Found plan {} with current status: {}", planCode, plan.getApprovalStatus());

        // STEP 2: Validate plan is in DRAFT status
        if (plan.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new ConflictException(
                    String.format("Chỉ có thể gửi duyệt lộ trình ở trạng thái 'Nháp'. Trạng thái hiện tại: %s",
                            plan.getApprovalStatus()));
        }

        // STEP 3: Validate plan has content (at least 1 phase and 1 item)
        if (plan.getPhases() == null || plan.getPhases().isEmpty()) {
            throw new BadRequestException(
                    "EMPTY_PLAN",
                    "Không thể gửi duyệt lộ trình chưa có giai đoạn nào.");
        }

        boolean hasItems = plan.getPhases().stream()
                .anyMatch(phase -> phase.getItems() != null && !phase.getItems().isEmpty());

        if (!hasItems) {
            throw new BadRequestException(
                    "NO_ITEMS",
                    "Không thể gửi duyệt lộ trình chưa có hạng mục nào.");
        }

        // STEP 4: Get current user for audit
        Integer employeeId = getCurrentEmployeeId();
        Employee submitter = null;
        if (employeeId != null) {
            submitter = employeeRepository.findById(employeeId).orElse(null);
        }

        // STEP 5: Change status to PENDING_REVIEW
        ApprovalStatus oldStatus = plan.getApprovalStatus();
        plan.setApprovalStatus(ApprovalStatus.PENDING_REVIEW);

        PatientTreatmentPlan savedPlan = planRepository.save(plan);

        log.info("Plan {} status changed: {} → PENDING_REVIEW",
                planCode, oldStatus);

        // STEP 6: Create audit log
        String notes = (request != null && StringUtils.hasText(request.getNotes()))
                ? request.getNotes()
                : "Gửi duyệt lộ trình điều trị";

        PlanAuditLog auditLog = PlanAuditLog.createApprovalLog(
                savedPlan,
                submitter,
                oldStatus,
                ApprovalStatus.PENDING_REVIEW,
                notes);
        auditLogRepository.save(auditLog);

        log.info("Audit log created for plan {} submission", planCode);

        // STEP 7: Build response
        TreatmentPlanDetailResponse response = mapToDetailResponse(savedPlan);

        // Add approval metadata
        if (savedPlan.getApprovedAt() != null) {
            response.setApprovalMetadata(buildApprovalMetadata(savedPlan));
        }

        log.info("API 5.12: Successfully submitted plan {} for review", planCode);

        return response;
    }
}
