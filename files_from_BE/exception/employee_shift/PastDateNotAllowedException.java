package com.dental.clinic.management.exception.employee_shift;

import java.time.LocalDate;

/**
 * Exception thrown when attempting to create a shift for a past date.
 */
public class PastDateNotAllowedException extends RuntimeException {

    public PastDateNotAllowedException(LocalDate workDate) {
        super(String.format(
                "Không thể tạo ca làm việc cho ngày %s trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.",
                workDate));
    }
}
