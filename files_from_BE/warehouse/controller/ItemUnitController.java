package com.dental.clinic.management.warehouse.controller;

import com.dental.clinic.management.warehouse.dto.ItemUnitResponse;
import com.dental.clinic.management.warehouse.service.ItemUnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API for item unit management
 * Enables frontend to get unit hierarchies for items
 */
@RestController
@RequestMapping("/api/v3/warehouse/items")
@RequiredArgsConstructor
@Tag(name = "Warehouse - Item Units", description = "API for managing item unit hierarchies (Hộp/Vỉ/Viên)")
public class ItemUnitController {

    private final ItemUnitService itemUnitService;

    @GetMapping("/{itemMasterId}/units")
    @Operation(summary = "Get all units for an item", description = "Returns unit hierarchy ordered by display order (Hộp → Vỉ → Viên)")
    public ResponseEntity<List<ItemUnitResponse>> getItemUnits(@PathVariable Long itemMasterId) {
        List<ItemUnitResponse> units = itemUnitService.getUnitsByItemId(itemMasterId);
        return ResponseEntity.ok(units);
    }

    @GetMapping("/{itemMasterId}/units/base")
    @Operation(summary = "Get base unit for an item", description = "Returns the smallest unit (e.g., 'Viên' for Amoxicillin)")
    public ResponseEntity<ItemUnitResponse> getBaseUnit(@PathVariable Long itemMasterId) {
        ItemUnitResponse baseUnit = itemUnitService.getBaseUnit(itemMasterId);
        return ResponseEntity.ok(baseUnit);
    }

    @GetMapping("/units/convert")
    @Operation(summary = "Convert quantity between units", description = "Example: Convert 2 Hộp (100) → 200 Viên")
    public ResponseEntity<Integer> convertQuantity(
            @RequestParam Long fromUnitId,
            @RequestParam Long toUnitId,
            @RequestParam Integer quantity) {
        Integer convertedQuantity = itemUnitService.convertQuantity(fromUnitId, toUnitId, quantity);
        return ResponseEntity.ok(convertedQuantity);
    }
}
