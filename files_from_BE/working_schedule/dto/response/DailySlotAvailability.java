package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents availability information for a single working day.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySlotAvailability {
    
    /**
     * Date in ISO format (YYYY-MM-DD, e.g., "2025-11-03")
     */
    private String date;
    
    /**
     * Day of week (e.g., "MONDAY")
     */
    private String dayOfWeek;
    
    /**
     * Quota for this day
     */
    private Integer quota;
    
    /**
     * Number of approved registrations covering this date
     */
    private Integer registered;
    
    /**
     * Remaining slots (quota - registered)
     */
    private Integer remaining;
    
    /**
     * Availability status:
     * - AVAILABLE: remaining == quota (100% free)
     * - PARTIAL: 0 < remaining < quota (some slots taken)
     * - FULL: remaining == 0 (no slots available)
     */
    private String status;
}
