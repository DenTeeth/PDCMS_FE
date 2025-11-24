package com.dental.clinic.management.exception.authorization;

import com.dental.clinic.management.exception.ErrorConstants;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * Exception thrown when a permission is not found.
 */
public class PermissionNotFoundException extends ErrorResponseException {

    public PermissionNotFoundException(String permissionId) {
        super(
                HttpStatus.NOT_FOUND,
                createProblemDetail(permissionId),
                null);
    }

    private static ProblemDetail createProblemDetail(String permissionId) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problemDetail.setType(ErrorConstants.PERMISSION_NOT_FOUND_TYPE);
        problemDetail.setTitle("Permission not found");
        problemDetail.setProperty("message", "error.permission.notfound");
        problemDetail.setProperty("params", permissionId);
        return problemDetail;
    }
}
