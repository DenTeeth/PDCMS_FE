package com.dental.clinic.management.warehouse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * API 6.17: Consumable Item Response
 * Individual consumable item required for a service
 *
 * RBAC: Price fields (unitPrice, totalCost) require VIEW_WAREHOUSE_COST
 * permission
 * - null values are excluded from JSON response via @JsonInclude(NON_NULL)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Exclude null price fields from JSON
public class ConsumableItemResponse {

    // Basic item info
    private Long itemMasterId;
    private String itemCode;
    private String itemName;

    // Requirement info
    private BigDecimal quantity; // Required quantity per service
    private String unitName;

    // Stock info (CRITICAL - Most important for clinic operations)
    private Integer currentStock; // Current stock in warehouse
    private String stockStatus; // OK | LOW | OUT_OF_STOCK

    // Cost info (RBAC: Requires VIEW_WAREHOUSE_COST permission)
    private BigDecimal unitPrice; // Unit price (null if no VIEW_WAREHOUSE_COST)
    private BigDecimal totalCost; // quantity × unitPrice (null if no VIEW_WAREHOUSE_COST)
}
