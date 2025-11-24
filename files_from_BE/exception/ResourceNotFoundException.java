package com.dental.clinic.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception thrown when a requested resource is not found.
 */
public class ResourceNotFoundException extends ErrorResponseException {

    public ResourceNotFoundException(String errorCode, String message) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(errorCode, message), null);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Resource Not Found");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/not-found"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
