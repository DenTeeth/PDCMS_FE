package com.dental.clinic.management.warehouse.enums;

/**
 * Phân loại ưu tiên nhà cung cấp (Theo feedback)
 * Dựa trên: Chất lượng hàng hóa, thời gian giao hàng, giá cả, độ tin cậy
 */
public enum SupplierTier {
    /**
     * TIER_1: Nhà cung cấp ưu tiên cao nhất
     * - Chất lượng tốt nhất
     * - Giao hàng nhanh, đúng hạn
     * - Giá cả cạnh tranh
     * - Ưu tiên chọn khi nhập hàng
     */
    TIER_1,

    /**
     * TIER_2: Nhà cung cấp chất lượng tốt
     * - Chất lượng ổn định
     * - Thời gian giao hàng hợp lý
     * - Lựa chọn thứ 2 khi TIER_1 không có hàng
     */
    TIER_2,

    /**
     * TIER_3: Nhà cung cấp dự phòng
     * - Chất lượng chấp nhận được
     * - Chỉ dùng khi cần gấp hoặc TIER_1/2 không có
     * - Default cho nhà cung cấp mới
     */
    TIER_3
}
