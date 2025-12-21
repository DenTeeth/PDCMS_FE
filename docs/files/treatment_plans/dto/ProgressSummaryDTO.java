package com.dental.clinic.management.treatment_plans.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Progress summary of a treatment plan.
 * Shows completion statistics at plan level.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressSummaryDTO {

    /**
     * Total number of phases
     */
    private Integer totalPhases;

    /**
     * Number of completed phases
     */
    private Integer completedPhases;

    /**
     * Total number of items across all phases
     */
    private Integer totalItems;

    /**
     * Number of completed items
     */
    private Integer completedItems;

    /**
     * Number of items ready to be booked
     */
    private Integer readyForBookingItems;
}
