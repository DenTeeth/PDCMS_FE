package com.dental.clinic.management.warehouse.dto.request;

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
 * API 6.4: Enhanced Import Transaction Request
 *
 * Features:
 * - Invoice number for accounting reconciliation
 * - Expected delivery date for supplier KPI
 * - Purchase price for COGS calculation
 * - Unit selection for proper conversion
 * - Bin location for warehouse organization
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportTransactionRequest {

    @NotNull(message = "Supplier ID is required")
    @Positive(message = "Supplier ID must be positive")
    private Long supplierId;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    @NotBlank(message = "Invoice number is required")
    @Size(max = 100, message = "Invoice number must not exceed 100 characters")
    private String invoiceNumber;

    private LocalDate expectedDeliveryDate;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<ImportItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportItemRequest {

        @NotNull(message = "Item Master ID is required")
        @Positive(message = "Item Master ID must be positive")
        private Long itemMasterId;

        @NotBlank(message = "Lot number is required")
        @Size(max = 100, message = "Lot number must not exceed 100 characters")
        private String lotNumber;

        @NotNull(message = "Expiry date is required")
        private LocalDate expiryDate;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be greater than 0")
        @Max(value = 1000000, message = "Quantity cannot exceed 1,000,000 units")
        private Integer quantity;

        @NotNull(message = "Unit ID is required")
        @Positive(message = "Unit ID must be positive")
        private Long unitId;

        @NotNull(message = "Purchase price is required")
        @DecimalMin(value = "0.01", message = "Purchase price must be greater than 0")
        @DecimalMax(value = "100000000.00", message = "Purchase price cannot exceed 100,000,000 VNĐ")
        private BigDecimal purchasePrice;

        @Size(max = 200, message = "Bin location must not exceed 200 characters")
        private String binLocation;

        @Size(max = 500, message = "Notes must not exceed 500 characters")
        private String notes;
    }
}
