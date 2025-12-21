package com.dental.clinic.management.booking_appointment.dto.request;

import com.dental.clinic.management.booking_appointment.enums.AppointmentReasonCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for rescheduling appointment (Cancel old + Create new).
 * API: POST /api/v1/appointments/{appointmentCode}/reschedule
 *
 * Business: Cancel old appointment and create new one with new
 * time/doctor/room.
 * Patient and services remain the same (or can be changed via newServiceIds).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAppointmentRequest {

    // ==================== NEW APPOINTMENT INFO ====================

    /**
     * New doctor employee code.
     * Required.
     */
    @NotBlank(message = "New employee code is required")
    private String newEmployeeCode;

    /**
     * New room code.
     * Required.
     */
    @NotBlank(message = "New room code is required")
    private String newRoomCode;

    /**
     * New appointment start time.
     * Must not be in the past.
     * Required.
     */
    @NotNull(message = "New start time is required")
    private LocalDateTime newStartTime;

    /**
     * New participant employee codes (nurses, assistants).
     * Optional - can be empty list.
     */
    private List<String> newParticipantCodes;

    /**
     * New service IDs.
     * Optional - if null or empty, reuse old appointment's services.
     * If provided, will replace old services entirely.
     */
    private List<Integer> newServiceIds;

    // ==================== OLD APPOINTMENT CANCELLATION INFO ====================

    /**
     * Reason code for canceling old appointment.
     * Required.
     */
    @NotNull(message = "Reason code is required")
    private AppointmentReasonCode reasonCode;

    /**
     * Additional notes for cancellation.
     * Optional.
     */
    private String cancelNotes;
}
