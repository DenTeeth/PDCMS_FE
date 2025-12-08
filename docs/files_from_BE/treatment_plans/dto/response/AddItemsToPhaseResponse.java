package com.dental.clinic.management.treatment_plans.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for adding items to a treatment plan phase.
 * Used by API 5.7: POST /api/v1/patient-plan-phases/{phaseId}/items
 *
 * Contains:
 * - List of created items
 * - Financial impact summary (critical for transparency)
 * - Approval workflow status (plan may require re-approval)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response after adding items to a treatment plan phase")
public class AddItemsToPhaseResponse {

    /**
     * List of items that were successfully created
     */
    @Schema(description = "List of items created in this operation")
    @Builder.Default
    private List<CreatedItemDTO> items = new ArrayList<>();

    /**
     * Financial impact summary showing cost changes
     */
    @Schema(description = "Financial impact of adding these items")
    private FinancialImpactDTO financialImpact;

    /**
     * Approval workflow status
     */
    @Schema(description = "Approval workflow information")
    private ApprovalWorkflowDTO approvalWorkflow;

    /**
     * Summary message
     */
    @Schema(description = "Summary message describing the operation result", example = "Successfully added 2 items to phase. Plan status changed to PENDING_REVIEW and requires manager approval.")
    private String message;

    // ===== INNER DTOs =====

    /**
     * Details of a created item
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Details of a newly created item")
    public static class CreatedItemDTO {

        @Schema(description = "Item ID", example = "536")
        private Long itemId;

        @Schema(description = "Sequence number within phase (auto-generated)", example = "6")
        private Integer sequenceNumber;

        @Schema(description = "Item name", example = "Trám răng Composite (Phát sinh - Lần 1)")
        private String itemName;

        @Schema(description = "Service code", example = "FILLING_COMP")
        private String serviceCode;

        @Schema(description = "Service ID", example = "6")
        private Integer serviceId;

        @Schema(description = "Price (snapshot)", example = "400000")
        private BigDecimal price;

        @Schema(description = "Estimated time in minutes", example = "45")
        private Integer estimatedTimeMinutes;

        @Schema(description = "Item status (always PENDING for newly added items)", example = "PENDING")
        private String status;

        @Schema(description = "Notes", example = "Phát hiện 2 răng sâu mặt nhai 46, 47")
        private String notes;

        @Schema(description = "Created timestamp", example = "2024-01-15T14:30:00")
        private String createdAt;

        @Schema(description = "Created by user", example = "DR_AN_KHOA")
        private String createdBy;
    }

    /**
     * Financial impact summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Financial impact of adding items")
    public static class FinancialImpactDTO {

        @Schema(description = "Total cost added by new items", example = "800000")
        private BigDecimal totalCostAdded;

        @Schema(description = "Plan total cost before adding items", example = "15000000")
        private BigDecimal planTotalCostBefore;

        @Schema(description = "Plan total cost after adding items", example = "15800000")
        private BigDecimal planTotalCostAfter;

        @Schema(description = "Plan final cost before (after discount)", example = "13500000")
        private BigDecimal planFinalCostBefore;

        @Schema(description = "Plan final cost after (after discount recalculated)", example = "14220000")
        private BigDecimal planFinalCostAfter;

        @Schema(description = "Whether discount was applied to new items", example = "true")
        private Boolean discountApplied;

        @Schema(description = "Total discount amount (may change after adding items)", example = "1580000")
        private BigDecimal discountAmount;
    }

    /**
     * Approval workflow information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Approval workflow status after adding items")
    public static class ApprovalWorkflowDTO {

        @Schema(description = "Whether manager approval is required", example = "true")
        private Boolean approvalRequired;

        @Schema(description = "Approval status before adding items", example = "APPROVED")
        private String previousApprovalStatus;

        @Schema(description = "New approval status after adding items", example = "PENDING_REVIEW")
        private String newApprovalStatus;

        @Schema(description = "Reason why approval is required", example = "Cost change requires manager re-approval")
        private String reason;
    }
}
