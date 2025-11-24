package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.BatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 📦 Batch Detail DTO - API 6.2
 * Chi tiết của một lô hàng (Operational View - No Financial Data)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchDetailDTO {

    /**
     * Batch identification
     */
    private Long batchId;
    private String lotNumber;
    private LocalDate expiryDate;

    /**
     * Inventory info
     */
    private Integer quantityOnHand;
    private Integer initialQuantity;
    private Double usageRate; // % đã sử dụng = (initialQty - currentQty) / initialQty * 100

    /**
     * Logistics info (Core data cho warehouse staff)
     */
    private String binLocation; // Vị trí vật lý trong kho
    private String supplierName; // Tên nhà cung cấp
    private LocalDateTime importedAt; // Ngày nhập kho

    /**
     * Computed status (Real-time calculation)
     */
    private Long daysRemaining; // Số ngày còn lại đến hết hạn
    private BatchStatus status; // EXPIRED | CRITICAL | EXPIRING_SOON | VALID
}
