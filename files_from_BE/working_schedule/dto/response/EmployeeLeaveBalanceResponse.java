package com.dental.clinic.management.working_schedule.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for employee leave balances (P5.2)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeLeaveBalanceResponse {

    @JsonProperty("employee_id")
    private Integer employeeId;

    @JsonProperty("cycle_year")
    private Integer cycleYear;

    @JsonProperty("balances")
    private List<LeaveBalanceDetailResponse> balances;
}
