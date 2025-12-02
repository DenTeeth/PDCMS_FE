package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemMasterListDto {

    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private String description;
    private String categoryName;
    private WarehouseType warehouseType;
    private Boolean isActive;
    private String baseUnitName;
    private Integer minStockLevel;
    private Integer maxStockLevel;
    private Integer totalQuantity;
    private StockStatus stockStatus;
    private LocalDateTime lastImportDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
