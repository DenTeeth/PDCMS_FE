package com.dental.clinic.management.warehouse.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * API 6.17: Service Consumables Response
 * Returns list of consumable items required for a service with stock and cost
 * info
 *
 * RBAC: totalConsumableCost field requires VIEW_WAREHOUSE_COST permission
 * - null values are excluded from JSON response via @JsonInclude(NON_NULL)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Exclude null price fields from JSON
public class ServiceConsumablesResponse {

    /**
     * Service basic info
     */
    private Long serviceId;
    private String serviceName;

    /**
     * Financial info - Total cost of all consumables for this service
     * RBAC: Requires VIEW_WAREHOUSE_COST permission (null if not granted)
     * Helps answer: "How much does this service cost in materials?"
     */
    private BigDecimal totalConsumableCost;

    /**
     * Availability flag - Any item out of stock or low?
     * True if ANY consumable has stockStatus = OUT_OF_STOCK or LOW
     * Use this to show warning: "Cannot perform service - insufficient materials"
     */
    private Boolean hasInsufficientStock;

    /**
     * List of consumable items required
     * Each item's unitPrice and totalCost also require VIEW_WAREHOUSE_COST
     */
    private List<ConsumableItemResponse> consumables;
}
