package com.dental.clinic.management.warehouse.enums;

/**
 * Export Transaction Types
 *
 * USAGE: Xuất để sử dụng (điều trị, nội bộ)
 * DISPOSAL: Xuất để hủy (hết hạn, hư hỏng)
 * RETURN: Trả lại NCC (hàng lỗi)
 */
public enum ExportType {
    USAGE, // Sử dụng
    DISPOSAL, // Hủy
    RETURN // Trả NCC
}
