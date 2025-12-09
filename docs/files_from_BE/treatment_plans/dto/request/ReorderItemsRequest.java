package com.dental.clinic.management.treatment_plans.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for API 5.14 (Reorder Phase Items).
 * Allows drag-and-drop reordering of items within a phase.
 *
 * V21.5: Enhances UX by supporting visual reordering.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to reorder items within a treatment phase")
public class ReorderItemsRequest {

    @SuppressWarnings("deprecation")
    @NotEmpty(message = "Danh sách item IDs không được trống")
    @Schema(description = "List of item IDs in new desired order. Item with ID at index 0 becomes sequence 1, index 1 becomes sequence 2, etc.",
            required = true,
            example = "[12, 10, 11]")
    private List<@NotNull Long> itemIds;
}
