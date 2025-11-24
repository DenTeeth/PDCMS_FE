package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO cho Modal Xuất Kho FEFO
 * BE đã sort theo expiryDate ASC
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponse {

    private Long batchId;
    private String lotNumber;
    private Integer quantityOnHand;
    private LocalDate expiryDate;
    private LocalDateTime importedAt; // 🆕 Ngày nhập kho
    private String supplierName;

    private Boolean isExpiringSoon;
    private Boolean isExpired;
}
