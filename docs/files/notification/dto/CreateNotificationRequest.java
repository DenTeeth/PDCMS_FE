package com.dental.clinic.management.notification.dto;

import com.dental.clinic.management.notification.enums.NotificationEntityType;
import com.dental.clinic.management.notification.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    @NotNull(message = "User ID không được để trống")
    private Integer userId;

    @NotNull(message = "Loại thông báo không được để trống")
    private NotificationType type;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String message;

    private NotificationEntityType relatedEntityType;

    private String relatedEntityId;
}
