package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a part-time registration.
 * 
 * NEW SPECIFICATION (Week-based registration):
 * - Employee can NO LONGER choose specific days of the week
 * - System automatically uses the slot's dayOfWeek for all matching dates
 * - Employee must register for at least 1 full week (minimum 7 days)
 * - System calculates all matching dates within effectiveFrom/effectiveTo range
 * - Request goes to PENDING status, waiting for manager approval
 * 
 * Example - Register for November (slot has MONDAY):
 * {
 *   "partTimeSlotId": 1,
 *   "effectiveFrom": "2025-11-01",
 *   "effectiveTo": "2025-11-30"
 * }
 * System automatically registers for ALL Mondays in November: Nov 3, 10, 17, 24
 * 
 * Example - Register for exactly 1 week (minimum):
 * {
 *   "partTimeSlotId": 2,
 *   "effectiveFrom": "2025-12-01",
 *   "effectiveTo": "2025-12-07"
 * }
 * Valid: 7 days span (inclusive)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRegistrationRequest {

    @NotNull(message = "Part-time slot ID is required")
    private Long partTimeSlotId;

    /**
     * Start date of registration period.
     * Must be within the slot's effectiveFrom/effectiveTo range.
     * Must be at least 7 days before effectiveTo (minimum 1 week).
     */
    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;
    
    /**
     * End date of registration period.
     * Must be within the slot's effectiveFrom/effectiveTo range.
     * Must be at least 7 days after effectiveFrom (minimum 1 week).
     */
    @NotNull(message = "Effective to date is required")
    private LocalDate effectiveTo;
}
