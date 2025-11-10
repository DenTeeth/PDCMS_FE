package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when employee tries to respond to renewal they don't own.
 */
public class NotRenewalOwnerException extends ErrorResponseException {

    private static final String ERROR_CODE = "NOT_OWNER";

    public NotRenewalOwnerException(String renewalId, Integer employeeId) {
        super(HttpStatus.FORBIDDEN, createProblemDetail(renewalId, employeeId), null);
    }

    private static ProblemDetail createProblemDetail(String renewalId, Integer employeeId) {
        String message = String.format(
                "Bạn không có quyền phản hồi yêu cầu gia hạn này. Yêu cầu %s không thuộc về nhân viên %d.",
                renewalId,
                employeeId);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, message);
        problemDetail.setTitle("Not Renewal Owner");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("renewalId", renewalId);
        problemDetail.setProperty("employeeId", employeeId);

        return problemDetail;
    }
}
