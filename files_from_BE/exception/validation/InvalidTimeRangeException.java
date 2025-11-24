package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when time range is invalid (end time <= start time).
 */
public class InvalidTimeRangeException extends ErrorResponseException {

    public InvalidTimeRangeException(String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(message), null);
    }

    public InvalidTimeRangeException() {
        this("End time must be after start time");
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Time Range");
        problemDetail.setProperty("errorCode", "INVALID_TIME_RANGE");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
