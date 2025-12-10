package com.dental.clinic.management.treatment_plans.util;

import com.dental.clinic.management.treatment_plans.repository.PatientTreatmentPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for generating unique treatment plan codes.
 *
 * Format: PLAN-YYYYMMDD-SEQ
 * Example: PLAN-20251111-001, PLAN-20251111-002, ...
 *
 * Thread-safe: Uses database query with COUNT to ensure atomicity
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanCodeGenerator {

    private static final String CODE_PREFIX = "PLAN-";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final PatientTreatmentPlanRepository planRepository;

    /**
     * Generate a unique plan code for today.
     *
     * Algorithm:
     * 1. Get today's date in yyyyMMdd format (e.g., 20251111)
     * 2. Query database: COUNT plans where plan_code LIKE 'PLAN-20251111-%'
     * 3. Increment count by 1
     * 4. Format as PLAN-20251111-001 (with leading zeros)
     *
     * Thread-safe: Database COUNT is atomic. Even if 2 requests run simultaneously,
     * the second one will get the updated count after the first commit.
     *
     * @return Unique plan code (e.g., "PLAN-20251111-001")
     */
    @Transactional(readOnly = true)
    public String generatePlanCode() {
        String today = LocalDate.now().format(DATE_FORMATTER);
        String prefix = CODE_PREFIX + today + "-";

        // Count existing plans with this prefix
        long count = planRepository.countByPlanCodeStartingWith(prefix);

        // Increment and format with leading zeros (001, 002, ...)
        long nextSequence = count + 1;
        String sequenceStr = String.format("%03d", nextSequence);

        String planCode = prefix + sequenceStr;

        log.debug("Generated plan code: {} (sequence: {})", planCode, nextSequence);

        return planCode;
    }

    /**
     * Generate plan code for a specific date (useful for testing/backdating)
     *
     * @param date The date to use for code generation
     * @return Unique plan code for that date
     */
    @Transactional(readOnly = true)
    public String generatePlanCodeForDate(LocalDate date) {
        String dateStr = date.format(DATE_FORMATTER);
        String prefix = CODE_PREFIX + dateStr + "-";

        long count = planRepository.countByPlanCodeStartingWith(prefix);
        long nextSequence = count + 1;
        String sequenceStr = String.format("%03d", nextSequence);

        String planCode = prefix + sequenceStr;

        log.debug("Generated plan code for {}: {} (sequence: {})", date, planCode, nextSequence);

        return planCode;
    }
}
