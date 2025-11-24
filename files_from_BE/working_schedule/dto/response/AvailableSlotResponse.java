package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotResponse {

    private Long slotId;
    private String shiftName;
    private String dayOfWeek;
    
    // Week availability counts (FIXED: Was incorrectly showing dates)
    private Integer totalWeeksAvailable; // Total weeks from effectiveFrom to effectiveTo
    private Integer availableWeeks; // Weeks with at least 1 slot available
    private Integer fullWeeks; // Weeks where all slots are full
    
    // Additional context
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Integer quota;
    private String availabilitySummary; // e.g., "11/14 weeks available"
    
    /**
     * List of months (YYYY-MM format) that have at least one working day available for this slot.
     * Used by frontend month picker to enable/disable months.
     * Example: ["2025-11", "2025-12", "2026-01"]
     */
    private List<String> availableMonths;
}
