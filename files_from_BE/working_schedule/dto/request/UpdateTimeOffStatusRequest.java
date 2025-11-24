package com.dental.clinic.management.working_schedule.dto.request;

import com.dental.clinic.management.working_schedule.enums.TimeOffStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request DTO for updating time-off request status (PATCH)
 * Used for APPROVE, REJECT, CANCEL actions
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTimeOffStatusRequest {

    @NotNull(message = "Status is required")
    private TimeOffStatus status;

    private String reason; // Required for REJECTED and CANCELLED

    @Override
    public String toString() {
        return "UpdateTimeOffStatusRequest{" +
                "status=" + status +
                ", reason='" + reason + '\'' +
                '}';
    }
}
