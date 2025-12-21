package com.dental.clinic.management.treatment_plans.dto;

import com.dental.clinic.management.treatment_plans.enums.PaymentType;
import com.dental.clinic.management.treatment_plans.enums.TreatmentPlanStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Summary DTO for treatment plan list response.
 * Used in GET /api/v1/patients/{patientCode}/treatment-plans
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentPlanSummaryDTO {

    private Long patientPlanId;

    /**
     * Unique plan code (e.g., "PLAN-20251111-001")
     * CRITICAL: Required by FE to navigate to detail page
     */
    private String planCode;

    /**
     * Patient code (e.g., "BN-1001")
     * Required for navigation from list to detail
     */
    private String patientCode;

    private String planName;

    private TreatmentPlanStatus status;

    private DoctorInfoDTO doctor;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expectedEndDate;

    private BigDecimal totalCost;

    private BigDecimal discountAmount;

    private BigDecimal finalCost;

    private PaymentType paymentType;
}
