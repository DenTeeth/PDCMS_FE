package com.dental.clinic.management.exception.overtime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when overtime request is not found.
 * Returns 404 NOT_FOUND status.
 */
public class OvertimeRequestNotFoundException extends ErrorResponseException {

    public OvertimeRequestNotFoundException(String requestId) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(requestId), null);
    }

    private static ProblemDetail asProblemDetail(String requestId) {
        String message = String.format("Không tìm thấy yêu cầu làm thêm giờ với ID: %s", requestId);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Overtime Request Not Found");
        problemDetail.setProperty("code", "OT_REQUEST_NOT_FOUND");
        problemDetail.setProperty("message", "Không tìm thấy yêu cầu làm thêm giờ.");
        return problemDetail;
    }
}
