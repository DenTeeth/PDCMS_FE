package com.dental.clinic.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception for conflict errors (409) - when resource state conflicts with
 * request
 */
public class ConflictException extends ErrorResponseException {

    public ConflictException(String errorCode, String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(errorCode, message), null);
    }

    public ConflictException(String message) {
        this("CONFLICT", message);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Conflict");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/conflict"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
