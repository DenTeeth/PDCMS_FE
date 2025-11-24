package com.dental.clinic.management.exception.shift;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when attempting to modify or delete a work shift that is currently in use
 * by employee schedules or part-time registrations.
 */
public class ShiftInUseException extends ErrorResponseException {

    public ShiftInUseException(String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(message), null);
    }

    public ShiftInUseException(String workShiftId, String usageDetails) {
        this(String.format("Không thể thay đổi hoặc xóa ca làm việc '%s' vì ca này đang được sử dụng bởi %s. " +
                          "Vui lòng xóa hoặc thay đổi các lịch làm việc/đăng ký liên quan trước.",
                          workShiftId, usageDetails));
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Work Shift In Use");
        problemDetail.setProperty("errorCode", "SHIFT_IN_USE");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
