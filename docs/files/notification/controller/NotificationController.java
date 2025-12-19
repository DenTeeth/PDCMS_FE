package com.dental.clinic.management.notification.controller;

import com.dental.clinic.management.exception.ResourceNotFoundException;
import com.dental.clinic.management.notification.dto.CreateNotificationRequest;
import com.dental.clinic.management.notification.dto.NotificationDTO;
import com.dental.clinic.management.notification.service.NotificationService;
import com.dental.clinic.management.utils.annotation.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

        private final NotificationService notificationService;

        /**
         * Extract account_id (userId) from JWT token.
         *
         * @param authentication Spring Security authentication object
         * @return Account ID from token
         */
        private Integer getUserIdFromToken(Authentication authentication) {
                if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
                        throw new ResourceNotFoundException("AUTHENTICATION_REQUIRED",
                                        "Valid JWT authentication required");
                }

                Jwt jwt = (Jwt) authentication.getPrincipal();
                Object claim = jwt.getClaim("account_id");

                if (claim == null) {
                        throw new ResourceNotFoundException("ACCOUNT_ID_MISSING", "JWT token missing account_id claim");
                }

                if (claim instanceof Integer) {
                        return (Integer) claim;
                }
                if (claim instanceof Number) {
                        return ((Number) claim).intValue();
                }
                if (claim instanceof String) {
                        try {
                                return Integer.parseInt((String) claim);
                        } catch (NumberFormatException e) {
                                throw new IllegalArgumentException("Invalid account_id format in JWT: " + claim);
                        }
                }

                throw new IllegalStateException("Unsupported account_id claim type: " + claim.getClass().getName());
        }

        /**
         * Lấy danh sách thông báo của user hiện tại (có phân trang)
         * GET /api/v1/notifications?page=0&size=20
         */
        @GetMapping
        @ApiMessage("Lấy danh sách thông báo thành công")
        @PreAuthorize("hasAnyAuthority('VIEW_NOTIFICATION', 'MANAGE_NOTIFICATION')")
        public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        Authentication authentication) {
                Integer userId = getUserIdFromToken(authentication);
                log.info("Getting notifications for user: {}, page: {}, size: {}", userId, page, size);

                Pageable pageable = PageRequest.of(page, size);
                Page<NotificationDTO> notifications = notificationService.getUserNotifications(userId, pageable);

                return ResponseEntity.ok(notifications);
        }

        /**
         * Lấy số lượng thông báo chưa đọc
         * GET /api/v1/notifications/unread-count
         */
        @GetMapping("/unread-count")
        @ApiMessage("Lấy số lượng thông báo chưa đọc thành công")
        @PreAuthorize("hasAnyAuthority('VIEW_NOTIFICATION', 'MANAGE_NOTIFICATION')")
        public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
                Integer userId = getUserIdFromToken(authentication);
                log.info("Getting unread count for user: {}", userId);

                Long count = notificationService.getUnreadCount(userId);

                return ResponseEntity.ok(count);
        }

        /**
         * Đánh dấu một thông báo là đã đọc
         * PATCH /api/v1/notifications/{notificationId}/read
         */
        @PatchMapping("/{notificationId}/read")
        @ApiMessage("Đánh dấu đã đọc thành công")
        @PreAuthorize("hasAnyAuthority('VIEW_NOTIFICATION', 'MANAGE_NOTIFICATION')")
        public ResponseEntity<Void> markAsRead(
                        @PathVariable Long notificationId,
                        Authentication authentication) {
                Integer userId = getUserIdFromToken(authentication);
                log.info("User {} marking notification {} as read", userId, notificationId);

                notificationService.markAsRead(notificationId, userId);

                return ResponseEntity.ok().build();
        }

        /**
         * Đánh dấu tất cả thông báo là đã đọc
         * PATCH /api/v1/notifications/read-all
         */
        @PatchMapping("/read-all")
        @ApiMessage("Đánh dấu tất cả đã đọc thành công")
        @PreAuthorize("hasAnyAuthority('VIEW_NOTIFICATION', 'MANAGE_NOTIFICATION')")
        public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
                Integer userId = getUserIdFromToken(authentication);
                log.info("User {} marking all notifications as read", userId);

                notificationService.markAllAsRead(userId);

                return ResponseEntity.ok().build();
        }

        /**
         * Xóa một thông báo
         * DELETE /api/v1/notifications/{notificationId}
         */
        @DeleteMapping("/{notificationId}")
        @ApiMessage("Xóa thông báo thành công")
        @PreAuthorize("hasAnyAuthority('DELETE_NOTIFICATION', 'MANAGE_NOTIFICATION')")
        public ResponseEntity<Void> deleteNotification(
                        @PathVariable Long notificationId,
                        Authentication authentication) {
                Integer userId = getUserIdFromToken(authentication);
                log.info("User {} deleting notification {}", userId, notificationId);

                notificationService.deleteNotification(notificationId, userId);

                return ResponseEntity.ok().build();
        }

        /**
         * Tạo thông báo (chỉ dành cho ADMIN hoặc internal service calls)
         * POST /api/v1/notifications
         */
        @PostMapping
        @ApiMessage("Tạo thông báo thành công")
        @PreAuthorize("hasAuthority('MANAGE_NOTIFICATION')")
        public ResponseEntity<NotificationDTO> createNotification(
                        @Valid @RequestBody CreateNotificationRequest request) {
                log.info("Creating notification for user: {}, type: {}", request.getUserId(), request.getType());

                NotificationDTO notification = notificationService.createNotification(request);

                return ResponseEntity.status(HttpStatus.CREATED).body(notification);
        }

        /**
         * Test endpoint để gửi thông báo test cho chính user hiện tại
         * POST /api/v1/notifications/test-send
         * Dùng để verify WebSocket và database notification hoạt động
         */
        @PostMapping("/test-send")
        @ApiMessage("Gửi thông báo test thành công")
        @PreAuthorize("hasAnyAuthority('VIEW_NOTIFICATION', 'MANAGE_NOTIFICATION')")
        public ResponseEntity<NotificationDTO> testSendNotification(Authentication authentication) {
                Integer userId = getUserIdFromToken(authentication);
                log.info("TEST: Sending test notification to user: {}", userId);

                CreateNotificationRequest request = CreateNotificationRequest.builder()
                                .userId(userId)
                                .type(com.dental.clinic.management.notification.enums.NotificationType.SYSTEM_ANNOUNCEMENT)
                                .title("Test notification")
                                .message("This is a test notification sent at " + java.time.LocalDateTime.now())
                                .relatedEntityType(
                                                com.dental.clinic.management.notification.enums.NotificationEntityType.SYSTEM)
                                .relatedEntityId("TEST-" + System.currentTimeMillis())
                                .build();

                NotificationDTO notification = notificationService.createNotification(request);

                log.info("TEST: Test notification created successfully with ID: {}", notification.getNotificationId());

                return ResponseEntity.ok(notification);
        }
}
