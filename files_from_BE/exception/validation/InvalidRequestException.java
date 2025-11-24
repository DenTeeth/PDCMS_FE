package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;
import com.dental.clinic.management.exception.ErrorConstants;

import java.net.URI;

/**
 * Exception thrown when a request is invalid or cannot be processed.
 */
public class InvalidRequestException extends ErrorResponseException {

    public InvalidRequestException(String errorCode, String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(errorCode, message), null);
    }

    private static ProblemDetail asProblemDetail(String errorCode, String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Request");
        problemDetail.setType(URI.create(ErrorConstants.PROBLEM_BASE_URL + "/invalid-request"));
        problemDetail.setProperty("errorCode", errorCode);
        return problemDetail;
    }
}
