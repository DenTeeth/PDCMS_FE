package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class SlotAlreadyExistsException extends ErrorResponseException {

    private static final String ERROR_CODE = "SLOT_ALREADY_EXISTS";

    public SlotAlreadyExistsException(String workShiftId, String dayOfWeek) {
        super(HttpStatus.CONFLICT, createProblemDetail(workShiftId, dayOfWeek), null);
    }

    private static ProblemDetail createProblemDetail(String workShiftId, String dayOfWeek) {
        String message = String.format(
            "Suất làm việc cho ca '%s' vào '%s' đã tồn tại. Vui lòng chọn ca hoặc ngày khác.",
            workShiftId, dayOfWeek
        );

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Slot Already Exists");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("workShiftId", workShiftId);
        problemDetail.setProperty("dayOfWeek", dayOfWeek);

        return problemDetail;
    }
}
