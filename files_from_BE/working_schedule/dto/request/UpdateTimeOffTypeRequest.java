package com.dental.clinic.management.working_schedule.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Update request for TimeOffType - All fields are optional
 * Only send the fields you want to update
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTimeOffTypeRequest {

    private String typeName;

    private String typeCode;

    private String description;

    private Boolean requiresBalance;

    private Double defaultDaysPerYear;

    private Boolean isPaid;

    private Boolean requiresApproval;

    private Boolean isActive;
}
