package com.dental.clinic.management.working_schedule.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

import com.dental.clinic.management.working_schedule.enums.WorkShiftCategory;

/**
 * Entity representing a work shift template.
 * Defines the time frame and category of work shifts.
 */
@Entity
@Table(name = "work_shifts", indexes = {
    @Index(name = "idx_work_shift_is_active", columnList = "is_active"),
    @Index(name = "idx_work_shift_category", columnList = "category"),
    @Index(name = "idx_work_shift_start_time", columnList = "start_time"),
    @Index(name = "idx_work_shift_active_category", columnList = "is_active, category")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkShift {

    @Id
    @Column(name = "work_shift_id", length = 20)
    @NotBlank(message = "Work shift ID is required")
    @Size(max = 20, message = "Work shift ID must not exceed 20 characters")
    private String workShiftId;

    @Column(name = "shift_name", nullable = false, length = 100)
    @NotBlank(message = "Shift name is required")
    @Size(max = 100, message = "Shift name must not exceed 100 characters")
    private String shiftName;

    @Column(name = "start_time", nullable = false)
    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    @NotNull(message = "Category is required")
    private WorkShiftCategory category = WorkShiftCategory.NORMAL;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Calculate the duration of the shift in hours.
     * Excludes lunch break (11:00-12:00) if the shift spans across it.
     * @return Duration in hours (decimal)
     */
    @Transient
    public Double getDurationHours() {
        if (startTime == null || endTime == null) {
            return 0.0;
        }
        
        long startSeconds = startTime.toSecondOfDay();
        long endSeconds = endTime.toSecondOfDay();
        
        // Handle case where shift crosses midnight
        if (endSeconds <= startSeconds) {
            endSeconds += 24 * 3600; // Add 24 hours
        }
        
        long durationSeconds = endSeconds - startSeconds;
        double durationHours = durationSeconds / 3600.0; // Convert to hours
        
        // Subtract lunch break (12:00-13:00) if shift spans across it
        LocalTime lunchStart = LocalTime.of(12, 0);
        LocalTime lunchEnd = LocalTime.of(13, 0);
        
        if (!startTime.isAfter(lunchStart) && !endTime.isBefore(lunchEnd)) {
            durationHours -= 1.0; // Subtract 1 hour for lunch break
        }
        
        return durationHours;
    }
}
