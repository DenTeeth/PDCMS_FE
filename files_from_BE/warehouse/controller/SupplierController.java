package com.dental.clinic.management.warehouse.controller;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.*;

import com.dental.clinic.management.utils.annotation.ApiMessage;
import com.dental.clinic.management.warehouse.dto.request.CreateSupplierRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateSupplierRequest;
import com.dental.clinic.management.warehouse.dto.response.SuppliedItemResponse;
import com.dental.clinic.management.warehouse.dto.response.SupplierDetailResponse;
import com.dental.clinic.management.warehouse.dto.response.SupplierSummaryResponse;
import com.dental.clinic.management.warehouse.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Supplier Management Controller
 * Quản lý nhà cung cấp với Pagination + Search + Sort
 */
@RestController
@RequestMapping("/api/v1/warehouse/suppliers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supplier Management", description = "APIs quản lý nhà cung cấp")
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * GET ALL Suppliers (Pagination + Search + Sort)
     * Query Params:
     * - page: Số trang (default 0)
     * - size: Số lượng/trang (default 10)
     * - sort: supplierName,asc | createdAt,desc
     * - search: Từ khóa tìm kiếm
     */
    @Operation(summary = "Lấy danh sách nhà cung cấp (Paginated)", description = "Hỗ trợ phân trang, tìm kiếm và sắp xếp")
    @ApiMessage("Lấy danh sách nhà cung cấp thành công")
    @GetMapping
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
    public ResponseEntity<Page<SupplierSummaryResponse>> getAllSuppliers(
            @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số lượng/trang") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sắp xếp: supplierName,asc | createdAt,desc") @RequestParam(defaultValue = "supplierName,asc") String sort,
            @Parameter(description = "Tìm kiếm theo tên, code, phone, email") @RequestParam(required = false) String search) {

        log.info("GET /api/v1/suppliers - page: {}, size: {}, sort: {}, search: '{}'", page, size, sort, search);

        // Parse sort parameter
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<SupplierSummaryResponse> suppliers = supplierService.getAllSuppliers(search, pageable);

        return ResponseEntity.ok(suppliers);
    }

    /**
     * API 6.13: GET Suppliers with Business Metrics (Advanced)
     * Features:
     * - Multi-field search (name, phone, email, code)
     * - Filter by blacklist status
     * - Filter by active status
     * - Sort by: supplierName, totalOrders, lastOrderDate, etc.
     * - Returns full supplier info + business metrics
     */
    @Operation(summary = "API 6.13 - Lấy danh sách nhà cung cấp với metrics", description = """
            Advanced supplier list với business metrics cho procurement decisions.

            **Search**: Tìm kiếm đa trường (name, phone, email, code)

            **Filters**:
            - isBlacklisted: Lọc NCC đen (fraud/quality issues)
            - isActive: Lọc NCC hoạt động

            **Sort Fields**: supplierName, totalOrders, lastOrderDate, createdAt, tierLevel, ratingScore

            **Business Metrics**:
            - totalOrders: Số lần đã nhập hàng từ NCC này (reliability indicator)
            - lastOrderDate: Ngày nhập gần nhất (detect inactive suppliers > 6 months)
            - isBlacklisted: Cảnh báo NCC có vấn đề chất lượng/fraud

            **Use Cases**:
            - Smart procurement: Chọn NCC đáng tin cậy (high totalOrders)
            - Risk management: Tránh NCC blacklisted
            - Supplier relationship: Detect inactive suppliers cần follow-up
            """)
    @ApiMessage("Lấy danh sách nhà cung cấp với metrics thành công")
    @GetMapping("/list")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('VIEW_WAREHOUSE', 'MANAGE_SUPPLIERS')")
    public ResponseEntity<com.dental.clinic.management.warehouse.dto.SupplierPageResponse> getSuppliersWithMetrics(
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(required = false) Integer page,

            @Parameter(description = "Page size (max 100)", example = "20") @RequestParam(required = false) Integer size,

            @Parameter(description = "Search keyword (searches in name, phone, email, code)", example = "ABC") @RequestParam(required = false) String search,

            @Parameter(description = "Filter by blacklist status (true = only blacklisted, false = only non-blacklisted, null = all)", example = "false") @RequestParam(required = false) Boolean isBlacklisted,

            @Parameter(description = "Filter by active status (true = only active, false = only inactive, null = all)", example = "true") @RequestParam(required = false) Boolean isActive,

            @Parameter(description = "Sort field: supplierName, totalOrders, lastOrderDate, createdAt, tierLevel, ratingScore", example = "totalOrders") @RequestParam(required = false) String sortBy,

            @Parameter(description = "Sort direction: ASC or DESC", example = "DESC") @RequestParam(required = false) String sortDir) {
        log.info("API 6.13 - GET /api/v1/suppliers/list - search='{}', isBlacklisted={}, isActive={}",
                search, isBlacklisted, isActive);

        // Build filter request
        com.dental.clinic.management.warehouse.dto.SupplierFilterRequest filterRequest = com.dental.clinic.management.warehouse.dto.SupplierFilterRequest
                .builder()
                .page(page)
                .size(size)
                .search(search)
                .isBlacklisted(isBlacklisted)
                .isActive(isActive)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        // Get suppliers with metrics
        com.dental.clinic.management.warehouse.dto.SupplierPageResponse response = supplierService
                .getSuppliers(filterRequest);

        return ResponseEntity.ok(response);
    }

    /**
     * GET Supplier By ID (Detail + Supplied Items)
     */
    @Operation(summary = "Lấy chi tiết nhà cung cấp", description = "Trả về thông tin đầy đủ + danh sách vật tư cung cấp")
    @ApiMessage("Lấy chi tiết nhà cung cấp thành công")
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
    public ResponseEntity<SupplierDetailResponse> getSupplierById(@PathVariable Long id) {
        log.info("GET /api/v1/suppliers/{}", id);
        SupplierDetailResponse supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(supplier);
    }

    /**
     * GET Supplied Items History
     * Lấy lịch sử vật tư đã cung cấp (giá nhập lần cuối + ngày nhập gần nhất)
     */
    @Operation(summary = "Lấy lịch sử vật tư cung cấp", description = "Trả về danh sách vật tư + giá nhập lần cuối + ngày nhập gần nhất")
    @ApiMessage("Lấy lịch sử vật tư thành công")
    @GetMapping("/{id}/supplied-items")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('VIEW_WAREHOUSE')")
    public ResponseEntity<List<SuppliedItemResponse>> getSuppliedItems(@PathVariable Long id) {
        log.info("GET /api/v1/suppliers/{}/supplied-items", id);
        List<SuppliedItemResponse> items = supplierService.getSuppliedItems(id);
        return ResponseEntity.ok(items);
    }

    /**
     * API 6.14: Create New Supplier
     *
     * Features:
     * - Auto-generate supplier code (SUP-001, SUP-002, ...)
     * - Validate name uniqueness (case-insensitive)
     * - Validate email uniqueness (case-insensitive)
     * - Set default values: isActive=true, totalOrders=0
     *
     * Validation Rules:
     * - supplierName: Required, 2-255 characters, must be unique
     * - phone: Required, 10-11 digits
     * - email: Optional, valid email format, must be unique if provided
     * - address: Optional, max 500 characters
     * - isBlacklisted: Optional, default false
     * - notes: Optional, max 1000 characters
     */
    @Operation(summary = "API 6.14 - Create new supplier", description = """
            Create a new supplier record for procurement management.

            Auto-generates supplier code (SUP-XXX format).
            Validates name and email uniqueness.
            """)
    @ApiMessage("Supplier created successfully")
    @PostMapping
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('MANAGE_SUPPLIERS', 'MANAGE_WAREHOUSE')")
    public ResponseEntity<SupplierSummaryResponse> createSupplier(
            @Valid @RequestBody CreateSupplierRequest request) {
        log.info("API 6.14 - POST /api/v1/warehouse/suppliers - name: {}", request.getSupplierName());
        SupplierSummaryResponse response = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * API 6.15: Update Supplier
     * Updates supplier profile and risk management flags (isActive, isBlacklisted)
     * Authorization: MANAGE_SUPPLIERS or MANAGE_WAREHOUSE
     */
    @Operation(summary = "Update supplier", description = "Update supplier profile including risk management flags")
    @ApiMessage("Supplier updated successfully")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('MANAGE_SUPPLIERS', 'MANAGE_WAREHOUSE')")
    public ResponseEntity<SupplierSummaryResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        log.info("PUT /api/v1/warehouse/suppliers/{}", id);
        SupplierSummaryResponse response = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * API 6.16: Soft Delete Supplier
     * Business Rule: Cannot delete if has transaction history
     * Authorization: MANAGE_SUPPLIERS or MANAGE_WAREHOUSE
     */
    @Operation(summary = "Soft delete supplier", description = "Set isActive = false. Cannot delete if supplier has transaction history.")
    @ApiMessage("Supplier deleted successfully")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('" + ADMIN + "') or hasAnyAuthority('MANAGE_SUPPLIERS', 'MANAGE_WAREHOUSE')")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        log.info("DELETE /api/v1/warehouse/suppliers/{}", id);
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}
