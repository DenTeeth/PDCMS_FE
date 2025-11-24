package com.dental.clinic.management.service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new Service Category
 * Used in API: POST /api/v1/service-categories
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateServiceCategoryRequest {

    @NotBlank(message = "Category code is required")
    @Size(max = 50, message = "Category code must not exceed 50 characters")
    private String categoryCode;

    @NotBlank(message = "Category name is required")
    @Size(max = 255, message = "Category name must not exceed 255 characters")
    private String categoryName;

    @NotNull(message = "Display order is required")
    @Min(value = 0, message = "Display order must be >= 0")
    private Integer displayOrder;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}
