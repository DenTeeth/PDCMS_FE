package com.dental.clinic.management.treatment_plans.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Phase detail in a treatment plan.
 * Contains list of items (checklist tasks).
 * Matches REVISED API SPEC v18.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhaseDetailDTO {

    /**
     * Phase ID (for backend operations, deep linking)
     */
    private Long phaseId;

    /**
     * Phase number (1, 2, 3, ...)
     */
    private Integer phaseNumber;

    /**
     * Name of the phase
     */
    private String phaseName;

    /**
     * Phase status: PENDING, IN_PROGRESS, COMPLETED
     */
    private String status;

    /**
     * When this phase started
     */
    private LocalDate startDate;

    /**
     * When this phase was completed
     */
    private LocalDate completionDate;

    /**
     * Estimated duration in days for this phase
     * Can be null if not set
     */
    private Integer estimatedDurationDays;

    /**
     * Items (checklist tasks) in this phase
     */
    @Builder.Default
    private List<ItemDetailDTO> items = new ArrayList<>();
}
