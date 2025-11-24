package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for detailed overtime request response.
 * Used for GET /api/v1/overtime-requests/{request_id}
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeRequestDetailResponse {

    private String requestId;
    
    private EmployeeBasicInfo employee;
    
    private EmployeeBasicInfo requestedBy;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate workDate;
    
    private WorkShiftInfo workShift;
    
    private String reason;
    
    private RequestStatus status;
    
    private EmployeeBasicInfo approvedBy;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime approvedAt;
    
    private String rejectedReason;
    
    private String cancellationReason;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * Basic employee information for overtime request.
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

    /**
     * Work shift information for overtime request.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkShiftInfo {
        private String workShiftId;
        private String shiftName;
        private LocalTime startTime;
        private LocalTime endTime;
        private Double durationHours;
    }
}
