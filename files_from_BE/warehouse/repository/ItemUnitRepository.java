package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.ItemUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemUnitRepository extends JpaRepository<ItemUnit, Long> {

        /**
         * Lấy tất cả đơn vị của 1 item, sort theo display_order
         */
        @Query("SELECT iu FROM ItemUnit iu " +
                        "WHERE iu.itemMaster.itemMasterId = :itemMasterId " +
                        "ORDER BY iu.displayOrder ASC")
        List<ItemUnit> findByItemMasterIdOrderByDisplayOrder(@Param("itemMasterId") Long itemMasterId);

        /**
         * Lấy đơn vị cơ bản (base unit) của item
         */
        @Query("SELECT iu FROM ItemUnit iu " +
                        "WHERE iu.itemMaster.itemMasterId = :itemMasterId " +
                        "AND iu.isBaseUnit = true")
        Optional<ItemUnit> findBaseUnitByItemMasterId(@Param("itemMasterId") Long itemMasterId);

        /**
         * Tìm unit theo item và tên đơn vị
         */
        Optional<ItemUnit> findByItemMaster_ItemMasterIdAndUnitName(Long itemMasterId, String unitName);

        /**
         * Lấy tất cả đơn vị của 1 item master (for update logic)
         */
        List<ItemUnit> findByItemMaster_ItemMasterId(Long itemMasterId);

        /**
         * Lấy tất cả đơn vị của 1 item master (for unpacking logic)
         */
        @Query("SELECT iu FROM ItemUnit iu " +
                        "WHERE iu.itemMaster = :itemMaster " +
                        "ORDER BY iu.conversionRate DESC")
        List<ItemUnit> findByItemMaster(
                        @Param("itemMaster") com.dental.clinic.management.warehouse.domain.ItemMaster itemMaster);

        /**
         * API 6.11: Lấy đơn vị đang hoạt động, sắp xếp theo displayOrder
         */
        List<ItemUnit> findByItemMaster_ItemMasterIdAndIsActiveTrueOrderByDisplayOrderAsc(Long itemMasterId);

        /**
         * API 6.11: Lấy đơn vị đã ngừng hoạt động, sắp xếp theo displayOrder
         */
        List<ItemUnit> findByItemMaster_ItemMasterIdAndIsActiveFalseOrderByDisplayOrderAsc(Long itemMasterId);

        /**
         * API 6.11: Lấy tất cả đơn vị (active + inactive), sắp xếp theo displayOrder
         */
        List<ItemUnit> findByItemMaster_ItemMasterIdOrderByDisplayOrderAsc(Long itemMasterId);

        /**
         * API 6.12: Tìm base unit theo ItemMaster object và isBaseUnit flag
         */
        Optional<ItemUnit> findByItemMasterAndIsBaseUnit(
                        com.dental.clinic.management.warehouse.domain.ItemMaster itemMaster,
                        boolean isBaseUnit);
}
