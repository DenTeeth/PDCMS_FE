package com.dental.clinic.management.warehouse.controller;

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
 * 🏢 Supplier Management Controller
 * Quản lý nhà cung cấp với Pagination + Search + Sort
 */
@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supplier Management", description = "APIs quản lý nhà cung cấp")
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * 📋 GET ALL Suppliers (Pagination + Search + Sort)
     * Query Params:
     * - page: Số trang (default 0)
     * - size: Số lượng/trang (default 10)
     * - sort: supplierName,asc | createdAt,desc
     * - search: Từ khóa tìm kiếm
     */
    @Operation(summary = "Lấy danh sách nhà cung cấp (Paginated)", description = "Hỗ trợ phân trang, tìm kiếm và sắp xếp")
    @ApiMessage("Lấy danh sách nhà cung cấp thành công")
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_RECEPTIONIST')")
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
     * 📄 GET Supplier By ID (Detail + Supplied Items)
     */
    @Operation(summary = "Lấy chi tiết nhà cung cấp", description = "Trả về thông tin đầy đủ + danh sách vật tư cung cấp")
    @ApiMessage("Lấy chi tiết nhà cung cấp thành công")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_RECEPTIONIST')")
    public ResponseEntity<SupplierDetailResponse> getSupplierById(@PathVariable Long id) {
        log.info("GET /api/v1/suppliers/{}", id);
        SupplierDetailResponse supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(supplier);
    }

    /**
     * 📦 GET Supplied Items History
     * Lấy lịch sử vật tư đã cung cấp (giá nhập lần cuối + ngày nhập gần nhất)
     */
    @Operation(summary = "Lấy lịch sử vật tư cung cấp", description = "Trả về danh sách vật tư + giá nhập lần cuối + ngày nhập gần nhất")
    @ApiMessage("Lấy lịch sử vật tư thành công")
    @GetMapping("/{id}/supplied-items")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER', 'ROLE_RECEPTIONIST')")
    public ResponseEntity<List<SuppliedItemResponse>> getSuppliedItems(@PathVariable Long id) {
        log.info("GET /api/v1/suppliers/{}/supplied-items", id);
        List<SuppliedItemResponse> items = supplierService.getSuppliedItems(id);
        return ResponseEntity.ok(items);
    }

    /**
     * ➕ API: Tạo Supplier mới
     */
    @Operation(summary = "Tạo nhà cung cấp mới", description = "Create new supplier")
    @ApiMessage("Tạo nhà cung cấp thành công")
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
    public ResponseEntity<SupplierSummaryResponse> createSupplier(
            @Valid @RequestBody CreateSupplierRequest request) {
        log.info("POST /api/v1/suppliers - name: {}", request.getSupplierName());
        SupplierSummaryResponse response = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * ✏️ API: Cập nhật Supplier
     */
    @Operation(summary = "Cập nhật nhà cung cấp", description = "Update supplier by ID")
    @ApiMessage("Cập nhật nhà cung cấp thành công")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
    public ResponseEntity<SupplierSummaryResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        log.info("PUT /api/v1/suppliers/{}", id);
        SupplierSummaryResponse response = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 🗑️ SOFT DELETE Supplier (World-class approach)
     * - Không xóa cứng, chỉ set isActive = false
     * - Validate: Không cho xóa NCC đã có giao dịch
     */
    @Operation(summary = "Xóa mềm nhà cung cấp", description = "Set isActive = false. Không xóa nếu đã có giao dịch nhập hàng.")
    @ApiMessage("Xóa nhà cung cấp thành công")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_INVENTORY_MANAGER')")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        log.info("DELETE /api/v1/suppliers/{}", id);
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}
