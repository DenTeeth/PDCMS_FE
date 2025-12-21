package com.dental.clinic.management.treatment_plans.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for automatic appointment scheduling from treatment plan.
 * 
 * ISSUE: AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION
 * Priority: HIGH
 * Assigned: NGUYEN
 * 
 * Features:
 * - Schedule appointments based on estimated dates from plan items
 * - Automatically skip holidays and weekends
 * - Apply service spacing rules (preparation, recovery, intervals)
 * - Enforce daily appointment limits
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoScheduleRequest {
    
    /**
     * Preferred employee (doctor) code for all appointments.
     * If not specified, system will suggest available doctors.
     */
    private String employeeCode;
    
    /**
     * Preferred room code for all appointments.
     * If not specified, system will suggest available rooms.
     */
    private String roomCode;
    
    /**
     * Preferred time slots for appointments.
     * Options: MORNING (8:00-12:00), AFTERNOON (13:00-17:00), EVENING (17:00-20:00)
     * If empty, system will suggest all available slots.
     */
    private List<String> preferredTimeSlots;
    
    /**
     * Maximum days to look ahead for available slots.
     * Default: 90 days (3 months)
     * Used to limit search range when dates are far in the future.
     */
    @Builder.Default
    private Integer lookAheadDays = 90;
    
    /**
     * Whether to force scheduling even if spacing rules are violated.
     * Default: false (strict validation)
     * Use with caution - only for emergency cases.
     */
    @Builder.Default
    private Boolean forceSchedule = false;
}
