package com.dental.clinic.management.exception.work_shift;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when WorkShift has dependencies preventing modification.
 *
 * Dependencies:
 * - RecurringSchedules using this shift
 * - Future EmployeeSchedules generated from recurring patterns
 *
 * Business Rule: Cannot delete/disable shift with active usage.
 *
 * Solution: Set isActive = false instead of deleting, or reassign dependencies
 * first.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class WorkShiftInUseException extends RuntimeException {

    public WorkShiftInUseException(String message) {
        super(message);
    }

    public WorkShiftInUseException(String shiftCode, int recurringCount, int scheduleCount) {
        super(String.format(
                "Không thể xóa/vô hiệu hóa ca %s. Đang được sử dụng bởi: " +
                        "%d lịch cố định, %d lịch làm việc. " +
                        "Vui lòng chuyển sang ca khác trước.",
                shiftCode, recurringCount, scheduleCount));
    }

    public WorkShiftInUseException(String message, Throwable cause) {
        super(message, cause);
    }
}
