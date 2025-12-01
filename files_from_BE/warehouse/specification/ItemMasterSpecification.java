package com.dental.clinic.management.warehouse.specification;

import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.enums.WarehouseType;
import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;

public class ItemMasterSpecification {

    public static Specification<ItemMaster> hasSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return null;
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("itemName")), pattern),
                    cb.like(cb.lower(root.get("itemCode")), pattern));
        };
    }

    public static Specification<ItemMaster> hasCategoryId(Long categoryId) {
        return (root, query, cb) -> categoryId == null ? null
                : cb.equal(root.get("category").get("categoryId"), categoryId);
    }

    public static Specification<ItemMaster> hasWarehouseType(WarehouseType warehouseType) {
        return (root, query, cb) -> warehouseType == null ? null : cb.equal(root.get("warehouseType"), warehouseType);
    }

    public static Specification<ItemMaster> isActive(Boolean isActive) {
        return (root, query, cb) -> isActive == null ? null : cb.equal(root.get("isActive"), isActive);
    }

    public static Specification<ItemMaster> hasStockStatus(StockStatus stockStatus) {
        return (root, query, cb) -> {
            if (stockStatus == null) {
                return null;
            }

            Expression<Integer> cachedQty = root.get("cachedTotalQuantity");
            Expression<Integer> minLevel = root.get("minStockLevel");
            Expression<Integer> maxLevel = root.get("maxStockLevel");

            switch (stockStatus) {
                case OUT_OF_STOCK:
                    return cb.or(
                            cb.isNull(cachedQty),
                            cb.equal(cachedQty, 0));

                case LOW_STOCK:
                    return cb.and(
                            cb.isNotNull(cachedQty),
                            cb.gt(cachedQty, 0),
                            cb.isNotNull(minLevel),
                            cb.lt(cachedQty, minLevel));

                case OVERSTOCK:
                    return cb.and(
                            cb.isNotNull(cachedQty),
                            cb.isNotNull(maxLevel),
                            cb.gt(cachedQty, maxLevel));

                case NORMAL:
                    return cb.and(
                            cb.isNotNull(cachedQty),
                            cb.isNotNull(minLevel),
                            cb.isNotNull(maxLevel),
                            cb.ge(cachedQty, minLevel),
                            cb.le(cachedQty, maxLevel));

                default:
                    return null;
            }
        };
    }
}
