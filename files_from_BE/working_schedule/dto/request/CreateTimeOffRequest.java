package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO for creating new time-off request
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTimeOffRequest {

    @NotNull(message = "Employee ID is required")
    private Integer employeeId;

    @NotNull(message = "Time-off type ID is required")
    private String timeOffTypeId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private String workShiftId; // NULL for full-day off, value for half-day off

    @NotNull(message = "Reason is required")
    private String reason;

    @Override
    public String toString() {
        return "CreateTimeOffRequest{" +
                "employeeId=" + employeeId +
                ", timeOffTypeId='" + timeOffTypeId + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", workShiftId='" + workShiftId + '\'' +
                '}';
    }
}
