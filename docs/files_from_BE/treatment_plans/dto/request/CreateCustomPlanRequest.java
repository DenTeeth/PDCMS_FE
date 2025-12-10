package com.dental.clinic.management.treatment_plans.dto.request;

import com.dental.clinic.management.treatment_plans.enums.PaymentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a CUSTOM treatment plan (API 5.4).
 * <p>
 * This DTO supports the "quantity expansion" feature:
 * - Doctor can specify quantity (e.g., 5 follow-up visits)
 * - Backend will automatically expand into 5 separate patient_plan_items
 * <p>
 * Version: V19
 * Date: 2025-11-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCustomPlanRequest {

    /**
     * Name of the treatment plan.
     * Example: "Lộ trình niềng răng tùy chỉnh (6 tháng)"
     */
    @NotBlank(message = "Plan name is required")
    @Size(max = 255, message = "Plan name must not exceed 255 characters")
    private String planName;

    /**
     * Employee code of the doctor in charge.
     * Example: "DR_AN_KHOA" or "EMP001"
     */
    @NotBlank(message = "Doctor employee code is required")
    private String doctorEmployeeCode;

    /**
     * Discount amount (default 0).
     * Must be >= 0 and <= totalCost (validated in service layer).
     */
    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.0", message = "Discount amount must be >= 0")
    private BigDecimal discountAmount;

    /**
     * Payment type: FULL, PHASED, or INSTALLMENT.
     */
    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    /**
     * Start date of the treatment plan (optional).
     * If null, will be set when plan is activated (API 5.5).
     */
    private LocalDate startDate;

    /**
     * Expected end date (optional).
     * If null, calculated from phase durations.
     */
    private LocalDate expectedEndDate;

    /**
     * List of phases in this plan.
     * Must have at least 1 phase.
     */
    @NotEmpty(message = "Must have at least 1 phase")
    @Valid
    private List<PhaseRequest> phases;

    /**
     * Phase Request DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhaseRequest {

        /**
         * Name of the phase.
         * Example: "Giai đoạn 1: Gắn khí cụ"
         */
        @NotBlank(message = "Phase name is required")
        @Size(max = 255, message = "Phase name must not exceed 255 characters")
        private String phaseName;

        /**
         * Phase number (1, 2, 3, ...).
         * Must be unique within a plan.
         */
        @NotNull(message = "Phase number is required")
        @Min(value = 1, message = "Phase number must be >= 1")
        private Integer phaseNumber;

        /**
         * Estimated duration of this phase in days (V19).
         * Example: 180 (6 months)
         */
        @Min(value = 0, message = "Estimated duration must be >= 0")
        private Integer estimatedDurationDays;

        /**
         * List of items (services) in this phase.
         * Must have at least 1 item.
         */
        @NotEmpty(message = "Phase must have at least 1 item")
        @Valid
        private List<ItemRequest> items;
    }

    /**
     * Item (Service) Request DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {

        /**
         * Service code (to lookup from services table).
         * Example: "ORTHO_BRACES_ON", "FILLING_COMP"
         */
        @NotBlank(message = "Service code is required")
        private String serviceCode;

        /**
         * Snapshot price for this item (V21.4: OPTIONAL).
         * If not provided, will auto-fill from service default price.
         * Doctors typically omit this field (pricing managed by Finance team).
         * IMPORTANT: Price override validation removed in V21.4.
         */
        @DecimalMin(value = "0", message = "Price must be >= 0")
        private BigDecimal price;

        /**
         * Sequence number within the phase.
         * Example: 1, 2, 3, ...
         */
        @NotNull(message = "Sequence number is required")
        @Min(value = 1, message = "Sequence number must be >= 1")
        private Integer sequenceNumber;

        /**
         * Quantity (V19 - KEY FEATURE).
         * Number of times this service will be performed.
         * Example: 5 means create 5 separate patient_plan_items.
         *
         * Validation: 1 <= quantity <= 100 (prevent abuse)
         */
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be >= 1")
        @Max(value = 100, message = "Quantity must be <= 100")
        private Integer quantity;
    }
}
