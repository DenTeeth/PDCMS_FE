package com.dental.clinic.management.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO cho Modal Xuất Kho FEFO
 * BE đã sort theo expiryDate ASC
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchDto {

    private Long batchId;
    private String lotNumber;
    private Integer quantityOnHand;
    private LocalDate expiryDate; // NULL nếu là dụng cụ
    private BigDecimal importPrice;
    private String supplierName;

    // Thêm info để FE highlight
    private Boolean isExpiringSoon; // Trong vòng 30 ngày
    private Boolean isExpired; // Đã hết hạn
}
