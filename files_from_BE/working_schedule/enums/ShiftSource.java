package com.dental.clinic.management.working_schedule.enums;

/**
 * Source of how an employee shift was created.
 * Maps to employee_shifts_source ENUM in database.
 */
public enum ShiftSource {
    /**
     * Created by monthly batch job for full-time employees.
     * Từ job tự động tạo cho Full-time.
     */
    BATCH_JOB,

    /**
     * Created by weekly job based on part-time employee registration.
     * Từ job tự động tạo cho Part-time.
     */
    REGISTRATION_JOB,

    /**
     * Created from approved overtime request.
     * Từ việc duyệt OT.
     */
    OT_APPROVAL,

    /**
     * Manually created by admin/manager.
     * Do quản lý/admin tạo thủ công.
     */
    MANUAL_ENTRY
}
