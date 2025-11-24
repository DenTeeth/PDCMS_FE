package com.dental.clinic.management.exception.fixed_registration;

/**
 * Exception thrown when a fixed registration is not found.
 */
public class FixedRegistrationNotFoundException extends RuntimeException {

    public FixedRegistrationNotFoundException(Integer registrationId) {
        super(String.format("Không tìm thấy lịch cố định với ID: %d", registrationId));
    }
}
