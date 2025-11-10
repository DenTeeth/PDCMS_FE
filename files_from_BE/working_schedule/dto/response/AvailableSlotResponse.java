package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableSlotResponse {

    private Long slotId;
    private String shiftName;
    private String dayOfWeek;
    
    // Date availability counts
    private Integer totalDatesAvailable; // Count of dates with space (registered < quota)
    private Integer totalDatesEmpty; // Count of dates with no registrations (registered = 0)
    private Integer totalDatesFull; // Count of dates at quota (registered = quota)
    
    // Additional context
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Integer quota;
    private String availabilitySummary; // e.g., "December FULL, January has space"
}
