package com.dental.clinic.management.working_schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for work slot statistics.
 * Provides dashboard-style metrics for slot utilization.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotStatisticsResponse {
    
    /**
     * Total number of active work slots
     */
    private long totalActiveSlots;
    
    /**
     * Total number of inactive/deleted work slots
     */
    private long totalInactiveSlots;
    
    /**
     * Total approved registrations across all slots
     */
    private long totalApprovedRegistrations;
    
    /**
     * Total pending registrations across all slots
     */
    private long totalPendingRegistrations;
    
    /**
     * Total rejected registrations across all slots
     */
    private long totalRejectedRegistrations;
    
    /**
     * Total quota capacity across all active slots
     */
    private long totalQuotaCapacity;
    
    /**
     * Total available capacity (quota - approved registrations)
     */
    private long totalAvailableCapacity;
    
    /**
     * Average staffing percentage across all slots (how much of needed quota is filled)
     */
    private double averageStaffingPercentage;
    
    /**
     * Statistics per shift (morning, afternoon, evening)
     */
    private List<ShiftStatistics> shiftStatistics;
    
    /**
     * Statistics per day of week
     */
    private List<DayStatistics> dayStatistics;
    
    /**
     * Statistics for a specific shift.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShiftStatistics {
        private String shiftName;
        private long totalSlots;
        private long totalQuota;
        private long approvedRegistrations;
        private long availableCapacity;
        private double staffingPercentage;
    }
    
    /**
     * Statistics for a specific day of week.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayStatistics {
        private String dayOfWeek;
        private long totalSlots;
        private long totalQuota;
        private long approvedRegistrations;
        private long availableCapacity;
        private double staffingPercentage;
    }
}
