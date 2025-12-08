package com.dental.clinic.management.booking_appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Appointment Detail DTO for Single Appointment View
 * Used in GET /api/v1/appointments/{appointmentCode} response
 *
 * Contains all fields from AppointmentSummaryDTO PLUS additional detail fields:
 * - appointmentId (internal PK)
 * - actualStartTime, actualEndTime
 * - cancellationReason (from audit log if status = CANCELLED)
 * - createdBy, createdAt
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDetailDTO {

    /**
     * Internal appointment ID (Primary Key)
     * Example: 123
     */
    private Integer appointmentId;

    /**
     * Appointment code
     * Example: "APT-20251104-001"
     */
    private String appointmentCode;

    /**
     * Appointment status
     * Example: SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
     */
    private String status;

    /**
     * Computed status based on current time and appointment status
     * Values: UPCOMING, LATE, IN_PROGRESS, CHECKED_IN, COMPLETED, CANCELLED,
     * NO_SHOW
     */
    private String computedStatus;

    /**
     * Minutes late (only applicable if LATE)
     */
    private Long minutesLate;

    /**
     * Appointment start time (scheduled)
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
     * Actual start time (when patient checked in or appointment started)
     * Only set when status = IN_PROGRESS or COMPLETED
     */
    private LocalDateTime actualStartTime;

    /**
     * Actual end time (when appointment completed)
     * Only set when status = COMPLETED
     */
    private LocalDateTime actualEndTime;

    /**
     * Cancellation reason (from appointment_audit_logs)
     * Only populated when status = CANCELLED
     * Example: "Bệnh nhân hủy do bận đột xuất"
     */
    private String cancellationReason;

    /**
     * Optional notes/remarks for this appointment
     */
    private String notes;

    /**
     * Patient information (with phone and DOB)
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
     * Full name of the user who created this appointment
     * Example: "Lễ tân An"
     */
    private String createdBy;

    /**
     * Timestamp when this appointment was created
     */
    private LocalDateTime createdAt;

    /**
     * Treatment plan code linked to this appointment (if any)
     * Populated from appointment_plan_items bridge table
     * Example: "PLAN-20251001-001"
     * Null if appointment is not linked to any treatment plan
     */
    private String linkedTreatmentPlanCode;
}
