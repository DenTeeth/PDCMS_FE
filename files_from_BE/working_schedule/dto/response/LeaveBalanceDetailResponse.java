package com.dental.clinic.management.working_schedule.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for individual leave balance detail (P5.2)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalanceDetailResponse {

    @JsonProperty("balance_id")
    private Long balanceId;

    @JsonProperty("time_off_type")
    private TimeOffTypeInfoResponse timeOffType;

    @JsonProperty("total_days_allowed")
    private Double totalDaysAllowed;

    @JsonProperty("days_taken")
    private Double daysTaken;

    @JsonProperty("days_remaining")
    private Double daysRemaining;
}
