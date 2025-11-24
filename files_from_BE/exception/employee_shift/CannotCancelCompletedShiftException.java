package com.dental.clinic.management.exception.employee_shift;

/**
 * Exception thrown when trying to cancel a completed shift.
 * Error Code: CANNOT_CANCEL_COMPLETED
 */
public class CannotCancelCompletedShiftException extends RuntimeException {

    public CannotCancelCompletedShiftException(String message) {
        super(message);
    }

    public CannotCancelCompletedShiftException(String message, Throwable cause) {
        super(message, cause);
    }
}
