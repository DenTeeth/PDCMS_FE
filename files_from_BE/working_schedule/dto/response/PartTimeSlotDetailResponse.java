package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartTimeSlotDetailResponse {

    private Long slotId;
    private String workShiftId;
    private String workShiftName;
    private String dayOfWeek;
    private Integer quota;
    private Long registered; // Count of active registrations
    private Boolean isActive;
    private List<RegisteredEmployeeInfo> registeredEmployees;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisteredEmployeeInfo {
        private Integer employeeId;
        private String employeeCode;
        private String employeeName;
        private String effectiveFrom;
        private String effectiveTo;
    }
}
