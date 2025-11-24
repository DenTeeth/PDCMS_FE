package com.dental.clinic.management.exception.employee_shift;

import java.time.LocalDate;

/**
 * Exception thrown when trying to create a shift on a holiday.
 * Error Code: HOLIDAY_CONFLICT
 */
public class HolidayConflictException extends RuntimeException {

    private static final String DEFAULT_MESSAGE = "Không thể tạo ca làm việc vào ngày nghỉ lễ: %s";

    public HolidayConflictException(LocalDate holidayDate) {
        super(String.format(DEFAULT_MESSAGE, holidayDate));
    }

    public HolidayConflictException(LocalDate holidayDate, Throwable cause) {
        super(String.format(DEFAULT_MESSAGE, holidayDate), cause);
    }
}
