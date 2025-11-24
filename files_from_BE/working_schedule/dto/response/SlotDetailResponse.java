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
public class SlotDetailResponse {

    private Long slotId;
    private String shiftName;
    private String dayOfWeek;
    private Integer quota;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Integer overallRemaining; // Minimum remaining across all dates
    
    private List<MonthlyAvailability> availabilityByMonth;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyAvailability {
        private String month; // Format: "YYYY-MM"
        private String monthName; // Format: "December 2025"
        private Integer totalDatesAvailable; // Count of dates where registered < quota
        private Integer totalDatesPartial; // Count of dates where 0 < registered < quota
        private Integer totalDatesFull; // Count of dates where registered == quota
        private String status; // "AVAILABLE", "PARTIAL", "FULL"
        private Integer totalWorkingDays; // Total working days in this month
    }
}
