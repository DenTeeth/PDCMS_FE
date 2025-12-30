/**
 * Notification System Types
 * Backend: /api/v1/notifications
 */

// Notification Type Enum - matches BE docs:
// - NOTIFICATION_SYSTEM_FE_INTEGRATION_GUIDE.md
// - NOTIFICATION_SYSTEM_FE_READY.md
// - REQUEST_NOTIFICATION_SYSTEM_FE_INTEGRATION_GUIDE.md
export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_COMPLETED'
  | 'TREATMENT_PLAN_APPROVED'
  | 'TREATMENT_PLAN_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'REQUEST_TIME_OFF_PENDING'
  | 'REQUEST_OVERTIME_PENDING'
  | 'REQUEST_PART_TIME_PENDING';

// Notification Entity Type Enum - matches BE
export type NotificationEntityType =
  | 'APPOINTMENT'
  | 'TREATMENT_PLAN'
  | 'PAYMENT'
  | 'SYSTEM'
  | 'TIME_OFF_REQUEST'
  | 'OVERTIME_REQUEST'
  | 'PART_TIME_REGISTRATION';

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
  APPOINTMENT_REMINDER: '⏰',
  APPOINTMENT_COMPLETED: '✅',
  TREATMENT_PLAN_APPROVED: '🩺',
  TREATMENT_PLAN_UPDATED: '📋',
  PAYMENT_RECEIVED: '💰',
  SYSTEM_ANNOUNCEMENT: '📢',
  REQUEST_TIME_OFF_PENDING: '🏖️',
  REQUEST_OVERTIME_PENDING: '⏰',
  REQUEST_PART_TIME_PENDING: '📋',
};

// Notification type labels (Vietnamese)
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: 'Đặt lịch thành công',
  APPOINTMENT_UPDATED: 'Cập nhật lịch hẹn',
  APPOINTMENT_CANCELLED: 'Hủy lịch hẹn',
  APPOINTMENT_REMINDER: 'Nhắc nhở lịch hẹn',
  APPOINTMENT_COMPLETED: 'Hoàn thành khám',
  TREATMENT_PLAN_APPROVED: 'Phê duyệt kế hoạch điều trị',
  TREATMENT_PLAN_UPDATED: 'Cập nhật kế hoạch điều trị',
  PAYMENT_RECEIVED: 'Thanh toán thành công',
  SYSTEM_ANNOUNCEMENT: 'Thông báo hệ thống',
  REQUEST_TIME_OFF_PENDING: 'Nhắc nhở: Phê duyệt yêu cầu nghỉ phép',
  REQUEST_OVERTIME_PENDING: 'Nhắc nhở: Phê duyệt yêu cầu tăng ca',
  REQUEST_PART_TIME_PENDING: 'Nhắc nhở: Phê duyệt yêu cầu đăng ký ca',
};


