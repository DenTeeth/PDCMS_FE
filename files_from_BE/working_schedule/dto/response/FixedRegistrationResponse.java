package com.dental.clinic.management.working_schedule.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for fixed shift registration details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FixedRegistrationResponse {

    @JsonProperty("registrationId")
    private Integer registrationId;

    @JsonProperty("employeeId")
    private Integer employeeId;

    @JsonProperty("employeeName")
    private String employeeName;

    @JsonProperty("workShiftId")
    private String workShiftId;

    @JsonProperty("workShiftName")
    private String workShiftName;

    @JsonProperty("daysOfWeek")
    private List<Integer> daysOfWeek; // 1=Monday, 2=Tuesday, ..., 7=Sunday

    @JsonProperty("effectiveFrom")
    private LocalDate effectiveFrom;

    @JsonProperty("effectiveTo")
    private LocalDate effectiveTo;

    @JsonProperty("isActive")
    private Boolean isActive;
}
