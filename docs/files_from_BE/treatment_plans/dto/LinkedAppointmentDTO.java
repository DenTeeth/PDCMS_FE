package com.dental.clinic.management.treatment_plans.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Linked appointment information for an item.
 * Supports multiple appointments per item (e.g., root canal treatment needs 2-3
 * visits).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkedAppointmentDTO {

    /**
     * Appointment code (e.g., APT-20251001-001)
     */
    private String code;

    /**
     * Scheduled start time of appointment
     */
    private LocalDateTime scheduledDate;

    /**
     * Appointment status (SCHEDULED, COMPLETED, etc.)
     */
    private String status;

    /**
     * Notes from dentist/assistant when completing appointment.
     * Used to record treatment observations, patient conditions, etc.
     */
    private String notes;
}
