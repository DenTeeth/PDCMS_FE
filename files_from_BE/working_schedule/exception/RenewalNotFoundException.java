package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when renewal request not found.
 */
public class RenewalNotFoundException extends ErrorResponseException {

    private static final String ERROR_CODE = "RENEWAL_NOT_FOUND";

    public RenewalNotFoundException(String renewalId) {
        super(HttpStatus.NOT_FOUND, createProblemDetail(renewalId), null);
    }

    private static ProblemDetail createProblemDetail(String renewalId) {
        String message = String.format(
                "Không tìm thấy yêu cầu gia hạn với ID: %s.",
                renewalId);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Renewal Request Not Found");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("renewalId", renewalId);

        return problemDetail;
    }
}
