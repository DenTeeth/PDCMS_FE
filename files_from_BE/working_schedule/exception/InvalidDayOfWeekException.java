package com.dental.clinic.management.working_schedule.exception;

import java.util.Arrays;
import java.util.List;

/**
 * Exception thrown when invalid day of week values are provided.
 * Includes the invalid days and list of valid days for client handling.
 */
public class InvalidDayOfWeekException extends RuntimeException {
    private final List<String> invalidDays;
    private final List<String> validDays;

    public InvalidDayOfWeekException(List<String> invalidDays) {
        super(String.format("Invalid day of week provided: %s. Valid values are: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY",
                String.join(", ", invalidDays)));
        this.invalidDays = invalidDays;
        this.validDays = Arrays.asList("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");
    }

    public List<String> getInvalidDays() {
        return invalidDays;
    }

    public List<String> getValidDays() {
        return validDays;
    }
}
