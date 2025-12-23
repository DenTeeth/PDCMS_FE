'use client';

/**
 * Notification List Component for Dashboard
 * Displays recent notifications in a card format
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NOTIFICATION_ICONS } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationListProps {
  maxItems?: number; // Maximum number of notifications to display
  showViewAll?: boolean; // Show "View All" button
  viewAllHref?: string; // Custom href for "View All" link (default: /admin/notifications)
}

export const NotificationList: React.FC<NotificationListProps> = ({
  maxItems = 5,
  showViewAll = true,
  viewAllHref = '/admin/notifications',
}) => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    getNotificationPath,
  } = useNotifications();

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return timestamp;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    
    const navigationPath = getNotificationPath(notification);
    if (navigationPath) {
      router.push(navigationPath);
    }
  };

  // Get recent notifications (limit to maxItems)
  const recentNotifications = notifications.slice(0, maxItems);
  const hasUnread = unreadCount > 0;

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <CardTitle className="text-lg font-semibold">Thông báo gần đây</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {hasUnread && recentNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80 h-8"
                onClick={async (e) => {
                  e.stopPropagation();
                  await markAllAsRead();
                }}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
            {showViewAll && (
              <Link href={viewAllHref} className="text-sm text-primary hover:underline">
                Xem tất cả
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Không có thông báo</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {recentNotifications.map((notification) => {
                const navigationPath = getNotificationPath(notification);
                return (
                  <div
                    key={notification.notificationId}
                    className={cn(
                      'group relative p-4 rounded-lg border transition-all',
                      'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      notification.isRead
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-primary/5 border-primary/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={cn(
                              'text-sm line-clamp-1',
                              notification.isRead ? 'font-normal text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'
                            )}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {navigationPath && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!notification.isRead) {
                                  await markAsRead(notification.notificationId);
                                }
                                router.push(navigationPath);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Xem chi tiết
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationList;

