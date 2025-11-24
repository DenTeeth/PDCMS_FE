package com.dental.clinic.management.exception.holiday;

import java.time.LocalDate;

/**
 * Exception thrown when date range query has invalid parameters (start date > end date).
 * Error Code: INVALID_DATE_RANGE
 */
public class InvalidDateRangeException extends RuntimeException {

    private final LocalDate startDate;
    private final LocalDate endDate;

    public InvalidDateRangeException(LocalDate startDate, LocalDate endDate) {
        super("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }
}
