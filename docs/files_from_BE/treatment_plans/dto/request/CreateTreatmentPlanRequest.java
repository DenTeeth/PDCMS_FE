package com.dental.clinic.management.treatment_plans.dto.request;

import com.dental.clinic.management.treatment_plans.enums.PaymentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for creating a new patient treatment plan from a template.
 * Used by API 5.3: POST /api/v1/patients/{patientCode}/treatment-plans
 *
 * Design Philosophy:
 * - Frontend only needs to provide 5 simple fields
 * - Backend handles all the complex snapshot logic (phases, items, financials)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a patient treatment plan from a template package")
public class CreateTreatmentPlanRequest {

    /**
     * Template code to copy from
     * Example: "TPL_ORTHO_METAL", "TPL_IMPLANT_OSSTEM"
     */
    @NotBlank(message = "Template code is required")
    @Size(max = 50, message = "Template code must not exceed 50 characters")
    @Schema(description = "Code of the template package to use", example = "TPL_ORTHO_METAL", requiredMode = Schema.RequiredMode.REQUIRED)
    private String sourceTemplateCode;

    /**
     * Employee code of the doctor who will be responsible for this plan
     * Example: "DR_AN_KHOA"
     */
    @NotBlank(message = "Doctor employee code is required")
    @Size(max = 20, message = "Employee code must not exceed 20 characters")
    @Schema(description = "Employee code of the doctor responsible for this treatment plan", example = "DR_AN_KHOA", requiredMode = Schema.RequiredMode.REQUIRED)
    private String doctorEmployeeCode;

    /**
     * Custom name for this patient's plan (optional)
     * If null, system will use the template's name
     * Example: "Lộ trình niềng răng 2 năm cho BN Phong (Gói khuyến mãi)"
     */
    @Size(max = 255, message = "Plan name must not exceed 255 characters")
    @Schema(description = "Custom name for this treatment plan. If not provided, template name will be used.", example = "Lộ trình niềng răng 2 năm cho BN Phong (Gói khuyến mãi)", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String planNameOverride;

    /**
     * Discount amount to apply to the total cost
     * Must be >= 0 and <= total cost (validated by business logic)
     * Example: 5000000 (5 triệu VND giảm giá)
     */
    @DecimalMin(value = "0.0", inclusive = true, message = "Discount amount must be >= 0")
    @Digits(integer = 10, fraction = 2, message = "Discount amount must have at most 10 integer digits and 2 decimal places")
    @Schema(description = "Discount amount in VND (must be <= total cost, validated by business logic)", example = "5000000", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /**
     * Payment type for this treatment plan
     * FULL: Pay all at once
     * PHASED: Pay by phases (when completing each phase)
     * INSTALLMENT: Pay in installments (monthly/custom schedule)
     */
    @NotNull(message = "Payment type is required")
    @Schema(description = "Payment method for this treatment plan", example = "INSTALLMENT", requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {
            "FULL", "PHASED", "INSTALLMENT" })
    private PaymentType paymentType;
}
