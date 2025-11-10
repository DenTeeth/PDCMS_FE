package com.dental.clinic.management.working_schedule.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a manual employee shift.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateShiftRequestDto {

    @NotNull(message = "employee_id không được để trống")
    @JsonProperty("employee_id")
    private Integer employeeId;

    @NotNull(message = "work_date không được để trống")
    @JsonProperty("work_date")
    private LocalDate workDate;

    @NotNull(message = "work_shift_id không được để trống")
    @JsonProperty("work_shift_id")
    private String workShiftId;

    @JsonProperty("notes")
    private String notes;
}
