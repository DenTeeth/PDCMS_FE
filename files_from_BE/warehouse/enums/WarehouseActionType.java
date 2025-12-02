package com.dental.clinic.management.warehouse.enums;

/**
 * Loại hành động trong Warehouse Audit Log
 * Tracking mọi thay đổi nhạy cảm trong kho
 */
public enum WarehouseActionType {
    /**
     * Tạo mới (Item, Batch, Transaction)
     */
    CREATE,

    /**
     * Cập nhật thông tin
     */
    UPDATE,

    /**
     * Xóa
     */
    DELETE,

    /**
     * Điều chỉnh số lượng kho (Adjustment)
     * VD: Kiểm kê phát hiện thiếu/thừa
     */
    ADJUST,

    /**
     * Cảnh báo sắp hết hạn
     * Tự động log khi batch gần hết HSD
     */
    EXPIRE_ALERT,

    /**
     * Chuyển kho (Transfer between locations)
     */
    TRANSFER,

    /**
     * Hủy/Thất thoát
     */
    DISCARD
}
