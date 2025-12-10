package com.dental.clinic.management.treatment_plans.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Doctor information DTO for treatment plan responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorInfoDTO {
    private String employeeCode;
    private String fullName;
}
