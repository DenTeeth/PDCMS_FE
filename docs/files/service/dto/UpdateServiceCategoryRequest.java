package com.dental.clinic.management.service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing Service Category
 * Used in API: PATCH /api/v1/service-categories/{categoryId}
 * All fields are optional (partial update)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServiceCategoryRequest {

    @Size(max = 50, message = "Category code must not exceed 50 characters")
    private String categoryCode;

    @Size(max = 255, message = "Category name must not exceed 255 characters")
    private String categoryName;

    @Min(value = 0, message = "Display order must be >= 0")
    private Integer displayOrder;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private Boolean isActive;
}
