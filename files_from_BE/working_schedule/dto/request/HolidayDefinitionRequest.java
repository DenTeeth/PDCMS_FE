package com.dental.clinic.management.working_schedule.dto.request;

import com.dental.clinic.management.working_schedule.enums.HolidayType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request DTO for creating/updating holiday definition.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDefinitionRequest {

    @NotBlank(message = "Definition ID is required")
    @Pattern(regexp = "^[A-Z0-9_]{1,20}$", 
             message = "Definition ID must contain only uppercase letters, numbers, and underscores (max 20 chars)")
    private String definitionId;

    @NotBlank(message = "Holiday name is required")
    @Size(max = 100, message = "Holiday name must not exceed 100 characters")
    private String holidayName;

    @NotNull(message = "Holiday type is required")
    private HolidayType holidayType;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
