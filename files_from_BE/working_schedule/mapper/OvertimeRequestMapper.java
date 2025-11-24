package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.working_schedule.domain.OvertimeRequest;
import com.dental.clinic.management.working_schedule.domain.WorkShift;
import com.dental.clinic.management.working_schedule.dto.response.OvertimeRequestDetailResponse;
import com.dental.clinic.management.working_schedule.dto.response.OvertimeRequestListResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between OvertimeRequest entity and DTOs.
 */
@Component
public class OvertimeRequestMapper {

    /**
     * Convert OvertimeRequest entity to detailed response DTO.
     * Includes all related information (employee, shift, approver).
     */
    public OvertimeRequestDetailResponse toDetailResponse(OvertimeRequest overtimeRequest) {
        return OvertimeRequestDetailResponse.builder()
                .requestId(overtimeRequest.getRequestId())
                .employee(mapEmployeeBasicInfo(overtimeRequest.getEmployee()))
                .requestedBy(mapEmployeeBasicInfo(overtimeRequest.getRequestedBy()))
                .workDate(overtimeRequest.getWorkDate())
                .workShift(mapWorkShiftInfo(overtimeRequest.getWorkShift()))
                .reason(overtimeRequest.getReason())
                .status(overtimeRequest.getStatus())
                .approvedBy(overtimeRequest.getApprovedBy() != null 
                    ? mapEmployeeBasicInfo(overtimeRequest.getApprovedBy()) 
                    : null)
                .approvedAt(overtimeRequest.getApprovedAt())
                .rejectedReason(overtimeRequest.getRejectedReason())
                .cancellationReason(overtimeRequest.getCancellationReason())
                .createdAt(overtimeRequest.getCreatedAt())
                .build();
    }

    /**
     * Convert OvertimeRequest entity to list response DTO.
     * Lighter version for paginated lists.
     */
    public OvertimeRequestListResponse toListResponse(OvertimeRequest overtimeRequest) {
        Employee employee = overtimeRequest.getEmployee();
        Employee requestedBy = overtimeRequest.getRequestedBy();
        WorkShift workShift = overtimeRequest.getWorkShift();

        return OvertimeRequestListResponse.builder()
                .requestId(overtimeRequest.getRequestId())
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFirstName() + " " + employee.getLastName())
                .workDate(overtimeRequest.getWorkDate())
                .workShiftId(workShift.getWorkShiftId())
                .shiftName(workShift.getShiftName())
                .status(overtimeRequest.getStatus())
                .requestedByName(requestedBy.getFirstName() + " " + requestedBy.getLastName())
                .createdAt(overtimeRequest.getCreatedAt())
                .build();
    }

    /**
     * Map Employee entity to basic info DTO.
     */
    private OvertimeRequestDetailResponse.EmployeeBasicInfo mapEmployeeBasicInfo(Employee employee) {
        if (employee == null) {
            return null;
        }
        return OvertimeRequestDetailResponse.EmployeeBasicInfo.builder()
                .employeeId(employee.getEmployeeId())
                .employeeCode(employee.getEmployeeCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .fullName(employee.getFirstName() + " " + employee.getLastName())
                .build();
    }

    /**
     * Map WorkShift entity to work shift info DTO.
     */
    private OvertimeRequestDetailResponse.WorkShiftInfo mapWorkShiftInfo(WorkShift workShift) {
        if (workShift == null) {
            return null;
        }
        return OvertimeRequestDetailResponse.WorkShiftInfo.builder()
                .workShiftId(workShift.getWorkShiftId())
                .shiftName(workShift.getShiftName())
                .startTime(workShift.getStartTime())
                .endTime(workShift.getEndTime())
                .durationHours(workShift.getDurationHours())
                .build();
    }
}
