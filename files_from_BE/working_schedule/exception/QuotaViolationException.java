package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class QuotaViolationException extends ErrorResponseException {

    private static final String ERROR_CODE = "QUOTA_VIOLATION";

    public QuotaViolationException(Long slotId, int newQuota, long currentRegistered) {
        super(HttpStatus.CONFLICT, createProblemDetail(slotId, newQuota, currentRegistered), null);
    }

    private static ProblemDetail createProblemDetail(Long slotId, int newQuota, long currentRegistered) {
        String message = String.format(
            "Không thể giảm quota xuống %d. Đã có %d nhân viên đăng ký suất này.",
            newQuota, currentRegistered
        );

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Quota Violation");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("slotId", slotId);
        problemDetail.setProperty("newQuota", newQuota);
        problemDetail.setProperty("currentRegistered", currentRegistered);

        return problemDetail;
    }
}
