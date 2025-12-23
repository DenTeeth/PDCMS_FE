'use client';

/**
 * admin/notifications-test
 *
 * Trang test đơn giản để gọi API:
 *   POST /api/v1/notifications/test-send
 * Backend sẽ gửi một thông báo SYSTEM_ANNOUNCEMENT cho chính tài khoản đang đăng nhập
 * và push qua WebSocket tới kênh `/topic/notifications/{account_id}`.
 *
 * Trang này chỉ dành cho QA/dev, có thể xoá sau khi hoàn tất kiểm thử.
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types/notification';
import { toast } from 'sonner';

export default function AdminNotificationTestPage() {
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTest = async () => {
    try {
      setIsLoading(true);
      const notif = await notificationService.sendTestNotification();
      setLastNotification(notif);
      toast.success('Đã gửi thông báo test thành công', {
        description: `${notif.title}: ${notif.message}`,
      });
    } catch (error) {
      console.error('[Notification Test] send-test failed', error);
      toast.error('Gửi thông báo test thất bại. Kiểm tra log BE để biết thêm chi tiết.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-start justify-center">
      <Card className="w-full max-w-3xl mt-8">
        <CardHeader>
          <CardTitle>Test gửi thông báo (Notification)</CardTitle>
          <CardDescription>
            Gọi API <code>POST /api/v1/notifications/test-send</code> để kiểm tra luồng tạo và
            đẩy thông báo real-time cho tài khoản hiện tại.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              - Sau khi bấm nút, bạn nên thấy:
              <br />
              &bull; 1 bản ghi notification mới trong danh sách & badge tăng lên.
              <br />
              &bull; Log WebSocket: &quot;Subscribed to /topic/notifications/&lt;account_id&gt;&quot; và
              &quot;New notification received&quot;.
            </p>
            <Button onClick={handleSendTest} disabled={isLoading}>
              {isLoading ? 'Đang gửi...' : 'Gửi thông báo test'}
            </Button>
          </div>

          {lastNotification && (
            <div className="border rounded-lg p-4 bg-muted/40">
              <h3 className="font-semibold mb-2">Thông báo mới nhất</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {lastNotification.notificationId}
                </div>
                <div>
                  <span className="font-medium">User ID:</span> {lastNotification.userId}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {lastNotification.type}
                </div>
                <div>
                  <span className="font-medium">Tiêu đề:</span> {lastNotification.title}
                </div>
                <div>
                  <span className="font-medium">Nội dung:</span> {lastNotification.message}</div>
                <div>
                  <span className="font-medium">Thời gian:</span> {lastNotification.createdAt}
                </div>
                {lastNotification.relatedEntityType && (
                  <div>
                    <span className="font-medium">Liên quan:</span>{' '}
                    {lastNotification.relatedEntityType} – {lastNotification.relatedEntityId}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}













