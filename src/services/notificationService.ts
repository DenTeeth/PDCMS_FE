/**
 * Notification REST API Service
 * Backend: /api/v1/notifications
 */

import { apiClient } from '@/lib/api';
import {
  Notification,
  CreateNotificationRequest,
  PaginatedNotificationResponse,
  NotificationApiResponse,
} from '@/types/notification';

const api = apiClient.getAxiosInstance();
const BASE_URL = '/notifications';

export const notificationService = {
  /**
   * Lấy danh sách thông báo (phân trang)
   * GET /api/v1/notifications?page=0&size=20
   */
  getNotifications: async (
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedNotificationResponse> => {
    const response = await api.get<NotificationApiResponse<PaginatedNotificationResponse> | PaginatedNotificationResponse>(
      BASE_URL,
      { params: { page, size } }
    );

    // BE docs: responses are wrapped as { statusCode, message, data }
    // But in some environments controller may return raw Page<NotificationDTO>.
    const raw = response.data as any;
    const pageData: PaginatedNotificationResponse = raw?.data ?? raw;

    return pageData;
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<NotificationApiResponse<number> | number>(
      `${BASE_URL}/unread-count`
    );

    const raw = response.data as any;
    const count: number = raw?.data ?? raw ?? 0;

    return count;
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   * PATCH /api/v1/notifications/{notificationId}/read
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.patch(`${BASE_URL}/${notificationId}/read`);
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * ✅ BE endpoint: PATCH /api/v1/notifications/read-all (BE controller line 123)
   */
  markAllAsRead: async (): Promise<void> => {
    await api.patch(`${BASE_URL}/read-all`);
  },

  /**
   * Xóa một thông báo
   * DELETE /api/v1/notifications/{notificationId}
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${notificationId}`);
  },

  /**
   * Tạo thông báo mới (Admin/System only)
   * POST /api/v1/notifications
   */
  createNotification: async (
    request: CreateNotificationRequest
  ): Promise<Notification> => {
    const response = await api.post<NotificationApiResponse<Notification>>(
      BASE_URL,
      request
    );
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<Notification>(response);
  },

  /**
   * Gửi thông báo test cho chính user hiện tại
   * POST /api/v1/notifications/test-send
   * (BE sẽ tự lấy account_id từ JWT)
   */
  sendTestNotification: async (): Promise<Notification> => {
    const response = await api.post<NotificationApiResponse<Notification> | Notification>(
      `${BASE_URL}/test-send`,
      {}
    );

    const raw = response.data as any;
    const notification: Notification = raw?.data ?? raw;
    return notification;
  },
};


