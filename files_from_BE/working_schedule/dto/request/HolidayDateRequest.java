package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Request DTO for creating/updating a holiday date.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDateRequest {

    @NotNull(message = "Holiday date is required")
    private LocalDate holidayDate;

    @NotBlank(message = "Definition ID is required")
    private String definitionId;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
