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
 * Supplier Service
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
         * GET ALL Suppliers (Pagination + Search)
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
         * API 6.13: GET Suppliers with Business Metrics
         * Advanced filtering: search, blacklist status, active status
         * Returns: SupplierPageResponse with all fields including metrics
         *
         * @param filterRequest Filter and pagination parameters
         * @return Paginated supplier list with business metrics
         */
        @Transactional(readOnly = true)
        public com.dental.clinic.management.warehouse.dto.SupplierPageResponse getSuppliers(
                        com.dental.clinic.management.warehouse.dto.SupplierFilterRequest filterRequest) {

                // Validate and normalize parameters
                filterRequest.validateAndNormalize();

                log.info("API 6.13 - Getting suppliers with filters: search='{}', isBlacklisted={}, isActive={}, " +
                                "page={}, size={}, sortBy={}, sortDir={}",
                                filterRequest.getSearch(),
                                filterRequest.getIsBlacklisted(),
                                filterRequest.getIsActive(),
                                filterRequest.getPage(),
                                filterRequest.getSize(),
                                filterRequest.getSortBy(),
                                filterRequest.getSortDir());

                // Create Pageable with dynamic sorting
                // IMPORTANT: Use Java property name (supplierName) NOT database column name
                // (supplier_name)
                org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(
                                filterRequest.getSortDir().equalsIgnoreCase("DESC")
                                                ? org.springframework.data.domain.Sort.Direction.DESC
                                                : org.springframework.data.domain.Sort.Direction.ASC,
                                filterRequest.getSortBy() // Java property name for JPA query
                );

                Pageable pageable = org.springframework.data.domain.PageRequest.of(
                                filterRequest.getPage(),
                                filterRequest.getSize(),
                                sort);

                // Execute query with filters
                Page<Supplier> suppliers = supplierRepository.findAllWithFilters(
                                filterRequest.getSearch(),
                                filterRequest.getIsBlacklisted(),
                                filterRequest.getIsActive(),
                                pageable);

                // Map to SupplierListDTO
                List<com.dental.clinic.management.warehouse.dto.SupplierListDTO> supplierDTOs = suppliers.getContent()
                                .stream()
                                .map(this::mapToSupplierListDTO)
                                .collect(Collectors.toList());

                log.info("API 6.13 - Found {} suppliers (total: {}, page: {}/{})",
                                supplierDTOs.size(),
                                suppliers.getTotalElements(),
                                suppliers.getNumber() + 1,
                                suppliers.getTotalPages());

                // Build response with pagination metadata
                return com.dental.clinic.management.warehouse.dto.SupplierPageResponse.fromPage(
                                suppliers,
                                supplierDTOs);
        }

        /**
         * Mapper: Supplier -> SupplierListDTO (for API 6.13)
         */
        private com.dental.clinic.management.warehouse.dto.SupplierListDTO mapToSupplierListDTO(Supplier supplier) {
                return com.dental.clinic.management.warehouse.dto.SupplierListDTO.builder()
                                .supplierId(supplier.getSupplierId())
                                .supplierCode(supplier.getSupplierCode())
                                .supplierName(supplier.getSupplierName())
                                .phoneNumber(supplier.getPhoneNumber())
                                .email(supplier.getEmail())
                                .address(supplier.getAddress())
                                .tierLevel(supplier.getTierLevel())
                                .ratingScore(supplier.getRatingScore())
                                .totalOrders(supplier.getTotalOrders())
                                .lastOrderDate(supplier.getLastOrderDate())
                                .isBlacklisted(supplier.getIsBlacklisted())
                                .isActive(supplier.getIsActive())
                                .notes(supplier.getNotes())
                                .createdAt(supplier.getCreatedAt())
                                .updatedAt(supplier.getUpdatedAt())
                                .build();
        }

        /**
         * GET Supplier By ID (Detail)
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
         * API 6.16: Soft Delete Supplier
         * Business Rule: Cannot delete supplier if has transaction history
         * Action: Set isActive = false (soft delete, keeps audit trail)
         */
        @Transactional
        public void deleteSupplier(Long id) {
                log.info("API 6.16 - Soft deleting supplier ID: {}", id);

                // 1. Validate supplier exists
                Supplier supplier = supplierRepository.findById(id)
                                .orElseThrow(() -> {
                                        log.warn("Supplier not found: ID {}", id);
                                        return new SupplierNotFoundException(id);
                                });

                // 2. Business Rule: Cannot delete if has transaction history
                if (storageTransactionRepository.existsBySupplier(id)) {
                        log.warn("Cannot delete supplier '{}' ({}) - has transaction history",
                                        supplier.getSupplierCode(), supplier.getSupplierName());
                        throw new com.dental.clinic.management.exception.BusinessException(
                                        "SUPPLIER_HAS_TRANSACTIONS",
                                        "Cannot delete supplier '" + supplier.getSupplierName()
                                                        + "' because it has transaction history. You can only set it to INACTIVE status.");
                }

                // 3. Soft Delete: Set isActive = false
                supplier.setIsActive(false);
                supplierRepository.save(supplier);

                log.info("API 6.16 - Supplier '{}' ({}) marked as INACTIVE (soft deleted)",
                                supplier.getSupplierCode(), supplier.getSupplierName());
        }

        /**
         * GET Supplied Items History (World-class query)
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
         * Mapper: Supplier -> SupplierSummaryResponse
         */
        private SupplierSummaryResponse mapToSummaryResponse(Supplier supplier) {
                return SupplierSummaryResponse.builder()
                                .supplierId(supplier.getSupplierId())
                                .supplierCode(supplier.getSupplierCode())
                                .supplierName(supplier.getSupplierName())
                                .phoneNumber(supplier.getPhoneNumber())
                                .email(supplier.getEmail())
                                .address(supplier.getAddress())
                                .isActive(supplier.getIsActive())
                                .isBlacklisted(supplier.getIsBlacklisted())
                                .totalOrders(supplier.getTotalOrders())
                                .lastOrderDate(supplier.getLastOrderDate())
                                .notes(supplier.getNotes())
                                .createdAt(supplier.getCreatedAt())
                                .status(supplier.getIsActive() ? "ACTIVE" : "INACTIVE")
                                .build();
        }

        /**
         * Mapper: Supplier + SupplierItems -> SupplierDetailResponse
         */
        private SupplierDetailResponse mapToDetailResponse(Supplier supplier, List<SupplierItem> supplierItems) {
                List<SupplierDetailResponse.SuppliedItemSummary> suppliedItemsSummary = supplierItems.stream()
                                .map(si -> {
                                        // Tính tổng số lượng từ tất cả batches của supplier này cho item này
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
                log.info("API 6.14 - Creating supplier: {}", request.getSupplierName());

                // Validate supplier name uniqueness (case-insensitive)
                if (supplierRepository.existsBySupplierNameIgnoreCase(request.getSupplierName())) {
                        log.warn("Supplier name already exists: {}", request.getSupplierName());
                        throw new com.dental.clinic.management.exception.DuplicateResourceException(
                                        "DUPLICATE_SUPPLIER_NAME",
                                        "Supplier '" + request.getSupplierName() + "' already exists");
                }

                // Validate email uniqueness if provided (case-insensitive)
                if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                        if (supplierRepository.existsByEmailIgnoreCase(request.getEmail())) {
                                log.warn("Email already exists: {}", request.getEmail());
                                throw new com.dental.clinic.management.exception.DuplicateResourceException(
                                                "DUPLICATE_EMAIL",
                                                "Email '" + request.getEmail()
                                                                + "' is already in use by another supplier");
                        }
                }

                // Auto-generate supplier code (SUP-001, SUP-002, ...)
                String supplierCode = generateSupplierCode();

                // Map to entity using mapper
                Supplier supplier = supplierMapper.toEntity(request);
                supplier.setSupplierCode(supplierCode);
                supplier.setIsActive(true);
                supplier.setTotalOrders(0);
                supplier.setLastOrderDate(null);

                supplier = supplierRepository.save(supplier);
                log.info("API 6.14 - Created supplier successfully: {} ({})", supplierCode, request.getSupplierName());

                return mapToSummaryResponse(supplier);
        }

        /**
         * API 6.15: Update Supplier
         * Updates supplier profile and risk management flags
         * Validates: (1) Supplier exists (404), (2) Duplicate name with other suppliers
         * (409)
         * Note: Metrics (totalOrders, lastOrderDate) are NOT updated via this API
         */
        @Transactional
        public SupplierSummaryResponse updateSupplier(Long id, UpdateSupplierRequest request) {
                log.info("API 6.15 - Updating supplier ID: {}", id);

                // 1. Validate supplier exists
                Supplier supplier = supplierRepository.findById(id)
                                .orElseThrow(() -> {
                                        log.warn("Supplier not found: ID {}", id);
                                        return new SupplierNotFoundException(id);
                                });

                // 2. Validate duplicate name with OTHER suppliers (case-insensitive)
                if (!supplier.getSupplierName().equalsIgnoreCase(request.getSupplierName())) {
                        if (supplierRepository.existsBySupplierNameIgnoreCase(request.getSupplierName())) {
                                log.warn("Supplier name already exists: {}", request.getSupplierName());
                                throw new com.dental.clinic.management.exception.DuplicateResourceException(
                                                "DUPLICATE_SUPPLIER_NAME",
                                                "Supplier name '" + request.getSupplierName()
                                                                + "' is already used by another supplier");
                        }
                }

                // 3. Validate duplicate email with OTHER suppliers if email changed
                if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                        if (supplier.getEmail() == null || !supplier.getEmail().equalsIgnoreCase(request.getEmail())) {
                                if (supplierRepository.existsByEmailIgnoreCase(request.getEmail())) {
                                        log.warn("Email already exists: {}", request.getEmail());
                                        throw new com.dental.clinic.management.exception.DuplicateResourceException(
                                                        "DUPLICATE_EMAIL",
                                                        "Email '" + request.getEmail()
                                                                        + "' is already in use by another supplier");
                                }
                        }
                }

                // 4. Log blacklist flag change for risk management
                if (request.getIsBlacklisted() != null && request.getIsBlacklisted()
                                && !Boolean.TRUE.equals(supplier.getIsBlacklisted())) {
                        log.warn("RISK MANAGEMENT: Supplier '{}' ({}) marked as BLACKLISTED. Reason: {}",
                                        supplier.getSupplierCode(), supplier.getSupplierName(),
                                        request.getNotes() != null ? request.getNotes() : "Not specified");
                }

                // 5. Update using mapper (only profile fields, NOT metrics)
                supplierMapper.updateEntity(supplier, request);

                supplier = supplierRepository.save(supplier);
                log.info("API 6.15 - Updated supplier successfully: {} ({})",
                                supplier.getSupplierCode(), supplier.getSupplierName());

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
