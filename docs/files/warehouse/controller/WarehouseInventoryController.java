package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.domain.ItemCategory;
import com.dental.clinic.management.warehouse.dto.response.InventorySummaryResponse;
import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;
import com.dental.clinic.management.warehouse.dto.response.ItemBatchesResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemCategoryResponse;
import com.dental.clinic.management.warehouse.enums.BatchStatus;
import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import com.dental.clinic.management.warehouse.repository.ItemCategoryRepository;
import com.dental.clinic.management.warehouse.service.InventoryService;
import com.dental.clinic.management.warehouse.service.WarehouseExcelExportService;
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

import java.util.List;
import java.util.stream.Collectors;

/**
 * Warehouse Inventory Controller
 * APIs for inventory summary, batch tracking, and expiring alerts
 */
@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Warehouse Inventory", description = "Inventory summary, batch tracking, and expiring alerts APIs")
public class WarehouseInventoryController {

        private final InventoryService inventoryService;
        private final ItemCategoryRepository itemCategoryRepository;
        private final WarehouseExcelExportService excelExportService;

        /**
         * API 6.1: Inventory Summary với Aggregation & Computed Fields
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
                        "Hỗ trợ filters: search, stockStatus, warehouseType, categoryId. " +
                        "WARNING: KHI KE DON THUOC - FE PHAI truyen categoryId cua MEDICINE de CHI LAY THUOC, khong lay vat tu/dung cu/consumables. "
                        +
                        "Goi API GET /api/v1/warehouse/item-categories de lay categoryId cua 'MEDICINE'.")
        @ApiMessage("Lấy inventory summary thành công")
        @GetMapping("/summary")
        @PreAuthorize("hasRole('" + ADMIN
                        + "') or hasAuthority('VIEW_WAREHOUSE') or hasAuthority('VIEW_ITEMS') or hasAuthority('VIEW_MEDICINES')")
        public ResponseEntity<InventorySummaryResponse> getInventorySummary(
                        @Parameter(description = "Tìm kiếm theo itemName hoặc itemCode (LIKE)") @RequestParam(required = false) String search,

                        @Parameter(description = "Lọc theo stock status: OUT_OF_STOCK | LOW_STOCK | NORMAL | OVERSTOCK") @RequestParam(required = false) StockStatus stockStatus,

                        @Parameter(description = "Lọc theo warehouse type: COLD | NORMAL") @RequestParam(required = false) WarehouseType warehouseType,

                        @Parameter(description = "Lọc theo category ID (QUAN TRỌNG: Khi kê đơn thuốc, PHẢI truyền categoryId của MEDICINE)") @RequestParam(required = false) Long categoryId,

                        @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,

                        @Parameter(description = "Số lượng items mỗi trang") @RequestParam(defaultValue = "20") int size) {

                log.info(
                                "🏥 API 6.1 - GET /api/v1/warehouse/summary - search='{}', stockStatus={}, warehouseType={}, categoryId={}, page={}, size={}",
                                search, stockStatus, warehouseType, categoryId, page, size);

                Pageable pageable = PageRequest.of(page, size);
                InventorySummaryResponse response = inventoryService.getInventorySummaryV2(
                                search, stockStatus, warehouseType, categoryId, pageable);

                log.info("✅ Returned {} items out of {} total (filtered by categoryId: {})",
                                response.getContent().size(), response.getTotalItems(),
                                categoryId != null ? categoryId : "ALL");
                return ResponseEntity.ok(response);
        }

        /**
         * API 6.0: Get Item Categories
         * Returns all active item categories (MEDICINE, CONSUMABLE, EQUIPMENT, etc.)
         * FE uses this to get categoryId for filtering in API 6.1
         *
         * Example Response:
         * [
         * {"categoryId": 3, "categoryCode": "MEDICINE", "categoryName": "Thuốc men",
         * "description": "...", "isActive": true},
         * {"categoryId": 1, "categoryCode": "CONSUMABLE", "categoryName": "Vật tư tiêu
         * hao", ...}
         * ]
         */
        @Operation(summary = "API 6.0 - Get Item Categories", description = "Lấy danh sách các loại vật tư/thuốc (MEDICINE, CONSUMABLE, EQUIPMENT, etc.). "
                        +
                        "FE dùng API này để lấy categoryId của MEDICINE khi kê đơn thuốc.")
        @ApiMessage("Lấy danh sách categories thành công")
        @GetMapping("/item-categories")
        @PreAuthorize("hasRole('" + ADMIN
                        + "') or hasAuthority('VIEW_WAREHOUSE') or hasAuthority('VIEW_ITEMS') or hasAuthority('VIEW_MEDICINES')")
        public ResponseEntity<List<ItemCategoryResponse>> getItemCategories() {
                log.info("🏥 API 6.0 - GET /api/v1/warehouse/item-categories");

                List<ItemCategory> categories = itemCategoryRepository.findByIsActiveTrue();

                List<ItemCategoryResponse> response = categories.stream()
                                .map(cat -> ItemCategoryResponse.builder()
                                                .categoryId(cat.getCategoryId())
                                                .categoryCode(cat.getCategoryCode())
                                                .categoryName(cat.getCategoryName())
                                                .description(cat.getDescription())
                                                .isActive(cat.getIsActive())
                                                .build())
                                .collect(Collectors.toList());

                log.info("✅ Returned {} categories", response.size());
                return ResponseEntity.ok(response);
        }

        /**
         * API 6.2: Get Item Batches Detail (Operational View)
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
        @Operation(summary = "API 6.2 - Get Item Batches Detail", description = "Lấy chi tiết các lô hàng của một item. "
                        +
                        "Features: FEFO sorting, summary stats, pagination, filtering by status. " +
                        "Operational view: số lượng, vị trí, HSD (không có giá vốn).")
        @ApiMessage("Lấy chi tiết lô hàng thành công")
        @GetMapping("/batches/{itemMasterId}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<ItemBatchesResponse> getItemBatches(
                        @Parameter(description = "ID của Item Master cần xem lô hàng") @PathVariable Long itemMasterId,

                        @Parameter(description = "Ẩn lô hết hàng (quantity=0). Default: true") @RequestParam(defaultValue = "true") Boolean hideEmpty,

                        @Parameter(description = "Lọc theo batch status: EXPIRED | CRITICAL | EXPIRING_SOON | VALID") @RequestParam(required = false) BatchStatus filterStatus,

                        @Parameter(description = "Trường sắp xếp: expiryDate (FEFO) | quantityOnHand | importedAt") @RequestParam(defaultValue = "expiryDate") String sortBy,

                        @Parameter(description = "Hướng sắp xếp: asc | desc") @RequestParam(defaultValue = "asc") String sortDir,

                        @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,

                        @Parameter(description = "Số lượng items mỗi trang") @RequestParam(defaultValue = "20") int size) {

                log.info(
                                " API 6.2 - GET /api/v1/warehouse/batches/{} - hideEmpty={}, filterStatus={}, sortBy={}, sortDir={}, page={}, size={}",
                                itemMasterId, hideEmpty, filterStatus, sortBy, sortDir, page, size);

                // Build pageable với sorting
                Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
                Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

                ItemBatchesResponse response = inventoryService.getItemBatches(
                                itemMasterId, hideEmpty, filterStatus, pageable);

                log.info(" Returned {} batches out of {} total for item '{}'",
                                response.getBatches().size(), response.getStats().getTotalBatches(),
                                response.getItemName());

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.3: Get Expiring Alerts (Warehouse Radar)
         *
         * Request:
         * GET
         * /api/v3/warehouse/alerts/expiring?days=30&categoryId=5&warehouseType=COLD&statusFilter=CRITICAL&page=0&size=20
         *
         * Response:
         * {
         * "reportDate": "2025-11-24T10:00:00",
         * "thresholdDays": 30,
         * "stats": {
         * "totalAlerts": 5,
         * "expiredCount": 1,
         * "criticalCount": 1,
         * "expiringSoonCount": 3,
         * "totalQuantity": 300
         * },
         * "meta": { "page": 0, "size": 20, "totalPages": 1, "totalElements": 5 },
         * "alerts": [
         * {
         * "batchId": 105,
         * "itemCode": "DP-AMOX-500",
         * "itemName": "Amoxicillin 500mg",
         * "categoryName": "Thuốc Kháng sinh",
         * "warehouseType": "COLD",
         * "lotNumber": "LOT-2023-X1",
         * "binLocation": "Kệ A - Tầng 2",
         * "quantityOnHand": 50,
         * "unitName": "Hộp",
         * "expiryDate": "2025-11-20",
         * "daysRemaining": -4,
         * "status": "EXPIRED",
         * "supplierName": "Dược Hậu Giang"
         * }
         * ]
         * }
         *
         * Business Logic:
         * - FEFO sorting (expiryDate ASC) - Hàng hết hạn sớm nhất lên đầu
         * - Status calculation: EXPIRED (<0d), CRITICAL (≤7d), EXPIRING_SOON (≤30d)
         * - Summary stats: Count by status, sum quantity
         * - Filters: category, warehouseType, statusFilter
         * - Operational view only (no financial data)
         *
         * Use Cases:
         * 1. Morning Routine: days=7 → Xem hàng cần dùng gấp tuần này
         * 2. Supplier Return: days=60 → Lọc hàng còn 2 tháng để đàm phán trả NCC
         * 3. Disposal: statusFilter=EXPIRED → Lập phiếu hủy hàng hết hạn
         */
        @Operation(summary = "API 6.3 - Get Expiring Alerts", description = "Quét kho tìm lô hàng sắp hết hạn hoặc đã hết hạn. "
                        +
                        "FEFO-compliant (First Expired First Out). " +
                        "Features: Summary stats, flexible filters (category/warehouse/status), pagination. " +
                        "Use cases: Morning routine check, Supplier return planning, Disposal management.")
        @ApiMessage("Lấy cảnh báo hàng sắp hết hạn thành công")
        @GetMapping("/alerts/expiring")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<com.dental.clinic.management.warehouse.dto.response.ExpiringAlertsResponse> getExpiringAlerts(
                        @Parameter(description = "Số ngày quét tới (1-1095). VD: 30 = quét hàng hết hạn trong 30 ngày tới") @RequestParam(defaultValue = "30") Integer days,

                        @Parameter(description = "Lọc theo category ID (VD: Thuốc kháng sinh)") @RequestParam(required = false) Long categoryId,

                        @Parameter(description = "Lọc theo loại kho: COLD | NORMAL") @RequestParam(required = false) WarehouseType warehouseType,

                        @Parameter(description = "Lọc nhanh theo trạng thái: EXPIRED | CRITICAL | EXPIRING_SOON") @RequestParam(required = false) BatchStatus statusFilter,

                        @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,

                        @Parameter(description = "Số lượng items mỗi trang") @RequestParam(defaultValue = "20") int size) {

                log.info(" API 6.3 - GET /api/v1/warehouse/alerts/expiring - days={}, categoryId={}, warehouseType={}, statusFilter={}, page={}, size={}",
                                days, categoryId, warehouseType, statusFilter, page, size);

                // Build pageable với FEFO sorting (expiryDate ASC)
                Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "expiryDate"));

                com.dental.clinic.management.warehouse.dto.response.ExpiringAlertsResponse response = inventoryService
                                .getExpiringAlerts(days, categoryId, warehouseType, statusFilter, pageable);

                log.info(" Returned {} alerts: EXPIRED={}, CRITICAL={}, EXPIRING_SOON={}",
                                response.getStats().getTotalAlerts(),
                                response.getStats().getExpiredCount(),
                                response.getStats().getCriticalCount(),
                                response.getStats().getExpiringSoonCount());

                return ResponseEntity.ok(response);
        }

        /**
         * API 6.1.1: Export Inventory Summary to Excel
         * Issue #50: Export warehouse inventory to Excel file
         */
        @GetMapping("/summary/export")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        @Operation(summary = "Xuất báo cáo tồn kho ra Excel", description = """
                        Export Inventory Summary to Excel file (.xlsx)

                        **Features:**
                        - Exports ALL inventory items (not paginated)
                        - Preserves filters from UI (warehouseType, stockStatus, search, categoryId)
                        - Formatted headers with bold styling
                        - Auto-sized columns
                        - Frozen header row for better navigation

                        **Permissions:**
                        - VIEW_WAREHOUSE: Required to export
                        """)
        @ApiMessage("Xuất báo cáo tồn kho thành công")
        public ResponseEntity<byte[]> exportInventorySummary(
                        @Parameter(description = "Tìm kiếm theo tên hoặc mã item") @RequestParam(required = false) String search,

                        @Parameter(description = "Lọc theo trạng thái tồn kho") @RequestParam(required = false) StockStatus stockStatus,

                        @Parameter(description = "Lọc theo loại kho") @RequestParam(required = false) WarehouseType warehouseType,

                        @Parameter(description = "Lọc theo category ID") @RequestParam(required = false) Long categoryId) {

                log.info("API 6.1.1 - GET /api/v1/warehouse/summary/export - search={}, stockStatus={}, warehouseType={}, categoryId={}",
                                search, stockStatus, warehouseType, categoryId);

                try {
                        // Get ALL data without pagination for export
                        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
                        InventorySummaryResponse response = inventoryService.getInventorySummaryV2(
                                        search, stockStatus, warehouseType, categoryId, pageable);

                        // Generate Excel file
                        byte[] excelBytes = excelExportService.exportInventorySummary(response);

                        log.info("Exported {} inventory items to Excel", response.getContent().size());

                        return ResponseEntity.ok()
                                        .header("Content-Disposition", "attachment; filename=inventory_summary.xlsx")
                                        .header("Content-Type",
                                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                        .body(excelBytes);

                } catch (Exception e) {
                        log.error("Error exporting inventory summary to Excel", e);
                        throw new RuntimeException("Failed to export inventory summary: " + e.getMessage());
                }
        }

        /**
         * API 6.3.1: Export Expiring Alerts to Excel
         * Issue #50: Export expiring items report to Excel file
         */
        @GetMapping("/alerts/expiring/export")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        @Operation(summary = "Xuất báo cáo hàng sắp hết hạn ra Excel", description = """
                        Export Expiring Alerts to Excel file (.xlsx)

                        **Features:**
                        - Exports ALL expiring items (not paginated)
                        - Preserves filters from UI (days, warehouseType, categoryId, statusFilter)
                        - Formatted headers with bold styling
                        - Warning highlights for EXPIRED items
                        - Auto-sized columns
                        - Frozen header row

                        **Permissions:**
                        - VIEW_WAREHOUSE: Required to export
                        """)
        @ApiMessage("Xuất báo cáo hàng sắp hết hạn thành công")
        public ResponseEntity<byte[]> exportExpiringAlerts(
                        @Parameter(description = "Số ngày quét tới (1-1095)") @RequestParam(defaultValue = "30") Integer days,

                        @Parameter(description = "Lọc theo category ID") @RequestParam(required = false) Long categoryId,

                        @Parameter(description = "Lọc theo loại kho") @RequestParam(required = false) WarehouseType warehouseType,

                        @Parameter(description = "Lọc theo trạng thái") @RequestParam(required = false) BatchStatus statusFilter) {

                log.info("API 6.3.1 - GET /api/v1/warehouse/alerts/expiring/export - days={}, categoryId={}, warehouseType={}, statusFilter={}",
                                days, categoryId, warehouseType, statusFilter);

                try {
                        // Get ALL data without pagination for export
                        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE,
                                        Sort.by(Sort.Direction.ASC, "expiryDate"));

                        com.dental.clinic.management.warehouse.dto.response.ExpiringAlertsResponse response = inventoryService
                                        .getExpiringAlerts(days, categoryId, warehouseType, statusFilter, pageable);

                        // Generate Excel file
                        byte[] excelBytes = excelExportService.exportExpiringAlerts(response);

                        log.info("Exported {} expiring alerts to Excel", response.getAlerts().size());

                        return ResponseEntity.ok()
                                        .header("Content-Disposition", "attachment; filename=expiring_alerts.xlsx")
                                        .header("Content-Type",
                                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                                        .body(excelBytes);

                } catch (Exception e) {
                        log.error("Error exporting expiring alerts to Excel", e);
                        throw new RuntimeException("Failed to export expiring alerts: " + e.getMessage());
                }
        }
}
