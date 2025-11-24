package com.dental.clinic.management.exception.account;

import com.dental.clinic.management.exception.ErrorConstants;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when user authentication fails due to invalid credentials.
 */
public class BadCredentialsException extends ErrorResponseException {

    public BadCredentialsException() {
        super(
                HttpStatus.UNAUTHORIZED,
                createProblemDetail(),
                null);
    }

    public BadCredentialsException(String message) {
        super(
                HttpStatus.UNAUTHORIZED,
                createProblemDetail(message),
                null);
    }

    private static ProblemDetail createProblemDetail() {
        return createProblemDetail("Invalid username or password");
    }

    private static ProblemDetail createProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problemDetail.setType(ErrorConstants.BAD_CREDENTIALS_TYPE);
        problemDetail.setTitle(message);
        problemDetail.setProperty("message", "error.authentication.failed");
        return problemDetail;
    }
}
