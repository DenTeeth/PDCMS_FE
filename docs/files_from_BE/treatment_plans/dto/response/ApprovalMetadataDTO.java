package com.dental.clinic.management.treatment_plans.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Approval metadata for treatment plan response (V20)
 * Contains information about who approved/rejected and when
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalMetadataDTO {

    /**
     * Employee who approved/rejected the plan
     */
    private EmployeeBasicDTO approvedBy;

    /**
     * When the plan was approved/rejected
     */
    private LocalDateTime approvedAt;

    /**
     * Approval/rejection notes
     */
    private String notes;

    /**
     * Basic employee info for approval metadata
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeeBasicDTO {
        private String employeeCode;
        private String fullName;
    }
}
