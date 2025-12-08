package com.dental.clinic.management.scheduled;

import com.dental.clinic.management.working_schedule.domain.PartTimeRegistration;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Job P11: Auto-deactivate expired Part-Time Flex registrations.
 *
 *  CRITICAL BUG FIX 
 *
 * Schema V14 Hybrid - Luồng 2: Lịch Linh hoạt (Part-Time FLEX)
 *
 * PROBLEM:
 * - Part-Time Flex employees register (claim) slots with effective_to = 3
 * months later
 * - After 3 months, effective_to is in the past, BUT is_active is still TRUE
 * - Job P8 correctly stops creating employee_shifts for them
 * - BUT API GET /api/v1/work-slots incorrectly counts them as "registered"
 * - Result: Slots appear FULL when they actually have available spots
 *
 * SOLUTION:
 * - Find all part_time_registrations with:
 * * is_active = true
 * * effective_to < CURRENT_DATE
 * - Set is_active = false (deactivate expired registrations)
 *
 * SQL Equivalent:
 * UPDATE part_time_registrations
 * SET is_active = false
 * WHERE effective_to < CURRENT_DATE AND is_active = true
 *
 * IMPACT:
 * - API GET /api/v1/work-slots now returns correct available spots
 * - Part-time employees can claim slots that were "ghost occupied"
 *
 * Runs daily at 00:15 AM (after P8, P9, P10 complete).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class CleanupExpiredFlexRegistrationsJob {

    private final PartTimeRegistrationRepository registrationRepository;

    /**
     * Cron: 0 15 0 * * ?
     * - Runs at 00:15 AM every day
     * - Format: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 15 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void cleanupExpiredRegistrations() {
        log.info("=== Starting Cleanup Expired Flex Registrations Job (P11) ===");

        LocalDate today = LocalDate.now();

        log.info("Looking for expired Part-Time Flex registrations in 'part_time_registrations' (effective_to < {})",
                today);

        try {
            // Find all active registrations that have already expired
            // Query: SELECT * FROM part_time_registrations
            // WHERE is_active = true AND effective_to < CURRENT_DATE
            List<PartTimeRegistration> expiredRegistrations = registrationRepository
                    .findByIsActiveAndEffectiveToLessThan(true, today);

            log.info("Found {} expired Part-Time Flex registrations still marked as active",
                    expiredRegistrations.size());

            if (expiredRegistrations.isEmpty()) {
                log.info("No expired registrations found. Job completed successfully.");
                return;
            }

            // Deactivate each expired registration
            int deactivatedCount = 0;
            int failedCount = 0;

            for (PartTimeRegistration registration : expiredRegistrations) {
                try {
                    // Log for audit trail
                    log.info("Deactivating expired Flex registration: {} (Employee ID: {}, Slot ID: {}, Expired: {})",
                            registration.getRegistrationId(),
                            registration.getEmployeeId(),
                            registration.getPartTimeSlotId(),
                            registration.getEffectiveTo());

                    // Set is_active = false + update timestamp
                    registration.setIsActive(false);
                    registration.setUpdatedAt(LocalDateTime.now());
                    registrationRepository.save(registration);

                    deactivatedCount++;

                } catch (Exception e) {
                    log.error("Failed to deactivate registration {}: {}",
                            registration.getRegistrationId(), e.getMessage(), e);
                    failedCount++;
                }
            }

            log.info("=== Cleanup Expired Flex Registrations Job Completed ===");
            log.info("Total expired registrations found: {}", expiredRegistrations.size());
            log.info("Successfully deactivated: {}", deactivatedCount);
            log.info("Failed to deactivate: {}", failedCount);

            if (deactivatedCount > 0) {
                log.warn("ACTION: {} Part-Time Flex registrations were auto-deactivated. " +
                        "These slots are now available for new registrations.", deactivatedCount);
            }

        } catch (Exception e) {
            log.error("CRITICAL ERROR in Cleanup Expired Flex Registrations Job", e);
        }
    }

    /**
     * Get the last run time (for monitoring/health checks).
     * Can be used by admin dashboard to verify job is running.
     */
    private java.time.LocalDateTime lastRunTime;

    public java.time.LocalDateTime getLastRunTime() {
        return lastRunTime;
    }
}
