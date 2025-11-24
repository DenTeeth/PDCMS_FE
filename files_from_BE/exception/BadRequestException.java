package com.dental.clinic.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception for bad request errors (400)
 */
public class BadRequestException extends ErrorResponseException {

    public BadRequestException(String errorCode, String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(errorCode, message), null);
    }

    public BadRequestException(String message) {
        this("BAD_REQUEST", message);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Bad Request");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/bad-request"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
