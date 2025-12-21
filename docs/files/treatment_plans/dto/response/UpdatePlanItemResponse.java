package com.dental.clinic.management.treatment_plans.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for API 5.10: Update Plan Item.
 * Returns updated item details + financial impact on the plan.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlanItemResponse {

    /**
     * The updated item details
     */
    private UpdatedItemDTO updatedItem;

    /**
     * Financial impact on the entire treatment plan
     */
    private FinancialImpactDTO financialImpact;

    /**
     * DTO for updated item details
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatedItemDTO {
        private Long itemId;
        private Integer sequenceNumber;
        private String itemName;
        private Integer serviceId;
        private BigDecimal price;
        private Integer estimatedTimeMinutes;
        private String status;
    }

    /**
     * DTO for financial impact
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FinancialImpactDTO {
        /**
         * New total cost of the plan (before discount)
         */
        private BigDecimal planTotalCost;

        /**
         * New final cost of the plan (after discount)
         */
        private BigDecimal planFinalCost;

        /**
         * Price change amount (newPrice - oldPrice)
         */
        private BigDecimal priceChange;
    }
}
