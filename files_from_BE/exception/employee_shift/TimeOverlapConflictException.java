package com.dental.clinic.management.exception.employee_shift;

import java.time.LocalTime;

/**
 * Exception thrown when attempting to create overlapping shifts for the same
 * employee.
 */
public class TimeOverlapConflictException extends RuntimeException {

    public TimeOverlapConflictException(LocalTime newStart, LocalTime newEnd, LocalTime existingStart,
            LocalTime existingEnd) {
        super(String.format("Nhân viên đã có ca làm việc chồng lấn thời gian. " +
                "Ca mới (%s - %s) trùng với ca hiện tại (%s - %s). " +
                "Vui lòng chọn ca làm việc khác.",
                newStart, newEnd, existingStart, existingEnd));
    }
}
