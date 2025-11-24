package com.dental.clinic.management.exception.employee_shift;

/**
 * Exception thrown when an employee shift is not found.
 * Error Code: SHIFT_NOT_FOUND
 */
public class ShiftNotFoundException extends RuntimeException {

    public ShiftNotFoundException(String message) {
        super(message);
    }

    public ShiftNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
