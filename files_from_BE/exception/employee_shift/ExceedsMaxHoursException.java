package com.dental.clinic.management.exception.employee_shift;

import java.time.LocalDate;

/**
 * Exception thrown when total working hours would exceed the 8-hour daily limit.
 */
public class ExceedsMaxHoursException extends RuntimeException {

    public ExceedsMaxHoursException(LocalDate workDate, int totalHours) {
        super(String.format(
                "Không thể tạo ca làm việc. Tổng giờ làm việc trong ngày %s sẽ là %d giờ, " +
                "vượt quá giới hạn tối đa 8 giờ/ngày. Vui lòng chọn ca làm việc khác hoặc điều chỉnh thời gian.",
                workDate, totalHours));
    }
}
