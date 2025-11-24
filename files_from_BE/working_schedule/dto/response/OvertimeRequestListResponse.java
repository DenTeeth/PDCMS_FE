package com.dental.clinic.management.working_schedule.dto.response;

import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for overtime request list item.
 * Lighter version for GET /api/v1/overtime-requests (paginated list)
 * Contains only essential information for list view.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeRequestListResponse {

    private String requestId;
    
    private Integer employeeId;
    
    private String employeeCode;
    
    private String employeeName;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate workDate;
    
    private String workShiftId;
    
    private String shiftName;
    
    private RequestStatus status;
    
    private String requestedByName;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
