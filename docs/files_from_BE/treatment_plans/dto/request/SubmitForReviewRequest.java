package com.dental.clinic.management.treatment_plans.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for API 5.12: Submit Treatment Plan for Review
 * Used by doctors to submit a completed DRAFT plan to managers for approval.
 *
 * Business Rules:
 * - Plan must be in DRAFT status
 * - Plan must have at least 1 phase and 1 item
 * - Changes plan status from DRAFT → PENDING_REVIEW
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitForReviewRequest {

    /**
     * Optional notes from the doctor submitting the plan
     * Can be used to provide context or highlight important information for the
     * reviewer
     *
     * Example: "Gửi duyệt lộ trình điều trị cho bệnh nhân, ưu tiên xử lý giai đoạn
     * 1"
     */
    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String notes;
}
