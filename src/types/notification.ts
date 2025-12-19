/**
 * Notification System Types
 * Backend: /api/v1/notifications
 */

// Notification Type Enum - matches BE docs:
// - NOTIFICATION_SYSTEM_FE_INTEGRATION_GUIDE.md
// - NOTIFICATION_SYSTEM_FE_READY.md
export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_DELAYED'
  | 'APPOINTMENT_COMPLETED'
  | 'TREATMENT_PLAN_CREATED'
  | 'TREATMENT_PLAN_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT';

// Notification Entity Type Enum - matches BE
export type NotificationEntityType =
  | 'APPOINTMENT'
  | 'TREATMENT_PLAN'
  | 'PAYMENT'
  | 'SYSTEM';

// Notification DTO - matches BE NotificationDTO
export interface Notification {
  notificationId: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: NotificationEntityType;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string; // ISO datetime
  readAt?: string; // ISO datetime
}

// Create Notification Request - matches BE CreateNotificationRequest
export interface CreateNotificationRequest {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: NotificationEntityType;
  relatedEntityId?: string;
}

// Paginated Response
export interface PaginatedNotificationResponse {
  content: Notification[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

// API Response wrapper
export interface NotificationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Notification icon mapping
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: '📅',
  APPOINTMENT_UPDATED: '📝',
  APPOINTMENT_CANCELLED: '❌',
  APPOINTMENT_DELAYED: '⏰',
  APPOINTMENT_COMPLETED: '✅',
  TREATMENT_PLAN_CREATED: '🩺',
  TREATMENT_PLAN_UPDATED: '📋',
  PAYMENT_RECEIVED: '💰',
  SYSTEM_ANNOUNCEMENT: '📢',
};

// Notification type labels (Vietnamese)
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: 'Đặt lịch thành công',
  APPOINTMENT_UPDATED: 'Cập nhật lịch hẹn',
  APPOINTMENT_CANCELLED: 'Hủy lịch hẹn',
  APPOINTMENT_DELAYED: 'Hoãn lịch hẹn',
  APPOINTMENT_COMPLETED: 'Hoàn thành khám',
  TREATMENT_PLAN_CREATED: 'Tạo kế hoạch điều trị',
  TREATMENT_PLAN_UPDATED: 'Cập nhật kế hoạch điều trị',
  PAYMENT_RECEIVED: 'Thanh toán thành công',
  SYSTEM_ANNOUNCEMENT: 'Thông báo hệ thống',
};


