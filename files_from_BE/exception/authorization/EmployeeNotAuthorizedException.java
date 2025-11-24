package com.dental.clinic.management.exception.authorization;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when employee attempts unauthorized schedule operation.
 *
 * Authorization Rules:
 * - Dentists can only manage their own schedules
 * - Admin can manage all schedules
 * - HR can view and update attendance status only
 *
 * Security:
 * - Prevent schedule manipulation
 * - Audit trail protection
 * - Role-based access control
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class EmployeeNotAuthorizedException extends RuntimeException {

    public EmployeeNotAuthorizedException(String message) {
        super(message);
    }

    public EmployeeNotAuthorizedException(String employeeCode, String operation) {
        super(String.format(
                "Nhân viên %s không có quyền thực hiện: %s. " +
                        "Chỉ có thể quản lý lịch của chính mình.",
                employeeCode, operation));
    }

    public EmployeeNotAuthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
