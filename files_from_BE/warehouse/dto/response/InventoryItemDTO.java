package com.dental.clinic.management.warehouse.dto.response;

import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO cho từng item trong Inventory Summary (API 6.1)
 * Chứa thông tin master data + các giá trị computed
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemDTO {

    // === Master Data ===
    private Long itemMasterId;
    private String itemCode;
    private String itemName;
    private String categoryName;
    private WarehouseType warehouseType;

    /**
     * Đơn vị cơ sở (Base unit) - VD: Viên, Ống, Đôi
     */
    private String unitName;

    private Integer minStockLevel;
    private Integer maxStockLevel;

    // === Computed Fields (Tính toán từ item_batches) ===

    /**
     * Tổng số lượng tồn kho (SUM của quantity_on_hand từ tất cả batches)
     */
    private Integer totalQuantity;

    /**
     * Trạng thái tồn kho (Tự động tính)
     * - OUT_OF_STOCK: totalQuantity = 0
     * - LOW_STOCK: totalQuantity < minStockLevel
     * - OVERSTOCK: totalQuantity > maxStockLevel
     * - NORMAL: Còn lại
     */
    private StockStatus stockStatus;

    /**
     * Ngày hết hạn gần nhất (MIN expiry_date của các batches còn hàng)
     * Dùng để cảnh báo FEFO
     */
    private LocalDate nearestExpiryDate;
}
