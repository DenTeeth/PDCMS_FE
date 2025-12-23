'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bell, CheckCheck, Eye, Calendar, FileText, CreditCard, AlertCircle, Info, Clock } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NOTIFICATION_ICONS, NOTIFICATION_TYPE_LABELS } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const getNotificationIcon = (type: Notification['type']) => {
  const iconMap: Record<Notification['type'], React.ReactNode> = {
    APPOINTMENT_CREATED: <Calendar className="h-5 w-5 text-blue-600" />,
    APPOINTMENT_UPDATED: <Calendar className="h-5 w-5 text-blue-600" />,
    APPOINTMENT_CANCELLED: <AlertCircle className="h-5 w-5 text-red-600" />,
    APPOINTMENT_REMINDER: <Clock className="h-5 w-5 text-yellow-600" />,
    APPOINTMENT_COMPLETED: <CheckCheck className="h-5 w-5 text-green-600" />,
    TREATMENT_PLAN_APPROVED: <FileText className="h-5 w-5 text-green-600" />,
    TREATMENT_PLAN_UPDATED: <FileText className="h-5 w-5 text-blue-600" />,
    PAYMENT_RECEIVED: <CreditCard className="h-5 w-5 text-green-600" />,
    SYSTEM_ANNOUNCEMENT: <Info className="h-5 w-5 text-purple-600" />,
    REQUEST_TIME_OFF_PENDING: <Calendar className="h-5 w-5 text-orange-600" />,
    REQUEST_OVERTIME_PENDING: <Clock className="h-5 w-5 text-orange-600" />,
    REQUEST_PART_TIME_PENDING: <FileText className="h-5 w-5 text-orange-600" />,
  };
  return iconMap[type] || <Bell className="h-5 w-5 text-gray-600" />;
};

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch (error) {
    return dateString;
  }
};

export default function PatientNotificationsPage() {
  const router = useRouter();
  const {
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
    getNotificationPath,
    hasMore,
    currentPage,
    totalPages,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(0, 20);
  }, [loadNotifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const totalCount = notifications.length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    const navigationPath = getNotificationPath(notification);
    if (navigationPath) {
      router.push(navigationPath);
    }
  };

  return (
    <ProtectedRoute requiredBaseRole="patient">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Thông báo</h1>
            <p className="text-muted-foreground">Cập nhật thông tin sức khỏe của bạn</p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Đã kết nối
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600 border-gray-600">
                Mất kết nối
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead} disabled={isLoading}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Đánh dấu đã đọc tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chưa đọc</p>
                  <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                </div>
                <Bell className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng cộng</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Đã đọc</p>
                  <p className="text-2xl font-bold text-green-600">{readCount}</p>
                </div>
                <CheckCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                Tất cả
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
                size="sm"
              >
                Chưa đọc
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                onClick={() => setFilter('read')}
                size="sm"
              >
                Đã đọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải thông báo...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không có thông báo</h3>
              <p className="text-muted-foreground">
                {filter === 'unread'
                  ? 'Bạn đã đọc hết tất cả thông báo!'
                  : filter === 'read'
                    ? 'Không có thông báo đã đọc.'
                    : 'Bạn chưa có thông báo nào.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {filteredNotifications.map((notification) => {
                const navigationPath = getNotificationPath(notification);
                return (
                  <Card
                    key={notification.notificationId}
                    className={cn(
                      'transition-all hover:shadow-md',
                      !notification.isRead && 'border-l-4 border-l-primary bg-primary/5'
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3
                                className={cn(
                                  'font-semibold',
                                  !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                                )}
                              >
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                              </Badge>
                              {!notification.isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await markAsRead(notification.notificationId);
                                  }}
                                  disabled={isLoading}
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <p
                            className={cn(
                              'mt-2',
                              !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{formatTime(notification.createdAt)}</span>
                            </div>
                            <div className="flex space-x-2">
                              {navigationPath && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Xem chi tiết
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await deleteNotification(notification.notificationId);
                                }}
                                disabled={isLoading}
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="text-center">
            <Button variant="outline" onClick={loadMore} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                'Tải thêm'
              )}
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
