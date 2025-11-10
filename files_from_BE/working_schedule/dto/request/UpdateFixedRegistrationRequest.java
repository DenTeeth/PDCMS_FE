package com.dental.clinic.management.working_schedule.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for updating a fixed shift registration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFixedRegistrationRequest {

    private String workShiftId; // Optional

    private List<Integer> daysOfWeek; // Optional

    private LocalDate effectiveFrom; // Optional

    private LocalDate effectiveTo; // Optional (null = permanent)
}
