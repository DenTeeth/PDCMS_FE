package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class SlotInactiveException extends ErrorResponseException {

    private static final String ERROR_CODE = "SLOT_INACTIVE";

    public SlotInactiveException(Long slotId) {
        super(HttpStatus.CONFLICT, createProblemDetail(slotId), null);
    }

    private static ProblemDetail createProblemDetail(Long slotId) {
        String message = String.format("Suất làm việc %d hiện tại đã không còn hoạt động.", slotId);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        pd.setTitle("Slot Inactive");
        pd.setProperty("errorCode", ERROR_CODE);
        pd.setProperty("message", message);
        pd.setProperty("slotId", slotId);
        return pd;
    }
}
