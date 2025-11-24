package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.ItemBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemBatchRepository extends JpaRepository<ItemBatch, Long> {

        /**
         * 🔥 FEFO Logic: First Expired, First Out
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
         * 🔥 Tính tổng số lượng tồn kho theo ItemMaster và Supplier
         * SUM(quantity_on_hand) từ tất cả batches của supplier cho item này
         */
        @Query("SELECT COALESCE(SUM(ib.quantityOnHand), 0) FROM ItemBatch ib " +
                        "WHERE ib.itemMaster.itemMasterId = :itemMasterId " +
                        "AND ib.supplier.supplierId = :supplierId")
        Integer getTotalQuantityByItemAndSupplier(@Param("itemMasterId") Long itemMasterId,
                        @Param("supplierId") Long supplierId);

        /**
         * 🔥 API 6.2: Get Item Batches with JOIN FETCH
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
         * 🔥 API 6.2: Count batches by item (for stats)
         * Tổng số batches (không filter hideEmpty)
         */
        @Query("SELECT COUNT(ib) FROM ItemBatch ib " +
                        "WHERE ib.itemMaster.itemMasterId = :itemMasterId")
        Long countByItemMasterId(@Param("itemMasterId") Long itemMasterId);
}
