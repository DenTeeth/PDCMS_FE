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

    public ItemMaster toEntity(CreateItemMasterRequest request) {
        if (request == null) {
            return null;
        }

        return ItemMaster.builder()
                .itemCode(request.getItemCode())
                .itemName(request.getItemName())
                .warehouseType(request.getWarehouseType())
                .unitOfMeasure(request.getUnitOfMeasure())
                .minStockLevel(request.getMinStockLevel())
                .maxStockLevel(request.getMaxStockLevel())
                .isTool(request.getIsTool() != null ? request.getIsTool() : false)
                .description(request.getDescription())
                .build();
    }

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

    public void updateEntity(ItemMaster item, UpdateItemMasterRequest request) {
        if (item == null || request == null) {
            return;
        }

        item.setItemName(request.getItemName());
        item.setWarehouseType(request.getWarehouseType());
        item.setUnitOfMeasure(request.getUnitOfMeasure());
        item.setMinStockLevel(request.getMinStockLevel());
        item.setMaxStockLevel(request.getMaxStockLevel());
        item.setIsTool(request.getIsTool());
        item.setDescription(request.getDescription());
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
