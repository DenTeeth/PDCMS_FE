package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.ShiftSource;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for employee shift details.
 * Used for both single shift detail and calendar list views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeShiftResponseDto {

    @JsonProperty("employee_shift_id")
    private String employeeShiftId;

    @JsonProperty("employee")
    private EmployeeBasicDto employee;

    @JsonProperty("work_date")
    private LocalDate workDate;

    @JsonProperty("work_shift")
    private WorkShiftBasicDto workShift;

    @JsonProperty("source")
    private ShiftSource source;

    @JsonProperty("status")
    private ShiftStatus status;

    @JsonProperty("is_overtime")
    private Boolean isOvertime;

    @JsonProperty("created_by")
    private Integer createdBy;

    @JsonProperty("created_by_name")
    private String createdByName;

    @JsonProperty("source_ot_request_id")
    private String sourceOtRequestId;

    @JsonProperty("source_off_request_id")
    private String sourceOffRequestId;

    @JsonProperty("notes")
    private String notes;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    /**
     * Nested DTO for basic employee information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeBasicDto {
        
        @JsonProperty("employee_id")
        private Integer employeeId;

        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("position")
        private String position;
    }

    /**
     * Nested DTO for basic work shift information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkShiftBasicDto {
        
        @JsonProperty("work_shift_id")
        private String workShiftId;

        @JsonProperty("shift_name")
        private String shiftName;

        @JsonProperty("start_time")
        private String startTime;

        @JsonProperty("end_time")
        private String endTime;
    }
}
