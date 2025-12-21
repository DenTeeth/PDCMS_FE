package com.dental.clinic.management.utils.validation;

import com.dental.clinic.management.exception.validation.BadRequestAlertException;
import com.dental.clinic.management.working_schedule.service.HolidayDateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Reusable validator for holiday validation across all modules.
 * Prevents operations on holidays (appointments, shifts, requests, etc.)
 * 
 * ISSUE #53: Holiday validation missing across all modules
 * This component provides centralized holiday validation to ensure
 * business rule consistency: "Phòng khám đóng cửa vào ngày lễ"
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HolidayValidator {
    
    private final HolidayDateService holidayDateService;
    
    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("dd/MM/yyyy");
    
    /**
     * Validate single date is NOT a holiday.
     * 
     * @param date Date to validate
     * @param entityName Entity name for error message (e.g., "lịch hẹn", "ca làm việc")
     * @throws BadRequestAlertException if date is a holiday
     */
    public void validateNotHoliday(LocalDate date, String entityName) {
        if (holidayDateService.isHoliday(date)) {
            String formattedDate = date.format(DATE_FORMATTER);
            String errorMessage = String.format(
                "Không thể tạo %s vào ngày lễ (%s). Phòng khám đóng cửa vào ngày này.",
                entityName,
                formattedDate
            );
            
            log.warn("Holiday validation failed: {} attempted on holiday: {}", entityName, formattedDate);
            
            throw new BadRequestAlertException(
                errorMessage,
                entityName,
                "DATE_IS_HOLIDAY"
            );
        }
    }
    
    /**
     * Validate date range does NOT contain any holidays.
     * Used for time-off requests, leave requests, etc.
     * 
     * @param startDate Start date of range (inclusive)
     * @param endDate End date of range (inclusive)
     * @param entityName Entity name for error message
     * @throws BadRequestAlertException if any date in range is a holiday
     */
    public void validateRangeNotIncludeHolidays(
        LocalDate startDate, 
        LocalDate endDate, 
        String entityName) {
        
        // Get all holidays in the range
        List<LocalDate> holidays = holidayDateService.getHolidaysInRange(startDate, endDate.plusDays(1));
        
        if (!holidays.isEmpty()) {
            String holidayList = holidays.stream()
                .map(h -> h.format(DATE_FORMATTER))
                .collect(Collectors.joining(", "));
            
            String errorMessage = String.format(
                "Không thể tạo %s trong khoảng thời gian có ngày lễ: %s. " +
                "Vui lòng chọn khoảng thời gian không bao gồm ngày lễ.",
                entityName,
                holidayList
            );
            
            log.warn("Holiday validation failed: {} range includes {} holidays: {}", 
                     entityName, holidays.size(), holidayList);
            
            throw new BadRequestAlertException(
                errorMessage,
                entityName,
                "RANGE_INCLUDES_HOLIDAYS"
            );
        }
    }
    
    /**
     * Check if date is holiday (non-throwing version).
     * Used when you need to check without exception.
     * 
     * @param date Date to check
     * @return true if date is a holiday
     */
    public boolean isHoliday(LocalDate date) {
        return holidayDateService.isHoliday(date);
    }
    
    /**
     * Filter out holidays from a list of dates.
     * Used in batch operations (e.g., monthly shift generation).
     * 
     * @param dates List of dates to filter
     * @return List of dates excluding holidays
     */
    public List<LocalDate> filterOutHolidays(List<LocalDate> dates) {
        List<LocalDate> workingDays = dates.stream()
            .filter(date -> !isHoliday(date))
            .collect(Collectors.toList());
        
        int holidayCount = dates.size() - workingDays.size();
        if (holidayCount > 0) {
            log.info("Filtered out {} holidays from {} total dates", holidayCount, dates.size());
        }
        
        return workingDays;
    }
    
    /**
     * Get the next working day (skip holidays).
     * Delegates to HolidayDateService.
     * 
     * @param date Starting date
     * @return Next working day (or same day if not holiday)
     */
    public LocalDate getNextWorkingDay(LocalDate date) {
        return holidayDateService.getNextWorkingDay(date);
    }
    
    /**
     * Count working days between two dates (excluding holidays).
     * Delegates to HolidayDateService.
     * 
     * @param startDate Start date (inclusive)
     * @param endDate End date (exclusive)
     * @return Number of working days
     */
    public long countWorkingDaysBetween(LocalDate startDate, LocalDate endDate) {
        return holidayDateService.countWorkingDaysBetween(startDate, endDate);
    }
    
    /**
     * Find next working day (skip holidays and weekends).
     * Used for auto-scheduling treatment plans.
     * 
     * ISSUE: AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION
     * Business Rule: When estimated date falls on holiday/weekend, 
     * automatically shift to next available working day.
     * 
     * @param startDate Starting date to check from
     * @return Next available working day
     */
    public LocalDate findNextWorkingDay(LocalDate startDate) {
        LocalDate currentDate = startDate;
        int maxAttempts = 30; // Prevent infinite loop (1 month max)
        int attempts = 0;
        
        while (attempts < maxAttempts) {
            // Check if weekend (Saturday = 6, Sunday = 7)
            java.time.DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
            boolean isWeekend = dayOfWeek == java.time.DayOfWeek.SATURDAY || 
                               dayOfWeek == java.time.DayOfWeek.SUNDAY;
            
            // Check if holiday
            boolean isHoliday = isHoliday(currentDate);
            
            if (!isWeekend && !isHoliday) {
                if (!currentDate.equals(startDate)) {
                    log.debug("Next working day from {} is {} (shifted {} days)", 
                            startDate, currentDate, attempts);
                }
                return currentDate;
            }
            
            // Move to next day
            currentDate = currentDate.plusDays(1);
            attempts++;
        }
        
        // Fallback: return original date + 30 days if no working day found
        log.warn("Could not find working day within 30 days from {}. Using fallback.", startDate);
        return startDate.plusDays(30);
    }
    
    /**
     * Adjust date to working day if it falls on holiday/weekend.
     * Returns same date if already a working day.
     * 
     * ISSUE: AUTO_SCHEDULE_HOLIDAYS_AND_SPACING_IMPLEMENTATION
     * Example: 2025-01-01 (New Year - Holiday) → 2025-01-02 (Working day)
     * 
     * @param date Date to adjust
     * @return Same date if working day, otherwise next working day
     */
    public LocalDate adjustToWorkingDay(LocalDate date) {
        if (isWorkingDay(date)) {
            return date;
        }
        return findNextWorkingDay(date.plusDays(1));
    }
    
    /**
     * Check if date is a working day (not weekend, not holiday).
     * Used to validate dates before auto-scheduling.
     * 
     * @param date Date to check
     * @return true if working day, false if weekend or holiday
     */
    public boolean isWorkingDay(LocalDate date) {
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
        boolean isWeekend = dayOfWeek == java.time.DayOfWeek.SATURDAY || 
                           dayOfWeek == java.time.DayOfWeek.SUNDAY;
        boolean isHoliday = isHoliday(date);
        
        return !isWeekend && !isHoliday;
    }
}
