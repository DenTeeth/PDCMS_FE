package com.dental.clinic.management.exception.registration;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.time.LocalDate;

/**
 * Exception thrown when registration date is invalid.
 * - effective_from cannot be in the past
 * - effective_to must be >= effective_from
 */
public class InvalidRegistrationDateException extends ErrorResponseException {

    public InvalidRegistrationDateException(String message) {
        super(HttpStatus.BAD_REQUEST, asProblemDetailWithMessage(message), null);
    }

    public InvalidRegistrationDateException(LocalDate workDate, LocalDate currentDate) {
        super(HttpStatus.BAD_REQUEST, asProblemDetailWithDates(workDate, currentDate), null);
    }

    private static ProblemDetail asProblemDetailWithMessage(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Registration Date");
        problemDetail.setProperty("message", "INVALID_REGISTRATION_DATE");
        return problemDetail;
    }

    private static ProblemDetail asProblemDetailWithDates(LocalDate workDate, LocalDate currentDate) {
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(currentDate, workDate);
        String message = String.format(
                "Ngày đăng ký không hợp lệ: %s (còn %d ngày).",
                workDate, daysDiff);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Registration Date");
        problemDetail.setProperty("message", "INVALID_REGISTRATION_DATE");
        return problemDetail;
    }
}

