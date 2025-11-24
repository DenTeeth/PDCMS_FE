package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.warehouse.domain.*;
import com.dental.clinic.management.warehouse.dto.request.ExportRequest;
import com.dental.clinic.management.warehouse.dto.request.ImportRequest;
import com.dental.clinic.management.warehouse.dto.response.StorageStatsResponse;
import com.dental.clinic.management.warehouse.dto.response.TransactionResponse;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import com.dental.clinic.management.warehouse.exception.*;
import com.dental.clinic.management.warehouse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 📥📤 Storage In/Out Service
 * Quản lý nhập/xuất kho và thống kê
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageInOutService {

    private final ItemMasterRepository itemMasterRepository;
    private final ItemBatchRepository itemBatchRepository;
    private final StorageTransactionRepository transactionRepository;
    private final SupplierRepository supplierRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * 🔥 API: Nhập kho (IMPORT)
     * Validation: Kho lạnh bắt buộc có HSD
     */
    @Transactional
    public TransactionResponse importItems(ImportRequest request) {
        log.info("Starting import transaction from supplier: {}", request.getSupplierId());

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new SupplierNotFoundException(request.getSupplierId()));

        Employee currentUser = getCurrentUser();

        // Tạo transaction header
        StorageTransaction transaction = StorageTransaction.builder()
                .transactionCode(generateTransactionCode("PN"))
                .transactionType(TransactionType.IMPORT)
                .transactionDate(LocalDateTime.now())
                .supplier(supplier)
                .notes(request.getNotes())
                .createdBy(currentUser)
                .items(new ArrayList<>())
                .build();

        // Xử lý từng item
        for (ImportRequest.ImportItemRequest itemDto : request.getItems()) {
            ItemMaster itemMaster = itemMasterRepository.findById(itemDto.getItemMasterId())
                    .orElseThrow(() -> new ItemMasterNotFoundException(itemDto.getItemMasterId()));

            // 🔥 Mentor feedback: Expiry date BẮT BUỘC cho TẤT CẢ vật tư
            // Không còn exception cho is_tool
            if (itemDto.getExpiryDate() == null) {
                throw new ExpiryDateRequiredException(itemMaster.getItemName());
            }

            // Tìm hoặc tạo batch mới
            ItemBatch batch = itemBatchRepository
                    .findByItemMaster_ItemMasterIdAndLotNumber(itemMaster.getItemMasterId(), itemDto.getLotNumber())
                    .orElse(ItemBatch.builder()
                            .itemMaster(itemMaster)
                            .lotNumber(itemDto.getLotNumber())
                            .quantityOnHand(0)
                            .expiryDate(itemDto.getExpiryDate())
                            .supplier(supplier)
                            .importedAt(LocalDateTime.now())
                            .build());

            // Cộng số lượng
            batch.setQuantityOnHand(batch.getQuantityOnHand() + itemDto.getQuantity());
            batch = itemBatchRepository.save(batch);

            // Tạo transaction item
            StorageTransactionItem transactionItem = StorageTransactionItem.builder()
                    .transaction(transaction)
                    .batch(batch)
                    .itemCode(itemMaster.getItemCode()) // 🔥 Warehouse staff nhận diện vật tư
                    .quantityChange(itemDto.getQuantity()) // Dương = Nhập
                    .notes(null)
                    .build();

            transaction.addItem(transactionItem);
        }

        transaction = transactionRepository.save(transaction);

        log.info("Import transaction completed: {}", transaction.getTransactionCode());
        return mapToTransactionResponse(transaction);
    }

    /**
     * 🔥 API: Xuất kho (EXPORT)
     */
    @Transactional
    public TransactionResponse exportItems(ExportRequest request) {
        log.info("Starting export transaction");

        Employee currentUser = getCurrentUser();

        StorageTransaction transaction = StorageTransaction.builder()
                .transactionCode(generateTransactionCode("PX"))
                .transactionType(TransactionType.EXPORT)
                .transactionDate(LocalDateTime.now())
                .notes(request.getNotes())
                .createdBy(currentUser)
                .items(new ArrayList<>())
                .build();

        for (ExportRequest.ExportItemRequest itemDto : request.getItems()) {
            // FEFO: Lấy danh sách batches theo thứ tự HSD gần nhất
            ItemMaster itemMaster = itemMasterRepository.findById(itemDto.getItemMasterId())
                    .orElseThrow(() -> new ItemMasterNotFoundException(itemDto.getItemMasterId()));

            List<ItemBatch> batches = itemBatchRepository.findByItemMasterIdFEFO(itemDto.getItemMasterId());

            Integer remainingQty = itemDto.getQuantity();

            for (ItemBatch batch : batches) {
                if (remainingQty <= 0)
                    break;

                if (batch.getQuantityOnHand() <= 0)
                    continue;

                Integer qtyToExport = Math.min(remainingQty, batch.getQuantityOnHand());

                // Trừ số lượng
                batch.setQuantityOnHand(batch.getQuantityOnHand() - qtyToExport);
                itemBatchRepository.save(batch);

                StorageTransactionItem transactionItem = StorageTransactionItem.builder()
                        .transaction(transaction)
                        .batch(batch)
                        .itemCode(itemMaster.getItemCode()) // 🔥 Warehouse staff nhận diện vật tư
                        .quantityChange(-qtyToExport) // Âm = Xuất
                        .notes(null)
                        .build();

                transaction.addItem(transactionItem);
                remainingQty -= qtyToExport;
            }

            if (remainingQty > 0) {
                throw new InsufficientStockException(itemMaster.getItemName(), itemDto.getQuantity(),
                        itemDto.getQuantity() - remainingQty);
            }
        }

        transaction = transactionRepository.save(transaction);

        log.info("Export transaction completed: {}", transaction.getTransactionCode());
        return mapToTransactionResponse(transaction);
    }

    /**
     * Get Storage Stats
     * Tính toán thống kê nhập/xuất kho theo tháng/năm
     */
    @Transactional(readOnly = true)
    public StorageStatsResponse getStorageStats(Integer month, Integer year) {
        log.info("Getting storage stats for month: {}, year: {}", month, year);

        // Sử dụng tháng/năm hiện tại nếu không được cung cấp
        LocalDateTime now = LocalDateTime.now();
        int targetMonth = (month != null) ? month : now.getMonthValue();
        int targetYear = (year != null) ? year : now.getYear();

        // Lấy tất cả giao dịch trong tháng
        List<StorageTransaction> currentMonthTransactions = transactionRepository
                .findByMonthAndYear(targetMonth, targetYear);

        // Đếm số giao dịch nhập và xuất
        long monthlyImportCount = currentMonthTransactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.IMPORT)
                .count();

        long monthlyExportCount = currentMonthTransactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPORT)
                .count();

        // Đếm số giao dịch
        int totalTransactionsCount = currentMonthTransactions.size();

        // Tính % tăng trưởng so với tháng trước
        int previousMonth = (targetMonth == 1) ? 12 : targetMonth - 1;
        int previousYear = (targetMonth == 1) ? targetYear - 1 : targetYear;

        List<StorageTransaction> previousMonthTransactions = transactionRepository
                .findByMonthAndYear(previousMonth, previousYear);

        long previousImportCount = previousMonthTransactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.IMPORT)
                .count();

        long previousExportCount = previousMonthTransactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPORT)
                .count();

        // Tính % tăng trưởng
        Double importGrowthPercent = calculateGrowthPercent(previousImportCount, monthlyImportCount);
        Double exportGrowthPercent = calculateGrowthPercent(previousExportCount, monthlyExportCount);

        // 🆕 Tính expired items
        java.time.LocalDate today = java.time.LocalDate.now();
        long uniqueExpiredItems = itemBatchRepository.findAll().stream()
                .filter(batch -> batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(today))
                .filter(batch -> batch.getQuantityOnHand() > 0)
                .map(batch -> batch.getItemMaster().getItemMasterId())
                .distinct()
                .count();

        return StorageStatsResponse.builder()
                .monthlyImportCount((int) monthlyImportCount)
                .monthlyExportCount((int) monthlyExportCount)
                .totalTransactionsCount(totalTransactionsCount)
                .importGrowthPercent(importGrowthPercent)
                .exportGrowthPercent(exportGrowthPercent)
                .expiredItemsCount((int) uniqueExpiredItems)
                .build();
    }

    /**
     * Helper: Tính % tăng trưởng
     */
    private Double calculateGrowthPercent(long previous, long current) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((double) (current - previous) / previous) * 100.0;
    }

    // ===========================
    // 🔍 GET ALL TRANSACTIONS
    // ===========================
    public List<TransactionResponse> getAllTransactions(TransactionType transactionType, Integer month, Integer year) {
        log.info("Getting all transactions - type: {}, month: {}, year: {}", transactionType, month, year);

        List<StorageTransaction> transactions;

        if (transactionType != null && month != null && year != null) {
            // Filter by type + month + year
            transactions = transactionRepository.findByTransactionTypeAndMonthAndYear(transactionType, month, year);
        } else if (transactionType != null) {
            // Filter by type only
            transactions = transactionRepository.findByTransactionTypeOrderByTransactionDateDesc(transactionType);
        } else if (month != null && year != null) {
            // Filter by month + year only
            transactions = transactionRepository.findByMonthAndYear(month, year);
        } else {
            // Get all
            transactions = transactionRepository.findAllByOrderByTransactionDateDesc();
        }

        return transactions.stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    // ===========================
    // 🔍 GET TRANSACTION BY ID
    // ===========================
    public TransactionResponse getTransactionById(Long id) {
        log.info("Getting transaction by ID: {}", id);

        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu nhập/xuất kho với ID: " + id));

        return mapToTransactionResponse(transaction);
    }

    // ===========================
    // ✏️ UPDATE TRANSACTION NOTES
    // ===========================
    @Transactional
    public TransactionResponse updateTransactionNotes(Long id, String notes) {
        log.info("Updating transaction {} notes to: {}", id, notes);

        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu nhập/xuất kho với ID: " + id));

        transaction.setNotes(notes);

        StorageTransaction saved = transactionRepository.save(transaction);
        return mapToTransactionResponse(saved);
    } // ===========================
      // 🗑️ DELETE TRANSACTION (ROLLBACK INVENTORY)
      // ===========================

    @Transactional
    public void deleteTransaction(Long id) {
        log.info("Deleting transaction: {}", id);

        StorageTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu nhập/xuất kho với ID: " + id));

        // Rollback inventory based on transaction type
        for (StorageTransactionItem item : transaction.getItems()) {
            ItemBatch batch = item.getBatch();

            if (transaction.getTransactionType() == TransactionType.IMPORT) {
                // Rollback IMPORT: subtract quantity back
                Integer newQuantity = batch.getQuantityOnHand() - item.getQuantityChange();
                if (newQuantity < 0) {
                    throw new IllegalStateException(
                            "Không thể xóa phiếu nhập: Lô " + batch.getLotNumber() +
                                    " đã được xuất kho. Số lượng hiện tại: " + batch.getQuantityOnHand() +
                                    ", cần rollback: " + item.getQuantityChange());
                }
                batch.setQuantityOnHand(newQuantity);

                // Delete batch if quantity becomes 0
                if (newQuantity == 0) {
                    itemBatchRepository.delete(batch);
                } else {
                    itemBatchRepository.save(batch);
                }

            } else if (transaction.getTransactionType() == TransactionType.EXPORT) {
                // Rollback EXPORT: add quantity back
                batch.setQuantityOnHand(batch.getQuantityOnHand() + item.getQuantityChange());
                itemBatchRepository.save(batch);
            }
        }

        // Delete transaction
        transactionRepository.delete(transaction);
        log.info("Transaction {} deleted and inventory rolled back", id);
    }

    // ==================== HELPER METHODS ====================

    private TransactionResponse mapToTransactionResponse(StorageTransaction transaction) {
        List<TransactionResponse.TransactionItemResponse> itemDtos = transaction.getItems().stream()
                .map(item -> TransactionResponse.TransactionItemResponse.builder()
                        .transactionItemId(item.getTransactionItemId())
                        .itemName(item.getBatch().getItemMaster().getItemName())
                        .lotNumber(item.getBatch().getLotNumber())
                        .quantityChange(item.getQuantityChange())
                        .notes(item.getNotes())
                        .build())
                .collect(Collectors.toList());

        return TransactionResponse.builder()
                .transactionId(transaction.getTransactionId())
                .transactionCode(transaction.getTransactionCode())
                .transactionType(transaction.getTransactionType())
                .transactionDate(transaction.getTransactionDate())
                .supplierName(transaction.getSupplier() != null ? transaction.getSupplier().getSupplierName() : null)
                .notes(transaction.getNotes())
                .createdByName(transaction.getCreatedBy() != null ? transaction.getCreatedBy().getFullName() : null)
                .createdAt(transaction.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    /**
     * Generate transaction code: PN-YYYYMMDD-XXX
     */
    private String generateTransactionCode(String prefix) {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer nextSeq = transactionRepository.getNextSequenceNumber(prefix + "-" + dateStr);
        return String.format("%s-%s-%03d", prefix, dateStr, nextSeq != null ? nextSeq : 1);
    }

    private Employee getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String) {
            String username = (String) auth.getPrincipal();
            return employeeRepository.findByAccount_Username(username)
                    .orElse(null);
        }
        return null;
    }
}
