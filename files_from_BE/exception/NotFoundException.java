package com.dental.clinic.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception for not found errors (404)
 */
public class NotFoundException extends ErrorResponseException {

    public NotFoundException(String errorCode, String message) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(errorCode, message), null);
    }

    public NotFoundException(String message) {
        this("NOT_FOUND", message);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Not Found");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/not-found"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
