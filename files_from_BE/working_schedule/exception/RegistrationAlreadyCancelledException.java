package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when trying to cancel a registration that is already cancelled.
 */
public class RegistrationAlreadyCancelledException extends ErrorResponseException {
    
    private static final String ERROR_CODE = "REGISTRATION_ALREADY_CANCELLED";
    
    public RegistrationAlreadyCancelledException(Integer registrationId) {
        super(HttpStatus.CONFLICT, createProblemDetail(registrationId), null);
    }

    private static ProblemDetail createProblemDetail(Integer registrationId) {
        String message = String.format(
                "Đăng ký %d đã bị hủy và không thể hủy lại lần nữa.",
                registrationId);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Registration Already Cancelled");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("registrationId", registrationId);

        return problemDetail;
    }
}
