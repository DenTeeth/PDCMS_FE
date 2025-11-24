package com.dental.clinic.management.working_schedule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

import java.net.URI;
import java.time.LocalDate;
import java.util.Set;

/**
 * Exception thrown when registration period does not cover all required days of the week.
 * 
 * For example, if a slot requires MON,WED,FRI, the registration period must include
 * at least one Monday, one Wednesday, and one Friday.
 */
public class IncompleteDayCoverageException extends ErrorResponseException {
    private final Set<String> missingDays;
    private final Set<String> requiredDays;
    private final LocalDate effectiveFrom;
    private final LocalDate effectiveTo;

    public IncompleteDayCoverageException(
            Set<String> missingDays,
            Set<String> requiredDays,
            LocalDate effectiveFrom,
            LocalDate effectiveTo) {
        super(HttpStatus.BAD_REQUEST, createProblemDetail(missingDays, requiredDays, effectiveFrom, effectiveTo), null);
        this.missingDays = missingDays;
        this.requiredDays = requiredDays;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
    }

    private static ProblemDetail createProblemDetail(
            Set<String> missingDays,
            Set<String> requiredDays,
            LocalDate effectiveFrom,
            LocalDate effectiveTo) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Date range must include at least one occurrence of each working day defined in the slot."
        );
        problemDetail.setTitle("Insufficient Date Range");
        problemDetail.setType(URI.create("https://api.dentalclinic.com/errors/insufficient-date-range"));
        return problemDetail;
    }

    public Set<String> getMissingDays() {
        return missingDays;
    }

    public Set<String> getRequiredDays() {
        return requiredDays;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }
}
