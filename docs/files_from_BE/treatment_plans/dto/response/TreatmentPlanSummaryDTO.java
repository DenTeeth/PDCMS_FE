package com.dental.clinic.management.treatment_plans.dto.response;

import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lightweight DTO for listing treatment plans (Manager View).
 * Used by GET /api/v1/treatment-plans endpoint.
 *
 * Purpose: Allow managers to view all treatment plans across all patients
 * with filtering and pagination support.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentPlanSummaryDTO {

    /**
     * Unique plan code
     */
    private String planCode;

    /**
     * Plan name/title
     */
    private String planName;

    /**
     * Patient information (minimal)
     */
    private PatientSummary patient;

    /**
     * Doctor who created the plan
     */
    private DoctorSummary doctor;

    /**
     * Current plan status (PENDING, ACTIVE, COMPLETED, CANCELLED)
     */
    private TreatmentPlanStatus status;

    /**
     * Approval status (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
     */
    private ApprovalStatus approvalStatus;

    /**
     * Total cost before discount
     */
    private BigDecimal totalPrice;

    /**
     * Final cost after discount
     */
    private BigDecimal finalCost;

    /**
     * Plan start date
     */
    private LocalDate startDate;

    /**
     * Expected end date
     */
    private LocalDate expectedEndDate;

    /**
     * When plan was created
     */
    private LocalDateTime createdAt;

    /**
     * Manager who approved (if approved)
     */
    private String approvedByName;

    /**
     * When plan was approved
     */
    private LocalDateTime approvedAt;

    // ===== Inner DTOs =====

    /**
     * Patient summary (lightweight)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientSummary {
        private String patientCode;
        private String fullName;
        private String phone;
    }

    /**
     * Doctor summary (lightweight)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorSummary {
        private String employeeCode;
        private String fullName;
    }
}
