package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.working_schedule.domain.TimeOffRequest;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffRequestResponse;

import org.springframework.stereotype.Component;

/**
 * Mapper for TimeOffRequest entity <-> DTO conversions
 */
@Component
public class TimeOffRequestMapper {

    /**
     * Convert TimeOffRequest entity to TimeOffRequestResponse DTO
     */
    public TimeOffRequestResponse toResponse(TimeOffRequest entity) {
        if (entity == null) {
            return null;
        }

        return TimeOffRequestResponse.builder()
                .requestId(entity.getRequestId())
                .employee(mapEmployeeBasicInfo(entity.getEmployee()))
                .requestedBy(mapEmployeeBasicInfo(entity.getRequestedByEmployee()))
                .timeOffTypeId(entity.getTimeOffTypeId())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .workShiftId(entity.getWorkShiftId())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .approvedBy(entity.getApprovedByEmployee() != null
                        ? mapEmployeeBasicInfo(entity.getApprovedByEmployee())
                        : null)
                .approvedAt(entity.getApprovedAt())
                .rejectedReason(entity.getRejectedReason())
                .cancellationReason(entity.getCancellationReason())
                .requestedAt(entity.getRequestedAt())
                .build();
    }

    /**
     * Map Employee entity to basic info DTO.
     */
    private TimeOffRequestResponse.EmployeeBasicInfo mapEmployeeBasicInfo(Employee employee) {
        if (employee == null) {
            return null;
        }
        return TimeOffRequestResponse.EmployeeBasicInfo.builder()
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .fullName(employee.getFirstName() + " " + employee.getLastName())
                .build();
    }
}
