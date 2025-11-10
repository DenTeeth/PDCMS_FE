package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.working_schedule.domain.HolidayDefinition;
import com.dental.clinic.management.working_schedule.dto.request.HolidayDefinitionRequest;
import com.dental.clinic.management.working_schedule.dto.response.HolidayDefinitionResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for HolidayDefinition entity and DTOs.
 */
@Component
public class HolidayDefinitionMapper {

    /**
     * Map request DTO to entity.
     */
    public HolidayDefinition toEntity(HolidayDefinitionRequest request) {
        if (request == null) {
            return null;
        }

        HolidayDefinition definition = new HolidayDefinition();
        definition.setDefinitionId(request.getDefinitionId());
        definition.setHolidayName(request.getHolidayName());
        definition.setHolidayType(request.getHolidayType());
        definition.setDescription(request.getDescription());

        return definition;
    }

    /**
     * Map entity to response DTO.
     */
    public HolidayDefinitionResponse toResponse(HolidayDefinition definition) {
        if (definition == null) {
            return null;
        }

        HolidayDefinitionResponse response = new HolidayDefinitionResponse();
        response.setDefinitionId(definition.getDefinitionId());
        response.setHolidayName(definition.getHolidayName());
        response.setHolidayType(definition.getHolidayType());
        response.setDescription(definition.getDescription());
        response.setCreatedAt(definition.getCreatedAt());
        response.setUpdatedAt(definition.getUpdatedAt());
        response.setTotalDates(definition.getHolidayDates() != null ? 
                                definition.getHolidayDates().size() : 0);

        return response;
    }

    /**
     * Update entity from request DTO (for PUT operations).
     */
    public void updateEntity(HolidayDefinition definition, HolidayDefinitionRequest request) {
        if (definition == null || request == null) {
            return;
        }

        definition.setHolidayName(request.getHolidayName());
        definition.setHolidayType(request.getHolidayType());
        definition.setDescription(request.getDescription());
        // Note: definitionId is immutable (part of PK)
    }
}
