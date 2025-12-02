package com.dental.clinic.management.warehouse.dto;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for filtering and sorting suppliers
 * Used in API 6.13: GET /api/v1/warehouse/suppliers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Filter and sort parameters for supplier list")
public class SupplierFilterRequest {

    @Parameter(description = "Page number (0-indexed)", example = "0")
    @Builder.Default
    private Integer page = 0;

    @Parameter(description = "Page size (max 100)", example = "20")
    @Builder.Default
    private Integer size = 20;

    @Parameter(description = "Search keyword (searches in name, phone, email, code)", example = "ABC")
    private String search;

    @Parameter(description = "Filter by blacklist status", example = "false")
    private Boolean isBlacklisted;

    @Parameter(description = "Filter by active status", example = "true")
    private Boolean isActive;

    @Parameter(description = "Sort field: supplierName, totalOrders, lastOrderDate, createdAt", example = "supplierName")
    @Builder.Default
    private String sortBy = "supplierName";

    @Parameter(description = "Sort direction: ASC or DESC", example = "ASC")
    @Builder.Default
    private String sortDir = "ASC";

    /**
     * Validate and normalize sort parameters
     */
    public void validateAndNormalize() {
        // Normalize sort direction
        if (sortDir != null) {
            sortDir = sortDir.toUpperCase();
            if (!sortDir.equals("ASC") && !sortDir.equals("DESC")) {
                sortDir = "ASC";
            }
        } else {
            sortDir = "ASC";
        }

        // Validate sort field (whitelist approach for security)
        String[] validSortFields = {
                "supplierName", "supplierCode", "totalOrders",
                "lastOrderDate", "createdAt", "tierLevel", "ratingScore"
        };

        boolean isValidSortField = false;
        if (sortBy != null) {
            for (String validField : validSortFields) {
                if (validField.equalsIgnoreCase(sortBy)) {
                    sortBy = validField; // Use exact case
                    isValidSortField = true;
                    break;
                }
            }
        }

        if (!isValidSortField) {
            sortBy = "supplierName"; // Default
        }

        // Validate page and size
        if (page == null || page < 0) {
            page = 0;
        }

        if (size == null || size < 1) {
            size = 20;
        } else if (size > 100) {
            size = 100; // Max limit
        }

        // Trim search keyword
        if (search != null) {
            search = search.trim();
            if (search.isEmpty()) {
                search = null;
            }
        }
    }

    /**
     * Convert sortBy field name to database column name
     * 
     * @return Database column name for sorting
     */
    public String getSortColumn() {
        switch (sortBy) {
            case "supplierName":
                return "supplier_name";
            case "supplierCode":
                return "supplier_code";
            case "totalOrders":
                return "total_orders";
            case "lastOrderDate":
                return "last_order_date";
            case "createdAt":
                return "created_at";
            case "tierLevel":
                return "tier_level";
            case "ratingScore":
                return "rating_score";
            default:
                return "supplier_name";
        }
    }
}
