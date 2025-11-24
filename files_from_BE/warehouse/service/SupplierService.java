package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.warehouse.domain.Supplier;
import com.dental.clinic.management.warehouse.domain.SupplierItem;
import com.dental.clinic.management.warehouse.dto.request.CreateSupplierRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateSupplierRequest;
import com.dental.clinic.management.warehouse.dto.response.SuppliedItemResponse;
import com.dental.clinic.management.warehouse.dto.response.SupplierDetailResponse;
import com.dental.clinic.management.warehouse.dto.response.SupplierSummaryResponse;
import com.dental.clinic.management.warehouse.exception.SupplierNotFoundException;
import com.dental.clinic.management.warehouse.mapper.SupplierMapper;
import com.dental.clinic.management.warehouse.repository.ItemBatchRepository;
import com.dental.clinic.management.warehouse.repository.StorageTransactionRepository;
import com.dental.clinic.management.warehouse.repository.SupplierItemRepository;
import com.dental.clinic.management.warehouse.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🏢 Supplier Service
 * Quản lý nhà cung cấp với Pagination + Search
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierService {

        private final SupplierRepository supplierRepository;
        private final SupplierItemRepository supplierItemRepository;
        private final StorageTransactionRepository storageTransactionRepository;
        private final ItemBatchRepository itemBatchRepository;
        private final SupplierMapper supplierMapper;

        /**
         * 📋 GET ALL Suppliers (Pagination + Search)
         * Trả về SupplierSummaryResponse (nhẹ)
         */
        @Transactional(readOnly = true)
        public Page<SupplierSummaryResponse> getAllSuppliers(String search, Pageable pageable) {
                log.info("Getting all suppliers - search: '{}', page: {}, size: {}", search, pageable.getPageNumber(),
                                pageable.getPageSize());

                Page<Supplier> suppliers = supplierRepository.findAllWithSearch(search, pageable);

                return suppliers.map(this::mapToSummaryResponse);
        }

        /**
         * 📄 GET Supplier By ID (Detail)
         * Trả về SupplierDetailResponse (đầy đủ + danh sách vật tư)
         */
        @Transactional(readOnly = true)
        public SupplierDetailResponse getSupplierById(Long id) {
                log.info("Getting supplier detail by id: {}", id);

                Supplier supplier = supplierRepository.findById(id)
                                .orElseThrow(() -> new SupplierNotFoundException(id));

                // Lấy danh sách vật tư mà NCC này cung cấp
                List<SupplierItem> supplierItems = supplierItemRepository.findBySupplierIdWithItems(id);

                return mapToDetailResponse(supplier, supplierItems);
        }

        /**
         * 🗑️ SOFT DELETE Supplier (World-class approach)
         * - Không xóa cứng (hard delete) để giữ lịch sử audit
         * - Chuyển isActive = false
         * - Kiểm tra xem có giao dịch nhập hàng không (business rule)
         */
        @Transactional
        public void deleteSupplier(Long id) {
                log.info("Soft deleting supplier: {}", id);

                Supplier supplier = supplierRepository.findById(id)
                                .orElseThrow(() -> new SupplierNotFoundException(id));

                // 🔒 Business Rule: Không cho xóa NCC đã có giao dịch nhập hàng
                if (storageTransactionRepository.existsBySupplier(id)) {
                        throw new IllegalStateException(
                                        "Không thể xóa nhà cung cấp '" + supplier.getSupplierName()
                                                        + "' vì đã có lịch sử giao dịch nhập hàng. Chỉ có thể đặt trạng thái INACTIVE.");
                }

                // Soft Delete: Set isActive = false
                supplier.setIsActive(false);
                supplierRepository.save(supplier);

                log.info("Supplier {} marked as INACTIVE (soft deleted)", supplier.getSupplierCode());
        }

        /**
         * 📦 GET Supplied Items History (World-class query)
         * - Lấy lịch sử vật tư mà NCC này đã cung cấp
         * - Giá nhập lần cuối + Ngày nhập gần nhất
         * - Sử dụng DISTINCT ON trong PostgreSQL (hiệu năng cao)
         */
        @Transactional(readOnly = true)
        public List<SuppliedItemResponse> getSuppliedItems(Long supplierId) {
                log.info("Getting supplied items history for supplier: {}", supplierId);

                // Validate supplier exists
                if (!supplierRepository.existsById(supplierId)) {
                        throw new SupplierNotFoundException(supplierId);
                }

                // Execute world-class query
                List<Object[]> results = storageTransactionRepository.findSuppliedItemsBySupplier(supplierId);

                // Map Object[] to DTO
                return results.stream()
                                .map(row -> SuppliedItemResponse.builder()
                                                .itemCode((String) row[0])
                                                .itemName((String) row[1])
                                                .lastImportPrice((BigDecimal) row[2])
                                                .lastImportDate((LocalDateTime) row[3])
                                                .build())
                                .collect(Collectors.toList());
        }

        /**
         * 🔄 Mapper: Supplier -> SupplierSummaryResponse
         */
        private SupplierSummaryResponse mapToSummaryResponse(Supplier supplier) {
                return SupplierSummaryResponse.builder()
                                .supplierId(supplier.getSupplierId())
                                .supplierCode(supplier.getSupplierCode())
                                .supplierName(supplier.getSupplierName())
                                .phoneNumber(supplier.getPhoneNumber())
                                .email(supplier.getEmail())
                                .status(supplier.getIsActive() ? "ACTIVE" : "INACTIVE")
                                .build();
        }

        /**
         * 🔄 Mapper: Supplier + SupplierItems -> SupplierDetailResponse
         */
        private SupplierDetailResponse mapToDetailResponse(Supplier supplier, List<SupplierItem> supplierItems) {
                List<SupplierDetailResponse.SuppliedItemSummary> suppliedItemsSummary = supplierItems.stream()
                                .map(si -> {
                                        // 🔥 Tính tổng số lượng từ tất cả batches của supplier này cho item này
                                        Integer totalQuantity = itemBatchRepository.getTotalQuantityByItemAndSupplier(
                                                        si.getItemMaster().getItemMasterId(),
                                                        supplier.getSupplierId());

                                        return SupplierDetailResponse.SuppliedItemSummary.builder()
                                                        .itemMasterId(si.getItemMaster().getItemMasterId())
                                                        .itemCode(si.getItemMaster().getItemCode())
                                                        .itemName(si.getItemMaster().getItemName())
                                                        .categoryName(si.getItemMaster().getCategory() != null
                                                                        ? si.getItemMaster().getCategory()
                                                                                        .getCategoryName()
                                                                        : "N/A")
                                                        .lastImportDate(si.getLastPurchaseDate())
                                                        .totalQuantity(totalQuantity != null ? totalQuantity : 0)
                                                        .build();
                                })
                                .collect(Collectors.toList());

                return SupplierDetailResponse.builder()
                                .supplierId(supplier.getSupplierId())
                                .supplierCode(supplier.getSupplierCode())
                                .supplierName(supplier.getSupplierName())
                                .phoneNumber(supplier.getPhoneNumber())
                                .email(supplier.getEmail())
                                .address(supplier.getAddress())
                                .notes(supplier.getNotes())
                                .isActive(supplier.getIsActive())
                                .createdAt(supplier.getCreatedAt())
                                .updatedAt(supplier.getUpdatedAt())
                                .suppliedItems(suppliedItemsSummary)
                                .build();
        }

        /**
         * Create Supplier
         */
        @Transactional
        public SupplierSummaryResponse createSupplier(CreateSupplierRequest request) {
                log.info("Creating supplier: {}", request.getSupplierName());

                // Auto-generate supplier code
                String supplierCode = generateSupplierCode();

                // Map to entity using mapper
                Supplier supplier = supplierMapper.toEntity(request);
                supplier.setSupplierCode(supplierCode);
                supplier.setIsActive(true);

                supplier = supplierRepository.save(supplier);
                log.info("Created supplier with code: {}", supplierCode);

                return mapToSummaryResponse(supplier);
        }

        /**
         * Update Supplier
         */
        @Transactional
        public SupplierSummaryResponse updateSupplier(Long id, UpdateSupplierRequest request) {
                log.info("Updating supplier: {}", id);

                Supplier supplier = supplierRepository.findById(id)
                                .orElseThrow(() -> new SupplierNotFoundException(id));

                // Update using mapper
                supplierMapper.updateEntity(supplier, request);

                supplier = supplierRepository.save(supplier);
                log.info("Updated supplier: {}", supplier.getSupplierCode());

                return mapToSummaryResponse(supplier);
        }

        // ==================== HELPER METHODS ====================

        /**
         * Generate supplier code: SUP001, SUP002, SUP003...
         */
        private String generateSupplierCode() {
                Long maxId = supplierRepository.findMaxSupplierId();
                Long nextId = (maxId != null) ? maxId + 1 : 1L;
                return String.format("SUP%03d", nextId);
        }
}
