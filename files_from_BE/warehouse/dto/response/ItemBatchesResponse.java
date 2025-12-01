package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 *  Item Batches Response - API 6.2
 * Response cho GET /api/v3/warehouse/batches/{itemMasterId}
 *
 * Contains:
 * - Item context info
 * - Summary statistics
 * - Pagination metadata
 * - List of batch details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemBatchesResponse {

    /**
     * Context: Thông tin item master
     */
    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private String unitName; // Đơn vị cơ sở
    private Integer minStockLevel;

    /**
     * Summary stats: Thống kê tổng quan
     */
    private BatchStatsDTO stats;

    /**
     * Pagination metadata
     */
    private PaginationMeta meta;

    /**
     * Data: Danh sách lô hàng
     */
    private List<BatchDetailDTO> batches;

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
