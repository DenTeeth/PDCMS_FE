package com.dental.clinic.management.working_schedule.domain;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * Composite primary key for HolidayDate entity.
 * Combination of (holiday_date, definition_id).
 */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class HolidayDateId implements Serializable {
    
    private LocalDate holidayDate;
    private String definitionId;
}
