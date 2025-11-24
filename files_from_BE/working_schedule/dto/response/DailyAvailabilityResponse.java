package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for daily availability of a specific slot in a month.
 * Shows detailed breakdown of quota availability per working day.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAvailabilityResponse {
    
    /**
     * Slot ID
     */
    private Long slotId;
    
    /**
     * Shift name (e.g., "Ca Part-time Sáng (8h-12h)")
     */
    private String shiftName;
    
    /**
     * Day(s) of week this slot applies to (e.g., "MONDAY" or "MONDAY,WEDNESDAY")
     */
    private String dayOfWeek;
    
    /**
     * Quota per day
     */
    private Integer quota;
    
    /**
     * Month being viewed (format: YYYY-MM, e.g., "2025-11")
     */
    private String month;
    
    /**
     * Month name in readable format (e.g., "November 2025")
     */
    private String monthName;
    
    /**
     * Total working days in this month (days matching dayOfWeek)
     */
    private Integer totalWorkingDays;
    
    /**
     * Number of days with 100% availability (remaining == quota)
     */
    private Integer totalDaysAvailable;
    
    /**
     * Number of days partially filled (0 < remaining < quota)
     */
    private Integer totalDaysPartial;
    
    /**
     * Number of days completely full (remaining == 0)
     */
    private Integer totalDaysFull;
    
    /**
     * Daily breakdown of availability
     */
    private List<DailySlotAvailability> dailyAvailability;
}
