package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

/**
 * Response DTO for shift summary by date.
 * Used for GET /api/v1/shifts/summary endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftSummaryResponseDto {

    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("total_shifts")
    private Long totalShifts;

    @JsonProperty("status_breakdown")
    private Map<ShiftStatus, Long> statusBreakdown;
}
