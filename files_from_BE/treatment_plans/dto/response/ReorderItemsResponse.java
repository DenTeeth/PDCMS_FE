package com.dental.clinic.management.treatment_plans.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for API 5.14 (Reorder Phase Items).
 * Returns updated sequence of items after reordering.
 *
 * V21.5: Confirmation response for drag-and-drop operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response after reordering phase items")
public class ReorderItemsResponse {

    @Schema(description = "Phase ID", example = "123")
    private Long phaseId;

    @Schema(description = "Phase name", example = "Giai đoạn 1")
    private String phaseName;

    @Schema(description = "Number of items reordered", example = "3")
    private Integer itemsReordered;

    @Schema(description = "List of items with updated sequence numbers")
    private List<ReorderedItem> items;

    /**
     * Inner DTO for individual reordered item.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Item with updated sequence number")
    public static class ReorderedItem {

        @Schema(description = "Item ID", example = "12")
        private Long itemId;

        @Schema(description = "Item name", example = "Nhổ răng số 8")
        private String itemName;

        @Schema(description = "New sequence number (1-based)", example = "1")
        private Integer sequenceNumber;
    }
}
