package com.dental.clinic.management.exception.holiday;

/**
 * Exception thrown when attempting to create a holiday definition that already exists.
 * Error Code: DUPLICATE_HOLIDAY_DEFINITION
 */
public class DuplicateHolidayDefinitionException extends RuntimeException {

    private final String definitionId;

    public DuplicateHolidayDefinitionException(String definitionId) {
        super(String.format("Định nghĩa ngày nghỉ đã tồn tại: %s", definitionId));
        this.definitionId = definitionId;
    }

    public String getDefinitionId() {
        return definitionId;
    }
}
