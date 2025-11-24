package com.dental.clinic.management.employee.enums;

/**
 * Employment type enum (Schema V15).
 *
 * - FULL_TIME: Uses Fixed Schedule (Luồng 1 - fixed_shift_registrations)
 * - PART_TIME_FIXED: Uses Fixed Schedule (Luồng 1 - fixed_shift_registrations)
 * - PART_TIME_FLEX: Uses Flexible Schedule (Luồng 2 - part_time_registrations)
 */
public enum EmploymentType {
    FULL_TIME,
    PART_TIME_FIXED,
    PART_TIME_FLEX
}
