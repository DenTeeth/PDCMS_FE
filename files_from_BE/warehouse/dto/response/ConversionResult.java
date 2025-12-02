package com.dental.clinic.management.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.text.DecimalFormat;

/**
 * Response DTO for single item conversion result
 * Contains detailed conversion information with formula for transparency
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversionResult {

    private Long itemMasterId;
    private String itemName;
    private String fromUnitName;
    private String toUnitName;

    // Input
    private Double inputQuantity;

    // Output (exact calculation)
    private Double resultQuantity;

    // Display-friendly format (e.g., "250" instead of "250.0", "1,000" for large
    // numbers)
    private String resultQuantityDisplay;

    // Transparency: Show how the conversion was calculated
    // Example: "(2.5 * 100) / 1" for 2.5 boxes to pills
    private String formula;

    // Conversion factor (fromUnit.conversionRate / toUnit.conversionRate)
    private Double conversionFactor;

    /**
     * Set result quantity and auto-generate display format
     */
    public void setResultQuantity(Double resultQuantity) {
        this.resultQuantity = resultQuantity;
        this.resultQuantityDisplay = formatQuantityForDisplay(resultQuantity);
    }

    /**
     * Format quantity for user-friendly display
     * - Remove unnecessary decimal zeros (250.0 -> 250)
     * - Add thousand separators for large numbers (1000 -> 1,000)
     * - Keep up to 2 decimal places for fractional values (83.33)
     */
    private String formatQuantityForDisplay(Double quantity) {
        if (quantity == null) {
            return "0";
        }

        // If integer, format without decimals
        if (quantity == Math.floor(quantity)) {
            DecimalFormat df = new DecimalFormat("#,###");
            return df.format(quantity.longValue());
        }

        // For decimals, keep up to 2 decimal places
        DecimalFormat df = new DecimalFormat("#,##0.##");
        return df.format(quantity);
    }
}
