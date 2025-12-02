package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.ItemBatch;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemBatchRepository extends JpaRepository<ItemBatch, Long> {

        /**
         * FEFO Logic: First Expired, First Out
         * Sort by expiryDate ASC (NULL cuối cùng)
         * Chỉ lấy batch còn hàng
         */
        @Query("SELECT ib FROM ItemBatch ib " +
                        "WHERE ib.itemMaster.itemMasterId = :itemMasterId " +
                        "AND ib.quantityOnHand > 0 " +
                        "ORDER BY " +
                        "CASE WHEN ib.expiryDate IS NULL THEN 1 ELSE 0 END, " +
                        "ib.expiryDate ASC NULLS LAST")
        List<ItemBatch> findByItemMasterIdFEFO(@Param("itemMasterId") Long itemMasterId);

        /**
         * Tìm batch theo ItemMaster và LotNumber
         */
        Optional<ItemBatch> findByItemMaster_ItemMasterIdAndLotNumber(Long itemMasterId, String lotNumber);

        /**
         * Lấy tất cả batch của 1 item
         */
        List<ItemBatch> findByItemMaster_ItemMasterId(Long itemMasterId);

        /**
         * Tính tổng số lượng tồn kho theo ItemMaster và Supplier
         * SUM(quantity_on_hand) từ tất cả batches của supplier cho item này
         */
        @Query("SELECT COALESCE(SUM(ib.quantityOnHand), 0) FROM ItemBatch ib " +
                        "WHERE ib.itemMaster.itemMasterId = :itemMasterId " +
                        "AND ib.supplier.supplierId = :supplierId")
        Integer getTotalQuantityByItemAndSupplier(@Param("itemMasterId") Long itemMasterId,
                        @Param("supplierId") Long supplierId);

        /**
         * API 6.2: Get Item Batches with JOIN FETCH
         * - JOIN FETCH supplier để tránh N+1 query
         * - Filter by hideEmpty (quantity > 0)
         * - Hỗ trợ pagination, sorting
         *
         * @param itemMasterId ID của item master
         * @param hideEmpty    true = chỉ lấy lô còn hàng, false = lấy cả lô hết
         * @param pageable     Pagination và sorting config
         * @return Page of ItemBatch
         */
        @Query("SELECT DISTINCT ib FROM ItemBatch ib " +
                        "LEFT JOIN FETCH ib.supplier " +
                        "WHERE ib.itemMaster.itemMasterId = :itemMasterId " +
                        "AND (:hideEmpty = false OR ib.quantityOnHand > 0)")
        Page<ItemBatch> findItemBatchesWithSupplier(
                        @Param("itemMasterId") Long itemMasterId,
                        @Param("hideEmpty") Boolean hideEmpty,
                        Pageable pageable);

        /**
         * API 6.2: Count batches by item (for stats)
         * Tổng số batches (không filter hideEmpty)
         */
        @Query("SELECT COUNT(ib) FROM ItemBatch ib " +
                        "WHERE ib.itemMaster.itemMasterId = :itemMasterId")
        Long countByItemMasterId(@Param("itemMasterId") Long itemMasterId);

        /**
         * API 6.3: Find Expiring Batches (Alerts)
         *
         * Query Logic:
         * - JOIN FETCH: item_master, category, supplier (avoid N+1)
         * - WHERE conditions:
         * 1. quantity_on_hand > 0 (only items in stock)
         * 2. expiry_date <= targetDate (expiring within threshold)
         * 3. Optional filters: categoryId, warehouseType
         * - ORDER BY: expiry_date ASC (FEFO - First Expired First Out)
         *
         * @param targetDate    Maximum expiry date (currentDate + days)
         * @param categoryId    Optional category filter
         * @param warehouseType Optional warehouse type filter (COLD/NORMAL)
         * @param pageable      Pagination config
         * @return Page of ItemBatch with related entities
         */
        @Query("SELECT DISTINCT ib FROM ItemBatch ib " +
                        "LEFT JOIN FETCH ib.itemMaster im " +
                        "LEFT JOIN FETCH im.category cat " +
                        "LEFT JOIN FETCH ib.supplier s " +
                        "WHERE ib.quantityOnHand > 0 " +
                        "AND ib.expiryDate IS NOT NULL " +
                        "AND ib.expiryDate <= :targetDate " +
                        "AND (:categoryId IS NULL OR im.category.categoryId = :categoryId) " +
                        "AND (:warehouseType IS NULL OR im.warehouseType = :warehouseType)")
        Page<ItemBatch> findExpiringBatches(
                        @Param("targetDate") LocalDate targetDate,
                        @Param("categoryId") Long categoryId,
                        @Param("warehouseType") WarehouseType warehouseType,
                        Pageable pageable);

        /**
         * API 6.3: Count total expiring batches (for pagination metadata)
         * Same logic as findExpiringBatches but COUNT only
         */
        @Query("SELECT COUNT(DISTINCT ib) FROM ItemBatch ib " +
                        "WHERE ib.quantityOnHand > 0 " +
                        "AND ib.expiryDate IS NOT NULL " +
                        "AND ib.expiryDate <= :targetDate " +
                        "AND (:categoryId IS NULL OR ib.itemMaster.category.categoryId = :categoryId) " +
                        "AND (:warehouseType IS NULL OR ib.itemMaster.warehouseType = :warehouseType)")
        Long countExpiringBatches(
                        @Param("targetDate") LocalDate targetDate,
                        @Param("categoryId") Long categoryId,
                        @Param("warehouseType") WarehouseType warehouseType);

        /**
         * API 6.5: Find batches by ItemMaster (for FEFO allocation)
         */
        @Query("SELECT ib FROM ItemBatch ib WHERE ib.itemMaster = :itemMaster")
        List<ItemBatch> findByItemMaster(
                        @Param("itemMaster") com.dental.clinic.management.warehouse.domain.ItemMaster itemMaster);

        /**
         * API 6.5: Find batches by ItemMaster ordered by expiry date (FEFO)
         */
        @Query("SELECT ib FROM ItemBatch ib " +
                        "WHERE ib.itemMaster = :itemMaster " +
                        "ORDER BY ib.expiryDate ASC")
        List<ItemBatch> findByItemMasterOrderByExpiryDateAsc(
                        @Param("itemMaster") com.dental.clinic.management.warehouse.domain.ItemMaster itemMaster);

        /**
         * API 6.5: Find batch by ItemMaster and LotNumber (for unpacking)
         */
        Optional<ItemBatch> findByItemMasterAndLotNumber(
                        @Param("itemMaster") com.dental.clinic.management.warehouse.domain.ItemMaster itemMaster,
                        @Param("lotNumber") String lotNumber);
}
