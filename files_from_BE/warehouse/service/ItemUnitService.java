package com.dental.clinic.management.warehouse.service;

import com.dental.clinic.management.warehouse.dto.ItemUnitResponse;
import com.dental.clinic.management.warehouse.domain.ItemMaster;
import com.dental.clinic.management.warehouse.domain.ItemUnit;
import com.dental.clinic.management.warehouse.exception.ItemMasterNotFoundException;
import com.dental.clinic.management.warehouse.repository.ItemMasterRepository;
import com.dental.clinic.management.warehouse.repository.ItemUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing item unit hierarchy
 * Handles: Hộp → Vỉ → Viên conversions and unit lookups
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ItemUnitService {

    private final ItemUnitRepository itemUnitRepository;
    private final ItemMasterRepository itemMasterRepository;

    /**
     * Get all units for an item (ordered by display order)
     * Example: Amoxicillin → [Hộp, Vỉ, Viên]
     *
     * @param itemMasterId The item master ID
     * @return List of units in display order (largest → smallest)
     */
    public List<ItemUnitResponse> getUnitsByItemId(Long itemMasterId) {
        // Verify item exists
        @SuppressWarnings("unused")
        ItemMaster itemMaster = itemMasterRepository.findById(itemMasterId)
                .orElseThrow(() -> new ItemMasterNotFoundException(itemMasterId));

        // Get all units for this item
        List<ItemUnit> units = itemUnitRepository.findByItemMasterIdOrderByDisplayOrder(itemMasterId);

        return units.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get the base (smallest) unit for an item
     * Example: Amoxicillin → "Viên"
     *
     * Auto-creates base unit from unitOfMeasure if not found (fallback)
     *
     * @param itemMasterId The item master ID
     * @return Base unit response
     */
    @Transactional
    public ItemUnitResponse getBaseUnit(Long itemMasterId) {
        // Verify item exists
        ItemMaster itemMaster = itemMasterRepository.findById(itemMasterId)
                .orElseThrow(() -> new ItemMasterNotFoundException(itemMasterId));

        // Try to get base unit
        Optional<ItemUnit> baseUnitOpt = itemUnitRepository.findBaseUnitByItemMasterId(itemMasterId);

        if (baseUnitOpt.isPresent()) {
            return mapToResponse(baseUnitOpt.get());
        }

        // Fallback: Auto-create base unit from unitOfMeasure
        if (itemMaster.getUnitOfMeasure() != null && !itemMaster.getUnitOfMeasure().trim().isEmpty()) {
            log.warn(" Base unit not found for item {}, auto-creating from unitOfMeasure: {}",
                    itemMaster.getItemCode(), itemMaster.getUnitOfMeasure());

            ItemUnit fallbackUnit = ItemUnit.builder()
                    .itemMaster(itemMaster)
                    .unitName(itemMaster.getUnitOfMeasure())
                    .conversionRate(1)
                    .isBaseUnit(true)
                    .displayOrder(1)
                    .build();

            ItemUnit saved = itemUnitRepository.save(fallbackUnit);
            log.info(" Auto-created base unit '{}' (ID: {}) for item master: {}",
                    itemMaster.getUnitOfMeasure(), saved.getUnitId(), itemMaster.getItemCode());

            return mapToResponse(saved);
        }

        throw new RuntimeException("Base unit not found and unitOfMeasure is empty for item: " + itemMaster.getItemName());
    }

    /**
     * Convert quantity between units
     * Example: 2 Hộp (conversionRate=100) → 200 Viên (base unit)
     *
     * @param fromUnitId Source unit ID
     * @param toUnitId   Target unit ID
     * @param quantity   Quantity in source unit
     * @return Converted quantity in target unit
     */
    public Integer convertQuantity(Long fromUnitId, Long toUnitId, Integer quantity) {
        // Get both units
        ItemUnit fromUnit = itemUnitRepository.findById(fromUnitId)
                .orElseThrow(() -> new RuntimeException("Source unit not found: " + fromUnitId));
        ItemUnit toUnit = itemUnitRepository.findById(toUnitId)
                .orElseThrow(() -> new RuntimeException("Target unit not found: " + toUnitId));

        // Verify same item
        if (!fromUnit.getItemMaster().getItemMasterId().equals(toUnit.getItemMaster().getItemMasterId())) {
            throw new RuntimeException("Cannot convert between units of different items");
        }

        // Convert to base unit first, then to target unit
        // Example: 2 Hộp (100) → 200 Viên → 20 Vỉ (10)
        Integer baseQuantity = quantity * fromUnit.getConversionRate();
        return baseQuantity / toUnit.getConversionRate();
    }

    /**
     * Map ItemUnit entity to response DTO
     */
    private ItemUnitResponse mapToResponse(ItemUnit unit) {
        return ItemUnitResponse.builder()
                .unitId(unit.getUnitId())
                .unitName(unit.getUnitName())
                .conversionRate(unit.getConversionRate())
                .isBaseUnit(unit.getIsBaseUnit())
                .displayOrder(unit.getDisplayOrder())
                .build();
    }
}
