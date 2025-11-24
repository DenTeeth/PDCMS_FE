package com.dental.clinic.management.exception.schedule;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDate;

/**
 * Exception thrown when dentist exceeds max schedules per day limit.
 *
 * Business Rule: Maximum 2 work schedules per day for part-time dentists.
 *
 * Rationale:
 * - Work-life balance
 * - Prevent burnout
 * - Quality of care
 * - Reasonable earning opportunity
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class MaxSchedulesExceededException extends RuntimeException {

    private static final int MAX_SCHEDULES_PER_DAY = 2;

    public MaxSchedulesExceededException(String message) {
        super(message);
    }

    public MaxSchedulesExceededException(LocalDate workDate, int currentCount) {
        super(String.format(
                "Đã đạt giới hạn lịch làm việc cho ngày %s: %d/%d ca. " +
                        "Không thể đăng ký thêm.",
                workDate, currentCount, MAX_SCHEDULES_PER_DAY));
    }

    public MaxSchedulesExceededException(String message, Throwable cause) {
        super(message, cause);
    }

    public static int getMaxSchedulesPerDay() {
        return MAX_SCHEDULES_PER_DAY;
    }
}
