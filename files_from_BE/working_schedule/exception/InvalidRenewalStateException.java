package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when renewal request is not in PENDING_ACTION state.
 */
public class InvalidRenewalStateException extends ErrorResponseException {

    private static final String ERROR_CODE = "INVALID_STATE";

    public InvalidRenewalStateException(String renewalId, String currentStatus) {
        super(HttpStatus.CONFLICT, createProblemDetail(renewalId, currentStatus), null);
    }

    private static ProblemDetail createProblemDetail(String renewalId, String currentStatus) {
        String message = String.format(
                "Không thể phản hồi yêu cầu gia hạn. Yêu cầu %s đang ở trạng thái %s (chỉ cho phép PENDING_ACTION).",
                renewalId,
                currentStatus);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Invalid Renewal State");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("renewalId", renewalId);
        problemDetail.setProperty("currentStatus", currentStatus);

        return problemDetail;
    }
}
