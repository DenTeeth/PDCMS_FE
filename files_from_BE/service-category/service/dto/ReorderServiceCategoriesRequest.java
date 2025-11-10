package com.dental.clinic.management.service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for reordering service categories
 * Used in API: POST /api/v1/service-categories/reorder
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderServiceCategoriesRequest {

    private List<CategoryOrder> orders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryOrder {
        @NotNull(message = "Category ID is required")
        private Long categoryId;

        @NotNull(message = "Display order is required")
        @Min(value = 0, message = "Display order must be >= 0")
        private Integer displayOrder;
    }
}
