package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Exception thrown when renewal request has expired (past deadline).
 */
public class RenewalExpiredException extends ErrorResponseException {

    private static final String ERROR_CODE = "REQUEST_EXPIRED";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public RenewalExpiredException(String renewalId, LocalDateTime expiresAt) {
        super(HttpStatus.CONFLICT, createProblemDetail(renewalId, expiresAt), null);
    }

    private static ProblemDetail createProblemDetail(String renewalId, LocalDateTime expiresAt) {
        String expiredDate = expiresAt != null ? expiresAt.format(FORMATTER) : "không xác định";
        String message = String.format(
                "Yêu cầu gia hạn %s đã hết hạn phản hồi (deadline: %s). Vui lòng liên hệ quản lý.",
                renewalId,
                expiredDate);

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
        problemDetail.setTitle("Renewal Request Expired");
        problemDetail.setProperty("errorCode", ERROR_CODE);
        problemDetail.setProperty("message", message);
        problemDetail.setProperty("renewalId", renewalId);
        problemDetail.setProperty("expiresAt", expiresAt != null ? expiresAt.toString() : null);

        return problemDetail;
    }
}
