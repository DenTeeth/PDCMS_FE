package com.dental.clinic.management.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho 4 thẻ stats trên Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStatsDto {

    private Integer totalItems; // Tổng số loại vật tư
    private Integer lowStockItems; // Số lượng vật tư cảnh báo
    private Integer expiringSoonItems; // Số lượng vật tư sắp hết hạn
    private Integer outOfStockItems; // Số lượng vật tư hết hàng
}
