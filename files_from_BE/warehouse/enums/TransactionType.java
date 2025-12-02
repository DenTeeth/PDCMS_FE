package com.dental.clinic.management.warehouse.enums;

/**
 * Loại giao dịch kho
 * FE chỉ sử dụng 2 loại: IMPORT và EXPORT
 */
public enum TransactionType {
    IMPORT, // Nhập kho
    EXPORT // Xuất kho
    // ADJUSTMENT và LOSS đã bị xóa theo yêu cầu FE
}
