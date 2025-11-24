package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response cho API 6.1: GET /api/v3/warehouse/summary
 * Inventory Summary với pagination
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventorySummaryResponse {

    /**
     * Pagination info
     */
    private Integer page;
    private Integer size;
    private Integer totalPages;
    private Long totalItems;

    /**
     * Danh sách items với computed fields
     */
    private List<InventoryItemDTO> content;
}
