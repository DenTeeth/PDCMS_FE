package com.dental.clinic.management.treatment_plans.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Treatment Plan Detail Response (API 5.2 - REVISED VERSION V18).
 *
 * Endpoint: GET /api/v1/patients/{patientCode}/treatment-plans/{planCode}
 *
 * Nested structure matching REVISED API SPEC:
 * - Plan level (root)
 * - Doctor info
 * - Patient info
 * - Progress summary
 * - List of Phases
 * - List of Items
 * - List of Linked Appointments
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentPlanDetailResponse {

    // ===== PLAN LEVEL =====

    /**
     * Internal plan ID (for backend operations)
     */
    private Long planId;

    /**
     * Business key (e.g., PLAN-20251001-001)
     */
    private String planCode;

    /**
     * Plan name
     */
    private String planName;

    /**
     * Plan status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
     */
    private String status;

    /**
     * Approval status (V20): DRAFT, PENDING_REVIEW, APPROVED, REJECTED
     */
    private String approvalStatus;

    /**
     * Approval metadata (V20): Who approved/rejected, when, and notes
     */
    private com.dental.clinic.management.treatment_plans.dto.response.ApprovalMetadataDTO approvalMetadata;

    /**
     * Submit notes: Notes provided by doctor when submitting plan for review (API 5.12)
     * Retrieved from audit log (action_type = 'SUBMITTED_FOR_REVIEW')
     */
    private String submitNotes;

    // ===== DOCTOR INFO =====

    /**
     * Doctor who created this plan
     */
    private DoctorInfoDTO doctor;

    // ===== PATIENT INFO =====

    /**
     * Patient who owns this plan
     */
    private PatientInfoDTO patient;

    // ===== TIMELINE =====

    /**
     * When this plan starts
     */
    private LocalDate startDate;

    /**
     * Expected completion date
     */
    private LocalDate expectedEndDate;

    /**
     * When this plan was created
     */
    private LocalDateTime createdAt;

    // ===== FINANCIAL INFO =====

    /**
     * Total price before discount
     */
    private BigDecimal totalPrice;

    /**
     * Discount amount
     */
    private BigDecimal discountAmount;

    /**
     * Final cost after discount
     */
    private BigDecimal finalCost;

    /**
     * Payment type: FULL, PHASED, INSTALLMENT
     */
    private String paymentType;

    // ===== PROGRESS SUMMARY =====

    /**
     * Progress statistics
     */
    private ProgressSummaryDTO progressSummary;

    // ===== PHASES (CHECKLIST) =====

    /**
     * List of phases with nested items and appointments
     */
    @Builder.Default
    private List<PhaseDetailDTO> phases = new ArrayList<>();

    // ===== INNER DTOs =====

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorInfoDTO {
        private String employeeCode;
        private String fullName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientInfoDTO {
        private String patientCode;
        private String fullName;
    }
}
