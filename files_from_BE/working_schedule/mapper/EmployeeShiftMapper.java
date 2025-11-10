package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.account.repository.AccountRepository;
import com.dental.clinic.management.working_schedule.domain.EmployeeShift;
import com.dental.clinic.management.working_schedule.dto.response.EmployeeShiftResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Mapper for EmployeeShift entity to DTOs.
 */
@Component
@RequiredArgsConstructor
public class EmployeeShiftMapper {

    private final AccountRepository accountRepository;

    /**
     * Convert EmployeeShift entity to response DTO.
     * 
     * @param shift employee shift entity
     * @return response DTO
     */
    public EmployeeShiftResponseDto toResponseDto(EmployeeShift shift) {
        if (shift == null) {
            return null;
        }

        // Fetch creator name
        String createdByName = null;
        if (shift.getCreatedBy() != null) {
            createdByName = accountRepository.findById(shift.getCreatedBy())
                    .map(account -> {
                        if (account.getEmployee() != null) {
                            return account.getEmployee().getFullName();
                        }
                        return account.getUsername();
                    })
                    .orElse("Unknown");
        }

        return EmployeeShiftResponseDto.builder()
                .employeeShiftId(shift.getEmployeeShiftId())
                .employee(mapEmployeeBasic(shift))
                .workDate(shift.getWorkDate())
                .workShift(mapWorkShiftBasic(shift))
                .source(shift.getSource())
                .status(shift.getStatus())
                .isOvertime(shift.getIsOvertime())
                .createdBy(shift.getCreatedBy())
                .createdByName(createdByName)
                .sourceOtRequestId(shift.getSourceOtRequestId())
                .sourceOffRequestId(shift.getSourceOffRequestId())
                .notes(shift.getNotes())
                .createdAt(shift.getCreatedAt())
                .updatedAt(shift.getUpdatedAt())
                .build();
    }

    /**
     * Map employee basic information.
     */
    private EmployeeShiftResponseDto.EmployeeBasicDto mapEmployeeBasic(EmployeeShift shift) {
        if (shift.getEmployee() == null) {
            return null;
        }

        return EmployeeShiftResponseDto.EmployeeBasicDto.builder()
                .employeeId(shift.getEmployee().getEmployeeId())
                .fullName(shift.getEmployee().getFullName())
                .position(shift.getEmployee().getEmploymentType() != null 
                        ? shift.getEmployee().getEmploymentType().name() 
                        : null)
                .build();
    }

    /**
     * Map work shift basic information.
     */
    private EmployeeShiftResponseDto.WorkShiftBasicDto mapWorkShiftBasic(EmployeeShift shift) {
        if (shift.getWorkShift() == null) {
            return null;
        }

        return EmployeeShiftResponseDto.WorkShiftBasicDto.builder()
                .workShiftId(shift.getWorkShift().getWorkShiftId())
                .shiftName(shift.getWorkShift().getShiftName())
                .startTime(shift.getWorkShift().getStartTime() != null 
                        ? shift.getWorkShift().getStartTime().toString() 
                        : null)
                .endTime(shift.getWorkShift().getEndTime() != null 
                        ? shift.getWorkShift().getEndTime().toString() 
                        : null)
                .build();
    }
}
