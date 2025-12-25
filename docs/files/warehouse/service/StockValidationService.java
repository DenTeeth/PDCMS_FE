package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.warehouse.repository.ItemBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Business Rules Service for Warehouse Stock Validation
 * 
 * Implements:
 * - Rule #18: Cannot export from warehouse if current stock quantity is lower than requested
 */
@Service
public class StockValidationService {

    @Autowired
    private ItemBatchRepository itemBatchRepository;

    /**
     * Rule #18: Validate sufficient stock before export
     * 
     * Business Rule:
     * - Check total quantity on hand across all batches for the item
     * - If requested quantity > available quantity → throw exception
     * 
     * @param itemMasterId ID of the item to check
     * @param requestedQuantity Quantity requested for export
     * @param itemName Name of the item (for error message)
     * @throws BadRequestAlertException if insufficient stock
     */
    public void validateStockAvailability(Long itemMasterId, Integer requestedQuantity, String itemName) {
        if (itemMasterId == null || requestedQuantity == null) {
            throw new IllegalArgumentException("ItemMasterId and requestedQuantity cannot be null");
        }

        if (requestedQuantity <= 0) {
            throw new BadRequestAlertException(
                "Số lượng yêu cầu phải lớn hơn 0",
                "warehouse",
                "invalidQuantity"
            );
        }

        // Calculate total available stock across all batches
        Integer totalAvailableStock = itemBatchRepository.findByItemMasterIdFEFO(itemMasterId)
            .stream()
            .mapToInt(batch -> batch.getQuantityOnHand() != null ? batch.getQuantityOnHand() : 0)
            .sum();

        // Check if sufficient stock available
        if (totalAvailableStock < requestedQuantity) {
            throw new BadRequestAlertException(
                String.format(
                    "Không đủ hàng để xuất kho. " +
                    "Vật tư: %s | " +
                    "Yêu cầu: %d | " +
                    "Tồn kho: %d | " +
                    "Thiếu: %d",
                    itemName != null ? itemName : "ID=" + itemMasterId,
                    requestedQuantity,
                    totalAvailableStock,
                    requestedQuantity - totalAvailableStock
                ),
                "warehouse",
                "insufficientStock"
            );
        }
    }

    /**
     * Get available stock quantity for an item
     * 
     * @param itemMasterId ID of the item
     * @return Total available quantity across all batches
     */
    public Integer getAvailableStock(Long itemMasterId) {
        if (itemMasterId == null) {
            return 0;
        }

        return itemBatchRepository.findByItemMasterIdFEFO(itemMasterId)
            .stream()
            .mapToInt(batch -> batch.getQuantityOnHand() != null ? batch.getQuantityOnHand() : 0)
            .sum();
    }

    /**
     * Check if item has sufficient stock (boolean check)
     * 
     * @param itemMasterId ID of the item
     * @param requestedQuantity Quantity to check
     * @return true if sufficient stock, false otherwise
     */
    public boolean hasSufficientStock(Long itemMasterId, Integer requestedQuantity) {
        if (itemMasterId == null || requestedQuantity == null || requestedQuantity <= 0) {
            return false;
        }

        Integer availableStock = getAvailableStock(itemMasterId);
        return availableStock >= requestedQuantity;
    }
}
