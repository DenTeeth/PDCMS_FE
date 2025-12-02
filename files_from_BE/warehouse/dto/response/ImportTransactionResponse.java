package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * API 6.4: Import Transaction Response
 *
 * Contains:
 * - Transaction header with financial summary
 * - Detailed items with batch status and current stock
 * - Warnings for near-expiry, price variance, etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportTransactionResponse {

    // Transaction Header
    private Long transactionId;
    private String transactionCode;
    private LocalDateTime transactionDate;
    private String supplierName;
    private String invoiceNumber;
    private String createdBy;
    private LocalDateTime createdAt;
    private com.dental.clinic.management.warehouse.enums.TransactionStatus status;

    // Approval Info
    private String approvedByName;
    private LocalDateTime approvedAt;

    // Payment Info (RBAC: requires VIEW_COST)
    private com.dental.clinic.management.warehouse.enums.PaymentStatus paymentStatus;
    private BigDecimal paidAmount;
    private BigDecimal remainingDebt;
    private LocalDate dueDate;

    // Financial Summary
    private Integer totalItems;
    private BigDecimal totalValue;

    // Detailed Items
    private List<ImportItemResponse> items;

    // Warnings (non-blocking alerts)
    private List<WarningDTO> warnings;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportItemResponse {
        private String itemCode;
        private String itemName;
        private Long batchId;
        private String batchStatus; // CREATED | UPDATED
        private String lotNumber;
        private LocalDate expiryDate;
        private Integer quantityChange;
        private String unitName;
        private BigDecimal purchasePrice;
        private BigDecimal totalLineValue;
        private String binLocation;
        private Integer currentStock;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WarningDTO {
        private String itemCode;
        private String warningType; // NEAR_EXPIRY | PRICE_VARIANCE | LOW_STOCK
        private String message;
    }
}
