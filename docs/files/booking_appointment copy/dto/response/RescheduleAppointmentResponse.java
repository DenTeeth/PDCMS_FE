package com.dental.clinic.management.booking_appointment.dto.response;

import com.dental.clinic.management.booking_appointment.dto.AppointmentDetailDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for reschedule appointment operation.
 * Contains both cancelled and new appointments.
 *
 * This helps frontend display clear message:
 * "Appointment APT-001 has been cancelled and rescheduled to APT-005"
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAppointmentResponse {

    /**
     * Cancelled appointment (old appointment, now CANCELLED status).
     * Contains rescheduled_to_appointment_id linking to new appointment.
     * Includes cancellation reason details.
     */
    private AppointmentDetailDTO cancelledAppointment;

    /**
     * New appointment (SCHEDULED status).
     * This is the active appointment with new time/doctor/room.
     */
    private AppointmentDetailDTO newAppointment;
}
