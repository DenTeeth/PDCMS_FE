package com.dental.clinic.management.booking_appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Appointment Summary DTO for Dashboard/List View
 * Used in GET /api/v1/appointments response
 *
 * Reuses nested summary classes from CreateAppointmentResponse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentSummaryDTO {

    /**
     * Appointment code
     * Example: "APT-20251030-001"
     */
    private String appointmentCode;

    /**
     * Appointment status
     * Example: SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
     */
    private String status;

    /**
     * Computed status based on current time and appointment status
     * Values: UPCOMING, LATE, IN_PROGRESS, CHECKED_IN, COMPLETED, CANCELLED
     *
     * Logic:
     * - CANCELLED: status == CANCELLED
     * - COMPLETED: status == COMPLETED
     * - CHECKED_IN: status == CHECKED_IN
     * - IN_PROGRESS: status == IN_PROGRESS
     * - LATE: status == SCHEDULED && currentTime > appointmentStartTime
     * - UPCOMING: status == SCHEDULED && currentTime <= appointmentStartTime
     */
    private String computedStatus;

    /**
     * Minutes late (only applicable if LATE)
     * If appointment is SCHEDULED but current time > start time, calculate delay
     * Otherwise: 0 or null
     */
    private Long minutesLate;

    /**
     * Appointment start time
     */
    private LocalDateTime appointmentStartTime;

    /**
     * Appointment end time (calculated)
     */
    private LocalDateTime appointmentEndTime;

    /**
     * Total expected duration in minutes
     */
    private Integer expectedDurationMinutes;

    /**
     * Patient information
     */
    private CreateAppointmentResponse.PatientSummary patient;

    /**
     * Primary doctor information
     */
    private CreateAppointmentResponse.DoctorSummary doctor;

    /**
     * Room information
     */
    private CreateAppointmentResponse.RoomSummary room;

    /**
     * List of services in this appointment
     */
    private List<CreateAppointmentResponse.ServiceSummary> services;

    /**
     * List of participants (assistants, secondary doctors, observers)
     */
    private List<CreateAppointmentResponse.ParticipantSummary> participants;

    /**
     * Optional: Notes/remarks for this appointment
     */
    private String notes;
}
