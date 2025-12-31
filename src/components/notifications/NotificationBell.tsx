'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, Loader2, WifiOff, Wifi, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NOTIFICATION_ICONS } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    hasMore,
    getNotificationPath,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    // Navigate to related entity if available
    const navigationPath = getNotificationPath(notification);
    if (navigationPath) {
      router.push(navigationPath);
      setIsOpen(false); // Close dropdown after navigation
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-10 w-10 rounded-full hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Thông báo${unreadCount > 0 ? ` - ${unreadCount} chưa đọc` : ''}`}
      >
        <Bell className="h-5 w-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-background"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        
        {/* Connection Status Indicator */}
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          )}
          title={isConnected ? 'Đang kết nối' : 'Mất kết nối'}
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Thông báo</h3>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          {/* Notification List */}
          <ScrollArea className="h-[400px]">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-sm">Không có thông báo</p>
              </div>
            ) : (
              <div className="divide-y pr-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={() => deleteNotification(notification.notificationId)}
                    formatTime={formatTime}
                    getNotificationPath={getNotificationPath}
                    markAsRead={markAsRead}
                    router={router}
                  />
                ))}
                
                {/* Load More */}
                {hasMore && (
                  <div className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Xem thêm
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

// Individual Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
  formatTime: (timestamp: string) => string;
  getNotificationPath: (notification: Notification) => string | null;
  markAsRead: (notificationId: number) => Promise<void>;
  router: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onDelete,
  formatTime,
  getNotificationPath,
  markAsRead,
  router,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigationPath = getNotificationPath(notification);

  const handleViewDetail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    if (navigationPath) {
      router.push(navigationPath);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 transition-colors relative group',
        notification.isRead ? 'bg-background' : 'bg-primary/5',
        'hover:bg-accent/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            'text-sm line-clamp-1',
            notification.isRead ? 'font-normal' : 'font-semibold'
          )}>
            {notification.title}
          </h4>
          
          {!notification.isRead && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatTime(notification.createdAt)}
          </span>
          <div className="flex items-center gap-2">
            {navigationPath && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleViewDetail}
              >
                <Eye className="h-3 w-3 mr-1" />
                Xem chi tiết
              </Button>
            )}
            {isHovered && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;

