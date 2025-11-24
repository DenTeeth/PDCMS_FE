package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * DTO for updating an existing work shift.
 * All fields are optional.
 * Category is removed - auto-updated based on time changes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkShiftRequest {

    @Size(max = 100, message = "Tên ca làm việc không được vượt quá 100 ký tự")
    private String shiftName;

    private LocalTime startTime;

    private LocalTime endTime;

    // Category is removed - auto-updated when time changes
}
