package com.dental.clinic.management.scheduled;

import com.dental.clinic.management.employee.repository.EmployeeRepository;
import com.dental.clinic.management.utils.IdGenerator;
import com.dental.clinic.management.working_schedule.domain.*;
import com.dental.clinic.management.working_schedule.enums.DayOfWeek;
import com.dental.clinic.management.working_schedule.enums.ShiftSource;
import com.dental.clinic.management.working_schedule.enums.ShiftStatus;
import com.dental.clinic.management.working_schedule.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Job P8: Unified Schedule Sync Job (Replaces Job 1 & Job 2)
 *
 * This is the MOST IMPORTANT cron job in the scheduling system.
 *
 * Purpose: Read schedules from BOTH sources (Fixed & Flex) and sync to
 * employee_shifts.
 *
 * Runs: Daily at 00:01 AM (self-healing - auto-corrects within 24 hours if
 * admin changes schedules)
 *
 * Business Logic:
 * 1. Define 14-day window: [Today] to [Today + 14 days]
 * 2. Clean old SCHEDULED shifts in this window (from BATCH_JOB &
 * REGISTRATION_JOB sources)
 * 3. Loop 14 times (Day 0 to Day 13):
 * - Query 1: Get Fixed schedules (fixed_shift_registrations +
 * fixed_registration_days)
 * - Query 2: Get Flex schedules (employee_shift_registrations +
 * part_time_slots)
 * - Merge results
 * - Insert into employee_shifts with proper source tag
 * 4. Skip holidays
 *
 * Source Tags:
 * - BATCH_JOB: From Fixed registrations (Luồng 1)
 * - REGISTRATION_JOB: From Flex registrations (Luồng 2)
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class UnifiedScheduleSyncJob {

    private final FixedShiftRegistrationRepository fixedRegistrationRepo;
    private final EmployeeShiftRegistrationRepository flexRegistrationRepo;
    private final PartTimeSlotRepository partTimeSlotRepo;
    private final EmployeeShiftRepository employeeShiftRepo;
    private final HolidayDateRepository holidayRepo;
    private final WorkShiftRepository workShiftRepo;
    private final EmployeeRepository employeeRepo;
    private final IdGenerator idGenerator;

    private static final int SYNC_WINDOW_DAYS = 14; // 14-day lookahead window

    /**
     * Cron: 0 1 0 * * ?
     * - Runs at 00:01 AM every day
     * - Format: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 1 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void syncSchedules() {
        log.info("=== Starting Unified Schedule Sync Job (P8) ===");

        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(SYNC_WINDOW_DAYS - 1);

        log.info("Sync window: {} to {} ({} days)", today, windowEnd, SYNC_WINDOW_DAYS);

        try {
            // STEP 1: Validate work shifts exist
            long workShiftCount = workShiftRepo.count();
            if (workShiftCount == 0) {
                log.error("CRITICAL: No work shifts found. Cannot sync schedules.");
                return;
            }
            log.info("Validation passed: {} work shifts available", workShiftCount);

            // STEP 2: Get holidays in the window
            Set<LocalDate> holidays = holidayRepo.findHolidayDatesByRange(today, windowEnd)
                    .stream()
                    .collect(Collectors.toSet());
            log.info("Found {} holidays in sync window: {}", holidays.size(), holidays);

            // STEP 3: Clean up old SCHEDULED shifts in the window
            int deletedCount = cleanupOldScheduledShifts(today, windowEnd);
            log.info("Cleaned up {} old SCHEDULED shifts in window", deletedCount);

            // STEP 4: Loop through 14 days and create new shifts
            int totalCreated = 0;
            int skippedHolidays = 0;

            for (int dayOffset = 0; dayOffset < SYNC_WINDOW_DAYS; dayOffset++) {
                LocalDate targetDate = today.plusDays(dayOffset);

                // Skip holidays
                if (holidays.contains(targetDate)) {
                    log.debug("Skipping holiday: {}", targetDate);
                    skippedHolidays++;
                    continue;
                }

                // Get day of week (MONDAY, TUESDAY, etc.)
                DayOfWeek dayOfWeek = DayOfWeek.valueOf(
                        targetDate.getDayOfWeek().toString());

                log.debug("Processing {} ({})", targetDate, dayOfWeek);

                // Query both sources and create shifts
                int createdForDay = syncShiftsForDate(targetDate, dayOfWeek);
                totalCreated += createdForDay;
            }

            log.info("=== Unified Schedule Sync Job Completed ===");
            log.info("Total shifts created: {}", totalCreated);
            log.info("Days skipped (holidays): {}", skippedHolidays);
            log.info("Sync window: {} days", SYNC_WINDOW_DAYS);

        } catch (Exception e) {
            log.error("CRITICAL ERROR in Unified Schedule Sync Job", e);
        }
    }

    /**
     * Clean up old SCHEDULED shifts in the sync window.
     * Deletes shifts with status=SCHEDULED and source=BATCH_JOB or
     * REGISTRATION_JOB.
     * This allows the job to "self-heal" - if admin changes Fixed registrations,
     * old shifts are removed and new ones created within 24 hours.
     *
     * @param startDate window start
     * @param endDate   window end
     * @return number of deleted shifts
     */
    private int cleanupOldScheduledShifts(LocalDate startDate, LocalDate endDate) {
        try {
            // Find all SCHEDULED shifts in window from batch jobs
            List<EmployeeShift> oldShifts = employeeShiftRepo.findAll().stream()
                    .filter(shift -> shift.getStatus() == ShiftStatus.SCHEDULED &&
                            (shift.getSource() == ShiftSource.BATCH_JOB ||
                                    shift.getSource() == ShiftSource.REGISTRATION_JOB)
                            &&
                            !shift.getWorkDate().isBefore(startDate) &&
                            !shift.getWorkDate().isAfter(endDate))
                    .collect(Collectors.toList());

            if (!oldShifts.isEmpty()) {
                employeeShiftRepo.deleteAll(oldShifts);
                log.info("Deleted {} old SCHEDULED shifts (source: BATCH_JOB/REGISTRATION_JOB)",
                        oldShifts.size());
            }

            return oldShifts.size();

        } catch (Exception e) {
            log.error("Error cleaning up old shifts: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Sync shifts for a specific date by querying both Fixed and Flex sources.
     *
     * @param targetDate the date to sync
     * @param dayOfWeek  the day of week enum
     * @return number of shifts created
     */
    private int syncShiftsForDate(LocalDate targetDate, DayOfWeek dayOfWeek) {
        int createdCount = 0;

        try {
            // QUERY 1: Get Fixed schedules (Luồng 1)
            List<EmployeeShift> fixedShifts = getFixedSchedules(targetDate, dayOfWeek);
            createdCount += fixedShifts.size();

            // QUERY 2: Get Flex schedules (Luồng 2)
            List<EmployeeShift> flexShifts = getFlexSchedules(targetDate, dayOfWeek);
            createdCount += flexShifts.size();

            // Merge and save
            List<EmployeeShift> allShifts = new ArrayList<>();
            allShifts.addAll(fixedShifts);
            allShifts.addAll(flexShifts);

            if (!allShifts.isEmpty()) {
                employeeShiftRepo.saveAll(allShifts);
                log.debug("Created {} shifts for {} ({} Fixed, {} Flex)",
                        allShifts.size(), targetDate, fixedShifts.size(), flexShifts.size());
            }

        } catch (Exception e) {
            log.error("Error syncing shifts for {}: {}", targetDate, e.getMessage(), e);
        }

        return createdCount;
    }

    /**
     * Query 1: Get Fixed schedules for a specific date.
     *
     * SELECT from fixed_shift_registrations + fixed_registration_days
     * WHERE day_of_week = [dayOfWeek]
     * AND effective_from <= [targetDate]
     * AND (effective_to IS NULL OR effective_to >= [targetDate])
     * AND is_active = true
     *
     * @param targetDate the work date
     * @param dayOfWeek  the day of week
     * @return list of EmployeeShift entities (source = BATCH_JOB)
     */
    private List<EmployeeShift> getFixedSchedules(LocalDate targetDate, DayOfWeek dayOfWeek) {
        List<EmployeeShift> shifts = new ArrayList<>();

        try {
            // Get all active Fixed registrations
            List<FixedShiftRegistration> allFixed = fixedRegistrationRepo.findAllActive();

            for (FixedShiftRegistration registration : allFixed) {
                // Check if registration is valid for target date
                if (registration.getEffectiveFrom().isAfter(targetDate)) {
                    continue; // Not yet effective
                }

                if (registration.getEffectiveTo() != null &&
                        registration.getEffectiveTo().isBefore(targetDate)) {
                    continue; // Already expired
                }

                // Check if registration includes this day of week
                boolean includesDay = registration.getRegistrationDays().stream()
                        .anyMatch(day -> dayOfWeek.name().equals(day.getDayOfWeek()));

                if (!includesDay) {
                    continue; // Employee doesn't work on this day
                }

                // Create EmployeeShift
                EmployeeShift shift = new EmployeeShift();
                shift.setEmployeeShiftId(idGenerator.generateId("EMS"));
                shift.setEmployee(registration.getEmployee());
                shift.setWorkShift(registration.getWorkShift());
                shift.setWorkDate(targetDate);
                shift.setStatus(ShiftStatus.SCHEDULED);
                shift.setSource(ShiftSource.BATCH_JOB); // Fixed = BATCH_JOB
                shift.setIsOvertime(false);
                shift.setCreatedAt(java.time.LocalDateTime.now());

                shifts.add(shift);
            }

        } catch (Exception e) {
            log.error("Error getting Fixed schedules for {}: {}", targetDate, e.getMessage(), e);
        }

        return shifts;
    }

    /**
     * Query 2: Get Flex schedules for a specific date.
     *
     * SELECT from employee_shift_registrations + part_time_slots
     * WHERE day_of_week = [dayOfWeek]
     * AND effective_from <= [targetDate]
     * AND effective_to >= [targetDate]
     * AND is_active = true
     *
     * @param targetDate the work date
     * @param dayOfWeek  the day of week
     * @return list of EmployeeShift entities (source = REGISTRATION_JOB)
     */
    private List<EmployeeShift> getFlexSchedules(LocalDate targetDate, DayOfWeek dayOfWeek) {
        List<EmployeeShift> shifts = new ArrayList<>();

        try {
            // Get all active Flex registrations
            List<EmployeeShiftRegistration> allFlex = flexRegistrationRepo
                    .findActiveRegistrations(targetDate);

            for (EmployeeShiftRegistration registration : allFlex) {
                // Get the part-time slot
                PartTimeSlot slot = partTimeSlotRepo
                        .findById(registration.getPartTimeSlotId())
                        .orElse(null);

                if (slot == null || !slot.getIsActive()) {
                    continue; // Slot not found or inactive
                }

                // Check if slot is for this day of week
                if (!dayOfWeek.name().equals(slot.getDayOfWeek())) {
                    continue; // Slot is for a different day
                }

                // Get WorkShift and Employee entities
                WorkShift workShift = workShiftRepo.findById(slot.getWorkShiftId()).orElse(null);
                if (workShift == null) {
                    log.warn("Work shift {} not found for slot {}",
                            slot.getWorkShiftId(), slot.getSlotId());
                    continue;
                }

                com.dental.clinic.management.employee.domain.Employee employee = employeeRepo
                        .findById(registration.getEmployeeId()).orElse(null);
                if (employee == null) {
                    log.warn("Employee {} not found for registration {}",
                            registration.getEmployeeId(), registration.getRegistrationId());
                    continue;
                }

                // Create EmployeeShift
                EmployeeShift shift = new EmployeeShift();
                shift.setEmployeeShiftId(idGenerator.generateId("EMS"));
                shift.setEmployee(employee);
                shift.setWorkShift(workShift);
                shift.setWorkDate(targetDate);
                shift.setStatus(ShiftStatus.SCHEDULED);
                shift.setSource(ShiftSource.REGISTRATION_JOB); // Flex = REGISTRATION_JOB
                shift.setIsOvertime(false);
                shift.setCreatedAt(java.time.LocalDateTime.now());

                shifts.add(shift);
            }

        } catch (Exception e) {
            log.error("Error getting Flex schedules for {}: {}", targetDate, e.getMessage(), e);
        }

        return shifts;
    }
}
