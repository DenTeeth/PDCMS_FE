package com.dental.clinic.management.exception.overtime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when a related resource (Employee, WorkShift, etc.) is not found.
 * Returns 404 NOT_FOUND status.
 */
public class RelatedResourceNotFoundException extends ErrorResponseException {

    public RelatedResourceNotFoundException(String resourceType, Object resourceId) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(resourceType, resourceId), null);
    }

    public RelatedResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, asProblemDetail(message), null);
    }

    private static ProblemDetail asProblemDetail(String resourceType, Object resourceId) {
        String message = String.format("%s không tồn tại với ID: %s", resourceType, resourceId);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Related Resource Not Found");
        problemDetail.setProperty("code", "RELATED_RESOURCE_NOT_FOUND");
        problemDetail.setProperty("message", "Nhân viên hoặc Ca làm việc không tồn tại.");
        return problemDetail;
    }

    private static ProblemDetail asProblemDetail(String message) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, message);
        problemDetail.setTitle("Related Resource Not Found");
        problemDetail.setProperty("code", "RELATED_RESOURCE_NOT_FOUND");
        problemDetail.setProperty("message", message);
        return problemDetail;
    }
}
