package com.dental.clinic.management.notification.dto;

import com.dental.clinic.management.notification.enums.NotificationEntityType;
import com.dental.clinic.management.notification.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private Long notificationId;
    private Integer userId;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationEntityType relatedEntityType;
    private String relatedEntityId;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
