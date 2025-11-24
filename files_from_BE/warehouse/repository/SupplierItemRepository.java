package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.SupplierItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierItemRepository extends JpaRepository<SupplierItem, Long> {

    /**
     * 📋 Lấy danh sách vật tư mà NCC này cung cấp (cho GET BY ID)
     * Kèm theo ItemMaster.ItemCategory để lấy categoryName
     */
    @Query("SELECT si FROM SupplierItem si " +
            "JOIN FETCH si.itemMaster im " +
            "LEFT JOIN FETCH im.category " +
            "WHERE si.supplier.supplierId = :supplierId " +
            "ORDER BY si.isPreferred DESC, im.itemName ASC")
    List<SupplierItem> findBySupplierIdWithItems(@Param("supplierId") Long supplierId);

    /**
     * Lấy danh sách NCC cung cấp vật tư này
     */
    List<SupplierItem> findByItemMaster_ItemMasterId(Long itemMasterId);
}
