package com.dental.clinic.management.exception.shift;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when trying to create a work shift with a duplicate name.
 * Lỗi 2: Duplicate shift name validation
 */
public class DuplicateShiftNameException extends ErrorResponseException {

    public DuplicateShiftNameException(String shiftName) {
        super(HttpStatus.CONFLICT, asProblemDetail(shiftName), null);
    }

    private static ProblemDetail asProblemDetail(String shiftName) {
        String message = String.format("Tên ca làm việc '%s' đã tồn tại. Vui lòng chọn tên khác.", shiftName);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Duplicate Shift Name");
        problemDetail.setProperty("errorCode", "DUPLICATE_SHIFT_NAME");
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("shiftName", shiftName);
        return problemDetail;
    }
}
