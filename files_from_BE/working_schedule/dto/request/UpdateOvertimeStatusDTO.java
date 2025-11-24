package com.dental.clinic.management.working_schedule.dto.request;

import com.dental.clinic.management.working_schedule.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating overtime request status (Approve/Reject/Cancel).
 * Used in PATCH /api/v1/overtime-requests/{request_id}
 * 
 * Business Rules:
 * - Can only update PENDING requests
 * - reason is required when status is REJECTED or CANCELLED
 * - Only specific statuses are allowed: APPROVED, REJECTED, CANCELLED
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOvertimeStatusDTO {

    @NotNull(message = "Status is required")
    private RequestStatus status;

    /**
     * Required when status is REJECTED or CANCELLED.
     * Should contain the reason for rejection or cancellation.
     */
    private String reason;
}
