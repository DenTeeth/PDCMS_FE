package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.response.InventorySummaryResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemBatchesResponse;
import com.dental.clinic.management.warehouse.enums.BatchStatus;
import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import com.dental.clinic.management.warehouse.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 🏭 Warehouse V3 Controller
 * V3 ERP-Compliant APIs với advanced features
 */
@RestController
@RequestMapping("/api/v3/warehouse")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Warehouse V3", description = "V3 ERP-Compliant Warehouse APIs")
public class WarehouseV3Controller {

    private final InventoryService inventoryService;

    /**
     * 🔥 API 6.1: Inventory Summary với Aggregation & Computed Fields
     *
     * Request:
     * GET
     * /api/v3/warehouse/summary?page=0&size=20&search=gạc&stockStatus=LOW_STOCK&warehouseType=NORMAL&categoryId=5
     *
     * Response:
     * {
     * "page": 0,
     * "size": 20,
     * "totalPages": 3,
     * "totalItems": 45,
     * "content": [
     * {
     * "itemMasterId": 101,
     * "itemCode": "VT-001",
     * "itemName": "Gạc y tế vô trùng 10x10cm",
     * "categoryName": "Vật tư tiêu hao",
     * "warehouseType": "NORMAL",
     * "unitName": "Gói",
     * "minStockLevel": 50,
     * "maxStockLevel": 200,
     * "totalQuantity": 35,
     * "stockStatus": "LOW_STOCK",
     * "nearestExpiryDate": "2024-06-15"
     * }
     * ]
     * }
     *
     * Business Logic:
     * - totalQuantity: SUM(quantity_on_hand) từ tất cả batches
     * - stockStatus: OUT_OF_STOCK | LOW_STOCK | NORMAL | OVERSTOCK
     * - nearestExpiryDate: MIN(expiry_date) WHERE quantity > 0 (FEFO)
     * - unitName: Lấy từ item_units WHERE is_base_unit = true
     */
    @Operation(summary = "API 6.1 - Inventory Summary Dashboard", description = "Lấy danh sách inventory với computed fields: totalQuantity (aggregation), stockStatus (calculated), nearestExpiryDate (FEFO). "
            +
            "Hỗ trợ filters: search, stockStatus, warehouseType, categoryId. Pagination enabled.")
    @ApiMessage("Lấy inventory summary thành công")
    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'VIEW_WAREHOUSE')")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary(
            @Parameter(description = "Tìm kiếm theo itemName hoặc itemCode (LIKE)") @RequestParam(required = false) String search,

            @Parameter(description = "Lọc theo stock status: OUT_OF_STOCK | LOW_STOCK | NORMAL | OVERSTOCK") @RequestParam(required = false) StockStatus stockStatus,

            @Parameter(description = "Lọc theo warehouse type: COLD | NORMAL") @RequestParam(required = false) WarehouseType warehouseType,

            @Parameter(description = "Lọc theo category ID") @RequestParam(required = false) Long categoryId,

            @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Số lượng items mỗi trang") @RequestParam(defaultValue = "20") int size) {

        log.info(
                "🔥 API 6.1 - GET /api/v3/warehouse/summary - search='{}', stockStatus={}, warehouseType={}, categoryId={}, page={}, size={}",
                search, stockStatus, warehouseType, categoryId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        InventorySummaryResponse response = inventoryService.getInventorySummaryV2(
                search, stockStatus, warehouseType, categoryId, pageable);

        log.info("✅ Returned {} items out of {} total", response.getContent().size(), response.getTotalItems());
        return ResponseEntity.ok(response);
    }

    /**
     * 🔥 API 6.2: Get Item Batches Detail (Operational View)
     *
     * Request:
     * GET
     * /api/v3/warehouse/batches/24?page=0&size=20&hideEmpty=true&filterStatus=CRITICAL&sortBy=expiryDate&sortDir=asc
     *
     * Response:
     * {
     * "itemMasterId": 24,
     * "itemCode": "DP-AMOX-500",
     * "itemName": "Amoxicillin 500mg",
     * "unitName": "Hộp",
     * "stats": {
     * "totalBatches": 15,
     * "expiredBatches": 2,
     * "criticalBatches": 3,
     * "warningBatches": 5,
     * "validBatches": 5,
     * "totalQuantityOnHand": 450
     * },
     * "meta": {
     * "page": 0,
     * "size": 20,
     * "totalPages": 1,
     * "totalElements": 15
     * },
     * "batches": [
     * {
     * "batchId": 196,
     * "lotNumber": "LOT-2023-A1",
     * "expiryDate": "2025-12-01",
     * "quantityOnHand": 50,
     * "initialQuantity": 100,
     * "usageRate": 50.0,
     * "binLocation": "Kệ A - Tầng 2 - Hộp 05",
     * "supplierName": "Dược Hậu Giang",
     * "importedAt": "2023-12-01T08:00:00",
     * "daysRemaining": 7,
     * "status": "CRITICAL"
     * }
     * ]
     * }
     *
     * Business Logic:
     * - Default FEFO sorting (expiryDate ASC)
     * - Computed fields: daysRemaining, status, usageRate
     * - Summary stats: Count by status categories
     * - Logistics focus: binLocation, supplierName
     * - No financial data (pure operational view)
     */
    @Operation(summary = "API 6.2 - Get Item Batches Detail", description = "Lấy chi tiết các lô hàng của một item. " +
            "Features: FEFO sorting, summary stats, pagination, filtering by status. " +
            "Operational view: số lượng, vị trí, HSD (không có giá vốn).")
    @ApiMessage("Lấy chi tiết lô hàng thành công")
    @GetMapping("/batches/{itemMasterId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'VIEW_WAREHOUSE')")
    public ResponseEntity<ItemBatchesResponse> getItemBatches(
            @Parameter(description = "ID của Item Master cần xem lô hàng") @PathVariable Long itemMasterId,

            @Parameter(description = "Ẩn lô hết hàng (quantity=0). Default: true") @RequestParam(defaultValue = "true") Boolean hideEmpty,

            @Parameter(description = "Lọc theo batch status: EXPIRED | CRITICAL | EXPIRING_SOON | VALID") @RequestParam(required = false) BatchStatus filterStatus,

            @Parameter(description = "Trường sắp xếp: expiryDate (FEFO) | quantityOnHand | importedAt") @RequestParam(defaultValue = "expiryDate") String sortBy,

            @Parameter(description = "Hướng sắp xếp: asc | desc") @RequestParam(defaultValue = "asc") String sortDir,

            @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Số lượng items mỗi trang") @RequestParam(defaultValue = "20") int size) {

        log.info(
                "🔥 API 6.2 - GET /api/v3/warehouse/batches/{} - hideEmpty={}, filterStatus={}, sortBy={}, sortDir={}, page={}, size={}",
                itemMasterId, hideEmpty, filterStatus, sortBy, sortDir, page, size);

        // Build pageable với sorting
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        ItemBatchesResponse response = inventoryService.getItemBatches(
                itemMasterId, hideEmpty, filterStatus, pageable);

        log.info("✅ Returned {} batches out of {} total for item '{}'",
                response.getBatches().size(), response.getStats().getTotalBatches(), response.getItemName());

        return ResponseEntity.ok(response);
    }
}
