package com.dental.clinic.management.exception.time_off;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when attempting to create a duplicate time-off request
 */
public class DuplicateTimeOffRequestException extends ErrorResponseException {

    public DuplicateTimeOffRequestException(String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(message), null);
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Duplicate Time-Off Request");
        problemDetail.setProperty("errorCode", "DUPLICATE_TIMEOFF_REQUEST");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
