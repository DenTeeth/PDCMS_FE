package com.dental.clinic.management.exception.employee_shift;

/**
 * Exception thrown when trying to cancel a batch-generated shift.
 * Error Code: CANNOT_CANCEL_BATCH
 */
public class CannotCancelBatchShiftException extends RuntimeException {

    public CannotCancelBatchShiftException(String message) {
        super(message);
    }

    public CannotCancelBatchShiftException(String message, Throwable cause) {
        super(message, cause);
    }
}
