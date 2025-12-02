package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO cho Dashboard Inventory
 * BE tính toán hết, FE chỉ hiển thị
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemMasterSummaryResponse {

    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private String categoryName;
    private WarehouseType warehouseType;

    // 🆕 Fields từ yêu cầu
    private String unitOfMeasure; // "Hộp", "Lọ", "Cái"

    //  Calculated Fields (BE đã tính sẵn)
    private Integer totalQuantityOnHand;
    private StockStatus stockStatus;
    private Boolean isExpiringSoon;

    private Integer minStockLevel;
    private Integer maxStockLevel;
    private Boolean isTool;

    // 🆕 Audit fields for FE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
