package com.dental.clinic.management.working_schedule.dto.request;

import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an employee shift.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShiftRequestDto {

    @JsonProperty("status")
    private ShiftStatus status;

    @JsonProperty("notes")
    private String notes;
}
