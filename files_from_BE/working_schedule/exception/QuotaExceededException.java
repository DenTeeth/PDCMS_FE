package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.time.LocalDate;

public class QuotaExceededException extends ErrorResponseException {

    private static final String ERROR_CODE = "QUOTA_EXCEEDED";

    public QuotaExceededException(Long slotId, LocalDate date, long registered, int quota) {
        super(HttpStatus.CONFLICT, createProblemDetail(slotId, date, registered, quota), null);
    }

    private static ProblemDetail createProblemDetail(Long slotId, LocalDate date, long registered, int quota) {
        String message = String.format(
                "Không thể duyệt đăng ký: suất %d vượt quá hạn mức vào %s (%d/%d).",
                slotId, date, registered, quota);

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        pd.setTitle("Quota Exceeded");
        pd.setProperty("errorCode", ERROR_CODE);
        pd.setProperty("message", message);
        pd.setProperty("slotId", slotId);
        pd.setProperty("date", date.toString());
        pd.setProperty("registered", registered);
        pd.setProperty("quota", quota);

        return pd;
    }
}
