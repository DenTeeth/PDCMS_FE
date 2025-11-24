package com.dental.clinic.management.exception.shift;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when shift duration violates business rules.
 *
 * Business Rule: Shifts must be between 3-8 hours.
 *
 * Applies to:
 * - WorkShift creation/update
 * - DentistWorkSchedule with custom times
 * - RecurringSchedule with custom times
 */
public class InvalidShiftDurationException extends ErrorResponseException {

    public InvalidShiftDurationException(String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(message), null);
    }

    public InvalidShiftDurationException(int actualHours) {
        this(String.format("Thời lượng ca làm việc không hợp lệ: %d giờ. Yêu cầu: 3-8 giờ", actualHours));
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Shift Duration");
        problemDetail.setProperty("errorCode", "INVALID_DURATION");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
