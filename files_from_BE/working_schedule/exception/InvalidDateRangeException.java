package com.dental.clinic.management.working_schedule.exception;

import java.time.LocalDate;

/**
 * Exception thrown when effectiveTo date is before effectiveFrom date.
 */
public class InvalidDateRangeException extends RuntimeException {
    private final LocalDate effectiveFrom;
    private final LocalDate effectiveTo;

    public InvalidDateRangeException(LocalDate effectiveFrom, LocalDate effectiveTo) {
        super(String.format("Effective to date (%s) must be after effective from date (%s)",
                effectiveTo, effectiveFrom));
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }
}
