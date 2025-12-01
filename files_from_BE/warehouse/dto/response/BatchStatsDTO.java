package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 *  Batch Stats DTO - API 6.2
 * Thống kê tổng quan về các lô hàng của một item
 * (Operational Metrics - No Financial Data)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchStatsDTO {

    /**
     * Batch counts by status
     */
    private Integer totalBatches; // Tổng số lô
    private Integer expiredBatches; // Số lô đã hết hạn
    private Integer criticalBatches; // Số lô còn <= 7 ngày
    private Integer warningBatches; // Số lô còn <= 30 ngày (EXPIRING_SOON)
    private Integer validBatches; // Số lô an toàn

    /**
     * Quantity summary
     */
    private Integer totalQuantityOnHand; // Tổng số lượng tồn kho (vật lý)
}
