package com.dental.clinic.management.warehouse.dto;

import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Dashboard Inventory
 * BE tính toán hết, FE chỉ hiển thị
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemMasterSummaryDto {

    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private String categoryName;
    private WarehouseType warehouseType; // "COLD" | "NORMAL"

    //  Calculated Fields (BE đã tính sẵn)
    private Integer totalQuantityOnHand; // Tổng từ tất cả các batch
    private StockStatus stockStatus; // "LOW_STOCK", "OUT_OF_STOCK", "NORMAL", "OVERSTOCK"
    private Boolean isExpiringSoon; // True nếu có lô sắp hết hạn (30 ngày)

    private Integer minStockLevel;
    private Integer maxStockLevel;
    private Boolean isTool;
}
