package com.dental.clinic.management.booking_appointment.dto;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * DatePreset Enum - Các tùy chọn lọc theo khoảng thời gian định sẵn
 * Backend tự động tính dateFrom/dateTo, KHÔNG cần thay đổi DB Schema
 */
public enum DatePreset {
    TODAY, // Hôm nay
    THIS_WEEK, // Tuần này (Monday -> Sunday)
    NEXT_7_DAYS, // 7 ngày tiếp theo
    THIS_MONTH; // Tháng này

    /**
     * Tính ngày bắt đầu dựa trên preset
     */
    public LocalDate getDateFrom() {
        LocalDate now = LocalDate.now();
        return switch (this) {
            case TODAY -> now;
            case THIS_WEEK -> now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case NEXT_7_DAYS -> now;
            case THIS_MONTH -> now.withDayOfMonth(1);
        };
    }

    /**
     * Tính ngày kết thúc dựa trên preset
     */
    public LocalDate getDateTo() {
        LocalDate now = LocalDate.now();
        return switch (this) {
            case TODAY -> now;
            case THIS_WEEK -> now.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            case NEXT_7_DAYS -> now.plusDays(6);
            case THIS_MONTH -> now.with(TemporalAdjusters.lastDayOfMonth());
        };
    }
}
