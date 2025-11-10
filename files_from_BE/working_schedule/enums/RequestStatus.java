package com.dental.clinic.management.working_schedule.enums;

/**
 * Enum representing the status of various requests (leave, overtime, etc.).
 */
public enum RequestStatus {
    /**
     * Request is pending approval.
     * Yêu cầu đang chờ duyệt.
     */
    PENDING,

    /**
     * Request has been approved.
     * Yêu cầu đã được duyệt.
     */
    APPROVED,

    /**
     * Request has been rejected.
     * Yêu cầu đã bị từ chối.
     */
    REJECTED,

    /**
     * Request was cancelled by the creator before approval.
     * Yêu cầu đã bị người tạo hủy trước khi được duyệt.
     */
    CANCELLED
}
