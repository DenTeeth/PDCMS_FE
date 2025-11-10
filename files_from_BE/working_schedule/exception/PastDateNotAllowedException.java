package com.dental.clinic.management.working_schedule.exception;

import java.time.LocalDate;

/**
 * Exception thrown when a date in the past is provided but not allowed.
 * Enhanced with providedDate and minimumDate for better error context.
 */
public class PastDateNotAllowedException extends RuntimeException {
    private final LocalDate providedDate;
    private final LocalDate minimumDate;

    public PastDateNotAllowedException(LocalDate providedDate) {
        super(String.format("Effective from date cannot be in the past. Provided: %s, Minimum date: %s",
                providedDate, LocalDate.now()));
        this.providedDate = providedDate;
        this.minimumDate = LocalDate.now();
    }

    public LocalDate getProvidedDate() {
        return providedDate;
    }

    public LocalDate getMinimumDate() {
        return minimumDate;
    }
}
