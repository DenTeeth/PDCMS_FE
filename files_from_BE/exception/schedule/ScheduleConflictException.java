package com.dental.clinic.management.exception.schedule;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Exception thrown when schedule has time conflicts with existing schedules.
 *
 * Conflict Definition: Overlapping time ranges on the same date.
 *
 * Checked for:
 * - DentistWorkSchedule (same dentist, same date)
 * - RecurringSchedule (same employee, same day of week)
 * - WorkShift (any overlapping shift templates)
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ScheduleConflictException extends RuntimeException {

    public ScheduleConflictException(String message) {
        super(message);
    }

    public ScheduleConflictException(LocalDate date, LocalTime startTime, LocalTime endTime,
            String conflictingScheduleCode) {
        super(String.format(
                "Trùng lịch làm việc ngày %s (%s - %s) với lịch %s. " +
                        "Vui lòng chọn thời gian khác.",
                date, startTime, endTime, conflictingScheduleCode));
    }

    public ScheduleConflictException(String dayOfWeek, LocalTime startTime, LocalTime endTime) {
        super(String.format(
                "Trùng lịch cố định thứ %s (%s - %s). " +
                        "Vui lòng kiểm tra lại lịch tuần.",
                dayOfWeek, startTime, endTime));
    }

    public ScheduleConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
