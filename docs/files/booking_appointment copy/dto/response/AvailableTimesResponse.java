package com.dental.clinic.management.booking_appointment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for P3.1: Available Time Slots
 *
 * Returns list of available slots with compatible rooms for each slot
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableTimesResponse {

    /**
     * Total duration needed for all services (including buffer time)
     * Unit: minutes
     * Calculated from: SUM(defaultDurationMinutes + defaultBufferMinutes)
     */
    private Integer totalDurationNeeded;

    /**
     * List of available time slots
     * Each slot includes compatible rooms that are available at that time
     */
    private List<TimeSlotDTO> availableSlots;

    /**
     * Optional: Message if no slots found
     * Example: "Không có phòng nào hỗ trợ các dịch vụ này"
     */
    private String message;
}
