package com.dental.clinic.management.treatment_plans.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Response DTO for automatic appointment scheduling.
 * 
 * ISSUE: AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION
 * Contains appointment suggestions with holiday adjustments and spacing validation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoScheduleResponse {
    
    /**
     * Treatment plan ID
     */
    private Long planId;
    
    /**
     * List of appointment suggestions for plan items
     */
    private List<AppointmentSuggestion> suggestions;
    
    /**
     * Total number of plan items processed
     */
    private Integer totalItemsProcessed;
    
    /**
     * Number of successful suggestions generated
     */
    private Integer successfulSuggestions;
    
    /**
     * Number of items that couldn't be scheduled (conflicts, no slots, etc.)
     */
    private Integer failedItems;
    
    /**
     * Summary of adjustments made (holidays skipped, dates shifted, etc.)
     */
    private SchedulingSummary summary;
    
    /**
     * Individual appointment suggestion for a plan item
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentSuggestion {
        /**
         * Plan item ID
         */
        private Long itemId;
        
        /**
         * Service code
         */
        private String serviceCode;
        
        /**
         * Service name (Vietnamese)
         */
        private String serviceName;
        
        /**
         * Suggested date after all adjustments
         */
        private LocalDate suggestedDate;
        
        /**
         * Original estimated date from treatment plan
         */
        private LocalDate originalEstimatedDate;
        
        /**
         * Whether date was adjusted due to holiday/weekend
         */
        private Boolean holidayAdjusted;
        
        /**
         * Whether date was adjusted due to spacing rules
         */
        private Boolean spacingAdjusted;
        
        /**
         * Reason for adjustment (if any)
         * Example: "Ngày lễ: Tết Dương lịch", "Cần 7 ngày hồi phục"
         */
        private String adjustmentReason;
        
        /**
         * Available time slots on suggested date
         */
        private List<TimeSlot> availableSlots;
        
        /**
         * Whether suggestion could be generated
         */
        private Boolean success;
        
        /**
         * Error message if suggestion failed
         */
        private String errorMessage;
    }
    
    /**
     * Available time slot for booking
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlot {
        /**
         * Start time of slot
         */
        private LocalTime startTime;
        
        /**
         * End time of slot
         */
        private LocalTime endTime;
        
        /**
         * Whether slot is available
         */
        private Boolean available;
        
        /**
         * Reason if not available (doctor busy, room occupied, etc.)
         */
        private String unavailableReason;
    }
    
    /**
     * Summary of scheduling adjustments
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchedulingSummary {
        /**
         * Number of dates adjusted due to holidays
         */
        private Integer holidayAdjustments;
        
        /**
         * Number of dates adjusted due to spacing rules
         */
        private Integer spacingAdjustments;
        
        /**
         * Number of dates adjusted due to daily limits
         */
        private Integer dailyLimitAdjustments;
        
        /**
         * Total days shifted forward
         */
        private Integer totalDaysShifted;
        
        /**
         * List of holidays encountered
         */
        private List<HolidayInfo> holidaysEncountered;
    }
    
    /**
     * Holiday information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HolidayInfo {
        /**
         * Holiday date
         */
        private LocalDate date;
        
        /**
         * Holiday name (Vietnamese)
         */
        private String name;
        
        /**
         * Whether it's a recurring holiday
         */
        private Boolean recurring;
    }
}
