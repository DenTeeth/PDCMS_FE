package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when decline_reason is required but not provided.
 */
public class DeclineReasonRequiredException extends ErrorResponseException {

    private static final String ERROR_CODE = "REASON_REQUIRED";

    public DeclineReasonRequiredException() {
        super(HttpStatus.BAD_REQUEST, createProblemDetail(), null);
    }

    private static ProblemDetail createProblemDetail() {
        String message = "Vui lòng cung cấp lý do từ chối gia hạn (declineReason).";

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, message);
        problemDetail.setTitle("Decline Reason Required");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);

        return problemDetail;
    }
}
