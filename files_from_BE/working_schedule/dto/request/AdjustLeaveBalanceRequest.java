package com.dental.clinic.management.working_schedule.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for adjusting leave balance (P5.2)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdjustLeaveBalanceRequest {

    @NotNull(message = "Employee ID is required")
    @JsonProperty("employee_id")
    private Integer employeeId;

    @NotNull(message = "Time-off type ID is required")
    @JsonProperty("time_off_type_id")
    private String timeOffTypeId;

    @NotNull(message = "Cycle year is required")
    @JsonProperty("cycle_year")
    private Integer cycleYear;

    @NotNull(message = "Change amount is required")
    @JsonProperty("change_amount")
    private Double changeAmount; // Positive to add, negative to subtract

    @JsonProperty("notes")
    private String notes;
}
