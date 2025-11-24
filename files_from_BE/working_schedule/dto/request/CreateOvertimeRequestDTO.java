package com.dental.clinic.management.working_schedule.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for creating a new overtime request.
 * The request_id and requested_by are auto-generated from the authenticated user.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOvertimeRequestDTO {

    // Optional for employee creating their own request (will be auto-filled from JWT)
    // Required for admin creating request for another employee
    private Integer employeeId;

    @NotNull(message = "Work date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate workDate;

    @NotBlank(message = "Work shift ID is required")
    private String workShiftId;

    @NotBlank(message = "Reason is required")
    private String reason;
    
    /**
     * Constructor for employee self-request (no employeeId needed)
     */
    public CreateOvertimeRequestDTO(LocalDate workDate, String workShiftId, String reason) {
        this.workDate = workDate;
        this.workShiftId = workShiftId;
        this.reason = reason;
    }
}
