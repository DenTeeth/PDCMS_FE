package com.dental.clinic.management.exception.account;

import com.dental.clinic.management.exception.ErrorConstants;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when password validation fails.
 */
public class InvalidPasswordException extends ErrorResponseException {

    public InvalidPasswordException() {
        super(
                HttpStatus.BAD_REQUEST,
                createProblemDetail(),
                null);
    }

    private static ProblemDetail createProblemDetail() {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problemDetail.setType(ErrorConstants.INVALID_PASSWORD_TYPE);
        problemDetail.setTitle("Incorrect password");
        return problemDetail;
    }
}
