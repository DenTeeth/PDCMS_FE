package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a part-time slot.
 * 
 * NEW SPECIFICATION:
 * - effectiveFrom and effectiveTo define the slot's active period
 * - dayOfWeek supports multiple days (comma-separated: "FRIDAY,SATURDAY")
 * - quota is the number of people needed PER DAY
 * 
 * Example:
 * {
 *   "workShiftId": "WKS_MORNING_01",
 *   "dayOfWeek": "FRIDAY,SATURDAY",
 *   "effectiveFrom": "2025-11-09",
 *   "effectiveTo": "2025-11-30",
 *   "quota": 2
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePartTimeSlotRequest {

    @NotBlank(message = "Work shift ID is required")
    private String workShiftId;

    /**
     * Days of week this slot is available.
     * Can be single day: "FRIDAY"
     * Or multiple days: "FRIDAY,SATURDAY"
     * Valid values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
     * (SUNDAY is typically not allowed)
     */
    @NotBlank(message = "Day of week is required")
    private String dayOfWeek;

    /**
     * Start date of slot availability.
     * Example: 2025-11-09
     */
    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    /**
     * End date of slot availability.
     * Example: 2025-11-30
     */
    @NotNull(message = "Effective to date is required")
    private LocalDate effectiveTo;

    /**
     * Number of people needed PER DAY for this slot.
     * Example: quota=2 means 2 people needed on EACH working day.
     */
    @NotNull(message = "Quota is required")
    @Min(value = 1, message = "Quota must be at least 1")
    private Integer quota;
}
