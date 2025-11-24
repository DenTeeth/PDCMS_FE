package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when date range is invalid
 * For example: start_date > end_date, or half-day with different start/end
 * dates
 */
public class InvalidDateRangeException extends ErrorResponseException {

    public InvalidDateRangeException(String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(message), null);
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Date Range");
        problemDetail.setProperty("errorCode", "INVALID_DATE_RANGE");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
