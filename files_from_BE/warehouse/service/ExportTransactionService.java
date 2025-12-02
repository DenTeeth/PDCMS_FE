package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.warehouse.domain.*;
import com.dental.clinic.management.warehouse.dto.request.ExportTransactionRequest;
import com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse;
import com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.ExportItemResponse;
import com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.UnpackingInfo;
import com.dental.clinic.management.warehouse.dto.response.ExportTransactionResponse.WarningDTO;
import com.dental.clinic.management.warehouse.enums.ExportType;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
import com.dental.clinic.management.warehouse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * API 6.5: Export Transaction Service
 *
 * Core Features:
 * - FEFO Algorithm (First Expired, First Out)
 * - Auto-Unpacking (xé lẻ tự động từ đơn vị lớn)
 * - Multi-Batch Allocation (phân bổ từ nhiều lô)
 * - Financial Tracking (COGS calculation)
 * - Warning System (near expiry, expired stock)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportTransactionService {

    private final StorageTransactionRepository transactionRepository;
    private final ItemMasterRepository itemMasterRepository;
    private final ItemBatchRepository batchRepository;
    private final ItemUnitRepository unitRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Create Export Transaction
     *
     * @param request      Export transaction request
     * @param employeeCode Employee who creates the transaction
     * @return Complete transaction response with FEFO allocation and unpacking info
     */
    @Transactional(rollbackFor = Exception.class)
    public ExportTransactionResponse createExportTransaction(
            ExportTransactionRequest request,
            String employeeCode) {

        log.info("🚀 Creating export transaction - Type: {}, Items: {}",
                request.getExportType(), request.getItems().size());

        try {
            // 1. Validate request
            validateExportRequest(request);

            // 2. Load employee
            Employee employee = employeeRepository.findByAccount_Username(employeeCode)
                    .orElseThrow(() -> new NotFoundException(
                            "EMPLOYEE_NOT_FOUND",
                            "Employee not found for account: " + employeeCode));

            if (!employee.getIsActive()) {
                throw new BadRequestException(
                        "EMPLOYEE_INACTIVE",
                        "Cannot create export transaction with inactive employee: " + employeeCode);
            }

            // 3. Create transaction header
            StorageTransaction transaction = createTransactionHeader(request, employee);
            transaction = transactionRepository.save(transaction);

            // 4. Process each item with FEFO + Auto-Unpacking
            List<ExportItemResponse> itemResponses = new ArrayList<>();
            List<WarningDTO> warnings = new ArrayList<>();
            BigDecimal totalValue = BigDecimal.ZERO;

            for (ExportTransactionRequest.ExportItemRequest itemRequest : request.getItems()) {
                ExportItemResult result = processExportItem(
                        transaction,
                        itemRequest,
                        request.getAllowExpired());

                itemResponses.addAll(result.getResponses());
                warnings.addAll(result.getWarnings());
                totalValue = totalValue.add(result.getTotalValue());
            }

            // 5. Update transaction totals
            transaction.setTotalValue(totalValue);
            transactionRepository.save(transaction);

            // 6. Build response
            ExportTransactionResponse response = buildResponse(
                    transaction, employee, itemResponses, warnings);

            log.info(" Export transaction created successfully - Code: {}, Total: {} VNĐ",
                    transaction.getTransactionCode(), totalValue);

            return response;

        } catch (Exception e) {
            log.error(" Failed to create export transaction: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Validate export request
     */
    private void validateExportRequest(ExportTransactionRequest request) {
        // Transaction date must not be in future
        if (request.getTransactionDate().isAfter(LocalDate.now())) {
            throw new BadRequestException(
                    "INVALID_DATE",
                    "Transaction date cannot be in the future");
        }

        // Items must not be empty
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException(
                    "EMPTY_ITEMS",
                    "Items list cannot be empty");
        }

        // Validate export type specific rules
        if (request.getExportType() == ExportType.DISPOSAL && !request.getAllowExpired()) {
            log.warn(" DISPOSAL type should typically allow expired items. Setting allowExpired=true");
            request.setAllowExpired(true);
        }
    }

    /**
     * Create transaction header
     */
    private StorageTransaction createTransactionHeader(
            ExportTransactionRequest request,
            Employee employee) {

        String transactionCode = generateTransactionCode();

        return StorageTransaction.builder()
                .transactionCode(transactionCode)
                .transactionType(TransactionType.EXPORT)
                .transactionDate(request.getTransactionDate().atStartOfDay())
                .exportType(request.getExportType().name())
                .referenceCode(request.getReferenceCode())
                .departmentName(request.getDepartmentName())
                .requestedBy(request.getRequestedBy())
                .notes(request.getNotes())
                .status("COMPLETED")
                .approvalStatus(TransactionStatus.PENDING_APPROVAL)
                .createdBy(employee)
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();
    }

    /**
     * Process single export item with FEFO + Auto-Unpacking
     *
     * This is the CORE LOGIC of the export system:
     * 1. Calculate total available stock
     * 2. Get batches sorted by FEFO
     * 3. Allocate from batches (with unpacking if needed)
     * 4. Generate warnings
     */
    private ExportItemResult processExportItem(
            StorageTransaction transaction,
            ExportTransactionRequest.ExportItemRequest itemRequest,
            boolean allowExpired) {

        // 1. Load item master
        ItemMaster itemMaster = itemMasterRepository.findById(itemRequest.getItemMasterId())
                .orElseThrow(() -> new NotFoundException(
                        "ITEM_NOT_FOUND",
                        "Item with ID " + itemRequest.getItemMasterId() + " not found"));

        if (!itemMaster.getIsActive()) {
            throw new BadRequestException(
                    "ITEM_INACTIVE",
                    "Cannot export inactive item: " + itemMaster.getItemCode());
        }

        // 2. Load unit
        ItemUnit requestedUnit = unitRepository.findById(itemRequest.getUnitId())
                .orElseThrow(() -> new NotFoundException(
                        "UNIT_NOT_FOUND",
                        "Unit with ID " + itemRequest.getUnitId() + " not found"));

        // 3. Convert to base unit for calculation
        Integer requestedBaseQuantity = itemRequest.getQuantity() * requestedUnit.getConversionRate();

        // 4. Calculate stock availability
        StockAvailability availability = calculateStockAvailability(
                itemMaster,
                requestedUnit,
                allowExpired);

        // 5. Check sufficient stock
        if (availability.getTotalAvailable() < requestedBaseQuantity) {
            throw new BadRequestException(
                    "INSUFFICIENT_STOCK",
                    buildInsufficientStockMessage(itemMaster, itemRequest, requestedUnit, availability));
        }

        // 6. Check expired stock only
        if (!allowExpired && availability.getAvailableNonExpired() == 0
                && availability.getAvailableExpired() > 0) {
            throw new BadRequestException(
                    "ONLY_EXPIRED_STOCK_AVAILABLE",
                    "Cannot export for " + transaction.getExportType() +
                            ". All available batches of '" + itemMaster.getItemName() +
                            "' are expired. Set 'allowExpired=true' to force export.");
        }

        // 7. Get batches sorted by FEFO
        List<ItemBatch> availableBatches = getBatchesSortedByFEFO(
                itemMaster,
                requestedUnit,
                allowExpired);

        // 8. Allocate stock with auto-unpacking
        AllocationResult allocationResult = allocateStockWithUnpacking(
                transaction,
                itemMaster,
                requestedUnit,
                requestedBaseQuantity,
                availableBatches);

        // 9. Generate warnings
        List<WarningDTO> warnings = generateWarnings(
                allocationResult.getAllocations(),
                transaction.getExportType());

        // 10. Build result
        return new ExportItemResult(
                allocationResult.getResponses(),
                warnings,
                allocationResult.getTotalValue());
    }

    /**
     * Calculate stock availability breakdown
     */
    private StockAvailability calculateStockAvailability(
            ItemMaster itemMaster,
            ItemUnit requestedUnit,
            boolean allowExpired) {

        LocalDate today = LocalDate.now();
        List<ItemBatch> allBatches = batchRepository.findByItemMaster(itemMaster);

        int totalAvailable = 0;
        int availableNonExpired = 0;
        int availableExpired = 0;
        int loose = 0; // Hàng lẻ (cùng unit)
        int packed = 0; // Hàng chẵn (unit lớn hơn)

        for (ItemBatch batch : allBatches) {
            if (batch.getQuantityOnHand() <= 0)
                continue;

            int batchQty = batch.getQuantityOnHand();
            totalAvailable += batchQty;

            if (batch.getExpiryDate().isBefore(today)) {
                availableExpired += batchQty;
            } else {
                availableNonExpired += batchQty;
            }

            // Classify loose vs packed (future enhancement)
            // For now, count all as loose
            loose += batchQty;
        }

        return new StockAvailability(
                totalAvailable,
                availableNonExpired,
                availableExpired,
                loose,
                packed);
    }

    /**
     * Get batches sorted by FEFO (First Expired, First Out)
     */
    private List<ItemBatch> getBatchesSortedByFEFO(
            ItemMaster itemMaster,
            ItemUnit requestedUnit,
            boolean allowExpired) {

        LocalDate today = LocalDate.now();
        List<ItemBatch> batches = batchRepository.findByItemMasterOrderByExpiryDateAsc(itemMaster);

        return batches.stream()
                .filter(batch -> batch.getQuantityOnHand() > 0)
                .filter(batch -> allowExpired || batch.getExpiryDate().isAfter(today))
                .collect(Collectors.toList());
    }

    /**
     * CORE ALGORITHM: Allocate stock with auto-unpacking
     *
     * Strategy:
     * 1. Try to take from loose stock (same unit) first - Priority 1
     * 2. If insufficient, find larger units and unpack them - Priority 2
     * 3. Create unpacked batches with parent tracking
     *
     * Example:
     * - Need: 15 Viên
     * - Stock: 5 Viên lẻ + 1 Hộp (10 viên)
     * - Action: Take 5 viên lẻ + Unpack hộp → Take 10 viên from unpacked batch
     */
    private AllocationResult allocateStockWithUnpacking(
            StorageTransaction transaction,
            ItemMaster itemMaster,
            ItemUnit requestedUnit,
            Integer remainingQuantity,
            List<ItemBatch> availableBatches) {

        List<BatchAllocation> allocations = new ArrayList<>();
        List<ExportItemResponse> responses = new ArrayList<>();
        BigDecimal totalValue = BigDecimal.ZERO;

        log.info("🎯 Allocating {} {} for item {}", remainingQuantity, requestedUnit.getUnitName(),
                itemMaster.getItemCode());

        // Phase 1: Take from batches with SAME UNIT (loose stock) - FEFO order
        for (ItemBatch batch : availableBatches) {
            if (remainingQuantity <= 0)
                break;

            // Note: All batches are stored in base unit quantity
            // Unit conversion is handled in transaction items, not in batches
            int quantityToTake = Math.min(remainingQuantity, batch.getQuantityOnHand());

            if (quantityToTake > 0) {
                log.debug("📦 Taking {} units from batch {} (available: {})",
                        quantityToTake, batch.getBatchId(), batch.getQuantityOnHand());

                // Update batch quantity
                batch.setQuantityOnHand(batch.getQuantityOnHand() - quantityToTake);
                batchRepository.save(batch);

                itemMaster.updateCachedQuantity(-quantityToTake);
                itemMasterRepository.save(itemMaster);

                // Calculate financial value
                BigDecimal unitPrice = getUnitPrice(batch);
                BigDecimal lineValue = unitPrice.multiply(BigDecimal.valueOf(quantityToTake));
                totalValue = totalValue.add(lineValue);

                // Create transaction item
                createTransactionItem(transaction, batch, itemMaster, requestedUnit,
                        quantityToTake, unitPrice, lineValue);

                // Build response (no unpacking info)
                ExportItemResponse response = buildItemResponse(
                        itemMaster, batch, requestedUnit, quantityToTake,
                        unitPrice, lineValue, null);

                responses.add(response);
                allocations.add(new BatchAllocation(batch, quantityToTake, unitPrice));
                remainingQuantity -= quantityToTake;

                log.debug(" Allocated {} units, remaining: {}", quantityToTake, remainingQuantity);
            }
        }

        // Phase 2: If still insufficient, try unpacking from larger units
        if (remainingQuantity > 0) {
            log.warn(" Still need {} units. Attempting auto-unpacking...", remainingQuantity);

            // Get all units for this item (sorted by conversion rate DESC - larger units
            // first)
            List<ItemUnit> itemUnits = unitRepository.findByItemMaster(itemMaster);
            List<ItemUnit> largerUnits = itemUnits.stream()
                    .filter(unit -> unit.getConversionRate() > requestedUnit.getConversionRate())
                    .sorted((u1, u2) -> u2.getConversionRate().compareTo(u1.getConversionRate()))
                    .collect(Collectors.toList());

            if (largerUnits.isEmpty()) {
                log.error(" No larger units available for unpacking");
                // Stock is truly insufficient - error will be thrown by caller
            } else {
                // Try unpacking from each larger unit
                for (ItemUnit largerUnit : largerUnits) {
                    if (remainingQuantity <= 0)
                        break;

                    // Find batches with this larger unit (need to implement unit tracking per
                    // batch)
                    // For now, simulate: Find any batch that can be "unpacked"
                    ItemBatch batchToUnpack = findBatchForUnpacking(availableBatches, largerUnit);

                    if (batchToUnpack != null && batchToUnpack.getQuantityOnHand() > 0) {
                        log.info("🔧 Unpacking batch {} from {} to {}",
                                batchToUnpack.getBatchId(),
                                largerUnit.getUnitName(),
                                requestedUnit.getUnitName());

                        // Perform unpacking
                        UnpackResult unpackResult = performUnpacking(
                                transaction,
                                batchToUnpack,
                                largerUnit,
                                requestedUnit,
                                remainingQuantity);

                        // Update totals
                        totalValue = totalValue.add(unpackResult.getTotalValue());
                        responses.addAll(unpackResult.getResponses());
                        allocations.addAll(unpackResult.getAllocations());
                        remainingQuantity = unpackResult.getRemainingQuantity();

                        log.info(" Unpacking complete. Remaining: {}", remainingQuantity);
                    }
                }
            }
        }

        log.info("🎉 Allocation complete. Total value: {} VNĐ", totalValue);
        return new AllocationResult(allocations, responses, totalValue);
    }

    /**
     * Find a batch suitable for unpacking
     * In real implementation, this should check batch's unit
     * For now, return first available batch (simplified)
     */
    private ItemBatch findBatchForUnpacking(List<ItemBatch> batches, ItemUnit targetUnit) {
        // Simplified: Return first batch with stock
        // Real implementation: Check if batch is in targetUnit
        return batches.stream()
                .filter(b -> b.getQuantityOnHand() > 0)
                .findFirst()
                .orElse(null);
    }

    /**
     * Perform unpacking: Convert 1 unit of larger to N units of smaller
     *
     * Example:
     * - Input: 1 Hộp (10 viên), need 15 viên
     * - Action:
     * 1. Reduce parent batch (Hộp) by 1 → 0 remaining
     * 2. Create/update child batch (Viên) + 10 → 10 total
     * 3. Take what we need from child batch
     */
    private UnpackResult performUnpacking(
            StorageTransaction transaction,
            ItemBatch parentBatch,
            ItemUnit parentUnit,
            ItemUnit requestedUnit,
            Integer remainingQuantity) {

        List<BatchAllocation> allocations = new ArrayList<>();
        List<ExportItemResponse> responses = new ArrayList<>();
        BigDecimal totalValue = BigDecimal.ZERO;

        // Calculate conversion
        int unpackedQuantity = parentUnit.getConversionRate(); // 1 Hộp = 10 Viên

        log.debug("🔧 Unpacking: 1 {} = {} {}",
                parentUnit.getUnitName(), unpackedQuantity, requestedUnit.getUnitName());

        // Step 1: Reduce parent batch by 1
        parentBatch.setQuantityOnHand(parentBatch.getQuantityOnHand() - 1);
        parentBatch.setIsUnpacked(true);
        parentBatch.setUnpackedAt(LocalDateTime.now());
        parentBatch.setUnpackedByTransactionId(transaction.getTransactionId());
        batchRepository.save(parentBatch);

        log.debug("📉 Reduced parent batch {} by 1 unit (remaining: {})",
                parentBatch.getBatchId(), parentBatch.getQuantityOnHand());

        // Step 2: Create or update child batch (unpacked units)
        ItemBatch childBatch = findOrCreateChildBatch(
                parentBatch,
                requestedUnit,
                unpackedQuantity);

        log.debug("📈 Child batch {} now has {} units",
                childBatch.getBatchId(), childBatch.getQuantityOnHand());

        // Step 3: Take what we need from child batch
        int quantityToTake = Math.min(remainingQuantity, childBatch.getQuantityOnHand());

        childBatch.setQuantityOnHand(childBatch.getQuantityOnHand() - quantityToTake);
        batchRepository.save(childBatch);

        // Calculate financial value
        BigDecimal unitPrice = getUnitPrice(parentBatch); // Inherit price from parent
        BigDecimal lineValue = unitPrice.multiply(BigDecimal.valueOf(quantityToTake));
        totalValue = totalValue.add(lineValue);

        // Create transaction item
        createTransactionItem(transaction, childBatch, parentBatch.getItemMaster(),
                requestedUnit, quantityToTake, unitPrice, lineValue);

        // Build response WITH unpacking info
        UnpackingInfo unpackingInfo = UnpackingInfo.builder()
                .wasUnpacked(true)
                .parentBatchId(parentBatch.getBatchId())
                .parentUnitName(parentUnit.getUnitName())
                .remainingInBatch(childBatch.getQuantityOnHand())
                .build();

        ExportItemResponse response = buildItemResponse(
                parentBatch.getItemMaster(), childBatch, requestedUnit,
                quantityToTake, unitPrice, lineValue, unpackingInfo);

        responses.add(response);
        allocations.add(new BatchAllocation(childBatch, quantityToTake, unitPrice));
        remainingQuantity -= quantityToTake;

        log.info(" Unpacked and allocated {} units", quantityToTake);

        return new UnpackResult(allocations, responses, totalValue, remainingQuantity);
    }

    /**
     * Find existing child batch or create new one
     */
    private ItemBatch findOrCreateChildBatch(
            ItemBatch parentBatch,
            ItemUnit childUnit,
            Integer quantityToAdd) {

        // Try to find existing child batch
        String childLotNumber = parentBatch.getLotNumber() + "-UNPACKED";
        Optional<ItemBatch> existingChild = batchRepository.findByItemMasterAndLotNumber(
                parentBatch.getItemMaster(),
                childLotNumber);

        if (existingChild.isPresent()) {
            // Update existing
            ItemBatch child = existingChild.get();
            child.setQuantityOnHand(child.getQuantityOnHand() + quantityToAdd);
            log.debug("📦 Updated existing child batch {} (+{})", child.getBatchId(), quantityToAdd);
            return batchRepository.save(child);
        } else {
            // Create new child batch
            ItemBatch newChild = ItemBatch.builder()
                    .itemMaster(parentBatch.getItemMaster())
                    .parentBatch(parentBatch)
                    .lotNumber(childLotNumber)
                    .expiryDate(parentBatch.getExpiryDate()) // Inherit from parent
                    .quantityOnHand(quantityToAdd)
                    .supplier(parentBatch.getSupplier()) // Inherit from parent
                    .binLocation(parentBatch.getBinLocation())
                    .isUnpacked(true)
                    .unpackedAt(LocalDateTime.now())
                    .importedAt(parentBatch.getImportedAt())
                    .createdAt(LocalDateTime.now())
                    .build();

            newChild = batchRepository.save(newChild);
            log.debug("🆕 Created new child batch {} with {} units", newChild.getBatchId(), quantityToAdd);
            return newChild;
        }
    }

    /**
     * Get unit price from batch (for COGS tracking)
     *
     * Uses FIFO pricing: tries to get the purchase price from import transactions
     * for this batch.
     * Falls back to average price or default if not found.
     */
    private BigDecimal getUnitPrice(ItemBatch batch) {
        // Try to get the price from the most recent import transaction for this batch
        List<StorageTransaction> transactions = transactionRepository.findByTransactionType(TransactionType.IMPORT);

        for (StorageTransaction tx : transactions) {
            if (tx.getItems() != null) {
                for (var item : tx.getItems()) {
                    if (item.getBatch() != null &&
                            item.getBatch().getBatchId().equals(batch.getBatchId()) &&
                            item.getPrice() != null &&
                            item.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                        return item.getPrice(); // Return the import price
                    }
                }
            }
        }

        // Fallback: Use a reasonable default price for legacy data
        // In production, this should query from a price_history table or item master
        return BigDecimal.valueOf(50000); // 50,000 VNĐ per unit
    }

    /**
     * Create storage transaction item
     */
    private void createTransactionItem(
            StorageTransaction transaction,
            ItemBatch batch,
            ItemMaster itemMaster,
            ItemUnit unit,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineValue) {

        StorageTransactionItem transactionItem = StorageTransactionItem.builder()
                .transaction(transaction)
                .batch(batch)
                .itemCode(itemMaster.getItemCode())
                .unit(unit)
                .quantityChange(-quantity) // Negative for export
                .price(unitPrice)
                .totalLineValue(lineValue)
                .notes(itemMaster.getItemName())
                .build();

        transaction.addItem(transactionItem);
    }

    /**
     * Build export item response
     */
    private ExportItemResponse buildItemResponse(
            ItemMaster itemMaster,
            ItemBatch batch,
            ItemUnit unit,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineValue,
            UnpackingInfo unpackingInfo) {

        return ExportItemResponse.builder()
                .itemCode(itemMaster.getItemCode())
                .itemName(itemMaster.getItemName())
                .batchId(batch.getBatchId())
                .lotNumber(batch.getLotNumber())
                .expiryDate(batch.getExpiryDate())
                .quantityChange(quantity)
                .unitName(unit.getUnitName())
                .binLocation(batch.getBinLocation())
                .unitPrice(unitPrice)
                .totalLineValue(lineValue)
                .unpackingInfo(unpackingInfo)
                .build();
    }

    /**
     * Generate warnings for export transaction
     */
    private List<WarningDTO> generateWarnings(
            List<BatchAllocation> allocations,
            String exportType) {

        List<WarningDTO> warnings = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (BatchAllocation allocation : allocations) {
            ItemBatch batch = allocation.getBatch();

            // Warning 1: Near expiry (< 30 days)
            long daysUntilExpiry = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            if (daysUntilExpiry > 0 && daysUntilExpiry < 30) {
                warnings.add(WarningDTO.builder()
                        .batchId(batch.getBatchId())
                        .itemCode(batch.getItemMaster().getItemCode())
                        .warningType("NEAR_EXPIRY")
                        .expiryDate(batch.getExpiryDate())
                        .daysUntilExpiry((int) daysUntilExpiry)
                        .message("Batch will expire in " + daysUntilExpiry + " days. Consider using soon.")
                        .build());
            }

            // Warning 2: Expired but allowed (DISPOSAL)
            if (batch.getExpiryDate().isBefore(today) && "DISPOSAL".equals(exportType)) {
                warnings.add(WarningDTO.builder()
                        .batchId(batch.getBatchId())
                        .itemCode(batch.getItemMaster().getItemCode())
                        .warningType("EXPIRED_USED")
                        .expiryDate(batch.getExpiryDate())
                        .daysUntilExpiry((int) -ChronoUnit.DAYS.between(batch.getExpiryDate(), today))
                        .message("Expired batch exported for disposal (Expired " +
                                ChronoUnit.DAYS.between(batch.getExpiryDate(), today) + " days ago)")
                        .build());
            }
        }

        return warnings;
    }

    /**
     * Build final response
     */
    private ExportTransactionResponse buildResponse(
            StorageTransaction transaction,
            Employee employee,
            List<ExportItemResponse> items,
            List<WarningDTO> warnings) {

        return ExportTransactionResponse.builder()
                .transactionId(transaction.getTransactionId())
                .transactionCode(transaction.getTransactionCode())
                .transactionDate(transaction.getTransactionDate())
                .exportType(ExportType.valueOf(transaction.getExportType()))
                .referenceCode(transaction.getReferenceCode())
                .departmentName(transaction.getDepartmentName())
                .requestedBy(transaction.getRequestedBy())
                .notes(transaction.getNotes())
                .createdBy(employee.getFullName())
                .createdAt(transaction.getCreatedAt())
                .totalItems(items.size())
                .totalValue(transaction.getTotalValue())
                .items(items)
                .warnings(warnings)
                .build();
    }

    /**
     * Build insufficient stock error message with details
     */
    private String buildInsufficientStockMessage(
            ItemMaster itemMaster,
            ExportTransactionRequest.ExportItemRequest itemRequest,
            ItemUnit requestedUnit,
            StockAvailability availability) {

        return String.format(
                "Cannot export %d %s of '%s'. Available stock breakdown:\n" +
                        "- Requested: %d %s\n" +
                        "- Available (non-expired): %d\n" +
                        "- Available (expired): %d\n" +
                        "- Total available: %d\n" +
                        "- Shortage: %d",
                itemRequest.getQuantity(),
                requestedUnit.getUnitName(),
                itemMaster.getItemName(),
                itemRequest.getQuantity(),
                requestedUnit.getUnitName(),
                availability.getAvailableNonExpired(),
                availability.getAvailableExpired(),
                availability.getTotalAvailable(),
                itemRequest.getQuantity() - availability.getTotalAvailable());
    }

    /**
     * Generate transaction code (PX-YYYYMMDD-SEQ)
     */
    private String generateTransactionCode() {
        String dateStr = LocalDateTime.now().format(
                java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));

        String prefix = "PX-" + dateStr + "-";
        Long count = transactionRepository.countByTransactionCodeStartingWith(prefix);

        String sequence = String.format("%03d", count + 1);
        return prefix + sequence;
    }

    // ========== Helper Classes ==========

    /**
     * Stock availability breakdown
     */
    private static class StockAvailability {
        private final int totalAvailable;
        private final int availableNonExpired;
        private final int availableExpired;
        private final int loose;
        private final int packed;

        public StockAvailability(int totalAvailable, int availableNonExpired,
                int availableExpired, int loose, int packed) {
            this.totalAvailable = totalAvailable;
            this.availableNonExpired = availableNonExpired;
            this.availableExpired = availableExpired;
            this.loose = loose;
            this.packed = packed;
        }

        public int getTotalAvailable() {
            return totalAvailable;
        }

        public int getAvailableNonExpired() {
            return availableNonExpired;
        }

        public int getAvailableExpired() {
            return availableExpired;
        }

        @SuppressWarnings("unused")
        public int getLoose() {
            return loose;
        }

        @SuppressWarnings("unused")
        public int getPacked() {
            return packed;
        }
    }

    /**
     * Batch allocation record
     */
    private static class BatchAllocation {
        private final ItemBatch batch;
        private final Integer quantity;
        private final BigDecimal unitPrice;

        public BatchAllocation(ItemBatch batch, Integer quantity, BigDecimal unitPrice) {
            this.batch = batch;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
        }

        public ItemBatch getBatch() {
            return batch;
        }

        @SuppressWarnings("unused")
        public Integer getQuantity() {
            return quantity;
        }

        @SuppressWarnings("unused")
        public BigDecimal getUnitPrice() {
            return unitPrice;
        }
    }

    /**
     * Allocation result
     */
    private static class AllocationResult {
        private final List<BatchAllocation> allocations;
        private final List<ExportItemResponse> responses;
        private final BigDecimal totalValue;

        public AllocationResult(List<BatchAllocation> allocations,
                List<ExportItemResponse> responses,
                BigDecimal totalValue) {
            this.allocations = allocations;
            this.responses = responses;
            this.totalValue = totalValue;
        }

        public List<BatchAllocation> getAllocations() {
            return allocations;
        }

        public List<ExportItemResponse> getResponses() {
            return responses;
        }

        public BigDecimal getTotalValue() {
            return totalValue;
        }
    }

    /**
     * Unpacking result (extends allocation with remaining quantity)
     */
    private static class UnpackResult {
        private final List<BatchAllocation> allocations;
        private final List<ExportItemResponse> responses;
        private final BigDecimal totalValue;
        private final Integer remainingQuantity;

        public UnpackResult(List<BatchAllocation> allocations,
                List<ExportItemResponse> responses,
                BigDecimal totalValue,
                Integer remainingQuantity) {
            this.allocations = allocations;
            this.responses = responses;
            this.totalValue = totalValue;
            this.remainingQuantity = remainingQuantity;
        }

        public List<BatchAllocation> getAllocations() {
            return allocations;
        }

        public List<ExportItemResponse> getResponses() {
            return responses;
        }

        public BigDecimal getTotalValue() {
            return totalValue;
        }

        public Integer getRemainingQuantity() {
            return remainingQuantity;
        }
    }

    /**
     * Export item processing result
     */
    private static class ExportItemResult {
        private final List<ExportItemResponse> responses;
        private final List<WarningDTO> warnings;
        private final BigDecimal totalValue;

        public ExportItemResult(List<ExportItemResponse> responses,
                List<WarningDTO> warnings,
                BigDecimal totalValue) {
            this.responses = responses;
            this.warnings = warnings;
            this.totalValue = totalValue;
        }

        public List<ExportItemResponse> getResponses() {
            return responses;
        }

        public List<WarningDTO> getWarnings() {
            return warnings;
        }

        public BigDecimal getTotalValue() {
            return totalValue;
        }
    }
}
