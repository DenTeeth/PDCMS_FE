package com.dental.clinic.management.working_schedule.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for annual leave balance reset (P5.2)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnualResetRequest {

    @NotNull(message = "Cycle year is required")
    @JsonProperty("cycle_year")
    private Integer cycleYear; // e.g., 2026

    @NotNull(message = "Time-off type ID is required")
    @JsonProperty("apply_to_type_id")
    private String applyToTypeId; // e.g., "ANNUAL_LEAVE"

    @NotNull(message = "Default allowance is required")
    @Positive(message = "Default allowance must be positive")
    @JsonProperty("default_allowance")
    private Double defaultAllowance; // e.g., 12.0
}
