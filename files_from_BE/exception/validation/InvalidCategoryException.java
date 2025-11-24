package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when shift category doesn't match time requirements.
 */
public class InvalidCategoryException extends ErrorResponseException {

    public InvalidCategoryException(String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(message), null);
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Category");
        problemDetail.setProperty("errorCode", "INVALID_CATEGORY");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
