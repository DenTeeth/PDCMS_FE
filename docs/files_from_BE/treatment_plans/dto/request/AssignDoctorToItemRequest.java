package com.dental.clinic.management.treatment_plans.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for assigning doctor to treatment plan item
 * Use case: When organizing phases or preparing for appointment scheduling
 * Business rules:
 * - Doctor must exist and be active
 * - Doctor must have required specialization for item's service
 * - Item must exist and belong to a valid treatment plan
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignDoctorToItemRequest {

    /**
     * Employee code of doctor to assign
     * Example: "EMP001", "BS-HOAN"
     */
    @NotBlank(message = "Doctor code is required")
    private String doctorCode;

    /**
     * Optional reason for assignment/reassignment
     * Example: "Doctor specializes in implants", "Original doctor on leave"
     */
    private String notes;
}
