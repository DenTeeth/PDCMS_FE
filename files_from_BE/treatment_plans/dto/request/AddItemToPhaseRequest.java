package com.dental.clinic.management.treatment_plans.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for adding a new item to a treatment plan phase.
 * Used by API 5.7: POST /api/v1/patient-plan-phases/{phaseId}/items
 *
 * Design Philosophy:
 * - NO sequenceNumber field → Backend auto-generates (append to end of phase)
 * - This avoids sequence conflicts and gaps
 * - Quantity expansion: 1 service × 2 quantity = 2 separate items
 *
 * Use Case:
 * Doctor discovers 2 cavities during orthodontic checkup → Add FILLING_COMP
 * service × 2
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to add new item(s) to a treatment plan phase")
public class AddItemToPhaseRequest {

    /**
     * Service code to add (from services table)
     * Example: "FILLING_COMP", "SCALING_L1"
     */
    @NotBlank(message = "Service code is required")
    @Size(max = 50, message = "Service code must not exceed 50 characters")
    @Schema(description = "Code of the service to add (will snapshot service details)", example = "FILLING_COMP", requiredMode = Schema.RequiredMode.REQUIRED)
    private String serviceCode;

    /**
     * Snapshot price for this item (V21.4: OPTIONAL).
     * If not provided, will auto-fill from service default price.
     * Doctors typically omit this field (pricing managed by Finance team).
     * Price override validation removed in V21.4.
     */
    @DecimalMin(value = "0.0", message = "Price must be >= 0")
    @Digits(integer = 10, fraction = 2, message = "Price must have at most 10 integer digits and 2 decimal places")
    @Schema(description = "Price for this item (optional, auto-fills from service default)", example = "400000", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private BigDecimal price;

    /**
     * Quantity: How many times to add this service
     * Backend will expand: quantity=2 → create 2 separate items with sequence
     * numbers
     * Example: Doctor finds 2 cavities → quantity=2 → creates 2 items:
     * - "Trám răng Composite (Phát sinh - Lần 1)"
     * - "Trám răng Composite (Phát sinh - Lần 2)"
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 10, message = "Quantity must not exceed 10")
    @Schema(description = "Number of times to add this service (will create separate items)", example = "2", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer quantity;

    /**
     * Optional notes explaining why this item is being added
     * Important for approval workflow: Manager needs to know reason for cost change
     * Example: "Phát hiện 2 răng sâu mặt nhai 46, 47 tại tái khám"
     */
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    @Schema(description = "Notes explaining reason for adding this item (important for approval workflow)", example = "Phát hiện 2 răng sâu mặt nhai 46, 47 tại tái khám ngày 15/01/2024", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String notes;
}
