package com.dental.clinic.management.working_schedule.service;

import com.dental.clinic.management.working_schedule.domain.PartTimeSlot;
import com.dental.clinic.management.working_schedule.enums.RegistrationStatus;
import com.dental.clinic.management.working_schedule.repository.PartTimeRegistrationRepository;
import com.dental.clinic.management.working_schedule.repository.PartTimeSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for calculating dynamic quota and availability for part-time slots.
 * 
 * NEW SPECIFICATION:
 * - Calculate quota per day (not fixed 3 months)
 * - Only count APPROVED registrations
 * - Support flexible date ranges
 * - Determine if slot is AVAILABLE based on actual working days
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PartTimeSlotAvailabilityService {

    private final PartTimeSlotRepository slotRepository;
    private final PartTimeRegistrationRepository registrationRepository;

    /**
     * Calculate how many approved employees are registered for a specific date.
     * 
     * Example: For slot_id=1 on 2025-11-21 (Friday)
     * - Doctor A registered 11/09-11/16: NOT counted (ended before 11/21)
     * - Doctor B registered 11/09-11/30: COUNTED (covers 11/21)
     * Result: 1 employee
     * 
     * @param slotId The slot ID
     * @param date The specific date to check
     * @return Number of approved employees covering that date
     * 
     * FIX ISSUE #2: Removed @Transactional to always read latest committed data
     */
    @PreAuthorize("hasAuthority('VIEW_AVAILABLE_SLOTS') or hasAuthority('VIEW_REGISTRATION_OWN') or hasAuthority('MANAGE_PART_TIME_REGISTRATIONS') or hasAuthority('MANAGE_WORK_SLOTS')")
    public long getRegisteredCountForDate(Long slotId, LocalDate date) {
    long count = registrationRepository.countBySlotAndDate(
        slotId,
        date,
        RegistrationStatus.APPROVED,
        true // isActive
    );
    // DEBUG: Log the count for troubleshooting Issue #2
    log.info("DEBUG getRegisteredCountForDate: slotId={}, date={}, count={}", slotId, date, count);
    return count;
    }

    /**
     * Check if a slot has availability for a given date range.
     * Returns true if ALL days in the range have available spots.
     * 
     * CRITICAL LOGIC (Based on spec):
     * - Must check EVERY working day in the requested range
     * - ALL days must have registered < quota
     * - If even ONE day is full, return false (not available)
     * 
     * Example from spec:
     * - Slot: FRIDAY,SATURDAY, quota=2, effectiveFrom=9/11, effectiveTo=30/11
     * - Doctor A registered: 9/11 to 16/11 (covers 14/11, 15/11)
     * - Doctor B registered: 9/11 to 30/11 (covers all 6 days)
     * 
     * Check availability 9/11-16/11:
     * - 14/11 (Fri): Doctor A + Doctor B = 2/2 → FULL
     * - 15/11 (Sat): Doctor A + Doctor B = 2/2 → FULL
     * Result: NOT AVAILABLE (at least one day is full)
     * 
     * Check availability 17/11-30/11:
     * - 21/11 (Fri): Only Doctor B = 1/2 → HAS SPACE
     * - 22/11 (Sat): Only Doctor B = 1/2 → HAS SPACE
     * - 28/11 (Fri): Only Doctor B = 1/2 → HAS SPACE
     * - 29/11 (Sat): Only Doctor B = 1/2 → HAS SPACE
     * Result: AVAILABLE (all days have space)
     * 
     * @param slotId Slot ID
     * @param startDate Start of desired registration period
     * @param endDate End of desired registration period
     * @return true if ALL working days have space (registered < quota)
     */
    @Transactional(readOnly = true)
    public boolean isSlotAvailable(Long slotId, LocalDate startDate, LocalDate endDate) {
        PartTimeSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null || !slot.getIsActive()) {
            return false;
        }

        // Check if slot has expired
        if (slot.getEffectiveTo().isBefore(LocalDate.now())) {
            return false;
        }

        // Get actual working days based on day_of_week constraint
        List<LocalDate> workingDays = getWorkingDays(slot, startDate, endDate);
        
        if (workingDays.isEmpty()) {
            log.warn("No working days found for slot {} between {} and {}", slotId, startDate, endDate);
            return false;
        }

        // CRITICAL: Check if ALL days have available spots
        // If even ONE day is full, the slot is NOT available for this range
        for (LocalDate workingDay : workingDays) {
            long registered = getRegisteredCountForDate(slotId, workingDay);
            if (registered >= slot.getQuota()) {
                log.debug("Slot {} is FULL on {}: {}/{} (rejecting entire range)", 
                         slotId, workingDay, registered, slot.getQuota());
                return false; // Even one full day makes the slot unavailable
            }
        }

        log.debug("Slot {} is AVAILABLE for range {}-{}: all {} days have space", 
                 slotId, startDate, endDate, workingDays.size());
        return true; // All days have space
    }

    /**
     * Get list of actual working days within a date range based on slot's day_of_week.
     * 
     * Example:
     * - Slot day_of_week: "FRIDAY,SATURDAY"
     * - Range: 2025-11-09 to 2025-11-30
     * - Result: [2025-11-14, 2025-11-15, 2025-11-21, 2025-11-22, 2025-11-28, 2025-11-29]
     * 
     * @param slot The part-time slot
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @return List of working dates
     */
    public List<LocalDate> getWorkingDays(PartTimeSlot slot, LocalDate startDate, LocalDate endDate) {
        // Parse day_of_week (supports comma-separated: "FRIDAY,SATURDAY")
        List<DayOfWeek> allowedDays = parseDaysOfWeek(slot.getDayOfWeek());
        
        List<LocalDate> workingDays = new ArrayList<>();
        LocalDate current = startDate;
        
        while (!current.isAfter(endDate)) {
            if (allowedDays.contains(current.getDayOfWeek())) {
                workingDays.add(current);
            }
            current = current.plusDays(1);
        }
        
        log.debug("Working days for slot {}: {} days between {} and {}", 
                  slot.getSlotId(), workingDays.size(), startDate, endDate);
        return workingDays;
    }

    /**
     * Calculate all dates within a range that fall on specified days of the week.
     * Used when employee specifies which days they can work (e.g., MONDAY, THURSDAY).
     * 
     * @param dayNames List of day names (e.g., ["MONDAY", "THURSDAY"])
     * @param startDate Start date of range
     * @param endDate End date of range
     * @return List of dates matching the specified days of week
     */
    public List<LocalDate> getWorkingDaysFromDayNames(List<String> dayNames, LocalDate startDate, LocalDate endDate) {
        if (dayNames == null || dayNames.isEmpty()) {
            return new ArrayList<>();
        }

        // Convert string names to DayOfWeek enums
        List<DayOfWeek> allowedDays = dayNames.stream()
                .map(String::trim)
                .map(String::toUpperCase)
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toList());

        List<LocalDate> workingDays = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            if (allowedDays.contains(current.getDayOfWeek())) {
                workingDays.add(current);
            }
            current = current.plusDays(1);
        }

        log.debug("Calculated {} working days for days {} between {} and {}", 
                  workingDays.size(), dayNames, startDate, endDate);
        return workingDays;
    }

    /**
     * Parse day_of_week string into list of DayOfWeek enums.
     * 
     * Supports:
     * - Single day: "FRIDAY"
     * - Multiple days: "FRIDAY,SATURDAY" or "FRIDAY, SATURDAY"
     * 
     * @param dayOfWeekStr The day_of_week field from database
     * @return List of DayOfWeek enums
     */
    private List<DayOfWeek> parseDaysOfWeek(String dayOfWeekStr) {
        if (dayOfWeekStr == null || dayOfWeekStr.trim().isEmpty()) {
            return new ArrayList<>();
        }

        return Arrays.stream(dayOfWeekStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .map(DayOfWeek::valueOf)
                .collect(Collectors.toList());
    }

    /**
     * Get the minimum registered count across all working days in a range.
     * Used to determine overall slot availability status.
     * 
     * @param slotId Slot ID
     * @param startDate Start date
     * @param endDate End date
     * @return Minimum registered count (the day with fewest registrations)
     * 
     * FIX ISSUE #2: Removed @Transactional(readOnly = true) to prevent stale reads
     */
    public long getMinimumRegisteredCount(Long slotId, LocalDate startDate, LocalDate endDate) {
        PartTimeSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null) {
            return 0;
        }

        List<LocalDate> workingDays = getWorkingDays(slot, startDate, endDate);
        if (workingDays.isEmpty()) {
            return 0;
        }

        long minCount = workingDays.stream()
                .mapToLong(date -> getRegisteredCountForDate(slotId, date))
                .min()
                .orElse(0);
        
        // DEBUG: Log the result for troubleshooting Issue #2
        log.info("DEBUG getMinimumRegisteredCount: slotId={}, startDate={}, endDate={}, workingDays={}, minCount={}", 
            slotId, startDate, endDate, workingDays.size(), minCount);
        
        return minCount;
    }

    /**
     * Get the maximum registered count across all working days in a range.
     * Used to check if any day is over quota.
     * 
     * @param slotId Slot ID
     * @param startDate Start date
     * @param endDate End date
     * @return Maximum registered count (the fullest day)
     * 
     * FIX ISSUE #2: Removed @Transactional(readOnly = true) to prevent stale reads
     */
    public long getMaximumRegisteredCount(Long slotId, LocalDate startDate, LocalDate endDate) {
        PartTimeSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null) {
            return 0;
        }

        List<LocalDate> workingDays = getWorkingDays(slot, startDate, endDate);
        if (workingDays.isEmpty()) {
            return 0;
        }

        return workingDays.stream()
                .mapToLong(date -> getRegisteredCountForDate(slotId, date))
                .max()
                .orElse(0);
    }

    /**
     * Generate a simple availability summary text for display in the slot list.
     * Example: "December FULL, January has space"
     * 
     * @param slotId Slot ID
     * @param quota Slot quota
     * @param startDate Start date
     * @param endDate End date
     * @return Human-readable summary string
     */
    @Transactional(readOnly = true)
    public String generateAvailabilitySummary(Long slotId, Integer quota, LocalDate startDate, LocalDate endDate) {
        PartTimeSlot slot = slotRepository.findById(slotId).orElse(null);
        if (slot == null) {
            return "Unknown";
        }

        List<String> monthStatuses = new java.util.ArrayList<>();
        LocalDate currentMonth = startDate.withDayOfMonth(1);
        LocalDate endMonth = endDate.withDayOfMonth(1);

        while (!currentMonth.isAfter(endMonth)) {
            LocalDate monthStart = currentMonth.isBefore(startDate) ? startDate : currentMonth;
            LocalDate monthEnd = currentMonth.plusMonths(1).minusDays(1);
            if (monthEnd.isAfter(endDate)) {
                monthEnd = endDate;
            }

            // Count available dates vs total working days
            List<LocalDate> workingDays = getWorkingDays(slot, monthStart, monthEnd);
            int totalDates = workingDays.size();
            int availableDates = 0;
            
            for (LocalDate date : workingDays) {
                long registered = getRegisteredCountForDate(slotId, date);
                if (registered < quota) {
                    availableDates++;
                }
            }

            // Vietnamese month names
            String monthName = getVietnameseMonthName(currentMonth.getMonthValue());
            if (availableDates == 0) {
                monthStatuses.add(monthName + " ĐẦY");
            } else {
                monthStatuses.add(monthName + " (" + availableDates + "/" + totalDates + " còn trống)");
            }

            currentMonth = currentMonth.plusMonths(1);
        }

        return String.join(", ", monthStatuses);
    }

    /**
     * Generate monthly availability breakdown for detailed slot view.
     * 
     * @param slotId Slot ID
     * @param slot Slot entity
     * @param startDate Start date
     * @param endDate End date
     * @return List of monthly availability information
     */
    @Transactional(readOnly = true)
    public List<com.dental.clinic.management.working_schedule.dto.response.SlotDetailResponse.MonthlyAvailability> 
            generateMonthlyAvailability(Long slotId, PartTimeSlot slot, LocalDate startDate, LocalDate endDate) {
        
        List<com.dental.clinic.management.working_schedule.dto.response.SlotDetailResponse.MonthlyAvailability> result = 
                new java.util.ArrayList<>();
        
        LocalDate currentMonth = startDate.withDayOfMonth(1);
        LocalDate endMonth = endDate.withDayOfMonth(1);

        while (!currentMonth.isAfter(endMonth)) {
            LocalDate monthStart = currentMonth.isBefore(startDate) ? startDate : currentMonth;
            LocalDate monthEnd = currentMonth.plusMonths(1).minusDays(1);
            if (monthEnd.isAfter(endDate)) {
                monthEnd = endDate;
            }

            List<LocalDate> workingDays = getWorkingDays(slot, monthStart, monthEnd);
            int totalWorkingDays = workingDays.size();

            // Count dates by availability status
            int totalDatesAvailable = 0; // registered == 0 (completely empty)
            int totalDatesPartial = 0;   // 0 < registered < quota  
            int totalDatesFull = 0;      // registered >= quota
            
            for (LocalDate date : workingDays) {
                long registered = getRegisteredCountForDate(slotId, date);
                if (registered >= slot.getQuota()) {
                    totalDatesFull++;
                } else if (registered > 0) {
                    totalDatesPartial++; // Has some registrations but not full
                } else {
                    totalDatesAvailable++; // Completely empty (registered == 0)
                }
            }

            String status;
            if (totalDatesFull == totalWorkingDays) {
                status = "FULL";
            } else if (totalDatesPartial > 0 || totalDatesFull > 0) {
                status = "PARTIAL";
            } else {
                status = "AVAILABLE";
            }

            String monthName = currentMonth.getMonth().toString().substring(0, 1) + 
                              currentMonth.getMonth().toString().substring(1).toLowerCase() + 
                              " " + currentMonth.getYear();

            result.add(com.dental.clinic.management.working_schedule.dto.response.SlotDetailResponse.MonthlyAvailability.builder()
                    .month(currentMonth.toString().substring(0, 7)) // YYYY-MM
                    .monthName(monthName)
                    .totalDatesAvailable(totalDatesAvailable)
                    .totalDatesPartial(totalDatesPartial)
                    .totalDatesFull(totalDatesFull)
                    .status(status)
                    .totalWorkingDays(totalWorkingDays)
                    .build());

            currentMonth = currentMonth.plusMonths(1);
        }

        return result;
    }

    /**
     * Convert month number to Vietnamese month abbreviation.
     * 
     * @param monthValue Month number (1-12)
     * @return Vietnamese month abbreviation
     */
    private String getVietnameseMonthName(int monthValue) {
        switch (monthValue) {
            case 1: return "T1";   // Tháng 1 (January)
            case 2: return "T2";   // Tháng 2 (February)
            case 3: return "T3";   // Tháng 3 (March)
            case 4: return "T4";   // Tháng 4 (April)
            case 5: return "T5";   // Tháng 5 (May)
            case 6: return "T6";   // Tháng 6 (June)
            case 7: return "T7";   // Tháng 7 (July)
            case 8: return "T8";   // Tháng 8 (August)
            case 9: return "T9";   // Tháng 9 (September)
            case 10: return "T10"; // Tháng 10 (October)
            case 11: return "T11"; // Tháng 11 (November)
            case 12: return "T12"; // Tháng 12 (December)
            default: return "T" + monthValue;
        }
    }

    /**
     * Get daily availability breakdown for a specific slot in a given month.
     * Shows quota, registered count, and remaining slots for each working day.
     * 
     * Business Logic:
     * - Only includes days matching slot's dayOfWeek
     * - Counts APPROVED registrations covering each date
     * - Status: AVAILABLE (100% free), PARTIAL (some taken), FULL (no slots)
     * 
     * Example:
     * - Slot: MONDAY, quota=10
     * - Month: 2025-11 (Mondays: 3, 10, 17, 24)
     * - Returns daily breakdown with registered count per day
     * 
     * @param slotId Slot ID to check
     * @param month Month in YYYY-MM format (e.g., "2025-11")
     * @return Daily availability response with per-day breakdown
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('VIEW_AVAILABLE_SLOTS') or hasAuthority('MANAGE_PART_TIME_REGISTRATIONS') or hasAuthority('MANAGE_WORK_SLOTS')")
    public com.dental.clinic.management.working_schedule.dto.response.DailyAvailabilityResponse getDailyAvailability(
            Long slotId, String month) {
        
        // Validate and parse month (YYYY-MM format)
        java.time.YearMonth yearMonth;
        try {
            yearMonth = java.time.YearMonth.parse(month);
        } catch (Exception e) {
            throw new BadRequestAlertException(
                "Invalid month format. Expected YYYY-MM",
                "partTimeSlot",
                "invalidmonthformat"
            );
        }
        
        // Get slot
        PartTimeSlot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new BadRequestAlertException(
                "Slot not found",
                "partTimeSlot",
                "slotnotfound"
            ));
        
        // Get month boundaries
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();
        
        // Get all working days in the month (matching slot's dayOfWeek)
        List<LocalDate> workingDays = getWorkingDays(slot, monthStart, monthEnd);
        
        // Build daily availability list
        List<com.dental.clinic.management.working_schedule.dto.response.DailySlotAvailability> dailyList = new ArrayList<>();
        int totalAvailable = 0;
        int totalPartial = 0;
        int totalFull = 0;
        
        for (LocalDate workingDay : workingDays) {
            long registered = getRegisteredCountForDate(slotId, workingDay);
            int remaining = slot.getQuota() - (int) registered;
            
            // Determine status
            String status;
            if (remaining == slot.getQuota()) {
                status = "AVAILABLE";
                totalAvailable++;
            } else if (remaining > 0) {
                status = "PARTIAL";
                totalPartial++;
            } else {
                status = "FULL";
                totalFull++;
            }
            
            dailyList.add(com.dental.clinic.management.working_schedule.dto.response.DailySlotAvailability.builder()
                .date(workingDay.toString())
                .dayOfWeek(workingDay.getDayOfWeek().toString())
                .quota(slot.getQuota())
                .registered((int) registered)
                .remaining(remaining)
                .status(status)
                .build());
        }
        
        // Sort by date ascending
        dailyList.sort((a, b) -> a.getDate().compareTo(b.getDate()));
        
        // Build month name (e.g., "November 2025")
        String monthName = yearMonth.getMonth().toString().charAt(0) + 
                          yearMonth.getMonth().toString().substring(1).toLowerCase() + 
                          " " + yearMonth.getYear();
        
        // Build response
        return com.dental.clinic.management.working_schedule.dto.response.DailyAvailabilityResponse.builder()
            .slotId(slotId)
            .shiftName(slot.getWorkShift().getShiftName())
            .dayOfWeek(slot.getDayOfWeek())
            .quota(slot.getQuota())
            .month(month)
            .monthName(monthName)
            .totalWorkingDays(workingDays.size())
            .totalDaysAvailable(totalAvailable)
            .totalDaysPartial(totalPartial)
            .totalDaysFull(totalFull)
            .dailyAvailability(dailyList)
            .build();
    }
}
