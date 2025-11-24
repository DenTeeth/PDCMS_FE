package com.dental.clinic.management.exception.time_off;

/**
 * Exception thrown when an employee tries to request time-off
 * but doesn't have a scheduled shift for that date/shift.
 * (V14 Hybrid Validation - P5.1)
 */
public class ShiftNotFoundForLeaveException extends RuntimeException {

    public ShiftNotFoundForLeaveException(String message) {
        super(message);
    }

    public ShiftNotFoundForLeaveException(Integer employeeId, String date, String workShiftId) {
        super(String.format(
                "Nhân viên không có lịch làm việc vào ngày này. Vui lòng kiểm tra lịch làm việc trước khi đăng ký nghỉ phép.%s",
                workShiftId != null ? String.format(" (Ca làm việc: %s, Ngày: %s)", workShiftId, date)
                        : String.format(" (Ngày: %s)", date)));
    }

    public ShiftNotFoundForLeaveException(Integer employeeId, String date, String workShiftId, String shiftName) {
        super(String.format(
                "Nhân viên không có lịch làm việc vào ngày này. Vui lòng kiểm tra lịch làm việc trước khi đăng ký nghỉ phép. (Ngày: %s, Ca: %s)",
                date,
                shiftName != null ? shiftName : workShiftId));
    }
}
