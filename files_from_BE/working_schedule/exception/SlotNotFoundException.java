package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class SlotNotFoundException extends ErrorResponseException {

    private static final String ERROR_CODE = "SLOT_NOT_FOUND";

    public SlotNotFoundException(Long slotId) {
        super(HttpStatus.NOT_FOUND, createProblemDetail(slotId), null);
    }

    private static ProblemDetail createProblemDetail(Long slotId) {
        String message = String.format(
            "Không tìm thấy suất làm việc với ID: %d.",
            slotId
        );

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Slot Not Found");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("slotId", slotId);

        return problemDetail;
    }
}
