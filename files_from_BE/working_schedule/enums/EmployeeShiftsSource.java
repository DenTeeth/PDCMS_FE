package com.dental.clinic.management.working_schedule.enums;

/**
 * Enum representing the source/origin of an employee shift assignment.
 */
public enum EmployeeShiftsSource {
    /**
     * Created automatically by batch job for full-time employees.
     * Từ job tự động tạo cho Full-time.
     */
    BATCH_JOB,

    /**
     * Created automatically by registration job for part-time employees.
     * Từ job tự động tạo cho Part-time.
     */
    REGISTRATION_JOB,

    /**
     * Created from overtime approval.
     * Từ việc duyệt OT.
     */
    OT_APPROVAL,

    /**
     * Created manually by manager/admin.
     * Do quản lý/admin tạo thủ công.
     */
    MANUAL_ENTRY
}
