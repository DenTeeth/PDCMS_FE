package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.exception.BadRequestException;
import com.dental.clinic.management.exception.ConflictException;
import com.dental.clinic.management.exception.NotFoundException;
import com.dental.clinic.management.warehouse.domain.*;
import com.dental.clinic.management.warehouse.dto.request.ImportTransactionRequest;
import com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse;
import com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse.ImportItemResponse;
import com.dental.clinic.management.warehouse.dto.response.ImportTransactionResponse.WarningDTO;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import com.dental.clinic.management.warehouse.repository.*;
import com.dental.clinic.management.warehouse.enums.TransactionStatus;
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

/**
 * API 6.4: Import Transaction Service
 *
 * Handles warehouse import operations with:
 * - Batch creation/update
 * - Unit conversion
 * - Price calculation
 * - Financial tracking
 * - Warning generation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImportTransactionService {

        private final StorageTransactionRepository transactionRepository;
        private final ItemMasterRepository itemMasterRepository;
        private final ItemBatchRepository batchRepository;
        private final ItemUnitRepository unitRepository;
        private final SupplierRepository supplierRepository;
        private final EmployeeRepository employeeRepository;
        private final SupplierItemRepository supplierItemRepository;

        /**
         * Create Import Transaction
         *
         * @param request      Import transaction request with items
         * @param employeeCode Employee who creates the transaction
         * @return Complete transaction response with warnings
         */
        @Transactional(rollbackFor = Exception.class)
        public ImportTransactionResponse createImportTransaction(
                        ImportTransactionRequest request,
                        String employeeCode) {

                log.info("🚀 Creating import transaction - Invoice: {}, Supplier: {}, Items: {}",
                                request.getInvoiceNumber(), request.getSupplierId(), request.getItems().size());

                try {
                        // 1. Validate request
                        validateImportRequest(request);

                        // 2. Check duplicate invoice
                        if (transactionRepository.existsByInvoiceNumber(request.getInvoiceNumber())) {
                                throw new ConflictException(
                                                "DUPLICATE_INVOICE",
                                                "Invoice Number '" + request.getInvoiceNumber() +
                                                                "' has already been imported. Please use a different invoice number.");
                        }

                        // 3. Load entities
                        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                                        .orElseThrow(() -> new NotFoundException(
                                                        "SUPPLIER_NOT_FOUND",
                                                        "Supplier with ID " + request.getSupplierId() + " not found"));

                        if (!supplier.getIsActive()) {
                                throw new BadRequestException(
                                                "SUPPLIER_INACTIVE",
                                                "Cannot import from inactive supplier: " + supplier.getSupplierName());
                        }

                        Employee employee = employeeRepository.findByAccount_Username(employeeCode)
                                        .orElseThrow(() -> new NotFoundException(
                                                        "EMPLOYEE_NOT_FOUND",
                                                        "Employee not found for account: " + employeeCode));

                        if (!employee.getIsActive()) {
                                throw new BadRequestException(
                                                "EMPLOYEE_INACTIVE",
                                                "Cannot create import transaction with inactive employee: "
                                                                + employeeCode);
                        }

                        // 4. Create transaction header
                        StorageTransaction transaction = createTransactionHeader(request, supplier, employee);
                        transaction = transactionRepository.save(transaction);

                        // 5. Process each item
                        List<ImportItemResponse> itemResponses = new ArrayList<>();
                        List<WarningDTO> warnings = new ArrayList<>();
                        BigDecimal totalValue = BigDecimal.ZERO;

                        for (ImportTransactionRequest.ImportItemRequest itemRequest : request.getItems()) {
                                ItemProcessResult result = processImportItem(transaction, itemRequest);
                                itemResponses.add(result.getResponse());
                                warnings.addAll(result.getWarnings());
                                totalValue = totalValue.add(result.getTotalLineValue());
                        }

                        // 6. Update transaction totals
                        transaction.setTotalValue(totalValue);
                        transactionRepository.save(transaction);

                        // 6.1 Update supplier business metrics (API 6.13)
                        updateSupplierMetrics(supplier, transaction.getTransactionDate().toLocalDate());

                        // 7. Build response
                        ImportTransactionResponse response = buildResponse(
                                        transaction, supplier, employee, itemResponses, warnings);

                        log.info(" Import transaction created successfully - Code: {}, Total: {} VNĐ",
                                        transaction.getTransactionCode(), totalValue);

                        return response;

                } catch (Exception e) {
                        log.error(" Failed to create import transaction: {}", e.getMessage(), e);
                        throw e;
                }
        }

        /**
         * Validate import request
         */
        private void validateImportRequest(ImportTransactionRequest request) {
                // Transaction date must not be in future
                if (request.getTransactionDate().isAfter(LocalDate.now())) {
                        throw new BadRequestException(
                                        "INVALID_DATE",
                                        "Transaction date cannot be in the future");
                }

                // Expected delivery date validation
                if (request.getExpectedDeliveryDate() != null) {
                        if (request.getExpectedDeliveryDate().isAfter(
                                        request.getTransactionDate())) {
                                log.warn(" Delivery was late - Expected: {}, Actual: {}",
                                                request.getExpectedDeliveryDate(),
                                                request.getTransactionDate());
                        }
                }

                // Items must not be empty (already validated by @NotEmpty, but double-check)
                if (request.getItems() == null || request.getItems().isEmpty()) {
                        throw new BadRequestException(
                                        "EMPTY_ITEMS",
                                        "Items list cannot be empty");
                }
        }

        /**
         * Create transaction header
         */
        private StorageTransaction createTransactionHeader(
                        ImportTransactionRequest request,
                        Supplier supplier,
                        Employee employee) {

                String transactionCode = generateTransactionCode();

                return StorageTransaction.builder()
                                .transactionCode(transactionCode)
                                .transactionType(TransactionType.IMPORT)
                                .transactionDate(request.getTransactionDate().atStartOfDay())
                                .supplier(supplier)
                                .invoiceNumber(request.getInvoiceNumber())
                                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                                .notes(request.getNotes())
                                .status("COMPLETED")
                                .approvalStatus(TransactionStatus.PENDING_APPROVAL)
                                .createdBy(employee)
                                .createdAt(LocalDateTime.now())
                                .items(new ArrayList<>())
                                .build();
        }

        /**
         * Process single import item
         */
        private ItemProcessResult processImportItem(
                        StorageTransaction transaction,
                        ImportTransactionRequest.ImportItemRequest itemRequest) {

                // 1. Load item master
                ItemMaster itemMaster = itemMasterRepository.findById(itemRequest.getItemMasterId())
                                .orElseThrow(() -> new NotFoundException(
                                                "ITEM_NOT_FOUND",
                                                "Item with ID " + itemRequest.getItemMasterId() + " not found"));

                if (!itemMaster.getIsActive()) {
                        throw new BadRequestException(
                                        "ITEM_INACTIVE",
                                        "Cannot import inactive item: " + itemMaster.getItemCode() +
                                                        " - " + itemMaster.getItemName());
                }

                // 1.1. Auto-create supplier-item link if not exists
                // This populates supplier_items table for GET /inventory/{id}/suppliers API
                Supplier supplier = transaction.getSupplier();
                Optional<SupplierItem> existingLink = supplierItemRepository
                                .findBySupplierAndItemMaster(supplier, itemMaster);

                SupplierItem supplierItem;
                if (existingLink.isEmpty()) {
                        // First time this supplier provides this item - create link
                        supplierItem = SupplierItem.builder()
                                        .supplier(supplier)
                                        .itemMaster(itemMaster)
                                        .isPreferred(false) // Default: not preferred
                                        .lastPurchaseDate(transaction.getTransactionDate())
                                        .build();
                        supplierItem = supplierItemRepository.save(supplierItem);
                        log.info("Auto-created supplier-item link: Supplier '{}' -> Item '{}'",
                                        supplier.getSupplierCode(), itemMaster.getItemCode());
                } else {
                        // Update last purchase date for existing link
                        supplierItem = existingLink.get();
                        supplierItem.setLastPurchaseDate(transaction.getTransactionDate());
                        supplierItemRepository.save(supplierItem);
                        log.info("Updated supplier-item link: Supplier '{}' -> Item '{}' (lastPurchaseDate: {})",
                                        supplier.getSupplierCode(), itemMaster.getItemCode(),
                                        transaction.getTransactionDate());
                }

                // 2. Validate expiry date
                LocalDate today = LocalDate.now();
                if (itemRequest.getExpiryDate().isBefore(today)) {
                        throw new BadRequestException(
                                        "EXPIRED_ITEM",
                                        "Cannot import expired item: " + itemMaster.getItemCode() +
                                                        " (Expiry: " + itemRequest.getExpiryDate() + ")");
                }

                // 3. Load or auto-create unit
                ItemUnit unit;
                Optional<ItemUnit> unitOpt = unitRepository.findById(itemRequest.getUnitId());

                if (unitOpt.isPresent()) {
                        unit = unitOpt.get();
                } else {
                        // Auto-create base unit from itemMaster.unitOfMeasure if unit not found
                        log.warn(" Unit ID {} not found for item {}. Attempting to auto-create base unit from unitOfMeasure: {}",
                                        itemRequest.getUnitId(), itemMaster.getItemCode(),
                                        itemMaster.getUnitOfMeasure());

                        if (itemMaster.getUnitOfMeasure() == null || itemMaster.getUnitOfMeasure().trim().isEmpty()) {
                                throw new BadRequestException(
                                                "UNIT_REQUIRED",
                                                "Item master '" + itemMaster.getItemCode()
                                                                + "' does not have unitOfMeasure. Cannot create base unit.");
                        }

                        // Check if base unit already exists (maybe unitId was wrong, but base unit
                        // exists)
                        Optional<ItemUnit> existingBaseUnit = unitRepository
                                        .findBaseUnitByItemMasterId(itemMaster.getItemMasterId());

                        if (existingBaseUnit.isPresent()) {
                                // Use existing base unit
                                unit = existingBaseUnit.get();
                                log.info(" Using existing base unit '{}' (ID: {}) for item: {}",
                                                unit.getUnitName(), unit.getUnitId(), itemMaster.getItemCode());
                        } else {
                                // Create new base unit from unitOfMeasure
                                unit = ItemUnit.builder()
                                                .itemMaster(itemMaster)
                                                .unitName(itemMaster.getUnitOfMeasure())
                                                .conversionRate(1)
                                                .isBaseUnit(true)
                                                .displayOrder(1)
                                                .build();

                                unit = unitRepository.save(unit);
                                log.info(" Auto-created base unit '{}' (ID: {}) for item master: {}",
                                                itemMaster.getUnitOfMeasure(), unit.getUnitId(),
                                                itemMaster.getItemCode());
                        }
                }

                // 4. Unit conversion
                Integer baseQuantity = itemRequest.getQuantity() * unit.getConversionRate();

                // 5. Handle batch (create or update)
                BatchResult batchResult = handleBatch(
                                itemMaster,
                                itemRequest.getLotNumber(),
                                itemRequest.getExpiryDate(),
                                baseQuantity,
                                itemRequest.getBinLocation());

                // 6. Calculate line value
                BigDecimal totalLineValue = itemRequest.getPurchasePrice()
                                .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

                // 7. Create transaction item
                StorageTransactionItem transactionItem = StorageTransactionItem.builder()
                                .transaction(transaction)
                                .batch(batchResult.getBatch())
                                .itemCode(itemMaster.getItemCode())
                                .unit(unit)
                                .quantityChange(baseQuantity)
                                .price(itemRequest.getPurchasePrice())
                                .totalLineValue(totalLineValue)
                                .notes(itemRequest.getNotes())
                                .build();

                transaction.addItem(transactionItem);

                // 8. Generate warnings
                List<WarningDTO> warnings = generateWarnings(
                                itemMaster,
                                itemRequest.getExpiryDate(),
                                itemRequest.getPurchasePrice());

                // 9. Build item response
                ImportItemResponse response = ImportItemResponse.builder()
                                .itemCode(itemMaster.getItemCode())
                                .itemName(itemMaster.getItemName())
                                .batchId(batchResult.getBatch().getBatchId())
                                .batchStatus(batchResult.isNewBatch() ? "CREATED" : "UPDATED")
                                .lotNumber(itemRequest.getLotNumber())
                                .expiryDate(itemRequest.getExpiryDate())
                                .quantityChange(itemRequest.getQuantity())
                                .unitName(unit.getUnitName())
                                .purchasePrice(itemRequest.getPurchasePrice())
                                .totalLineValue(totalLineValue)
                                .binLocation(itemRequest.getBinLocation())
                                .currentStock(batchResult.getBatch().getQuantityOnHand())
                                .build();

                return new ItemProcessResult(response, warnings, totalLineValue);
        }

        /**
         * Handle batch creation or update
         */
        private BatchResult handleBatch(
                        ItemMaster itemMaster,
                        String lotNumber,
                        LocalDate expiryDate,
                        Integer quantityToAdd,
                        String binLocation) {

                // Find existing batch
                Optional<ItemBatch> existingBatch = batchRepository
                                .findByItemMaster_ItemMasterIdAndLotNumber(itemMaster.getItemMasterId(), lotNumber);

                if (existingBatch.isPresent()) {
                        ItemBatch batch = existingBatch.get();

                        // Validate expiry date consistency
                        if (!batch.getExpiryDate().equals(expiryDate)) {
                                throw new ConflictException(
                                                "BATCH_EXPIRY_CONFLICT",
                                                "Lot Number '" + lotNumber + "' already exists with Expiry Date " +
                                                                batch.getExpiryDate()
                                                                + ". Cannot add same lot with different expiry " +
                                                                expiryDate + ".");
                        }

                        // Update existing batch
                        batch.setQuantityOnHand(batch.getQuantityOnHand() + quantityToAdd);
                        if (binLocation != null && !binLocation.isBlank()) {
                                batch.setBinLocation(binLocation);
                        }
                        batchRepository.save(batch);

                        itemMaster.updateCachedQuantity(quantityToAdd);
                        itemMaster.setCachedLastImportDate(LocalDateTime.now());
                        itemMasterRepository.save(itemMaster);

                        log.debug(" Updated existing batch ID {} - Added {} units, New total: {}",
                                        batch.getBatchId(), quantityToAdd, batch.getQuantityOnHand());

                        return new BatchResult(batch, false);
                } else {
                        // Create new batch
                        ItemBatch newBatch = ItemBatch.builder()
                                        .itemMaster(itemMaster)
                                        .lotNumber(lotNumber)
                                        .expiryDate(expiryDate)
                                        .quantityOnHand(quantityToAdd)
                                        .binLocation(binLocation)
                                        .createdAt(LocalDateTime.now())
                                        .build();

                        newBatch = batchRepository.save(newBatch);

                        itemMaster.updateCachedQuantity(quantityToAdd);
                        itemMaster.setCachedLastImportDate(LocalDateTime.now());
                        itemMasterRepository.save(itemMaster);

                        log.debug(" Created new batch ID {} - Lot: {}, Quantity: {}",
                                        newBatch.getBatchId(), lotNumber, quantityToAdd);

                        return new BatchResult(newBatch, true);
                }
        }

        /**
         * Generate warnings for near-expiry, price variance, etc.
         */
        private List<WarningDTO> generateWarnings(
                        ItemMaster itemMaster,
                        LocalDate expiryDate,
                        BigDecimal purchasePrice) {

                List<WarningDTO> warnings = new ArrayList<>();
                LocalDate today = LocalDate.now();

                // Warning 1: Near expiry (< 3 months)
                long monthsUntilExpiry = ChronoUnit.MONTHS.between(today, expiryDate);
                if (monthsUntilExpiry < 3) {
                        warnings.add(WarningDTO.builder()
                                        .itemCode(itemMaster.getItemCode())
                                        .warningType("NEAR_EXPIRY")
                                        .message("Item will expire in " + monthsUntilExpiry + " months (Expiry: " +
                                                        expiryDate + "). Consider using this batch first.")
                                        .build());
                }

                // Warning 2: Price variance (future enhancement - need price history)
                // Commented out for now, can be implemented later

                return warnings;
        }

        /**
         * API 6.13: Update supplier business metrics after successful import
         * Updates totalOrders (increment) and lastOrderDate (set to transaction date)
         *
         * @param supplier        The supplier who provided the items
         * @param transactionDate Date of the import transaction
         */
        private void updateSupplierMetrics(Supplier supplier, java.time.LocalDate transactionDate) {
                try {
                        // Increment total orders
                        Integer currentOrders = supplier.getTotalOrders();
                        supplier.setTotalOrders(currentOrders != null ? currentOrders + 1 : 1);

                        // Update last order date
                        supplier.setLastOrderDate(transactionDate);

                        // Save supplier
                        supplierRepository.save(supplier);

                        log.info("✓ Updated supplier metrics - ID: {}, Total Orders: {}, Last Order: {}",
                                        supplier.getSupplierId(),
                                        supplier.getTotalOrders(),
                                        transactionDate);

                } catch (Exception e) {
                        // Log error but don't fail the transaction
                        log.error("✗ Failed to update supplier metrics for supplier ID {}: {}",
                                        supplier.getSupplierId(), e.getMessage());
                        // Continue - metrics update failure should not block import transaction
                }
        }

        /**
         * Build final response
         */
        private ImportTransactionResponse buildResponse(
                        StorageTransaction transaction,
                        Supplier supplier,
                        Employee employee,
                        List<ImportItemResponse> items,
                        List<WarningDTO> warnings) {

                return ImportTransactionResponse.builder()
                                .transactionId(transaction.getTransactionId())
                                .transactionCode(transaction.getTransactionCode())
                                .transactionDate(transaction.getTransactionDate())
                                .supplierName(supplier.getSupplierName())
                                .invoiceNumber(transaction.getInvoiceNumber())
                                .createdBy(employee.getFullName())
                                .createdAt(transaction.getCreatedAt())
                                .status(com.dental.clinic.management.warehouse.enums.TransactionStatus
                                                .valueOf(transaction.getStatus()))
                                .totalItems(items.size())
                                .totalValue(transaction.getTotalValue())
                                .items(items)
                                .warnings(warnings)
                                .build();
        }

        /**
         * Generate transaction code (PN-YYYYMMDD-SEQ)
         */
        private String generateTransactionCode() {
                String dateStr = LocalDateTime.now().format(
                                java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));

                // Find last transaction today
                String prefix = "PN-" + dateStr + "-";
                Long count = transactionRepository.countByTransactionCodeStartingWith(prefix);

                String sequence = String.format("%03d", count + 1);
                return prefix + sequence;
        }

        // Helper classes
        private static class ItemProcessResult {
                private final ImportItemResponse response;
                private final List<WarningDTO> warnings;
                private final BigDecimal totalLineValue;

                public ItemProcessResult(ImportItemResponse response, List<WarningDTO> warnings,
                                BigDecimal totalLineValue) {
                        this.response = response;
                        this.warnings = warnings;
                        this.totalLineValue = totalLineValue;
                }

                public ImportItemResponse getResponse() {
                        return response;
                }

                public List<WarningDTO> getWarnings() {
                        return warnings;
                }

                public BigDecimal getTotalLineValue() {
                        return totalLineValue;
                }
        }

        private static class BatchResult {
                private final ItemBatch batch;
                private final boolean isNewBatch;

                public BatchResult(ItemBatch batch, boolean isNewBatch) {
                        this.batch = batch;
                        this.isNewBatch = isNewBatch;
                }

                public ItemBatch getBatch() {
                        return batch;
                }

                public boolean isNewBatch() {
                        return isNewBatch;
                }
        }
}
