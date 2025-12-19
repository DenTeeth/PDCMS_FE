package com.dental.clinic.management.notification.service.impl;

import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.notification.domain.Notification;
import com.dental.clinic.management.notification.dto.CreateNotificationRequest;
import com.dental.clinic.management.notification.dto.NotificationDTO;
import com.dental.clinic.management.notification.repository.NotificationRepository;
import com.dental.clinic.management.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public NotificationDTO createNotification(CreateNotificationRequest request) {
        log.info("Creating notification for user: {}, type: {}", request.getUserId(), request.getType());

        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .relatedEntityType(request.getRelatedEntityType())
                .relatedEntityId(request.getRelatedEntityId())
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification created with ID: {}", savedNotification.getNotificationId());

        NotificationDTO notificationDTO = convertToDTO(savedNotification);

        // Push real-time notification qua WebSocket
        try {
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + request.getUserId(),
                    notificationDTO);
            log.info("WebSocket notification sent to user: {}", request.getUserId());
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to user {}: {}", request.getUserId(), e.getMessage());
            // Không throw exception vì thông báo đã được lưu vào DB
        }

        return notificationDTO;
    }

    @Override
    public void markAsRead(Long notificationId, Integer userId) {
        log.info("Marking notification {} as read for user: {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("NOTIFICATION_NOT_FOUND",
                        "Notification not found with ID: " + notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("User không có quyền đánh dấu thông báo này");
        }

        if (!notification.getIsRead()) {
            notificationRepository.markAsRead(notificationId, userId);
            log.info("Notification {} marked as read", notificationId);
        }
    }

    @Override
    public void markAllAsRead(Integer userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        notificationRepository.markAllAsRead(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(Integer userId) {
        Long count = notificationRepository.countUnreadByUserId(userId);
        log.debug("Unread count for user {}: {}", userId, count);
        return count;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotifications(Integer userId, Pageable pageable) {
        log.debug("Getting notifications for user: {}, page: {}", userId, pageable.getPageNumber());
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::convertToDTO);
    }

    @Override
    public void deleteNotification(Long notificationId, Integer userId) {
        log.info("Deleting notification {} for user: {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("NOTIFICATION_NOT_FOUND",
                        "Notification not found with ID: " + notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("User không có quyền xóa thông báo này");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted successfully", notificationId);
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .notificationId(notification.getNotificationId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
