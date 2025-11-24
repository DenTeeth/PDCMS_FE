package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a fixed shift registration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFixedRegistrationRequest {

    @NotNull(message = "Employee ID is required")
    private Integer employeeId;

    @NotBlank(message = "Work shift ID is required")
    private String workShiftId;

    @NotEmpty(message = "Days of week cannot be empty")
    private List<Integer> daysOfWeek;

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo; // null = permanent
}
