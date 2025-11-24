package com.dental.clinic.management.exception.fixed_registration;

/**
 * Exception thrown when attempting to create a duplicate fixed shift
 * registration.
 * This occurs when an employee already has an active registration for the same
 * work shift.
 */
public class DuplicateFixedShiftRegistrationException extends RuntimeException {

    public DuplicateFixedShiftRegistrationException(String workShiftName) {
        super(String.format("Nhân viên này đã được gán %s. Vui lòng cập nhật bản ghi cũ.", workShiftName));
    }
}
