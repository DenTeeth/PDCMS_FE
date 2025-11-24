package com.dental.clinic.management.exception.employee;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when a non-part-time employee tries to create shift
 * registration.
 */
public class InvalidEmploymentTypeException extends ErrorResponseException {

    public InvalidEmploymentTypeException(Integer employeeId) {
        super(HttpStatus.FORBIDDEN, asProblemDetail(employeeId), null);
    }

    public InvalidEmploymentTypeException(String message) {
        super(HttpStatus.FORBIDDEN, asProblemDetailWithMessage(message), null);
    }

    private static ProblemDetail asProblemDetail(Integer employeeId) {
        String message = "Only part-time employees can create shift registrations. Employee ID: " + employeeId;
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, message);
        problemDetail.setTitle("Invalid Employment Type");
        problemDetail.setProperty("errorCode", "INVALID_EMPLOYMENT_TYPE");
        problemDetail.setProperty("message", "Only part-time employees can create shift registrations.");
        return problemDetail;
    }

    private static ProblemDetail asProblemDetailWithMessage(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, message);
        problemDetail.setTitle("Invalid Employment Type");
        problemDetail.setProperty("errorCode", "INVALID_EMPLOYMENT_TYPE");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
