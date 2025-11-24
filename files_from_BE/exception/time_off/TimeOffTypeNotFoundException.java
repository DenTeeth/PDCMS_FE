package com.dental.clinic.management.exception.time_off;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when time-off type is not found
 */
public class TimeOffTypeNotFoundException extends ErrorResponseException {

    public TimeOffTypeNotFoundException(String typeId) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(typeId), null);
    }

    private static ProblemDetail asProblemDetail(String typeId) {
        String message = "Time-off type with ID '" + typeId + "' not found or inactive";
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Time-Off Type Not Found");
        problemDetail.setProperty("errorCode", "TIMEOFF_TYPE_NOT_FOUND");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
