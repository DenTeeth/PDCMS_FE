package com.dental.clinic.management.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for ItemUnit - Unit hierarchy for warehouse items
 * Example: Hộp (100) → Vỉ (10) → Viên (1)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemUnitResponse {

    private Long unitId;

    /**
     * Unit name (e.g., "Hộp", "Vỉ", "Viên", "Ống", "Thùng")
     */
    private String unitName;

    /**
     * Conversion rate relative to base unit
     * Example: 1 Hộp = 10 Vỉ → conversionRate = 10 for Hộp
     */
    private Integer conversionRate;

    /**
     * Whether this is the base (smallest) unit
     * Example: "Viên" is base unit → isBaseUnit = true
     */
    private Boolean isBaseUnit;

    /**
     * Display order (larger units first)
     * Example: Hộp (displayOrder=1) → Vỉ (displayOrder=2) → Viên (displayOrder=3)
     */
    private Integer displayOrder;
}
