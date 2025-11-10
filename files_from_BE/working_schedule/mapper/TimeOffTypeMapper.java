package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.working_schedule.domain.TimeOffType;
import com.dental.clinic.management.working_schedule.dto.response.TimeOffTypeResponse;

import org.springframework.stereotype.Component;

/**
 * Mapper for TimeOffType entity <-> DTO conversions
 */
@Component
public class TimeOffTypeMapper {

    /**
     * Convert TimeOffType entity to TimeOffTypeResponse DTO
     */
    public TimeOffTypeResponse toResponse(TimeOffType entity) {
        if (entity == null) {
            return null;
        }

        return TimeOffTypeResponse.builder()
                .typeId(entity.getTypeId())
                .typeCode(entity.getTypeCode())
                .typeName(entity.getTypeName())
                .description(entity.getDescription())
                .requiresBalance(entity.getRequiresBalance())
                .defaultDaysPerYear(entity.getDefaultDaysPerYear())
                .isPaid(entity.getIsPaid())
                .requiresApproval(entity.getRequiresApproval())
                .isActive(entity.getIsActive())
                .build();
    }
}
