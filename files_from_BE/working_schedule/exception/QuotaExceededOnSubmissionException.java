package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.time.LocalDate;

public class QuotaExceededOnSubmissionException extends ErrorResponseException {

    private static final String ERROR_CODE = "QUOTA_EXCEEDED_ON_SUBMISSION";

    public QuotaExceededOnSubmissionException(Long slotId, LocalDate from, LocalDate to, String detail) {
        super(HttpStatus.CONFLICT, createProblemDetail(slotId, from, to, detail), null);
    }

    private static ProblemDetail createProblemDetail(Long slotId, LocalDate from, LocalDate to, String detail) {
        String message = String.format("Không thể gửi yêu cầu: suất %d đã đầy cho thời gian %s -> %s.\n%s", slotId, from, to, detail);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        pd.setTitle("Quota Exceeded On Submission");
        pd.setProperty("errorCode", ERROR_CODE);
        pd.setProperty("message", message);
        pd.setProperty("slotId", slotId);
        pd.setProperty("from", from);
        pd.setProperty("to", to);
        return pd;
    }
}
