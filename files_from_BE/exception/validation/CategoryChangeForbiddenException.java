package com.dental.clinic.management.exception.validation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when attempting to change a work shift's category (NORMAL ↔ NIGHT)
 * which would conflict with the semantic meaning of the shift ID.
 */
public class CategoryChangeForbiddenException extends ErrorResponseException {

    public CategoryChangeForbiddenException(String message) {
        super(HttpStatus.CONFLICT, asProblemDetail(message), null);
    }

    public CategoryChangeForbiddenException(String workShiftId, String fromCategory, String toCategory) {
        this(String.format("Không thể thay đổi ca từ %s sang %s vì sẽ không khớp với mã ca làm việc '%s'. " +
                          "Vui lòng tạo ca làm việc mới thay vì cập nhật ca hiện tại.",
                          fromCategory, toCategory, workShiftId));
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Category Change Forbidden");
        problemDetail.setProperty("errorCode", "CATEGORY_CHANGE_FORBIDDEN");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
