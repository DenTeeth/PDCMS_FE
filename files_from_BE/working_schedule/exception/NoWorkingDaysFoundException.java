package com.dental.clinic.management.working_schedule.exception;

import java.time.LocalDate;
import java.util.List;

/**
 * Exception thrown when no working days are found matching the requested days of week in the date range.
 */
public class NoWorkingDaysFoundException extends RuntimeException {
    private final List<String> requestedDays;
    private final LocalDate effectiveFrom;
    private final LocalDate effectiveTo;

    public NoWorkingDaysFoundException(List<String> requestedDays, LocalDate effectiveFrom, LocalDate effectiveTo) {
        super(String.format("No working days found for %s between %s and %s. Try expanding your date range or selecting different days of the week.",
                String.join(", ", requestedDays), effectiveFrom, effectiveTo));
        this.requestedDays = requestedDays;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
    }

    public List<String> getRequestedDays() {
        return requestedDays;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }
}
