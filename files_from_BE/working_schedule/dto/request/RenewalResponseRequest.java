package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Employee can CONFIRM (accept renewal) or DECLINE (reject with reason).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RenewalResponseRequest {

    @NotBlank(message = "Action is required")
    @Pattern(regexp = "CONFIRMED|DECLINED", message = "Action must be either CONFIRMED or DECLINED")
    private String action; // "CONFIRMED" or "DECLINED"

    /**
     * Required when action = "DECLINED", optional when action = "CONFIRMED".
     * Validation is done in service layer (cannot use @NotNull here due to
     * conditional requirement).
     */
    private String declineReason;
}
