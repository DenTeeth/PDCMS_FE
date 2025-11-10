package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.time.LocalDate;

/**
 * Exception thrown when new effective_to date is invalid (not after old
 * effective_to).
 * HTTP 400 BAD REQUEST.
 */
public class InvalidEffectiveToException extends ErrorResponseException {

    private static final String ERROR_CODE = "INVALID_EFFECTIVE_TO";

    public InvalidEffectiveToException(LocalDate oldEffectiveTo, LocalDate newEffectiveTo) {
        super(HttpStatus.BAD_REQUEST, createProblemDetail(oldEffectiveTo, newEffectiveTo), null);
    }

    private static ProblemDetail createProblemDetail(LocalDate oldEffectiveTo, LocalDate newEffectiveTo) {
        String message = String.format(
                "Ngày kết thúc mới (%s) phải sau ngày kết thúc cũ (%s).",
                newEffectiveTo,
                oldEffectiveTo);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Invalid Effective To Date");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("oldEffectiveTo", oldEffectiveTo.toString());
        problemDetail.setProperty("newEffectiveTo", newEffectiveTo.toString());

        return problemDetail;
    }
}
