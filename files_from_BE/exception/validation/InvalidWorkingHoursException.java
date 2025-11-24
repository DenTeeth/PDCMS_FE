package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalTime;

/**
 * Exception thrown when work hours violate clinic operating hours.
 *
 * Business Rule: All work must be within 08:00 - 21:00.
 *
 * Rationale:
 * - Labor law compliance (no late-night shifts)
 * - Clinic operating hours
 * - Patient safety and service quality
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidWorkingHoursException extends RuntimeException {

    private static final LocalTime MIN_TIME = LocalTime.of(8, 0);
    private static final LocalTime MAX_TIME = LocalTime.of(21, 0);

    public InvalidWorkingHoursException(String message) {
        super(message);
    }

    public InvalidWorkingHoursException(LocalTime startTime, LocalTime endTime) {
        super(String.format(
                "Giờ làm việc không hợp lệ: %s - %s. Phải trong khung giờ: 08:00 - 21:00",
                startTime, endTime));
    }

    public InvalidWorkingHoursException(String message, Throwable cause) {
        super(message, cause);
    }

    public static LocalTime getMinTime() {
        return MIN_TIME;
    }

    public static LocalTime getMaxTime() {
        return MAX_TIME;
    }
}
