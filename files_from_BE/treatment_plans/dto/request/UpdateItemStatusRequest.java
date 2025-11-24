package com.dental.clinic.management.treatment_plans.dto.request;

import com.dental.clinic.management.treatment_plans.enums.PlanItemStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for updating treatment plan item status.
 * Used by API 5.6: PATCH /api/v1/patient-plan-items/{itemId}/status
 *
 * Supported State Transitions (State Machine):
 * - PENDING → READY_FOR_BOOKING, SKIPPED, COMPLETED
 * - READY_FOR_BOOKING → SCHEDULED, SKIPPED, COMPLETED
 * - SCHEDULED → IN_PROGRESS, COMPLETED (cannot skip if appointment active)
 * - IN_PROGRESS → COMPLETED (cannot skip if appointment in progress)
 * - SKIPPED → READY_FOR_BOOKING, COMPLETED (allow undo)
 * - COMPLETED → (no transitions allowed)
 *
 * Business Rules:
 * 1. Cannot skip items with active appointments (SCHEDULED/IN_PROGRESS)
 * 2. Skipping item reduces plan.total_cost and plan.final_cost
 * 3. Unskipping (SKIPPED → READY_FOR_BOOKING) adds cost back
 * 4. Completing item auto-activates next item in phase
 * 5. Completing last item in phase auto-completes the phase
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to update treatment plan item status")
public class UpdateItemStatusRequest {

    /**
     * New status to transition to
     * Must follow state machine rules (validated by business logic)
     */
    @NotNull(message = "Status is required")
    @Schema(description = "New status for the item (must follow state machine rules)", example = "COMPLETED", requiredMode = Schema.RequiredMode.REQUIRED, allowableValues = {
            "PENDING", "READY_FOR_BOOKING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "SKIPPED" })
    private PlanItemStatus status;

    /**
     * Optional notes explaining the status change
     * Example: "Patient requested to skip this service due to budget constraints"
     */
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    @Schema(description = "Notes explaining the status change (max 500 characters)", example = "Completed during appointment on 2024-01-15, patient satisfied with results", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String notes;

    /**
     * Completion timestamp (required only when status = COMPLETED)
     * If not provided for COMPLETED status, system will use current time
     */
    @Schema(description = "Timestamp when item was completed (auto-filled if not provided for COMPLETED status)", example = "2024-01-15T14:30:00", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private LocalDateTime completedAt;
}
