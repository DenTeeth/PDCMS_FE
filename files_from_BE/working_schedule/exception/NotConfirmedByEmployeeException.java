package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when Admin tries to finalize a renewal that employee hasn't
 * confirmed yet.
 * HTTP 409 CONFLICT.
 */
public class NotConfirmedByEmployeeException extends ErrorResponseException {

    private static final String ERROR_CODE = "NOT_CONFIRMED_BY_EMPLOYEE";

    public NotConfirmedByEmployeeException(String renewalId, String currentStatus) {
        super(HttpStatus.CONFLICT, createProblemDetail(renewalId, currentStatus), null);
    }

    private static ProblemDetail createProblemDetail(String renewalId, String currentStatus) {
        String message = String.format(
                "Không thể chốt gia hạn. Nhân viên chưa xác nhận đồng ý. Yêu cầu %s đang ở trạng thái %s (yêu cầu CONFIRMED).",
                renewalId,
                currentStatus);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Not Confirmed By Employee");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("renewalId", renewalId);
        problemDetail.setProperty("currentStatus", currentStatus);

        return problemDetail;
    }
}
