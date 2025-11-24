package com.dental.clinic.management.working_schedule.mapper;

import com.dental.clinic.management.working_schedule.domain.ShiftRenewalRequest;
import com.dental.clinic.management.working_schedule.dto.response.ShiftRenewalResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper for ShiftRenewalRequest entity.
 */
@Component
public class ShiftRenewalMapper {

    /**
     * Map ShiftRenewalRequest entity to response DTO.
     *
     * @param entity the entity
     * @return the response DTO
     */
    public ShiftRenewalResponse toResponse(ShiftRenewalRequest entity) {
        if (entity == null) {
            return null;
        }

        String shiftDetails = buildShiftDetails(entity);

        return ShiftRenewalResponse.builder()
                .renewalId(entity.getRenewalId())
                .expiringRegistrationId(entity.getExpiringRegistration().getRegistrationId())
                .employeeId(entity.getEmployee().getEmployeeId())
                .employeeName(entity.getEmployee().getFullName())
                .status(entity.getStatus())
                .expiresAt(entity.getExpiresAt())
                .confirmedAt(entity.getConfirmedAt())
                .createdAt(entity.getCreatedAt())
                .effectiveFrom(entity.getExpiringRegistration().getEffectiveFrom())
                .effectiveTo(entity.getExpiringRegistration().getEffectiveTo())
                .shiftDetails(shiftDetails)
                .declineReason(entity.getDeclineReason())
                .build();
    }

    /**
     * Build shift details string from registration days.
     * Example: "Monday, Wednesday, Friday - Morning Shift"
     *
     * @param entity the renewal request entity
     * @return formatted shift details
     */
    private String buildShiftDetails(ShiftRenewalRequest entity) {
        if (entity.getExpiringRegistration() == null ||
                entity.getExpiringRegistration().getRegistrationDays() == null ||
                entity.getExpiringRegistration().getRegistrationDays().isEmpty()) {
            return "N/A";
        }

        // Build details from FixedShiftRegistration's days
        String days = entity.getExpiringRegistration().getRegistrationDays().stream()
                .map(day -> day.getDayOfWeek().toString())
                .collect(java.util.stream.Collectors.joining(", "));

        String shiftName = entity.getExpiringRegistration().getWorkShift() != null
                ? entity.getExpiringRegistration().getWorkShift().getShiftName()
                : "Unknown Shift";

        return String.format("%s - %s", days, shiftName);
    }
}
