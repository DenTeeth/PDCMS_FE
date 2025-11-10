package com.dental.clinic.management.working_schedule.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for approving or rejecting a part-time registration.
 * 
 * Used by managers in: PATCH /api/v1/admin/registrations/part-time-flex/{id}/status
 * 
 * Example (Approve):
 * {
 *   "status": "APPROVED"
 * }
 * 
 * Example (Reject):
 * {
 *   "status": "REJECTED",
 *   "reason": "Không đủ nhân sự trong thời gian này"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRegistrationStatusRequest {

    /**
     * New status: "APPROVED" or "REJECTED"
     * PENDING is not allowed (can't revert to pending).
     */
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Status must be either APPROVED or REJECTED")
    private String status;

    /**
     * Rejection reason (REQUIRED if status = REJECTED).
     * Example: "Đã đủ nhân sự cho ca này"
     */
    private String reason;
}
