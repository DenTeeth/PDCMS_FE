package com.dental.clinic.management.warehouse.enums;

/**
 * Transaction Approval Status
 * Controls transaction lifecycle and approval workflow
 */
public enum TransactionStatus {
    DRAFT, // Nháp - chưa hoàn thành
    PENDING_APPROVAL, // Chờ duyệt
    APPROVED, // Đã duyệt
    REJECTED, // Bị từ chối
    COMPLETED, // Hoàn thành (legacy - same as APPROVED)
    CANCELLED // Đã hủy
}
