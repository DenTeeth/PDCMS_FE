package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTimeOffTypeRequest {

    @NotBlank(message = "typeName is required")
    private String typeName;

    @NotBlank(message = "typeCode is required")
    private String typeCode;

    private String description;

    @NotNull(message = "requiresBalance is required")
    private Boolean requiresBalance;

    private Double defaultDaysPerYear;

    @NotNull(message = "isPaid is required")
    private Boolean isPaid;

    @Builder.Default
    private Boolean requiresApproval = true;

    @Builder.Default
    private Boolean isActive = true;
}
