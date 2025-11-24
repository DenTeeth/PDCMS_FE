package com.dental.clinic.management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;

/**
 * Exception for business rule violations (4xx Conflict)
 */
public class BusinessException extends ErrorResponseException {

    public BusinessException(String errorCode, String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(errorCode, message), null);
    }

    public BusinessException(String message) {
        this("BUSINESS_RULE_VIOLATION", message);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Business Rule Violation");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/business-error"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
