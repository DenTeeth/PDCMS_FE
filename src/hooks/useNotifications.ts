/**
 * Custom hook for Notification System
 * Handles both REST API and WebSocket real-time notifications
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/cookies';
import { getUserIdFromToken } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';
import { notificationWebSocket } from '@/services/notificationWebSocket';
import { Notification, PaginatedNotificationResponse } from '@/types/notification';
import { toast } from 'sonner';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  // Actions
  loadNotifications: (page?: number, size?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  getNotificationPath: (notification: Notification) => string | null;
  // Pagination
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async (page: number = 0, size: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedNotificationResponse = await notificationService.getNotifications(page, size);
      
      if (page === 0) {
        setNotifications(response.content);
      } else {
        setNotifications((prev) => [...prev, ...response.content]);
      }
      
      setCurrentPage(response.pageable.pageNumber);
      setTotalPages(response.totalPages);
      setHasMore(!response.last);
    } catch (err: any) {
      // Handle 403 Forbidden - Missing VIEW_NOTIFICATION permission
      if (err?.response?.status === 403) {
        const errorMessage = 'Bạn chưa có quyền xem thông báo. Vui lòng liên hệ admin để được cấp quyền VIEW_NOTIFICATION.';
        setError(errorMessage);
        console.error('[Notifications] 403 Forbidden - Missing VIEW_NOTIFICATION permission:', err.response?.data);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải thông báo';
        setError(errorMessage);
        console.error('[Notifications] Load error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load more notifications (pagination)
   */
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await loadNotifications(currentPage + 1);
    }
  }, [hasMore, isLoading, currentPage, loadNotifications]);

  /**
   * Refresh unread count
   */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      // Silently handle 403 - user doesn't have permission, just set count to 0
      if (err?.response?.status === 403) {
        console.warn('[Notifications] 403 Forbidden - Missing VIEW_NOTIFICATION permission for unread count');
        setUnreadCount(0);
      } else {
        console.error('[Notifications] Unread count error:', err);
      }
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      
      // Decrease unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] Mark as read error:', err);
      toast.error('Không thể đánh dấu đã đọc');
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      console.error('[Notifications] Mark all as read error:', err);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      // Find notification before delete to check if unread
      const notification = notifications.find((n) => n.notificationId === notificationId);
      
      await notificationService.deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      
      // Update unread count if notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      toast.success('Đã xóa thông báo');
    } catch (err) {
      console.error('[Notifications] Delete error:', err);
      toast.error('Không thể xóa thông báo');
    }
  }, [notifications]);

  /**
   * Get navigation path for notification based on entity type
   */
  const getNotificationPath = useCallback((notification: Notification): string | null => {
    if (!notification.relatedEntityType || !notification.relatedEntityId) {
      return null;
    }

    switch (notification.relatedEntityType) {
      case 'TIME_OFF_REQUEST':
        return `/admin/time-off-requests/${notification.relatedEntityId}`;
      case 'OVERTIME_REQUEST':
        return `/admin/overtime-requests/${notification.relatedEntityId}`;
      case 'PART_TIME_REGISTRATION':
        // Part-time registration ID is numeric, navigate to registrations page with filter
        return `/admin/registration-requests`;
      case 'APPOINTMENT':
        return `/admin/appointments/${notification.relatedEntityId}`;
      case 'TREATMENT_PLAN':
        return `/admin/treatment-plans/${notification.relatedEntityId}`;
      default:
        return null;
    }
  }, []);

  /**
   * Handle new real-time notification
   */
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('[Notifications] New notification received:', notification);

    // Special debug log for "Tạo lịch thành công" flow
    if (
      notification.type === 'APPOINTMENT_CREATED' &&
      notification.relatedEntityType === 'APPOINTMENT'
    ) {
      console.groupCollapsed(
        '%c[Appointment → Notification]',
        'color: #2563eb; font-weight: 600;',
      );
      console.log('📌 Loại thông báo:', notification.type);
      console.log('👤 userId nhận thông báo:', notification.userId);
      console.log('🗓 Mã cuộc hẹn (relatedEntityId):', notification.relatedEntityId);
      console.log('🕒 Thời gian tạo thông báo (createdAt):', notification.createdAt);
      console.log('📝 Tiêu đề:', notification.title);
      console.log('💬 Nội dung:', notification.message);
      console.groupEnd();
    }
    
    // Add to beginning of list
    setNotifications((prev) => [notification, ...prev]);
    
    // Increment unread count
    setUnreadCount((prev) => prev + 1);
    
    // Get navigation path
    const navigationPath = getNotificationPath(notification);
    
    // Show toast notification with action button if navigation available
    if (navigationPath) {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
        action: {
          label: 'Xem chi tiết',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = navigationPath;
            }
          },
        },
      });
    } else {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }
  }, [getNotificationPath]);

  /**
   * Connect WebSocket and load initial data when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = getToken();
      
      if (token) {
        // Extract userId from token
        const userId = getUserIdFromToken(token);
        
        if (userId) {
          // Connect to WebSocket
          notificationWebSocket.connect(token, userId);
          
          // Register callback for new notifications
          const unsubscribe = notificationWebSocket.onNotification(handleNewNotification);
          
          // Load initial data
          loadNotifications();
          refreshUnreadCount();
          
          // Check connection status periodically
          const statusInterval = setInterval(() => {
            setIsConnected(notificationWebSocket.getConnectionStatus());
          }, 1000);
          
          return () => {
            unsubscribe();
            clearInterval(statusInterval);
            notificationWebSocket.disconnect();
          };
        } else {
          console.warn('[Notifications] Could not extract userId from token');
        }
      }
    }
  }, [isAuthenticated, user, handleNewNotification, loadNotifications, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    getNotificationPath,
    hasMore,
    currentPage,
    totalPages,
  };
};

