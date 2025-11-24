package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.warehouse.domain.ItemBatch;
import com.dental.clinic.management.warehouse.domain.ItemCategory;
import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.domain.ItemUnit;
import com.dental.clinic.management.warehouse.dto.request.CreateCategoryRequest;
import com.dental.clinic.management.warehouse.dto.request.CreateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateCategoryRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.response.BatchDetailDTO;
import com.dental.clinic.management.warehouse.dto.response.BatchResponse;
import com.dental.clinic.management.warehouse.dto.response.BatchStatsDTO;
import com.dental.clinic.management.warehouse.dto.response.InventoryItemDTO;
import com.dental.clinic.management.warehouse.dto.response.InventorySummaryResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemBatchesResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemCategoryResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemMasterSummaryResponse;
import com.dental.clinic.management.warehouse.dto.response.ItemSupplierResponse;
import com.dental.clinic.management.warehouse.dto.response.WarehouseStatsResponse;
import com.dental.clinic.management.warehouse.enums.BatchStatus;
import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import com.dental.clinic.management.warehouse.exception.ItemMasterNotFoundException;
import com.dental.clinic.management.warehouse.mapper.ItemMasterMapper;
import com.dental.clinic.management.warehouse.repository.ItemBatchRepository;
import com.dental.clinic.management.warehouse.repository.ItemCategoryRepository;
import com.dental.clinic.management.warehouse.repository.ItemMasterRepository;
import com.dental.clinic.management.warehouse.repository.ItemUnitRepository;
import com.dental.clinic.management.warehouse.repository.SupplierItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 📦 Inventory Service
 * Quản lý tồn kho, vật tư, danh mục, lô hàng
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ItemMasterRepository itemMasterRepository;
    private final ItemBatchRepository itemBatchRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final SupplierItemRepository supplierItemRepository;
    private final ItemMasterMapper itemMasterMapper;
    private final ItemUnitRepository itemUnitRepository;

    /**
     * 🔥 API 1: Lấy danh sách vật tư cho Dashboard
     * BE tự động tính toán stock_status, total_quantity, isExpiringSoon
     */
    @Transactional(readOnly = true)
    public List<ItemMasterSummaryResponse> getInventorySummary(WarehouseType warehouseType, StockStatus stockStatus) {
        log.info("Getting inventory summary - warehouseType: {}, stockStatus: {}", warehouseType, stockStatus);

        List<ItemMaster> items = (warehouseType != null)
                ? itemMasterRepository.findByWarehouseTypeAndIsActiveTrue(warehouseType)
                : itemMasterRepository.findByIsActiveTrue();

        List<ItemMasterSummaryResponse> result = items.stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());

        // Filter by stock status if provided
        if (stockStatus != null) {
            result = result.stream()
                    .filter(dto -> dto.getStockStatus() == stockStatus)
                    .collect(Collectors.toList());
        }

        log.info("Found {} items", result.size());
        return result;
    }

    /**
     * 🔥 API 1.5: Lấy danh sách vật tư với Pagination
     */
    @Transactional(readOnly = true)
    public Page<ItemMasterSummaryResponse> getInventorySummaryPaginated(WarehouseType warehouseType,
            StockStatus stockStatus, Pageable pageable) {
        log.info("Getting inventory summary (paginated) - warehouseType: {}, stockStatus: {}, page: {}, size: {}",
                warehouseType, stockStatus, pageable.getPageNumber(), pageable.getPageSize());

        List<ItemMasterSummaryResponse> allItems = getInventorySummary(warehouseType, stockStatus);

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allItems.size());

        List<ItemMasterSummaryResponse> pageContent = allItems.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allItems.size());
    }

    /**
     * 🔥 API 2: Lấy thống kê cho 4 thẻ trên Dashboard
     */
    @Transactional(readOnly = true)
    public WarehouseStatsResponse getWarehouseStats() {
        log.info("Calculating warehouse statistics");

        List<ItemMasterSummaryResponse> allItems = getInventorySummary(null, null);

        return WarehouseStatsResponse.builder()
                .totalItems(allItems.size())
                .lowStockItems((int) allItems.stream().filter(i -> i.getStockStatus() == StockStatus.LOW_STOCK).count())
                .expiringSoonItems((int) allItems.stream().filter(ItemMasterSummaryResponse::getIsExpiringSoon).count())
                .outOfStockItems(
                        (int) allItems.stream().filter(i -> i.getStockStatus() == StockStatus.OUT_OF_STOCK).count())
                .build();
    }

    /**
     * 🔥 API 3: Lấy danh sách lô hàng (FEFO sorted)
     */
    @Transactional(readOnly = true)
    public List<BatchResponse> getBatchesByItemMaster(Long itemMasterId) {
        log.info("Getting batches for itemMasterId: {} with FEFO sorting", itemMasterId);

        List<ItemBatch> batches = itemBatchRepository.findByItemMasterIdFEFO(itemMasterId);

        return batches.stream()
                .map(this::mapToBatchDto)
                .collect(Collectors.toList());
    }

    /**
     * Create Item Master
     */
    @Transactional
    public ItemMasterSummaryResponse createItemMaster(CreateItemMasterRequest request) {
        log.info("Creating item master: {}", request.getItemCode());

        // Check duplicate itemCode
        if (itemMasterRepository.findByItemCode(request.getItemCode()).isPresent()) {
            throw new IllegalArgumentException("Mã vật tư '" + request.getItemCode() + "' đã tồn tại");
        }

        // Validate category exists
        ItemCategory category = itemCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy danh mục với ID: " + request.getCategoryId()));

        // Create entity using mapper
        ItemMaster itemMaster = itemMasterMapper.toEntity(request);
        itemMaster.setCategory(category);
        itemMaster.setIsActive(true);

        ItemMaster saved = itemMasterRepository.save(itemMaster);
        log.info("Created item master successfully: {}", saved.getItemMasterId());

        return itemMasterMapper.toSummaryResponse(saved);
    }

    /**
     * Update Item Master
     */
    @Transactional
    public ItemMasterSummaryResponse updateItemMaster(Long id, UpdateItemMasterRequest request) {
        log.info("Updating item master: {}", id);

        ItemMaster itemMaster = itemMasterRepository.findById(id)
                .orElseThrow(() -> new ItemMasterNotFoundException(id));

        // Validate category exists
        ItemCategory category = itemCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy danh mục với ID: " + request.getCategoryId()));

        // Update using mapper
        itemMasterMapper.updateEntity(itemMaster, request);
        itemMaster.setCategory(category);

        if (request.getIsActive() != null) {
            itemMaster.setIsActive(request.getIsActive());
        }

        ItemMaster updated = itemMasterRepository.save(itemMaster);
        log.info("Updated item master successfully: {}", updated.getItemMasterId());

        return itemMasterMapper.toSummaryResponse(updated);
    }

    /**
     * Delete Item Master
     */
    @Transactional
    public void deleteItemMaster(Long id) {
        log.info("Deleting item master: {}", id);

        ItemMaster itemMaster = itemMasterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vật tư với ID: " + id));

        // Check if has batches
        List<ItemBatch> batches = itemBatchRepository.findByItemMaster_ItemMasterId(id);
        if (!batches.isEmpty()) {
            throw new IllegalArgumentException(
                    "Không thể xóa vật tư đã có lô hàng. Vui lòng set isActive = false thay vì xóa.");
        }

        itemMasterRepository.delete(itemMaster);
        log.info("Deleted item master successfully: {}", id);
    }

    /**
     * Get All Categories
     */
    @Transactional(readOnly = true)
    public List<ItemCategoryResponse> getAllCategories(WarehouseType warehouseType) {
        log.info("Getting all categories - warehouseType: {}", warehouseType);

        List<ItemCategory> categories = itemCategoryRepository.findByIsActiveTrue();

        return categories.stream()
                .map(cat -> ItemCategoryResponse.builder()
                        .categoryId(cat.getCategoryId())
                        .categoryCode(cat.getCategoryCode())
                        .categoryName(cat.getCategoryName())
                        .description(cat.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    // ==================== HELPER METHODS ====================

    /**
     * 🧠 Map ItemMaster sang DTO với calculated fields
     */
    private ItemMasterSummaryResponse mapToSummaryDto(ItemMaster item) {
        List<ItemBatch> batches = itemBatchRepository.findByItemMaster_ItemMasterId(item.getItemMasterId());

        Integer totalQty = batches.stream()
                .mapToInt(ItemBatch::getQuantityOnHand)
                .sum();

        StockStatus status = calculateStockStatus(totalQty, item.getMinStockLevel(), item.getMaxStockLevel());

        Boolean expiringSoon = batches.stream()
                .anyMatch(b -> b.getExpiryDate() != null
                        && b.getExpiryDate().isBefore(LocalDate.now().plusDays(30))
                        && b.getQuantityOnHand() > 0);

        return ItemMasterSummaryResponse.builder()
                .itemMasterId(item.getItemMasterId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .categoryName(item.getCategory() != null ? item.getCategory().getCategoryName() : null)
                .warehouseType(item.getWarehouseType())
                .unitOfMeasure(item.getUnitOfMeasure())
                .totalQuantityOnHand(totalQty)
                .stockStatus(status)
                .isExpiringSoon(expiringSoon)
                .minStockLevel(item.getMinStockLevel())
                .maxStockLevel(item.getMaxStockLevel())
                .isTool(item.getIsTool())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    /**
     * 🧠 Logic: Tính stock status
     */
    private StockStatus calculateStockStatus(Integer totalQty, Integer minLevel, Integer maxLevel) {
        if (totalQty == 0)
            return StockStatus.OUT_OF_STOCK;
        if (totalQty < minLevel)
            return StockStatus.LOW_STOCK;
        if (totalQty > maxLevel)
            return StockStatus.OVERSTOCK;
        return StockStatus.NORMAL;
    }

    private BatchResponse mapToBatchDto(ItemBatch batch) {
        LocalDate expiryDate = batch.getExpiryDate();
        Boolean isExpiringSoon = expiryDate != null && expiryDate.isBefore(LocalDate.now().plusDays(30));
        Boolean isExpired = expiryDate != null && expiryDate.isBefore(LocalDate.now());

        return BatchResponse.builder()
                .batchId(batch.getBatchId())
                .lotNumber(batch.getLotNumber())
                .quantityOnHand(batch.getQuantityOnHand())
                .expiryDate(batch.getExpiryDate())
                .importedAt(batch.getImportedAt())
                .supplierName(batch.getSupplier() != null ? batch.getSupplier().getSupplierName() : null)
                .isExpiringSoon(isExpiringSoon)
                .isExpired(isExpired)
                .build();
    }

    /**
     * 📋 API: Lấy tất cả Item Masters với phân trang
     */
    @Transactional(readOnly = true)
    public List<ItemMasterSummaryResponse> getAllItemMasters(WarehouseType warehouseType, String search) {
        log.info("Getting all item masters - warehouseType: {}, search: '{}'", warehouseType, search);

        List<ItemMaster> items;
        if (search != null && !search.isBlank()) {
            items = itemMasterRepository.searchItemMasters(search.trim());
        } else if (warehouseType != null) {
            items = itemMasterRepository.findByWarehouseTypeAndIsActiveTrue(warehouseType);
        } else {
            items = itemMasterRepository.findByIsActiveTrue();
        }

        return items.stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    /**
     * 🔍 API: Lấy chi tiết 1 Item Master
     */
    @Transactional(readOnly = true)
    public ItemMasterSummaryResponse getItemMasterById(Long id) {
        log.info("Getting item master detail by id: {}", id);

        if (id == null) {
            throw new IllegalArgumentException("ID không được để trống");
        }

        ItemMaster itemMaster = itemMasterRepository.findById(id)
                .orElseThrow(() -> new ItemMasterNotFoundException(id));

        return mapToSummaryDto(itemMaster);
    }

    // ========================================
    // 📁 CATEGORY CRUD OPERATIONS
    // ========================================

    /**
     * ➕ API: Tạo Category mới
     */
    @Transactional
    public ItemCategoryResponse createCategory(CreateCategoryRequest request) {
        log.info("Creating new category - code: {}, name: {}", request.getCategoryCode(), request.getCategoryName());

        // Validate duplicate code
        if (itemCategoryRepository.findByCategoryCode(request.getCategoryCode()).isPresent()) {
            throw new IllegalArgumentException("Mã danh mục đã tồn tại: " + request.getCategoryCode());
        }

        ItemCategory category = ItemCategory.builder()
                .categoryCode(request.getCategoryCode())
                .categoryName(request.getCategoryName())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .build();

        ItemCategory saved = itemCategoryRepository.save(category);
        log.info("Category created successfully - id: {}", saved.getCategoryId());

        return mapToCategoryResponse(saved);
    }

    /**
     * ✏️ API: Cập nhật Category
     */
    @Transactional
    public ItemCategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        log.info("Updating category - id: {}", id);

        ItemCategory category = itemCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + id));

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }
        category.setUpdatedAt(LocalDateTime.now());

        ItemCategory updated = itemCategoryRepository.save(category);
        log.info("Category updated successfully - id: {}", updated.getCategoryId());

        return mapToCategoryResponse(updated);
    }

    /**
     * 🗑️ API: Xóa Category
     */
    @Transactional
    public void deleteCategory(Long id) {
        log.info("Deleting category - id: {}", id);

        ItemCategory category = itemCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục với ID: " + id));

        // Validate: không xóa nếu đã có items
        List<ItemMaster> itemsInCategory = itemMasterRepository.findByCategory_CategoryId(id);
        if (!itemsInCategory.isEmpty()) {
            throw new IllegalStateException(
                    String.format("Không thể xóa danh mục '%s' vì đã có %d vật tư thuộc danh mục này",
                            category.getCategoryName(), itemsInCategory.size()));
        }

        itemCategoryRepository.delete(category);
        log.info("Category deleted successfully - id: {}", id);
    }

    /**
     * 🧠 Mapper: Category entity sang DTO
     */
    private ItemCategoryResponse mapToCategoryResponse(ItemCategory category) {
        return ItemCategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryCode(category.getCategoryCode())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .build();
    }

    // ===========================
    // 📦 API: LẤY DANH SÁCH NCC CỦA 1 ITEM
    // ===========================

    /**
     * 🔥 API: Lấy danh sách nhà cung cấp của 1 item
     * FE dùng để: Xem item này có bao nhiêu NCC, tìm NCC mới
     */
    @Transactional(readOnly = true)
    public List<ItemSupplierResponse> getItemSuppliers(Long itemMasterId) {
        log.info("Getting suppliers for item ID: {}", itemMasterId);

        // Validate item exists
        ItemMaster item = itemMasterRepository.findById(itemMasterId)
                .orElseThrow(() -> new ItemMasterNotFoundException("Item not found with ID: " + itemMasterId));

        return supplierItemRepository.findByItemMaster_ItemMasterId(itemMasterId).stream()
                .map(si -> ItemSupplierResponse.builder()
                        .supplierId(si.getSupplier().getSupplierId())
                        .supplierCode(si.getSupplier().getSupplierCode())
                        .supplierName(si.getSupplier().getSupplierName())
                        .contactPhone(si.getSupplier().getPhoneNumber())
                        .lastPurchaseDate(si.getLastPurchaseDate())
                        .isPreferred(si.getIsPreferred())
                        .build())
                .collect(Collectors.toList());
    }

    // ===========================
    // 🔥 API 6.1: INVENTORY SUMMARY WITH AGGREGATION
    // ===========================

    /**
     * 🔥 API 6.1: Lấy Inventory Summary với computed fields
     * - Tổng số lượng (aggregation từ batches)
     * - Stock status (calculated)
     * - Nearest expiry date (FEFO)
     * - Base unit name
     * - Filters: search, stockStatus, warehouseType, categoryId
     * - Pagination
     */
    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummaryV2(
            String search,
            StockStatus stockStatus,
            WarehouseType warehouseType,
            Long categoryId,
            Pageable pageable) {

        log.info(
                "API 6.1 - Getting inventory summary: search='{}', stockStatus={}, warehouseType={}, categoryId={}, page={}, size={}",
                search, stockStatus, warehouseType, categoryId, pageable.getPageNumber(), pageable.getPageSize());

        // Step 1: Query items with filters (search, warehouseType, categoryId)
        List<ItemMaster> items = itemMasterRepository.findInventorySummary(search, warehouseType, categoryId);

        // Step 2: Map to DTO with computed fields
        List<InventoryItemDTO> allItems = items.stream()
                .map(this::mapToInventoryItemDTO)
                .collect(Collectors.toList());

        // Step 3: Filter by stockStatus if provided
        if (stockStatus != null) {
            allItems = allItems.stream()
                    .filter(dto -> dto.getStockStatus() == stockStatus)
                    .collect(Collectors.toList());
        }

        // Step 4: Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allItems.size());
        List<InventoryItemDTO> pageContent = allItems.subList(start, end);

        // Step 5: Build response
        return InventorySummaryResponse.builder()
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalPages((int) Math.ceil((double) allItems.size() / pageable.getPageSize()))
                .totalItems((long) allItems.size())
                .content(pageContent)
                .build();
    }

    /**
     * 🧠 Map ItemMaster sang InventoryItemDTO với computed fields
     * - totalQuantity: SUM(quantity_on_hand) từ batches
     * - stockStatus: calculated từ totalQuantity vs min/max levels
     * - nearestExpiryDate: MIN(expiry_date) WHERE quantity > 0 (FEFO)
     * - unitName: base unit name
     */
    private InventoryItemDTO mapToInventoryItemDTO(ItemMaster item) {
        // Step 1: Get all batches for this item
        List<ItemBatch> batches = itemBatchRepository.findByItemMaster_ItemMasterId(item.getItemMasterId());

        // Step 2: Calculate totalQuantity (aggregation)
        Integer totalQty = batches.stream()
                .mapToInt(ItemBatch::getQuantityOnHand)
                .sum();

        // Step 3: Calculate stockStatus
        StockStatus status = calculateStockStatus(totalQty, item.getMinStockLevel(), item.getMaxStockLevel());

        // Step 4: Find nearestExpiryDate (FEFO - First Expired First Out)
        LocalDate nearestExpiry = batches.stream()
                .filter(b -> b.getExpiryDate() != null && b.getQuantityOnHand() > 0)
                .map(ItemBatch::getExpiryDate)
                .min(LocalDate::compareTo)
                .orElse(null);

        // Step 5: Get base unit name
        String unitName = itemUnitRepository.findBaseUnitByItemMasterId(item.getItemMasterId())
                .map(ItemUnit::getUnitName)
                .orElse(item.getUnitOfMeasure()); // fallback to old field if no unit defined

        return InventoryItemDTO.builder()
                .itemMasterId(item.getItemMasterId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .categoryName(item.getCategory() != null ? item.getCategory().getCategoryName() : null)
                .warehouseType(item.getWarehouseType())
                .unitName(unitName)
                .minStockLevel(item.getMinStockLevel())
                .maxStockLevel(item.getMaxStockLevel())
                .totalQuantity(totalQty)
                .stockStatus(status)
                .nearestExpiryDate(nearestExpiry)
                .build();
    }

    // ===========================
    // 🔥 API 6.2: GET ITEM BATCHES WITH DETAILS
    // ===========================

    /**
     * 🔥 API 6.2: Lấy chi tiết các lô hàng của một item
     *
     * Features:
     * - Pagination, sorting, filtering
     * - Summary stats (expired, critical, warning, valid counts)
     * - FEFO default sorting (expiryDate ASC)
     * - Computed fields: daysRemaining, status, usageRate
     * - JOIN FETCH supplier (avoid N+1)
     * - Pure operational view (no financial data)
     *
     * @param itemMasterId ID của item master
     * @param hideEmpty    true = chỉ lấy lô còn hàng, false = lấy cả lô hết
     * @param filterStatus Lọc theo batch status (EXPIRED, CRITICAL, EXPIRING_SOON,
     *                     VALID)
     * @param pageable     Pagination và sorting
     * @return ItemBatchesResponse với context, stats, meta, batches
     */
    @Transactional(readOnly = true)
    public ItemBatchesResponse getItemBatches(
            Long itemMasterId,
            Boolean hideEmpty,
            BatchStatus filterStatus,
            Pageable pageable) {

        log.info("🔥 API 6.2 - Getting batches for itemMasterId={}, hideEmpty={}, filterStatus={}, page={}, size={}",
                itemMasterId, hideEmpty, filterStatus, pageable.getPageNumber(), pageable.getPageSize());

        // Step 1: Validate item exists
        ItemMaster itemMaster = itemMasterRepository.findById(itemMasterId)
                .orElseThrow(() -> new ItemMasterNotFoundException(itemMasterId));

        // Step 2: Get all batches (for stats calculation)
        List<ItemBatch> allBatches = itemBatchRepository.findByItemMaster_ItemMasterId(itemMasterId);

        // Step 3: Calculate summary stats
        BatchStatsDTO stats = calculateBatchStats(allBatches);

        // Step 4: Query batches with pagination (JOIN FETCH supplier)
        Page<ItemBatch> batchPage = itemBatchRepository.findItemBatchesWithSupplier(
                itemMasterId, hideEmpty, pageable);

        // Step 5: Map to DTOs và filter by status if needed
        List<BatchDetailDTO> batchDTOs = batchPage.getContent().stream()
                .map(this::mapToBatchDetailDTO)
                .filter(dto -> filterStatus == null || dto.getStatus() == filterStatus)
                .collect(Collectors.toList());

        // Step 6: Get base unit name
        String unitName = itemUnitRepository.findBaseUnitByItemMasterId(itemMasterId)
                .map(ItemUnit::getUnitName)
                .orElse(itemMaster.getUnitOfMeasure());

        // Step 7: Build response
        return ItemBatchesResponse.builder()
                .itemMasterId(itemMaster.getItemMasterId())
                .itemCode(itemMaster.getItemCode())
                .itemName(itemMaster.getItemName())
                .unitName(unitName)
                .minStockLevel(itemMaster.getMinStockLevel())
                .stats(stats)
                .meta(ItemBatchesResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber())
                        .size(pageable.getPageSize())
                        .totalPages(batchPage.getTotalPages())
                        .totalElements(batchPage.getTotalElements())
                        .build())
                .batches(batchDTOs)
                .build();
    }

    /**
     * 🧠 Calculate batch statistics
     * Count batches by status categories
     */
    private BatchStatsDTO calculateBatchStats(List<ItemBatch> batches) {
        LocalDate today = LocalDate.now();

        int expired = 0, critical = 0, warning = 0, valid = 0;
        int totalQty = 0;

        for (ItemBatch batch : batches) {
            totalQty += batch.getQuantityOnHand();

            if (batch.getExpiryDate() == null) {
                valid++; // No expiry date = valid
                continue;
            }

            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            BatchStatus status = BatchStatus.fromDaysRemaining(daysRemaining);

            switch (status) {
                case EXPIRED:
                    expired++;
                    break;
                case CRITICAL:
                    critical++;
                    break;
                case EXPIRING_SOON:
                    warning++;
                    break;
                case VALID:
                    valid++;
                    break;
            }
        }

        return BatchStatsDTO.builder()
                .totalBatches(batches.size())
                .expiredBatches(expired)
                .criticalBatches(critical)
                .warningBatches(warning)
                .validBatches(valid)
                .totalQuantityOnHand(totalQty)
                .build();
    }

    /**
     * 🧠 Map ItemBatch entity to BatchDetailDTO
     * Calculate computed fields: daysRemaining, status, usageRate
     */
    private BatchDetailDTO mapToBatchDetailDTO(ItemBatch batch) {
        LocalDate today = LocalDate.now();

        // Calculate days remaining
        Long daysRemaining = null;
        BatchStatus status = BatchStatus.VALID; // Default for null expiry

        if (batch.getExpiryDate() != null) {
            daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            status = BatchStatus.fromDaysRemaining(daysRemaining);
        }

        // Calculate usage rate
        Double usageRate = 0.0;
        if (batch.getInitialQuantity() != null && batch.getInitialQuantity() > 0) {
            int used = batch.getInitialQuantity() - batch.getQuantityOnHand();
            usageRate = (used * 100.0) / batch.getInitialQuantity();
        }

        return BatchDetailDTO.builder()
                .batchId(batch.getBatchId())
                .lotNumber(batch.getLotNumber())
                .expiryDate(batch.getExpiryDate())
                .quantityOnHand(batch.getQuantityOnHand())
                .initialQuantity(batch.getInitialQuantity())
                .usageRate(Math.round(usageRate * 10.0) / 10.0) // Round to 1 decimal
                .binLocation(batch.getBinLocation())
                .supplierName(batch.getSupplier() != null ? batch.getSupplier().getSupplierName() : null)
                .importedAt(batch.getImportedAt())
                .daysRemaining(daysRemaining)
                .status(status)
                .build();
    }
}
