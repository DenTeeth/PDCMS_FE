package com.dental.clinic.management.booking_appointment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Time Slot DTO
 * Represents a specific time slot with available compatible rooms
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotDTO {

    /**
     * Start time of this slot
     * Format: ISO 8601 (YYYY-MM-DDTHH:mm:ss)
     * Example: "2025-10-30T09:30:00"
     */
    private LocalDateTime startTime;

    /**
     * List of room codes that are:
     * 1. Compatible with ALL requested services (from room_services)
     * 2. Available (not busy) at this time slot
     *
     * Example: ["P-IMPLANT-01", "P-IMPLANT-02"]
     */
    private List<String> availableCompatibleRoomCodes;

    /**
     * Optional: Additional info about this slot
     * Example: "Peak hour - may have delays"
     */
    private String note;
}
