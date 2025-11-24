package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

import com.dental.clinic.management.working_schedule.enums.WorkShiftCategory;

/**
 * DTO for work shift response.
 * Includes the calculated duration_hours field.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkShiftResponse {

    private String workShiftId;
    
    private String shiftName;
    
    private LocalTime startTime;
    
    private LocalTime endTime;
    
    private WorkShiftCategory category;
    
    private Boolean isActive;
    
    /**
     * Calculated field: duration in hours.
     */
    private Double durationHours;
}
