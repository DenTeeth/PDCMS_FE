package com.dental.clinic.management.booking_appointment.dto.availability;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * DTO for API 4.2: Available Time Slots
 * Represents a continuous time block when doctor is available
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotDTO {

    /**
     * Start time of available slot
     * Example: "08:30:00"
     */
    private LocalTime start;

    /**
     * End time of available slot
     * Example: "11:00:00"
     */
    private LocalTime end;

    /**
     * Whether this is the earliest/recommended slot
     * UI can highlight suggested slot for better UX
     */
    @Builder.Default
    private Boolean suggested = false;
}
