package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 *  Alert Stats DTO - API 6.3
 * Summary statistics cho Expiring Alerts Dashboard
 * 
 * Purpose:
 * - Quick overview: Bao nhiêu lô EXPIRED, CRITICAL, EXPIRING_SOON
 * - Total quantity affected: Tổng số lượng hàng bị ảnh hưởng
 * - Decision support: Giúp Manager đánh giá mức độ nghiêm trọng
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertStatsDTO {

    /**
     * Tổng số lô hàng cảnh báo
     */
    private Integer totalAlerts;

    /**
     * Số lô đã hết hạn (daysRemaining < 0)
     * Action: Lập phiếu hủy
     */
    private Integer expiredCount;

    /**
     * Số lô sắp hết hạn trong 7 ngày (0 <= daysRemaining <= 7)
     * Action: Ưu tiên xuất kho ngay
     */
    private Integer criticalCount;

    /**
     * Số lô sắp hết hạn trong khoảng 7-30 ngày (7 < daysRemaining <= threshold)
     * Action: Cân nhắc trả NCC hoặc đẩy sale
     */
    private Integer expiringSoonCount;

    /**
     * Tổng số lượng hàng hóa bị ảnh hưởng
     * = SUM(quantity_on_hand) của tất cả lô cảnh báo
     */
    private Integer totalQuantity;
}
