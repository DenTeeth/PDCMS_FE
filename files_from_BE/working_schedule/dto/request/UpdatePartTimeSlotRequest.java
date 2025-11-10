package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePartTimeSlotRequest {

    @NotNull(message = "Quota is required")
    @Min(value = 1, message = "Quota must be at least 1")
    private Integer quota;

    @NotNull(message = "isActive is required")
    private Boolean isActive;
}
