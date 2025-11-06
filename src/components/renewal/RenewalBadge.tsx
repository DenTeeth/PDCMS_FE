'use client';

/**
 * Renewal Notification Badge Component
 * 
 * Component hiển thị số lượng renewal requests đang chờ phản hồi
 * 
 * Chức năng:
 * - Poll API mỗi 5 phút để cập nhật số lượng pending renewals
 * - Hiển thị badge với số lượng (chỉ hiển thị khi count > 0)
 * - Click vào badge → Navigate đến trang renewals
 * 
 * Usage:
 * - Tích hợp vào sidebar hoặc header
 * - Chỉ hiển thị cho employee (không phải admin)
 * 
 * Dựa trên: CRON_JOB_AND_RENEWAL_API_GUIDE.md
 * Last updated: 2025-01-XX
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bell } from 'lucide-react';
import { renewalService } from '@/services/renewalService';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/permission';

/**
 * Props cho RenewalBadge component
 */
interface RenewalBadgeProps {
  /** 
   * Có hiển thị icon không 
   * Default: true
   */
  showIcon?: boolean;
  
  /** 
   * Custom className cho badge
   */
  className?: string;
  
  /**
   * Poll interval (milliseconds)
   * Default: 5 phút (5 * 60 * 1000)
   */
  pollInterval?: number;
}

/**
 * Renewal Notification Badge Component
 * 
 * Component này tự động poll API để lấy số lượng pending renewals
 * và hiển thị badge với số lượng
 */
export default function RenewalBadge({ 
  showIcon = true, 
  className = '',
  pollInterval = 5 * 60 * 1000 // 5 phút
}: RenewalBadgeProps) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();

  /**
   * Số lượng renewal requests đang chờ phản hồi
   */
  const [pendingCount, setPendingCount] = useState(0);
  
  /**
   * Loading state
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * Error state
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch số lượng pending renewals từ API
   * 
   * API: GET /api/v1/registrations/renewals/pending
   * 
   * Note: Chỉ trả về renewals có status = PENDING_ACTION
   * Chỉ trả về renewals của nhân viên hiện tại
   */
  const fetchPendingCount = async () => {
    try {
      setError(null);
      
      // Chỉ fetch nếu user là employee và có permission
      // (Admin không cần xem badge này)
      if (!hasPermission(Permission.VIEW_RENEWAL_OWN)) {
        setPendingCount(0);
        setLoading(false);
        return;
      }

      const renewals = await renewalService.getPendingRenewals();
      
      console.log('✅ [RenewalBadge] Fetched pending count:', renewals.length);
      
      setPendingCount(renewals.length || 0);
    } catch (err: any) {
      console.error('❌ [RenewalBadge] Failed to fetch pending count:', err);
      
      // Không hiển thị error cho user (badge là optional)
      // Chỉ log để debug
      setError(err.message || 'Failed to fetch');
      
      // Set count = 0 để ẩn badge
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch khi component mount
   * Và setup polling để cập nhật số lượng định kỳ
   */
  useEffect(() => {
    // Fetch ngay khi mount
    fetchPendingCount();

    // Poll mỗi 5 phút (hoặc theo pollInterval)
    // Note: Cron Job P9 chạy mỗi đêm 00:05 AM, nhưng vẫn nên poll
    // để cập nhật nếu có renewal mới được tạo hoặc status thay đổi
    const interval = setInterval(() => {
      fetchPendingCount();
    }, pollInterval);

    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, [pollInterval, hasPermission]);

  /**
   * Handle click vào badge → Navigate đến trang renewals
   */
  const handleClick = () => {
    router.push('/employee/renewals');
  };

  /**
   * Nếu không có pending renewals → Không hiển thị badge
   */
  if (loading || pendingCount === 0) {
    return null;
  }

  /**
   * Render badge với số lượng pending renewals
   */
  return (
    <button
      onClick={handleClick}
      className={`
        relative inline-flex items-center gap-2
        px-3 py-1.5
        bg-red-500 hover:bg-red-600
        text-white text-sm font-semibold
        rounded-full
        transition-all duration-200
        hover:shadow-lg
        cursor-pointer
        ${className}
      `}
      title={`${pendingCount} yêu cầu gia hạn đang chờ phản hồi`}
      aria-label={`${pendingCount} pending renewal requests`}
    >
      {showIcon && (
        <Bell className="h-4 w-4 animate-pulse" />
      )}
      
      <span>{pendingCount}</span>
      
      {/* Pulse animation để thu hút sự chú ý */}
      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" 
            style={{ animationDuration: '2s' }} 
            aria-hidden="true" />
    </button>
  );
}

/**
 * Simplified version: Chỉ hiển thị số (không có button, dùng cho inline)
 */
export function RenewalCountBadge({ className = '' }: { className?: string }) {
  const { hasPermission } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        if (!hasPermission(Permission.VIEW_RENEWAL_OWN)) {
          setPendingCount(0);
          return;
        }

        const renewals = await renewalService.getPendingRenewals();
        setPendingCount(renewals.length || 0);
      } catch {
        setPendingCount(0);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasPermission]);

  if (pendingCount === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`${className} flex items-center gap-1`}
    >
      <AlertCircle className="h-3 w-3" />
      {pendingCount}
    </Badge>
  );
}

