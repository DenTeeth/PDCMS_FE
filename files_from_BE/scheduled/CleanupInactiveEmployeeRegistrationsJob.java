package com.dental.clinic.management.scheduled;

import com.dental.clinic.management.employee.domain.Employee;
import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.working_schedule.repository.EmployeeShiftRepository;
import com.dental.clinic.management.working_schedule.repository.FixedShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Job P3: Cleanup Registrations for Inactive Employees
 * 
 * Purpose:
 * - When an employee is deactivated (is_active = false), their registrations should be deactivated
 * - This prevents inactive employees from appearing in schedules
 * 
 * Schedule: Daily at 00:20 AM (Asia/Ho_Chi_Minh)
 * Runs after:
 *   - Job P8 (UnifiedScheduleSyncJob) at 00:01 AM
 *   - Job P11 (CleanupExpiredFlexRegistrationsJob) at 00:15 AM
 * 
 * Actions:
 * 1. Find all inactive employees (is_active = false)
 * 2. Deactivate their Fixed registrations (fixed_shift_registrations)
 * 3. Deactivate their Flex registrations (part_time_registrations)
 * 4. Delete their future SCHEDULED shifts (employee_shifts where work_date >= TODAY)
 * 
 * Impact:
 * - Inactive employees won't appear in future schedules
 * - Historical data preserved (past shifts not deleted)
 * - Next sync job will not create new shifts for them
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CleanupInactiveEmployeeRegistrationsJob {

    private final EmployeeRepository employeeRepository;
    private final FixedShiftRegistrationRepository fixedRegistrationRepository;
    private final PartTimeRegistrationRepository partTimeRegistrationRepository;
    private final EmployeeShiftRepository employeeShiftRepository;

    /**
     * Cron Expression: "0 20 0 * * ?"
     * - Second: 0
     * - Minute: 20
     * - Hour: 0 (midnight)
     * - Day of month: * (every day)
     * - Month: * (every month)
     * - Day of week: ? (any)
     * 
     * Timezone: Asia/Ho_Chi_Minh
     * Execution: Daily at 00:20 AM
     */
    @Scheduled(cron = "0 20 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void cleanupInactiveEmployeeRegistrations() {
        log.info("========================================");
        log.info("Job P3: Starting cleanup of inactive employee registrations");
        log.info("========================================");

        try {
            // Step 1: Find all inactive employees
            List<Employee> inactiveEmployees = employeeRepository.findByIsActiveFalse();
            
            if (inactiveEmployees.isEmpty()) {
                log.info("✅ No inactive employees found. Nothing to cleanup.");
                return;
            }

            log.info("📋 Found {} inactive employees to process", inactiveEmployees.size());

            int totalFixedDeactivated = 0;
            int totalFlexDeactivated = 0;
            int totalShiftsDeleted = 0;

            LocalDate today = LocalDate.now();

            // Step 2: Process each inactive employee
            for (Employee employee : inactiveEmployees) {
                log.debug("Processing inactive employee: {} (ID: {})", 
                    employee.getFullName(), employee.getEmployeeId());

                // Step 2a: Deactivate Fixed registrations
                int fixedCount = fixedRegistrationRepository
                    .deactivateByEmployeeId(employee.getEmployeeId());
                totalFixedDeactivated += fixedCount;

                if (fixedCount > 0) {
                    log.debug("  ✅ Deactivated {} Fixed registration(s)", fixedCount);
                }

                // Step 2b: Deactivate Flex registrations
                int flexCount = partTimeRegistrationRepository
                    .deactivateByEmployeeId(employee.getEmployeeId());
                totalFlexDeactivated += flexCount;

                if (flexCount > 0) {
                    log.debug("  ✅ Deactivated {} Flex registration(s)", flexCount);
                }

                // Step 2c: Delete future SCHEDULED shifts (work_date >= TODAY)
                int shiftsCount = employeeShiftRepository
                    .deleteFutureScheduledShiftsByEmployeeId(employee.getEmployeeId(), today);
                totalShiftsDeleted += shiftsCount;

                if (shiftsCount > 0) {
                    log.debug("  ✅ Deleted {} future SCHEDULED shift(s)", shiftsCount);
                }
            }

            // Step 3: Summary
            log.info("========================================");
            log.info("✅ Job P3 Completed Successfully");
            log.info("📊 Summary:");
            log.info("   - Inactive employees processed: {}", inactiveEmployees.size());
            log.info("   - Fixed registrations deactivated: {}", totalFixedDeactivated);
            log.info("   - Flex registrations deactivated: {}", totalFlexDeactivated);
            log.info("   - Future SCHEDULED shifts deleted: {}", totalShiftsDeleted);
            log.info("========================================");

        } catch (Exception e) {
            log.error("❌ Job P3 Failed: Error cleaning up inactive employee registrations", e);
            log.error("Error details: {}", e.getMessage());
            throw e; // Re-throw to trigger rollback
        }
    }
}
