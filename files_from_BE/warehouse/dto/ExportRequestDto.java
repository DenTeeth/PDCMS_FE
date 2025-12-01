package com.dental.clinic.management.warehouse.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO cho API Xuất Kho
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequestDto {

    private String notes;

    @NotNull(message = "Items list is required")
    private List<ExportItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExportItemDto {

        @NotNull(message = "Batch ID is required")
        private Long batchId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        private String notes;
    }
}
