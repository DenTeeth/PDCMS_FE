package com.dental.clinic.management.exception.fixed_registration;

/**
 * Exception thrown when employee_id parameter is required but missing.
 */
public class EmployeeIdRequiredException extends RuntimeException {

    public EmployeeIdRequiredException() {
        super("Vui lòng cung cấp employee_id để xem.");
    }
}
