package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when the expiring fixed registration is inactive/deleted.
 */
public class RegistrationInactiveException extends ErrorResponseException {

    private static final String ERROR_CODE = "REGISTRATION_INACTIVE";

    public RegistrationInactiveException(Integer registrationId) {
        super(HttpStatus.CONFLICT, createProblemDetail(registrationId), null);
    }

    private static ProblemDetail createProblemDetail(Integer registrationId) {
        String message = String.format(
                "Lịch làm việc cố định (ID: %d) đã bị hủy hoặc vô hiệu hóa. Không thể gia hạn.",
                registrationId);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Registration Inactive");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("registrationId", registrationId);

        return problemDetail;
    }
}
