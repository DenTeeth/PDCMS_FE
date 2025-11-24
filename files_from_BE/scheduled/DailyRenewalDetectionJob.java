package com.dental.clinic.management.scheduled;

import com.dental.clinic.management.working_schedule.domain.FixedShiftRegistration;
import com.dental.clinic.management.working_schedule.enums.RenewalStatus;
import com.dental.clinic.management.working_schedule.repository.FixedShiftRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.ShiftRenewalRequestRepository;
import com.dental.clinic.management.working_schedule.service.ShiftRenewalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Job P9: Auto-detect expiring FIXED shift registrations and create renewal
 * requests.
 *
 * Runs daily at 00:05 AM (after P8 sync job completes).
 * Finds FIXED registrations (FULL_TIME/PART_TIME_FIXED) expiring in 14-28 days
 * and creates renewal invitations.
 *
 * IMPROVEMENTS from old Job 3:
 * - Window changed from 7 days to 14-28 days (more time for employee response)
 * - Added NOT EXISTS check to prevent duplicate renewal requests
 * - Runs after P8 sync for better data consistency
 *
 * NOTE: Part-Time Flex registrations don't need renewal - they expire
 * automatically (handled by P11).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DailyRenewalDetectionJob {

    private final FixedShiftRegistrationRepository registrationRepository;
    private final ShiftRenewalRequestRepository renewalRepository;
    private final ShiftRenewalService renewalService;

    // Window: Find registrations expiring in 14-28 days
    // This gives employees 14 days to respond before expiration
    private static final int RENEWAL_WINDOW_START_DAYS = 14;
    private static final int RENEWAL_WINDOW_END_DAYS = 28;

    /**
     * Cron: 0 5 0 * * ?
     * - Runs at 00:05 AM every day (5 minutes after P8)
     * - Format: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 5 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void detectExpiringRegistrations() {
        log.info("=== Starting Daily Renewal Detection Job (P9) ===");

        LocalDate today = LocalDate.now();
        LocalDate windowStart = today.plusDays(RENEWAL_WINDOW_START_DAYS);
        LocalDate windowEnd = today.plusDays(RENEWAL_WINDOW_END_DAYS);

        log.info("Looking for FIXED registrations expiring between: {} and {}",
                windowStart, windowEnd);

        try {
            // VALIDATION: Check if registration repository is accessible
            long totalRegistrations = registrationRepository.count();
            log.info("Validation passed: {} total FIXED registrations in database", totalRegistrations);

            if (totalRegistrations == 0) {
                log.info("No FIXED registrations found in database. Job completed with no actions.");
                return;
            }

            // Find FIXED registrations expiring in the window (14-28 days from now)
            List<FixedShiftRegistration> expiringRegistrations = registrationRepository
                    .findByEffectiveToRange(windowStart, windowEnd, true);

            log.info("Found {} FIXED registrations expiring in window [{} to {}]",
                    expiringRegistrations.size(), windowStart, windowEnd);

            if (expiringRegistrations.isEmpty()) {
                log.info("No expiring FIXED registrations found. Job completed successfully.");
                return;
            }

            // 2. Create renewal requests for each
            int renewalsCreated = 0;
            int skippedAlreadyExists = 0;
            int skippedDueToErrors = 0;

            for (FixedShiftRegistration registration : expiringRegistrations) {
                try {
                    // VALIDATION: Check if registration has valid ID
                    Integer registrationId = registration.getRegistrationId();
                    if (registrationId == null) {
                        log.warn("Registration has invalid ID. Skipping.");
                        skippedDueToErrors++;
                        continue;
                    }

                    // VALIDATION: Check if employee exists
                    if (registration.getEmployee() == null || registration.getEmployee().getEmployeeId() == null) {
                        log.warn("Registration {} has no employee. Skipping.", registrationId);
                        skippedDueToErrors++;
                        continue;
                    }

                    // Check if renewal already exists
                    boolean alreadyExists = renewalRepository.existsByExpiringRegistrationRegistrationIdAndStatus(
                            registrationId,
                            RenewalStatus.PENDING_ACTION);

                    if (alreadyExists) {
                        log.debug("Renewal already exists for registration {}. Skipping.", registrationId);
                        skippedAlreadyExists++;
                        continue;
                    }

                    // Create renewal request
                    renewalService.createRenewalRequest(registrationId);
                    renewalsCreated++;

                    log.info("Created renewal request for FIXED registration {} (Employee ID: {})",
                            registrationId, registration.getEmployee().getEmployeeId());

                } catch (Exception e) {
                    log.error("Failed to create renewal for registration {}: {}",
                            registration.getRegistrationId(), e.getMessage(), e);
                    skippedDueToErrors++;
                }
            }

            log.info("=== Daily Renewal Detection Job Completed ===");
            log.info("Total expiring registrations: {}", expiringRegistrations.size());
            log.info("Renewals created: {}", renewalsCreated);
            log.info("Skipped (already exists): {}", skippedAlreadyExists);
            log.info("Skipped (errors): {}", skippedDueToErrors);

        } catch (Exception e) {
            log.error("Error in Daily Renewal Detection Job", e);
            throw new RuntimeException("Failed to detect expiring registrations", e);
        }
    }
}
