package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.StorageTransaction;
// import com.dental.clinic.management.warehouse.dto.response.SuppliedItemResponse;
import com.dental.clinic.management.warehouse.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StorageTransactionRepository extends JpaRepository<StorageTransaction, Long>,
    JpaSpecificationExecutor<StorageTransaction> {

  Optional<StorageTransaction> findByTransactionCode(String transactionCode);

  List<StorageTransaction> findByTransactionType(TransactionType transactionType);

  // GET ALL with sorting
  List<StorageTransaction> findAllByOrderByTransactionDateDesc();

  // Filter by transaction type
  List<StorageTransaction> findByTransactionTypeOrderByTransactionDateDesc(TransactionType transactionType);

  @Query("SELECT st FROM StorageTransaction st " +
      "WHERE st.transactionDate BETWEEN :startDate AND :endDate " +
      "ORDER BY st.transactionDate DESC")
  List<StorageTransaction> findByDateRange(@Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate);

  // Filter by month and year
  @Query("SELECT st FROM StorageTransaction st " +
      "WHERE FUNCTION('MONTH', st.transactionDate) = :month " +
      "AND FUNCTION('YEAR', st.transactionDate) = :year " +
      "ORDER BY st.transactionDate DESC")
  List<StorageTransaction> findByMonthAndYear(@Param("month") Integer month, @Param("year") Integer year);

  // Filter by type + month + year
  @Query("SELECT st FROM StorageTransaction st " +
      "WHERE st.transactionType = :type " +
      "AND FUNCTION('MONTH', st.transactionDate) = :month " +
      "AND FUNCTION('YEAR', st.transactionDate) = :year " +
      "ORDER BY st.transactionDate DESC")
  List<StorageTransaction> findByTransactionTypeAndMonthAndYear(
      @Param("type") TransactionType transactionType,
      @Param("month") Integer month,
      @Param("year") Integer year);

  /**
   * Generate mã phiếu tự động: PN-YYYYMMDD-SEQ
   */
  @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_code FROM 13) AS INTEGER)), 0) + 1 " +
      "FROM storage_transactions " +
      "WHERE transaction_code LIKE :prefix || '%' " +
      "AND DATE(transaction_date) = CURRENT_DATE", nativeQuery = true)
  Integer getNextSequenceNumber(@Param("prefix") String prefix);

  /**
   * WORLD-CLASS QUERY: Lấy lịch sử vật tư cung cấp từ NCC
   * - Chỉ lấy giao dịch IMPORT
   * - DISTINCT ON: Lấy 1 dòng mới nhất cho mỗi vật tư
   * - ORDER BY: Đảm bảo lấy giao dịch có ngày gần nhất
   */
  @Query(value = """
      SELECT DISTINCT ON (im.item_master_id)
          im.item_code AS itemCode,
          im.item_name AS itemName,
          sti.unit_price AS lastImportPrice,
          st.transaction_date AS lastImportDate
      FROM storage_transactions st
      JOIN storage_transaction_items sti ON st.transaction_id = sti.transaction_id
      JOIN item_batches ib ON sti.batch_id = ib.batch_id
      JOIN item_masters im ON ib.item_master_id = im.item_master_id
      WHERE st.supplier_id = :supplierId
        AND st.transaction_type = 'IMPORT'
      ORDER BY im.item_master_id, st.transaction_date DESC
      """, nativeQuery = true)
  List<Object[]> findSuppliedItemsBySupplier(@Param("supplierId") Long supplierId);

  /**
   * Check if supplier has any transactions (for safe delete validation)
   */
  @Query("SELECT COUNT(st) > 0 FROM StorageTransaction st WHERE st.supplier.id = :supplierId")
  boolean existsBySupplier(@Param("supplierId") Long supplierId);

  /**
   * API 6.4: Check duplicate invoice number
   */
  boolean existsByInvoiceNumber(String invoiceNumber);

  /**
   * API 6.4: Count transactions by code prefix for sequence generation
   */
  Long countByTransactionCodeStartingWith(String prefix);

  /**
   * Get transaction by ID with all details eagerly loaded
   * Prevents lazy loading issues when accessing batch, itemMaster, and unit
   */
  @Query("SELECT DISTINCT st FROM StorageTransaction st " +
         "LEFT JOIN FETCH st.items i " +
         "LEFT JOIN FETCH i.batch b " +
         "LEFT JOIN FETCH b.itemMaster im " +
         "LEFT JOIN FETCH i.unit u " +
         "LEFT JOIN FETCH st.supplier s " +
         "LEFT JOIN FETCH st.createdBy e " +
         "WHERE st.transactionId = :id")
  Optional<StorageTransaction> findByIdWithDetails(@Param("id") Long id);
}
