package com.dental.clinic.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception thrown when attempting to create a resource that already exists.
 * Returns HTTP 409 CONFLICT status.
 * 
 * Use this for:
 * - Duplicate room codes
 * - Duplicate service codes
 * - Duplicate employee codes
 * - Any unique constraint violations
 */
public class DuplicateResourceException extends ErrorResponseException {

    public DuplicateResourceException(String errorCode, String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(errorCode, message), null);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Resource Already Exists");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/conflict"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
