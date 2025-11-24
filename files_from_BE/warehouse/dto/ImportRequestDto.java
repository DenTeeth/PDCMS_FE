package com.dental.clinic.management.warehouse.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO cho API Nhập Kho
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportRequestDto {
    
    @NotNull(message = "Supplier ID is required")
    private Long supplierId;
    
    private String notes;
    
    @NotNull(message = "Items list is required")
    private List<ImportItemDto> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportItemDto {
        
        @NotNull(message = "Item Master ID is required")
        private Long itemMasterId;
        
        @NotNull(message = "Lot number is required")
        private String lotNumber;
        
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;
        
        private LocalDate expiryDate; // Bắt buộc nếu warehouseType=COLD && isTool=false
        
        @NotNull(message = "Import price is required")
        @Min(value = 0, message = "Price cannot be negative")
        private BigDecimal importPrice;
        
        private String notes;
    }
}
