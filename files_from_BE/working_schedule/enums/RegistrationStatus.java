package com.dental.clinic.management.working_schedule.enums;

/**
 * Enum representing the status of part-time registration requests.
 * 
 * NEW SPECIFICATION (Approval Workflow):
 * - PENDING: Registration submitted, waiting for manager approval
 * - APPROVED: Registration approved, employee can work
 * - REJECTED: Registration rejected by manager
 * 
 * Only APPROVED registrations count toward quota.
 */
public enum RegistrationStatus {
    /**
     * Registration is pending manager approval.
     * Đăng ký đang chờ quản lý duyệt.
     */
    PENDING,

    /**
     * Registration has been approved by manager.
     * Employee can work during the registered period.
     * Đăng ký đã được duyệt, nhân viên có thể làm việc.
     */
    APPROVED,

    /**
     * Registration has been rejected by manager.
     * Reason must be provided.
     * Đăng ký đã bị từ chối, phải có lý do.
     */
    REJECTED
}
