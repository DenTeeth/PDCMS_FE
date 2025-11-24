package com.dental.clinic.management.exception.employee_shift;

/**
 * Exception thrown when trying to modify a finalized shift.
 * Error Code: SHIFT_FINALIZED
 */
public class ShiftFinalizedException extends RuntimeException {

    public ShiftFinalizedException(String message) {
        super(message);
    }

    public ShiftFinalizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
