package com.dental.clinic.management.treatment_plans.dto.response;

import com.dental.clinic.management.treatment_plans.dto.LinkedAppointmentDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for treatment plan item status update.
 * Used by API 5.6: PATCH /api/v1/patient-plan-items/{itemId}/status
 *
 * Returns complete item details after status update, including:
 * - Updated status and metadata
 * - Linked appointments (to verify no active appointments when skipping)
 * - Phase context (to show which phase this item belongs to)
 * - Financial impact (to show cost adjustment if skipped)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response after updating treatment plan item status")
public class PatientPlanItemResponse {

    // ===== ITEM DETAILS =====

    @Schema(description = "Internal item ID", example = "1001")
    private Long itemId;

    @Schema(description = "Sequence number within the phase", example = "1")
    private Integer sequenceNumber;

    @Schema(description = "Name of the treatment item", example = "Khám và tư vấn ban đầu")
    private String itemName;

    @Schema(description = "Service ID reference", example = "101")
    private Integer serviceId;

    @Schema(description = "Item price (snapshot at plan creation)", example = "500000")
    private BigDecimal price;

    @Schema(description = "Estimated time in minutes", example = "30")
    private Integer estimatedTimeMinutes;

    // ===== STATUS INFO =====

    @Schema(description = "Current status after update", example = "COMPLETED")
    private String status;

    @Schema(description = "Timestamp when item was completed (null if not completed)", example = "2024-01-15T14:30:00")
    private LocalDateTime completedAt;

    @Schema(description = "Notes explaining the status change", example = "Completed during appointment APT-001")
    private String notes;

    // ===== PHASE CONTEXT =====

    @Schema(description = "ID of the phase this item belongs to", example = "201")
    private Long phaseId;

    @Schema(description = "Name of the phase", example = "Phase 1: Initial Examination")
    private String phaseName;

    @Schema(description = "Phase sequence number", example = "1")
    private Integer phaseSequenceNumber;

    // ===== LINKED APPOINTMENTS =====

    @Schema(description = "List of appointments linked to this item (empty if none)")
    @Builder.Default
    private List<LinkedAppointmentDTO> linkedAppointments = new ArrayList<>();

    // ===== FINANCIAL IMPACT (for SKIPPED status) =====

    @Schema(description = "Whether this status change impacted plan finances (true if item was skipped/unskipped)", example = "true")
    private Boolean financialImpact;

    @Schema(description = "Financial impact message (present if financialImpact = true)", example = "Item skipped: Plan total cost reduced by 500,000 VND")
    private String financialImpactMessage;

    // ===== METADATA =====

    @Schema(description = "Timestamp when this status update was recorded", example = "2024-01-15T14:30:00")
    private LocalDateTime updatedAt;

    @Schema(description = "User who performed the status update", example = "DR_AN_KHOA")
    private String updatedBy;
}
