package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for TimeOffRequest
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeOffRequestResponse {

    private String requestId;

    private EmployeeBasicInfo employee;

    private EmployeeBasicInfo requestedBy;

    private String timeOffTypeId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String workShiftId;

    private String reason;

    private TimeOffStatus status;

    private EmployeeBasicInfo approvedBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime approvedAt;

    private String rejectedReason;

    private String cancellationReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime requestedAt;

    /**
     * Basic employee information for time-off request.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeBasicInfo {
        private Integer employeeId;
        private String employeeCode;
        private String firstName;
        private String lastName;
        private String fullName;
    }
}
