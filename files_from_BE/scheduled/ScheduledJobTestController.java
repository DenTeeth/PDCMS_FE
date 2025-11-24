package com.dental.clinic.management.scheduled;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

import static com.dental.clinic.management.utils.security.AuthoritiesConstants.ADMIN;

/**
 * Test Controller for Manually Triggering Scheduled Jobs
 * 
 * ⚠️ WARNING: For TESTING/DEVELOPMENT ONLY
 * These endpoints allow manual execution of cron jobs that normally run automatically.
 * 
 * Security: Only accessible by ADMIN role
 * 
 * Available Jobs:
 * - Job P8 (UnifiedScheduleSyncJob): Sync schedules for next 14 days
 * - Job P11 (CleanupExpiredFlexRegistrationsJob): Cleanup expired flex registrations
 * - Job P3 (CleanupInactiveEmployeeRegistrationsJob): Cleanup inactive employee registrations
 * - Job P4 (DailyRenewalDetectionJob): Detect renewal requests
 * - Job P5 (ExpirePendingRenewalsJob): Expire pending renewals
 */
@RestController
@RequestMapping("/api/v1/admin/test/scheduled-jobs")
@RequiredArgsConstructor
@Slf4j
public class ScheduledJobTestController {

    private final UnifiedScheduleSyncJob unifiedScheduleSyncJob;
    private final CleanupExpiredFlexRegistrationsJob cleanupExpiredFlexRegistrationsJob;
    private final CleanupInactiveEmployeeRegistrationsJob cleanupInactiveEmployeeRegistrationsJob;

    /**
     * Manually trigger Job P8: Unified Schedule Sync Job
     * 
     * This is the MOST IMPORTANT job - syncs Fixed & Flex registrations to employee_shifts
     * for the next 14 days.
     * 
     * Normal schedule: Daily at 00:01 AM
     * 
     * GET /api/v1/admin/test/scheduled-jobs/trigger-sync
     */
    @GetMapping("/trigger-sync")
    @PreAuthorize("hasRole('" + ADMIN + "')")
    public ResponseEntity<Map<String, Object>> triggerUnifiedScheduleSync() {
        log.warn("⚠️ MANUAL TRIGGER: UnifiedScheduleSyncJob triggered by admin");
        
        long startTime = System.currentTimeMillis();
        try {
            unifiedScheduleSyncJob.syncSchedules();
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Job P8 (UnifiedScheduleSyncJob) executed successfully");
            response.put("jobName", "UnifiedScheduleSyncJob");
            response.put("normalSchedule", "Daily at 00:01 AM");
            response.put("executionTimeMs", duration);
            response.put("action", "Synced schedules for next 14 days from Fixed & Flex registrations");
            
            log.info("✅ Manual job execution completed in {}ms", duration);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error executing UnifiedScheduleSyncJob manually", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Job execution failed: " + e.getMessage());
            response.put("jobName", "UnifiedScheduleSyncJob");
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Manually trigger Job P11: Cleanup Expired Flex Registrations
     * 
     * Deactivates part_time_registrations with effective_to < CURRENT_DATE
     * 
     * Normal schedule: Daily at 00:15 AM
     * 
     * GET /api/v1/admin/test/scheduled-jobs/trigger-cleanup-flex
     */
    @GetMapping("/trigger-cleanup-flex")
    @PreAuthorize("hasRole('" + ADMIN + "')")
    public ResponseEntity<Map<String, Object>> triggerCleanupExpiredFlex() {
        log.warn("⚠️ MANUAL TRIGGER: CleanupExpiredFlexRegistrationsJob triggered by admin");
        
        long startTime = System.currentTimeMillis();
        try {
            cleanupExpiredFlexRegistrationsJob.cleanupExpiredRegistrations();
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Job P11 (CleanupExpiredFlexRegistrationsJob) executed successfully");
            response.put("jobName", "CleanupExpiredFlexRegistrationsJob");
            response.put("normalSchedule", "Daily at 00:15 AM");
            response.put("executionTimeMs", duration);
            response.put("action", "Deactivated expired part-time flex registrations");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error executing CleanupExpiredFlexRegistrationsJob manually", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Job execution failed: " + e.getMessage());
            response.put("jobName", "CleanupExpiredFlexRegistrationsJob");
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Manually trigger Job P3: Cleanup Inactive Employee Registrations
     * 
     * Deactivates all registrations (Fixed & Flex) for employees with is_active = false
     * 
     * Normal schedule: Daily at 00:20 AM
     * 
     * GET /api/v1/admin/test/scheduled-jobs/trigger-cleanup-inactive
     */
    @GetMapping("/trigger-cleanup-inactive")
    @PreAuthorize("hasRole('" + ADMIN + "')")
    public ResponseEntity<Map<String, Object>> triggerCleanupInactiveEmployees() {
        log.warn("⚠️ MANUAL TRIGGER: CleanupInactiveEmployeeRegistrationsJob triggered by admin");
        
        long startTime = System.currentTimeMillis();
        try {
            cleanupInactiveEmployeeRegistrationsJob.cleanupInactiveEmployeeRegistrations();
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Job P3 (CleanupInactiveEmployeeRegistrationsJob) executed successfully");
            response.put("jobName", "CleanupInactiveEmployeeRegistrationsJob");
            response.put("normalSchedule", "Daily at 00:20 AM");
            response.put("executionTimeMs", duration);
            response.put("action", "Cleaned up registrations for inactive employees");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error executing CleanupInactiveEmployeeRegistrationsJob manually", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Job execution failed: " + e.getMessage());
            response.put("jobName", "CleanupInactiveEmployeeRegistrationsJob");
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Manually trigger ALL main jobs in sequence (P8 → P11 → P3)
     * 
     * Executes all critical schedule sync and cleanup jobs in the correct order.
     * 
     * GET /api/v1/admin/test/scheduled-jobs/trigger-all
     */
    @GetMapping("/trigger-all")
    @PreAuthorize("hasRole('" + ADMIN + "')")
    public ResponseEntity<Map<String, Object>> triggerAllMainJobs() {
        log.warn("⚠️ MANUAL TRIGGER: Executing ALL main scheduled jobs in sequence");
        
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> results = new HashMap<>();
        long totalStartTime = System.currentTimeMillis();
        
        try {
            // Job P8: Unified Schedule Sync (00:01 AM)
            log.info("▶ Step 1/3: Running UnifiedScheduleSyncJob...");
            long start = System.currentTimeMillis();
            unifiedScheduleSyncJob.syncSchedules();
            results.put("job_P8_UnifiedScheduleSync", Map.of(
                "status", "success",
                "executionTimeMs", System.currentTimeMillis() - start
            ));
            
            // Job P11: Cleanup Expired Flex (00:15 AM)
            log.info("▶ Step 2/3: Running CleanupExpiredFlexRegistrationsJob...");
            start = System.currentTimeMillis();
            cleanupExpiredFlexRegistrationsJob.cleanupExpiredRegistrations();
            results.put("job_P11_CleanupExpiredFlex", Map.of(
                "status", "success",
                "executionTimeMs", System.currentTimeMillis() - start
            ));
            
            // Job P3: Cleanup Inactive Employees (00:20 AM)
            log.info("▶ Step 3/3: Running CleanupInactiveEmployeeRegistrationsJob...");
            start = System.currentTimeMillis();
            cleanupInactiveEmployeeRegistrationsJob.cleanupInactiveEmployeeRegistrations();
            results.put("job_P3_CleanupInactiveEmployees", Map.of(
                "status", "success",
                "executionTimeMs", System.currentTimeMillis() - start
            ));
            
            long totalDuration = System.currentTimeMillis() - totalStartTime;
            
            response.put("success", true);
            response.put("message", "All main scheduled jobs executed successfully");
            response.put("executionOrder", "P8 → P11 → P3");
            response.put("totalExecutionTimeMs", totalDuration);
            response.put("results", results);
            
            log.info("✅ All jobs completed in {}ms", totalDuration);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error executing scheduled jobs sequence", e);
            
            response.put("success", false);
            response.put("message", "Job sequence failed: " + e.getMessage());
            response.put("error", e.getMessage());
            response.put("partialResults", results);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get list of all available test endpoints
     * 
     * GET /api/v1/admin/test/scheduled-jobs/list
     */
    @GetMapping("/list")
    @PreAuthorize("hasRole('" + ADMIN + "')")
    public ResponseEntity<Map<String, Object>> listAvailableJobs() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("title", "Scheduled Jobs Test Endpoints");
        response.put("warning", "⚠️ These endpoints are for TESTING/DEVELOPMENT only");
        response.put("security", "Only accessible by ADMIN role");
        
        Map<String, Object> endpoints = new HashMap<>();
        
        endpoints.put("GET /api/v1/admin/test/scheduled-jobs/trigger-sync", Map.of(
            "job", "Job P8: UnifiedScheduleSyncJob",
            "schedule", "Daily at 00:01 AM",
            "description", "Sync Fixed & Flex registrations to employee_shifts for next 14 days"
        ));
        
        endpoints.put("GET /api/v1/admin/test/scheduled-jobs/trigger-cleanup-flex", Map.of(
            "job", "Job P11: CleanupExpiredFlexRegistrationsJob",
            "schedule", "Daily at 00:15 AM",
            "description", "Deactivate expired part-time flex registrations"
        ));
        
        endpoints.put("GET /api/v1/admin/test/scheduled-jobs/trigger-cleanup-inactive", Map.of(
            "job", "Job P3: CleanupInactiveEmployeeRegistrationsJob",
            "schedule", "Daily at 00:20 AM",
            "description", "Cleanup registrations for inactive employees"
        ));
        
        endpoints.put("GET /api/v1/admin/test/scheduled-jobs/trigger-all", Map.of(
            "job", "ALL Main Jobs (P8 → P11 → P3)",
            "schedule", "Sequential execution",
            "description", "Run all critical jobs in correct order"
        ));
        
        response.put("endpoints", endpoints);
        
        return ResponseEntity.ok(response);
    }
}
