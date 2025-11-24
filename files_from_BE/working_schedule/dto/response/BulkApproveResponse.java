package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for bulk approval operation.
 * Shows which registrations succeeded and which failed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkApproveResponse {
    
    /**
     * Total number of registrations requested to approve
     */
    private int totalRequested;
    
    /**
     * Number of registrations successfully approved
     */
    private int successCount;
    
    /**
     * Number of registrations that failed to approve
     */
    private int failureCount;
    
    /**
     * List of successfully approved registration IDs
     */
    private List<Integer> successfulIds;
    
    /**
     * List of failed approvals with reasons
     */
    private List<FailureDetail> failures;
    
    /**
     * Detail about a failed approval.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailureDetail {
        private Integer registrationId;
        private String reason;
    }
}
