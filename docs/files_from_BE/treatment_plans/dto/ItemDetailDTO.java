package com.dental.clinic.management.treatment_plans.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Item detail in a phase (checklist task).
 * Matches REVISED API SPEC v18.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemDetailDTO {

    /**
     * Item ID (for backend operations)
     */
    private Long itemId;

    /**
     * Sequence number within the phase (1, 2, 3, ...)
     */
    private Integer sequenceNumber;

    /**
     * Name of the item/task
     */
    private String itemName;

    /**
     * Service ID reference (for checking current service price)
     */
    private Integer serviceId;

    /**
     * Service code (Phase 5: for FE appointment booking)
     */
    private String serviceCode;

    /**
     * Snapshot price when plan was created
     */
    private BigDecimal price;

    /**
     * Estimated time in minutes (for booking slot calculation)
     */
    private Integer estimatedTimeMinutes;

    /**
     * Item status: READY_FOR_BOOKING, SCHEDULED, IN_PROGRESS, COMPLETED, SKIPPED
     */
    private String status;

    /**
     * When this item was completed (NULL if not completed)
     */
    private LocalDateTime completedAt;

    /**
     * Linked appointments (array to support multiple appointments per item)
     */
    @Builder.Default
    private List<LinkedAppointmentDTO> linkedAppointments = new ArrayList<>();
}
