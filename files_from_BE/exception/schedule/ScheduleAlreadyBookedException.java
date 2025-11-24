package com.dental.clinic.management.exception.schedule;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when attempting to cancel/modify already booked schedule.
 *
 * Business Rule: BOOKED schedules cannot be cancelled directly.
 *
 * Workflow:
 * 1. Reschedule or cancel patient appointments first
 * 2. Schedule status will auto-update to AVAILABLE
 * 3. Then dentist can cancel the schedule
 *
 * Rationale:
 * - Patient commitment protection
 * - Payment guarantee ("đăng ký lên ngồi là phải trả tiền")
 * - Prevent revenue loss
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ScheduleAlreadyBookedException extends RuntimeException {

    public ScheduleAlreadyBookedException(String message) {
        super(message);
    }

    public ScheduleAlreadyBookedException(String scheduleCode, int appointmentCount) {
        super(String.format(
                "Không thể hủy lịch %s. Đã có %d lịch hẹn bệnh nhân. " +
                        "Vui lòng hủy/chuyển lịch hẹn trước khi hủy ca làm việc.",
                scheduleCode, appointmentCount));
    }

    public ScheduleAlreadyBookedException(String message, Throwable cause) {
        super(message, cause);
    }
}
