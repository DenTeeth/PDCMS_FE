package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Expiring Alerts Response - API 6.3
 * Response cho GET /api/v3/warehouse/alerts/expiring
 *
 * Features:
 * - Real-time expiry alerts (FEFO-compliant)
 * - Summary statistics dashboard
 * - Flexible filtering (category, warehouse type, status)
 * - Pagination support
 *
 * Use Cases:
 * 1. Morning Routine: Thủ kho check hàng sắp hỏng mỗi sáng
 * 2. Supplier Return: Lọc hàng còn 60 ngày để đàm phán trả NCC
 * 3. Disposal: Tìm hàng EXPIRED để lập phiếu hủy
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpiringAlertsResponse {

    /**
     * Context: Report metadata
     */
    private LocalDateTime reportDate; // Thời điểm tạo báo cáo
    private Integer thresholdDays; // Số ngày quét (VD: 30 ngày)

    /**
     * Summary stats: Thống kê tổng quan
     */
    private AlertStatsDTO stats;

    /**
     * Pagination metadata
     */
    private PaginationMeta meta;

    /**
     * Data: Danh sách chi tiết các lô cảnh báo
     */
    private List<ExpiringAlertDTO> alerts;

    /**
     * Inner class for pagination metadata
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaginationMeta {
        private Integer page;
        private Integer size;
        private Integer totalPages;
        private Long totalElements;
    }
}
