package com.dental.clinic.management.treatment_plans.dto.request;

import com.dental.clinic.management.treatment_plans.domain.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for API 5.9: Approve/Reject Treatment Plan
 * Used by managers to approve or reject a treatment plan in PENDING_REVIEW
 * status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveTreatmentPlanRequest {

    /**
     * New approval status: APPROVED or REJECTED
     */
    @NotNull(message = "Trạng thái duyệt không được để trống")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Trạng thái duyệt phải là APPROVED hoặc REJECTED")
    private String approvalStatus;

    /**
     * Notes from the approver (mandatory if REJECTED)
     * Will be validated in service layer based on approval status
     */
    private String notes;

    /**
     * Convert string to ApprovalStatus enum
     */
    public ApprovalStatus getApprovalStatusEnum() {
        return ApprovalStatus.valueOf(this.approvalStatus);
    }

    /**
     * Check if this is a rejection request
     */
    public boolean isRejection() {
        return "REJECTED".equals(this.approvalStatus);
    }

    /**
     * Check if this is an approval request
     */
    public boolean isApproval() {
        return "APPROVED".equals(this.approvalStatus);
    }
}
