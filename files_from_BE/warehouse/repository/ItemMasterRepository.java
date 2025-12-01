package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemMasterRepository extends JpaRepository<ItemMaster, Long>, JpaSpecificationExecutor<ItemMaster> {

        Optional<ItemMaster> findByItemCode(String itemCode);

        List<ItemMaster> findByIsActiveTrue();

        List<ItemMaster> findByWarehouseTypeAndIsActiveTrue(WarehouseType warehouseType);

        List<ItemMaster> findByCategory_CategoryId(Long categoryId);

        @Query("SELECT im FROM ItemMaster im WHERE im.isActive = true " +
                        "AND (:warehouseType IS NULL OR im.warehouseType = :warehouseType) " +
                        "AND (:categoryId IS NULL OR im.category.categoryId = :categoryId)")
        List<ItemMaster> findByFilters(@Param("warehouseType") WarehouseType warehouseType,
                        @Param("categoryId") Long categoryId);

        @Query("SELECT im FROM ItemMaster im WHERE im.isActive = true " +
                        "AND (LOWER(im.itemName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(im.itemCode) LIKE LOWER(CONCAT('%', :search, '%')))")
        List<ItemMaster> searchItemMasters(@Param("search") String search);

        /**
         *  API 6.1: Query với filters cho Inventory Summary
         * - Search by itemName or itemCode (LIKE)
         * - Filter by warehouseType
         * - Filter by categoryId
         */
        @Query("SELECT DISTINCT im FROM ItemMaster im " +
                        "LEFT JOIN im.category cat " +
                        "WHERE im.isActive = true " +
                        "AND (:search IS NULL OR :search = '' OR " +
                        "LOWER(im.itemName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                        "LOWER(im.itemCode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:warehouseType IS NULL OR im.warehouseType = :warehouseType) " +
                        "AND (:categoryId IS NULL OR cat.categoryId = :categoryId)")
        List<ItemMaster> findInventorySummary(
                        @Param("search") String search,
                        @Param("warehouseType") WarehouseType warehouseType,
                        @Param("categoryId") Long categoryId);
}
