package com.dental.clinic.management.warehouse.controller;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import com.dental.clinic.management.utils.security.SecurityUtil;
import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.request.CreateCategoryRequest;
import com.dental.clinic.management.warehouse.dto.request.CreateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.request.ExportTransactionRequest;
import com.dental.clinic.management.warehouse.dto.request.ImportTransactionRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateCategoryRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.response.*;
import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import com.dental.clinic.management.warehouse.service.ExportTransactionService;
import com.dental.clinic.management.warehouse.service.ImportTransactionService;
import com.dental.clinic.management.warehouse.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Inventory Management Controller
 * Quản lý vật tư, danh mục, lô hàng, thống kê kho
 */
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Inventory Management", description = "APIs quản lý tồn kho và vật tư")
public class InventoryController {

        private final InventoryService inventoryService;
        private final ImportTransactionService importTransactionService;
        private final ExportTransactionService exportTransactionService;

        // ===========================
        // GET ALL ITEM MASTERS
        // ===========================
        @Operation(summary = "Lấy danh sách tất cả vật tư", description = "Lấy danh sách vật tư với tìm kiếm và lọc theo loại kho")
        @GetMapping
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<List<ItemMasterSummaryResponse>> getAllItemMasters(
                        @Parameter(description = "Tìm kiếm theo tên hoặc mã vật tư") @RequestParam(required = false) String search,
                        @Parameter(description = "Lọc theo loại kho (COLD/NORMAL)") @RequestParam(required = false) WarehouseType warehouseType) {
                log.info("GET /api/v1/inventory - search: '{}', warehouseType: {}", search, warehouseType);
                List<ItemMasterSummaryResponse> items = inventoryService.getAllItemMasters(warehouseType, search);
                return ResponseEntity.ok(items);
        }

        // ===========================
        // GET ITEM MASTER BY ID
        // ===========================
        @Operation(summary = "Lấy chi tiết 1 vật tư", description = "Lấy thông tin chi tiết của 1 vật tư theo ID")
        @GetMapping("/{id}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<ItemMasterSummaryResponse> getItemMasterById(
                        @Parameter(description = "ID của vật tư cần xem") @PathVariable Long id) {
                log.info("GET /api/v1/inventory/{}", id);
                ItemMasterSummaryResponse item = inventoryService.getItemMasterById(id);
                return ResponseEntity.ok(item);
        }

        /**
         * API 1: Lấy danh sách vật tư cho Dashboard (Có Pagination)
         * FE nhận được: totalQuantityOnHand, stockStatus, isExpiringSoon
         */
        @Operation(summary = "Lấy danh sách tồn kho (Inventory Dashboard)", description = "BE tự động tính toán stock_status, total_quantity, và cảnh báo hết hạn. Hỗ trợ pagination.")
        @GetMapping("/summary")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<org.springframework.data.domain.Page<ItemMasterSummaryResponse>> getInventorySummary(
                        @Parameter(description = "Lọc theo loại kho: COLD | NORMAL") @RequestParam(required = false) WarehouseType warehouseType,
                        @Parameter(description = "Lọc theo trạng thái: OUT_OF_STOCK | LOW_STOCK | NORMAL | OVERSTOCK") @RequestParam(required = false) StockStatus stockStatus,
                        @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Số lượng/trang") @RequestParam(defaultValue = "10") int size,
                        @Parameter(description = "Sắp xếp: itemName,asc | itemCode,desc") @RequestParam(defaultValue = "itemName,asc") String sort) {
                log.info("GET /api/v1/inventory/summary - warehouseType: {}, stockStatus: {}, page: {}, size: {}",
                                warehouseType, stockStatus, page, size);

                // Parse sort
                String[] sortParams = sort.split(",");
                String sortField = sortParams[0];
                org.springframework.data.domain.Sort.Direction direction = sortParams.length > 1
                                && sortParams[1].equalsIgnoreCase("desc")
                                                ? org.springframework.data.domain.Sort.Direction.DESC
                                                : org.springframework.data.domain.Sort.Direction.ASC;

                org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page,
                                size,
                                org.springframework.data.domain.Sort.by(direction, sortField));
                org.springframework.data.domain.Page<ItemMasterSummaryResponse> result = inventoryService
                                .getInventorySummaryPaginated(warehouseType, stockStatus, pageable);
                return ResponseEntity.ok(result);
        }

        /**
         * ➕ API: Tạo Item Master mới
         */
        @Operation(summary = "Tạo vật tư mới", description = "Validate: item_code unique, min_stock <= max_stock")
        @ApiMessage("Tạo vật tư thành công")
        @PostMapping("/item-master")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('MANAGE_WAREHOUSE')")
        public ResponseEntity<ItemMasterSummaryResponse> createItemMaster(
                        @Valid @RequestBody CreateItemMasterRequest request) {
                log.info("POST /api/v1/inventory/item-master - itemCode: {}", request.getItemCode());
                ItemMasterSummaryResponse response = inventoryService.createItemMaster(request);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        /**
         * ✏ API: Cập nhật Item Master
         */
        @Operation(summary = "Cập nhật vật tư", description = "Update item master by ID")
        @ApiMessage("Cập nhật vật tư thành công")
        @PutMapping("/item-master/{id}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('MANAGE_WAREHOUSE')")
        public ResponseEntity<ItemMasterSummaryResponse> updateItemMaster(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateItemMasterRequest request) {
                log.info("PUT /api/v1/inventory/item-master/{}", id);
                ItemMasterSummaryResponse response = inventoryService.updateItemMaster(id, request);
                return ResponseEntity.ok(response);
        }

        /**
         * API: Xóa Item Master
         */
        @Operation(summary = "Xóa vật tư", description = "Không thể xóa nếu đã có lô hàng")
        @ApiMessage("Xóa vật tư thành công")
        @DeleteMapping("/item-master/{id}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('MANAGE_WAREHOUSE')")
        public ResponseEntity<Void> deleteItemMaster(@PathVariable Long id) {
                log.info("DELETE /api/v1/inventory/item-master/{}", id);
                inventoryService.deleteItemMaster(id);
                return ResponseEntity.noContent().build();
        }

        /**
         * API 2: Lấy thống kê cho 4 thẻ trên Dashboard
         */
        @Operation(summary = "Lấy thống kê tổng quan kho", description = "Trả về: Tổng vật tư, Cảnh báo, Sắp hết hạn, Hết hàng")
        @ApiMessage("Lấy thống kê kho thành công")
        @GetMapping("/stats")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<WarehouseStatsResponse> getInventoryStats() {
                log.info("GET /api/v1/inventory/stats");
                WarehouseStatsResponse stats = inventoryService.getWarehouseStats();
                return ResponseEntity.ok(stats);
        }

        /**
         * API 3: Lấy danh sách lô hàng (FEFO sorted)
         * Dùng cho Modal Xuất Kho
         */
        @Operation(summary = "Lấy danh sách lô hàng theo FEFO", description = "BE đã sort theo expiryDate ASC")
        @ApiMessage("Lấy danh sách lô hàng thành công")
        @GetMapping("/batches/{itemMasterId}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<List<BatchResponse>> getBatchesByItemMaster(
                        @Parameter(description = "ID của vật tư") @PathVariable Long itemMasterId) {
                log.info("GET /api/v1/inventory/batches/{}", itemMasterId);
                List<BatchResponse> batches = inventoryService.getBatchesByItemMaster(itemMasterId);
                return ResponseEntity.ok(batches);
        }

        /**
         * API: Lấy tất cả Categories
         */
        @Operation(summary = "Lấy danh sách danh mục", description = "Load categories for dropdown in CreateItemMasterModal")
        @ApiMessage("Lấy danh mục thành công")
        @GetMapping("/categories")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<List<ItemCategoryResponse>> getAllCategories(
                        @Parameter(description = "Lọc theo loại kho") @RequestParam(required = false) WarehouseType warehouseType) {
                log.info("GET /api/v1/inventory/categories - warehouseType: {}", warehouseType);
                List<ItemCategoryResponse> categories = inventoryService.getAllCategories(warehouseType);
                return ResponseEntity.ok(categories);
        }

        /**
         * ➕ API: Tạo Category mới
         */
        @Operation(summary = "Tạo danh mục vật tư mới", description = "Validate: category_code unique")
        @ApiMessage("Tạo danh mục thành công")
        @PostMapping("/categories")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('MANAGE_WAREHOUSE')")
        public ResponseEntity<ItemCategoryResponse> createCategory(
                        @Valid @RequestBody CreateCategoryRequest request) {
                log.info("POST /api/v1/inventory/categories - code: {}, name: {}",
                                request.getCategoryCode(), request.getCategoryName());
                ItemCategoryResponse response = inventoryService.createCategory(request);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        /**
         * ✏ API: Cập nhật Category
         */
        @Operation(summary = "Cập nhật danh mục vật tư", description = "Update category by ID")
        @ApiMessage("Cập nhật danh mục thành công")
        @PutMapping("/categories/{id}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('MANAGE_WAREHOUSE')")
        public ResponseEntity<ItemCategoryResponse> updateCategory(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateCategoryRequest request) {
                log.info("PUT /api/v1/inventory/categories/{}", id);
                ItemCategoryResponse response = inventoryService.updateCategory(id, request);
                return ResponseEntity.ok(response);
        }

        /**
         * API: Xóa Category
         */
        @Operation(summary = "Xóa danh mục vật tư", description = "Không thể xóa nếu đã có items")
        @ApiMessage("Xóa danh mục thành công")
        @DeleteMapping("/categories/{id}")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('MANAGE_WAREHOUSE')")
        public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
                log.info("DELETE /api/v1/inventory/categories/{}", id);
                inventoryService.deleteCategory(id);
                return ResponseEntity.noContent().build();
        }

        // ===========================
        // GET SUPPLIERS OF ITEM
        // ===========================

        /**
         * API: Lấy danh sách NCC cung cấp item này
         * FE dùng khi: Filter item để tìm NCC, so sánh giá giữa các NCC
         */
        @Operation(summary = "Lấy danh sách NCC của item", description = "Xem item này có bao nhiêu NCC cung cấp, giá nhập lần cuối")
        @GetMapping("/{id}/suppliers")
        @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
        public ResponseEntity<List<ItemSupplierResponse>> getItemSuppliers(@PathVariable Long id) {
                log.info("GET /api/v1/inventory/{}/suppliers", id);
                List<ItemSupplierResponse> suppliers = inventoryService.getItemSuppliers(id);
                return ResponseEntity.ok(suppliers);
        }

        // ===========================
        // API 6.4: CREATE IMPORT TRANSACTION
        // ===========================

        /**
         * API 6.4: Create Import Transaction
         *
         * Business Features:
         * - Invoice number tracking (unique constraint)
         * - Batch creation/update with expiry date validation
         * - Unit conversion (input unit to base unit)
         * - Purchase price tracking for COGS
         * - Financial summary (totalValue)
         * - Warning generation (near expiry, price variance)
         * - Batch status tracking (CREATED/UPDATED)
         * - Current stock after import
         */
        @Operation(summary = "Tạo phiếu nhập kho", description = "Tạo phiếu nhập kho với tracking hóa đơn, giá nhập, chuyển đổi đơn vị, xử lý lô hàng")
        @ApiMessage("Tạo phiếu nhập kho thành công")
        @PostMapping("/import")
        @PreAuthorize("hasAuthority('IMPORT_ITEMS')")
        public ResponseEntity<ImportTransactionResponse> createImportTransaction(
                        @Valid @RequestBody ImportTransactionRequest request) {

                String employeeCode = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("Cannot determine current user"));

                log.info("POST /api/v1/inventory/import - Invoice: {}, Supplier: {}, Items: {}",
                                request.getInvoiceNumber(), request.getSupplierId(), request.getItems().size());

                ImportTransactionResponse response = importTransactionService.createImportTransaction(
                                request, employeeCode);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        // ===========================
        // API 6.5: CREATE EXPORT TRANSACTION
        // ===========================

        /**
         * API 6.5: Create Export Transaction
         *
         * Business Features:
         * - FEFO Algorithm (First Expired, First Out)
         * - Auto-Unpacking (xé lẻ tự động từ đơn vị lớn)
         * - Multi-Batch Allocation (phân bổ từ nhiều lô)
         * - Financial Tracking (COGS calculation)
         * - Warning System (near expiry, expired stock)
         * - Unpacking Traceability (parentBatchId tracking)
         *
         * Export Types:
         * - USAGE: Xuất dùng (không cho phép hàng hết hạn)
         * - DISPOSAL: Xuất hủy (cho phép hàng hết hạn)
         * - RETURN: Trả NCC
         */
        @Operation(summary = "Tạo phiếu xuất kho", description = """
                        Tạo phiếu xuất kho với các tính năng:
                        - FEFO Algorithm: Tự động chọn lô hết hạn trước
                        - Auto-Unpacking: Xé lẻ tự động nếu không đủ hàng lẻ
                        - Multi-Batch: Phân bổ từ nhiều lô để đủ số lượng
                        - Financial Tracking: Tính COGS cho báo cáo
                        - Warnings: Cảnh báo hàng sắp hết hạn/đã hết hạn

                        Permissions:
                        - EXPORT_ITEMS: Xuất dùng (USAGE)
                        - DISPOSE_ITEMS: Xuất hủy (DISPOSAL)
                        """)
        @ApiMessage("Tạo phiếu xuất kho thành công")
        @PostMapping("/export")
        @PreAuthorize("hasAnyAuthority('EXPORT_ITEMS', 'DISPOSE_ITEMS')")
        public ResponseEntity<ExportTransactionResponse> createExportTransaction(
                        @Valid @RequestBody ExportTransactionRequest request) {

                String employeeCode = SecurityUtil.getCurrentUserLogin()
                                .orElseThrow(() -> new RuntimeException("Cannot determine current user"));

                log.info("POST /api/v1/inventory/export - Type: {}, Items: {}",
                                request.getExportType(), request.getItems().size());

                ExportTransactionResponse response = exportTransactionService.createExportTransaction(
                                request, employeeCode);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
}
