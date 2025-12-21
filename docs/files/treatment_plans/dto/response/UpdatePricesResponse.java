package com.dental.clinic.management.treatment_plans.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for API 5.13 (Update Treatment Plan Prices - Finance).
 * Returns summary of price adjustments made by Finance/Accounting team.
 *
 * V21.4: Part of new pricing model audit trail.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response after updating treatment plan prices")
public class UpdatePricesResponse {

    @Schema(description = "Treatment plan code", example = "PLAN-20251119-001")
    private String planCode;

    @Schema(description = "Total cost before price update", example = "1000000")
    private BigDecimal totalCostBefore;

    @Schema(description = "Total cost after price update", example = "970000")
    private BigDecimal totalCostAfter;

    @Schema(description = "Final cost after discount (totalCost - discount)", example = "750000")
    private BigDecimal finalCost;

    @Schema(description = "Number of items with updated prices", example = "2")
    private Integer itemsUpdated;

    @Schema(description = "Whether discount amount was updated", example = "true")
    private Boolean discountUpdated;

    @Schema(description = "Who performed the update", example = "Kế toán Thành")
    private String updatedBy;

    @Schema(description = "Employee code who performed the update", example = "ACC_THANH")
    private String updatedByEmployeeCode;

    @Schema(description = "When the update was performed", example = "2025-11-19T16:00:00")
    private LocalDateTime updatedAt;
}
