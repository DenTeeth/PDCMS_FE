package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when attempting invalid state transition for time-off
 * request
 * For example: trying to approve a request that is not PENDING
 */
public class InvalidStateTransitionException extends ErrorResponseException {

    public InvalidStateTransitionException(String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(message), null);
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Invalid State Transition");
        problemDetail.setProperty("errorCode", "INVALID_STATE_TRANSITION");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
