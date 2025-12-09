package com.dental.clinic.management.treatment_plans.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for API 5.10: Update Plan Item.
 * All fields are optional - only send what needs to be updated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlanItemRequest {

    /**
     * New name for the item (optional)
     * Example: "Trám răng Composite (Răng 46 - Sửa giá)"
     */
    private String itemName;

    /**
     * New price for the item (optional)
     * Must be positive if provided
     */
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    /**
     * New estimated time in minutes (optional)
     * Must be positive if provided
     */
    @Min(value = 1, message = "Thời gian ước tính phải lớn hơn 0")
    private Integer estimatedTimeMinutes;

    /**
     * Check if any field is provided (for validation)
     */
    public boolean hasAnyUpdate() {
        return itemName != null || price != null || estimatedTimeMinutes != null;
    }
}
