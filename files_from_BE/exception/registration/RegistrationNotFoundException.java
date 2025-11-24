package com.dental.clinic.management.exception.registration;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when employee shift registration is not found.
 */
public class RegistrationNotFoundException extends ErrorResponseException {

    public RegistrationNotFoundException(String registrationId) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(registrationId), null);
    }

    public RegistrationNotFoundException(String registrationId, String additionalMessage) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(registrationId, additionalMessage), null);
    }

    private static ProblemDetail asProblemDetail(String registrationId) {
        String message = String.format("Employee Shift Registration not found with id: %s", registrationId);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Registration Not Found");
        problemDetail.setProperty("message", "error.registration.not.found");
        return problemDetail;
    }

    private static ProblemDetail asProblemDetail(String registrationId, String additionalMessage) {
        String message = String.format("Employee Shift Registration not found with id: %s. %s", registrationId,
                additionalMessage);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Registration Not Found");
        problemDetail.setProperty("message", "error.registration.not.found");
        return problemDetail;
    }
}
