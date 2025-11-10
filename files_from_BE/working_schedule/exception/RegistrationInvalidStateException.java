package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class RegistrationInvalidStateException extends ErrorResponseException {

    private static final String ERROR_CODE = "REGISTRATION_INVALID_STATE";

    public RegistrationInvalidStateException(Integer registrationId, String currentStatus) {
        super(HttpStatus.CONFLICT, createProblemDetail(registrationId, currentStatus), null);
    }

    private static ProblemDetail createProblemDetail(Integer registrationId, String currentStatus) {
        String message = String.format(
                "Đăng ký %d không thể xử lý ở trạng thái hiện tại: %s.",
                registrationId, currentStatus);

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        pd.setTitle("Registration Invalid State");
        pd.setProperty("errorCode", ERROR_CODE);
        pd.setProperty("message", message);
        pd.setProperty("registrationId", registrationId);
        pd.setProperty("currentStatus", currentStatus);

        return pd;
    }
}
