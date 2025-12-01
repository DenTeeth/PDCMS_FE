package com.dental.clinic.management.warehouse.mapper;

import com.dental.clinic.management.warehouse.domain.ItemBatch;
import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.dto.request.CreateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.request.UpdateItemMasterRequest;
import com.dental.clinic.management.warehouse.dto.response.ItemMasterSummaryResponse;
import com.dental.clinic.management.warehouse.enums.StockStatus;
import com.dental.clinic.management.warehouse.repository.ItemBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Mapper for ItemMaster entity and DTOs
 */
@Component
@RequiredArgsConstructor
public class ItemMasterMapper {

    private final ItemBatchRepository itemBatchRepository;

    /**
     * DEPRECATED: This method is for old CreateItemMaster API (InventoryService).
     * API 6.9 uses ItemMasterService.createItemMaster() directly.
     *
     * Note: CreateItemMasterRequest was rewritten for API 6.9 with unit hierarchy.
     * This old mapper is incompatible with the new DTO structure.
     * Keeping this commented until InventoryService is refactored.
     */
    @Deprecated
    public ItemMaster toEntity(CreateItemMasterRequest request) {
        if (request == null) {
            return null;
        }

        // Extract base unit name from units array
        String baseUnitName = request.getUnits().stream()
                .filter(u -> u.getIsBaseUnit())
                .findFirst()
                .map(CreateItemMasterRequest.UnitRequest::getUnitName)
                .orElse("Unit");

        return ItemMaster.builder()
                .itemCode(request.getItemCode())
                .itemName(request.getItemName())
                .warehouseType(request.getWarehouseType())
                .unitOfMeasure(baseUnitName) // Use base unit name from units array
                .minStockLevel(request.getMinStockLevel())
                .maxStockLevel(request.getMaxStockLevel())
                .description(request.getDescription())
                .build();
    }

    @SuppressWarnings("deprecation")
    public ItemMasterSummaryResponse toSummaryResponse(ItemMaster item) {
        if (item == null) {
            return null;
        }

        List<ItemBatch> batches = itemBatchRepository.findByItemMaster_ItemMasterId(item.getItemMasterId());

        Integer totalQty = batches.stream()
                .mapToInt(ItemBatch::getQuantityOnHand)
                .sum();

        StockStatus status = calculateStockStatus(totalQty, item.getMinStockLevel(), item.getMaxStockLevel());

        Boolean expiringSoon = batches.stream()
                .anyMatch(b -> b.getExpiryDate() != null
                        && b.getExpiryDate().isBefore(LocalDate.now().plusDays(30))
                        && b.getQuantityOnHand() > 0);

        return ItemMasterSummaryResponse.builder()
                .itemMasterId(item.getItemMasterId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .categoryName(item.getCategory() != null ? item.getCategory().getCategoryName() : null)
                .warehouseType(item.getWarehouseType())
                .unitOfMeasure(item.getUnitOfMeasure())
                .totalQuantityOnHand(totalQty)
                .stockStatus(status)
                .isExpiringSoon(expiringSoon)
                .minStockLevel(item.getMinStockLevel())
                .maxStockLevel(item.getMaxStockLevel())
                .isTool(item.getIsTool())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    // DEPRECATED: This method is no longer used. Update logic is now handled in
    // ItemMasterService.updateItemMaster()
    // with Safety Lock mechanism and unit hierarchy management.
    // Keeping this method for backward compatibility with legacy code.
    @Deprecated
    public void updateEntity(ItemMaster item, UpdateItemMasterRequest request) {
        throw new UnsupportedOperationException(
                "This method is deprecated. Use ItemMasterService.updateItemMaster() instead for API 6.10 with Safety Lock support.");
    }

    private StockStatus calculateStockStatus(Integer totalQty, Integer minLevel, Integer maxLevel) {
        if (totalQty == 0)
            return StockStatus.OUT_OF_STOCK;
        if (totalQty < minLevel)
            return StockStatus.LOW_STOCK;
        if (totalQty > maxLevel)
            return StockStatus.OVERSTOCK;
        return StockStatus.NORMAL;
    }
}
