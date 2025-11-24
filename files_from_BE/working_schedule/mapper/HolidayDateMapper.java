package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.working_schedule.domain.HolidayDate;
import com.dental.clinic.management.working_schedule.dto.request.HolidayDateRequest;
import com.dental.clinic.management.working_schedule.dto.response.HolidayDateResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for HolidayDate entity and DTOs.
 */
@Component
public class HolidayDateMapper {

    /**
     * Map request DTO to entity.
     */
    public HolidayDate toEntity(HolidayDateRequest request) {
        if (request == null) {
            return null;
        }

        HolidayDate holidayDate = new HolidayDate();
        holidayDate.setHolidayDate(request.getHolidayDate());
        holidayDate.setDefinitionId(request.getDefinitionId());
        holidayDate.setDescription(request.getDescription());

        return holidayDate;
    }

    /**
     * Map entity to response DTO.
     */
    public HolidayDateResponse toResponse(HolidayDate holidayDate) {
        if (holidayDate == null) {
            return null;
        }

        HolidayDateResponse response = new HolidayDateResponse();
        response.setHolidayDate(holidayDate.getHolidayDate());
        response.setDefinitionId(holidayDate.getDefinitionId());
        response.setDescription(holidayDate.getDescription());
        response.setCreatedAt(holidayDate.getCreatedAt());
        response.setUpdatedAt(holidayDate.getUpdatedAt());

        // Get holiday name from definition if available
        if (holidayDate.getHolidayDefinition() != null) {
            response.setHolidayName(holidayDate.getHolidayDefinition().getHolidayName());
        }

        return response;
    }

    /**
     * Update entity from request DTO (for PUT operations).
     */
    public void updateEntity(HolidayDate holidayDate, HolidayDateRequest request) {
        if (holidayDate == null || request == null) {
            return;
        }

        holidayDate.setDescription(request.getDescription());
        // Note: holidayDate and definitionId are immutable (composite PK)
    }
}
