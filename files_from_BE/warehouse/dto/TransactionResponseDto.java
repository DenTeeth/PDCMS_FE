package com.dental.clinic.management.warehouse.dto;

import com.dental.clinic.management.warehouse.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO cho Transaction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponseDto {

    private Long transactionId;
    private String transactionCode;
    private TransactionType transactionType;
    private LocalDateTime transactionDate;
    private String supplierName;
    private BigDecimal totalAmount;
    private String notes;
    private String createdByName;
    private LocalDateTime createdAt;

    private List<TransactionItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionItemDto {
        private Long transactionItemId;
        private String itemName;
        private String lotNumber;
        private Integer quantityChange;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private String notes;
    }
}
