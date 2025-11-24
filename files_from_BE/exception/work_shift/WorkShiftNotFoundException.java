package com.dental.clinic.management.exception.work_shift;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;
import java.time.Instant;

/**
 * Exception thrown when work shift is not found.
 */
public class WorkShiftNotFoundException extends ErrorResponseException {

    private static final String ERROR_CODE = "WORK_SHIFT_NOT_FOUND";

    public WorkShiftNotFoundException(String workShiftId) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(workShiftId), null);
    }

    private static ProblemDetail asProblemDetail(String workShiftId) {
        String message = String.format("Không tìm thấy ca làm việc với mã: '%s'. " +
                                      "Vui lòng kiểm tra lại mã ca làm việc hoặc danh sách ca làm việc hiện có.",
                                      workShiftId);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setType(URI.create("https://api.dentalclinic.com/errors/work-shift-not-found"));
        problemDetail.setTitle("Work Shift Not Found");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("timestamp", Instant.now());
        problemDetail.setProperty("workShiftId", workShiftId);
        return problemDetail;
    }
}
