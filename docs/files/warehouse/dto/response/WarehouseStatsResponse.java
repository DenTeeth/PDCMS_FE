package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response cho 4 thẻ stats trên Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStatsResponse {

    private Integer totalItems;
    private Integer lowStockItems;
    private Integer expiringSoonItems;
    private Integer outOfStockItems;
}
