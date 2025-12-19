package com.dental.clinic.management.booking_appointment.dto.request;

import com.dental.clinic.management.booking_appointment.enums.AppointmentReasonCode;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for delaying an appointment to a new time slot.
 * API: PATCH /api/v1/appointments/{appointmentCode}/delay
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayAppointmentRequest {

    /**
     * New start time for the appointment.
     * Must be after the original start time.
     * Preferably on the same day as original appointment.
     */
    @NotNull(message = "New start time is required")
    private LocalDateTime newStartTime;

    /**
     * Reason code for delaying the appointment.
     * Examples: PATIENT_REQUEST, DOCTOR_EMERGENCY, EQUIPMENT_FAILURE
     */
    @NotNull(message = "Reason code is required")
    private AppointmentReasonCode reasonCode;

    /**
     * Additional notes explaining the delay.
     * Optional but recommended for audit trail.
     */
    private String notes;
}
