package com.dental.clinic.management.exception.shift;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when shift code is duplicated.
 */
public class DuplicateShiftCodeException extends ErrorResponseException {

    public DuplicateShiftCodeException(String shiftCode) {
        super(HttpStatus.BAD_REQUEST, asProblemDetail(shiftCode), null);
    }

    private static ProblemDetail asProblemDetail(String shiftCode) {
        String message = String.format("Mã ca làm việc '%s' đã tồn tại. Vui lòng sử dụng mã khác.", shiftCode);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Duplicate Shift Code");
        problemDetail.setProperty("errorCode", "DUPLICATE_SHIFT_CODE");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
