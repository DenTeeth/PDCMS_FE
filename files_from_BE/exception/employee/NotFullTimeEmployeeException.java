package com.dental.clinic.management.exception.employee;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when non-full-time employee attempts recurring schedule.
 *
 * Business Rule: Only FULL_TIME employees can have recurring schedules.
 *
 * Rationale:
 * - Full-time = fixed monthly salary = fixed weekly pattern
 * - Part-time = hourly payment = flexible self-registration
 * - System design: recurring_schedules table is for full-time only
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class NotFullTimeEmployeeException extends RuntimeException {

    public NotFullTimeEmployeeException(String message) {
        super(message);
    }

    public NotFullTimeEmployeeException(String employeeCode, String employmentType) {
        super(String.format(
                "Nhân viên %s (loại: %s) không được tạo lịch cố định. " +
                        "Chỉ nhân viên FULL_TIME mới có lịch tuần cố định.",
                employeeCode, employmentType));
    }

    public NotFullTimeEmployeeException(String message, Throwable cause) {
        super(message, cause);
    }
}
