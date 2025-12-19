package com.dental.clinic.management.notification.service;

import com.dental.clinic.management.notification.dto.CreateNotificationRequest;
import com.dental.clinic.management.notification.dto.NotificationDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /**
     * Tạo thông báo mới và lưu vào database
     *
     * @param request thông tin thông báo
     * @return NotificationDTO
     */
    NotificationDTO createNotification(CreateNotificationRequest request);

    /**
     * Đánh dấu một thông báo là đã đọc
     *
     * @param notificationId ID thông báo
     * @param userId         ID người dùng
     */
    void markAsRead(Long notificationId, Integer userId);

    /**
     * Đánh dấu tất cả thông báo của user là đã đọc
     *
     * @param userId ID người dùng
     */
    void markAllAsRead(Integer userId);

    /**
     * Lấy số lượng thông báo chưa đọc của user
     *
     * @param userId ID người dùng
     * @return số lượng thông báo chưa đọc
     */
    Long getUnreadCount(Integer userId);

    /**
     * Lấy danh sách thông báo của user (có phân trang)
     *
     * @param userId   ID người dùng
     * @param pageable thông tin phân trang
     * @return Page<NotificationDTO>
     */
    Page<NotificationDTO> getUserNotifications(Integer userId, Pageable pageable);

    /**
     * Xóa thông báo
     *
     * @param notificationId ID thông báo
     * @param userId         ID người dùng
     */
    void deleteNotification(Long notificationId, Integer userId);
}
