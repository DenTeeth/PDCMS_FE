package com.dental.clinic.management.warehouse.enums;

/**
 * 🏭 Batch Status Enum - API 6.2
 * Trạng thái hạn sử dụng của lô hàng (Operational View)
 *
 * Logic:
 * - EXPIRED: Đã quá hạn (expiryDate < today)
 * - CRITICAL: Còn <= 7 ngày (cần dùng gấp)
 * - EXPIRING_SOON: Còn <= 30 ngày (cảnh báo)
 * - VALID: Còn > 30 ngày (an toàn)
 */
public enum BatchStatus {

    /**
     * 🔴 EXPIRED: Lô đã hết hạn sử dụng
     * - expiryDate < currentDate
     * - Action: Tạo phiếu hủy, không được xuất kho
     */
    EXPIRED("Hết hạn"),

    /**
     * 🔴 CRITICAL: Lô sắp hết hạn trong vòng 7 ngày
     * - 0 <= daysRemaining <= 7
     * - Action: Ưu tiên xuất kho ngay, thông báo khẩn cấp
     */
    CRITICAL("Cần dùng gấp"),

    /**
     * 🟡 EXPIRING_SOON: Lô sắp hết hạn trong vòng 30 ngày
     * - 7 < daysRemaining <= 30
     * - Action: Ưu tiên sử dụng, chuẩn bị order thêm
     */
    EXPIRING_SOON("Sắp hết hạn"),

    /**
     * 🟢 VALID: Lô còn hạn sử dụng dài
     * - daysRemaining > 30
     * - Action: An toàn, có thể dùng bình thường
     */
    VALID("Còn hạn");

    private final String description;

    BatchStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 🧠 Calculate batch status based on days remaining
     *
     * @param daysRemaining Number of days until expiry (can be negative if expired)
     * @return BatchStatus enum
     */
    public static BatchStatus fromDaysRemaining(long daysRemaining) {
        if (daysRemaining < 0) {
            return EXPIRED;
        } else if (daysRemaining <= 7) {
            return CRITICAL;
        } else if (daysRemaining <= 30) {
            return EXPIRING_SOON;
        } else {
            return VALID;
        }
    }
}
