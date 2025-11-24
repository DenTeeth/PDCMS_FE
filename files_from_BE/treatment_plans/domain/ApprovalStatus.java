package com.dental.clinic.management.treatment_plans.domain;

/**
 * Trạng thái phê duyệt của Lộ trình điều trị.
 * <p>
 * Enum này hỗ trợ quy trình duyệt giá (Price Approval Workflow) cho Custom
 * Treatment Plans.
 * Mục đích: Kiểm soát tài chính khi Bác sĩ có quyền ghi đè giá dịch vụ.
 *
 * @version V19
 * @since 2025-11-12
 */
public enum ApprovalStatus {

    /**
     * DRAFT: Bản nháp.
     * - Bác sĩ đang soạn thảo, chưa gửi duyệt.
     * - Có thể chỉnh sửa tự do.
     */
    DRAFT,

    /**
     * PENDING_REVIEW: Chờ duyệt.
     * - Bác sĩ đã gửi lên Quản lý/Trưởng khoa.
     * - Không thể chỉnh sửa (cần thu hồi về DRAFT trước).
     */
    PENDING_REVIEW,

    /**
     * APPROVED: Đã duyệt.
     * - Quản lý đã phê duyệt giá.
     * - Lộ trình này có thể kích hoạt (API 5.5) và đặt lịch.
     */
    APPROVED,

    /**
     * REJECTED: Từ chối.
     * - Quản lý từ chối (giá không hợp lý, policy vi phạm...).
     * - Bác sĩ cần chỉnh sửa và gửi lại.
     */
    REJECTED
}
