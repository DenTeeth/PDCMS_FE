package com.dental.clinic.management.exception.authentication;

import com.dental.clinic.management.exception.ErrorConstants;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when JWT validation fails.
 */
public class JwtValidationException extends ErrorResponseException {

    public JwtValidationException(String message) {
        super(
                HttpStatus.UNAUTHORIZED,
                createProblemDetail(message),
                null);
    }

    public JwtValidationException(String message, Throwable cause) {
        super(
                HttpStatus.UNAUTHORIZED,
                createProblemDetail(message),
                cause);
    }

    private static ProblemDetail createProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problemDetail.setType(ErrorConstants.JWT_VALIDATION_FAILED_TYPE);
        problemDetail.setTitle("JWT validation failed");
        problemDetail.setProperty("message", "error.jwt.validation.failed");
        problemDetail.setProperty("details", message);
        return problemDetail;
    }
}
