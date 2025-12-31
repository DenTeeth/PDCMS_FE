'use client';

/**
 * Employee Renewal Page
 * 
 * Trang này cho phép nhân viên:
 * 1. Xem danh sách renewal requests đang chờ phản hồi
 * 2. Phản hồi renewal (Đồng ý hoặc Từ chối)
 * 
 * Workflow:
 * - Cron Job P9 (00:05 AM mỗi đêm) tự động phát hiện lịch Fixed sắp hết hạn
 * - Tạo renewal request với status = PENDING_ACTION
 * - Nhân viên mở trang này → Xem danh sách renewal requests
 * - Nhân viên chọn "Đồng ý" hoặc "Từ chối"
 * - Nếu "Đồng ý" → Chờ Admin finalize (chọn ngày hết hạn mới)
 * - Nếu "Từ chối" → Lịch sẽ kết thúc theo ngày hết hạn hiện tại
 * 
 * Dựa trên: CRON_JOB_AND_RENEWAL_API_GUIDE.md
 * Last updated: 2025-01-XX
 */

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RotateCcw,
  AlertCircle,
  Info,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

// Import types và services
import { ShiftRenewal, RenewalStatus } from '@/types/renewal';
import { renewalService } from '@/services/renewalService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Helper function: Format date để hiển thị
 * @param dateString ISO date string
 * @returns Formatted date string (VD: "30/11/2025")
 */
const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return dateString;
  }
};

/**
 * Helper function: Format datetime để hiển thị
 * @param dateString ISO datetime string
 * @returns Formatted datetime string (VD: "30/11/2025 23:59")
 */
const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return dateString;
  }
};

/**
 * Helper function: Tính số ngày còn lại đến deadline
 * @param expiresAt Deadline datetime (ISO string)
 * @returns Số ngày còn lại (number)
 */
const getDaysRemaining = (expiresAt: string): number => {
  try {
    const expiresDate = parseISO(expiresAt);
    const now = new Date();
    const days = differenceInDays(expiresDate, now);
    return days >= 0 ? days : 0;
  } catch {
    return 0;
  }
};

/**
 * Helper function: Lấy badge color dựa trên số ngày còn lại
 * @param daysRemaining Số ngày còn lại
 * @returns Badge variant name
 */
const getUrgencyBadgeVariant = (daysRemaining: number): 'default' | 'secondary' | 'destructive' => {
  if (daysRemaining <= 3) {
    return 'destructive'; // Đỏ - Cấp bách
  } else if (daysRemaining <= 7) {
    return 'secondary'; // Vàng - Sắp đến hạn
  }
  return 'default'; // Xanh - Còn thời gian
};

// ==================== MAIN COMPONENT ====================
export default function EmployeeRenewalsPage() {
  const { user, hasPermission } = useAuth();

  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Danh sách renewal requests đang chờ phản hồi
   * Chỉ chứa các renewals có status = PENDING_ACTION
   */
  const [renewals, setRenewals] = useState<ShiftRenewal[]>([]);
  
  /**
   * Loading state khi fetch dữ liệu từ API
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * Modal state cho việc phản hồi renewal
   */
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<ShiftRenewal | null>(null);
  const [responseAction, setResponseAction] = useState<'CONFIRMED' | 'DECLINED' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [responding, setResponding] = useState(false);

  // ==================== FETCH DATA ====================

  /**
   * Fetch danh sách pending renewals từ API
   * 
   * API: GET /api/v1/registrations/renewals/pending
   * 
   * Note: Chỉ trả về renewals có status = PENDING_ACTION
   * Chỉ trả về renewals của nhân viên hiện tại (từ token)
   */
  const fetchRenewals = async () => {
    try {
      setLoading(true);
      console.log(' [fetchRenewals] Fetching pending renewals...');
      
      const data = await renewalService.getPendingRenewals();
      
      console.log(' [fetchRenewals] Received renewals:', {
        count: data.length,
        renewals: data
      });
      
      setRenewals(data || []);
    } catch (error: any) {
      console.error(' [fetchRenewals] Failed to fetch renewals:', error);
      
      // Hiển thị error message
      toast.error(error.message || 'Không thể tải danh sách renewal requests');
      
      // Set empty array để tránh crash
      setRenewals([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch renewals khi component mount
   * Và setup polling mỗi 5 phút để cập nhật dữ liệu mới
   */
  useEffect(() => {
    // Fetch ngay khi mount
    fetchRenewals();

    // Poll mỗi 5 phút để cập nhật renewals mới (nếu có)
    // Note: Cron Job P9 chạy mỗi đêm 00:05 AM, nhưng vẫn nên poll để
    // cập nhật nếu có renewal mới được tạo hoặc status thay đổi
    const interval = setInterval(() => {
      fetchRenewals();
    }, 5 * 60 * 1000); // 5 phút

    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, []);

  // ==================== HANDLERS ====================

  /**
   * Mở modal để phản hồi renewal
   * @param renewal Renewal request cần phản hồi
   * @param action Hành động: 'CONFIRMED' (đồng ý) hoặc 'DECLINED' (từ chối)
   */
  const handleOpenResponseModal = (renewal: ShiftRenewal, action: 'CONFIRMED' | 'DECLINED') => {
    setSelectedRenewal(renewal);
    setResponseAction(action);
    setDeclineReason(''); // Reset decline reason
    setShowResponseModal(true);
  };

  /**
   * Đóng modal phản hồi
   */
  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedRenewal(null);
    setResponseAction(null);
    setDeclineReason('');
  };

  /**
   * Xử lý phản hồi renewal (CONFIRMED hoặc DECLINED)
   * 
   * API: PATCH /api/v1/registrations/renewals/{renewalId}/respond
   * 
   * Validation:
   * - Nếu action = DECLINED → declineReason bắt buộc
   * - Renewal phải còn trong thời hạn (expires_at > NOW)
   */
  const handleRespondToRenewal = async () => {
    if (!selectedRenewal || !responseAction) {
      return;
    }

    // Validate: Nếu từ chối, phải có lý do
    if (responseAction === 'DECLINED' && !declineReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setResponding(true);

      console.log(' [handleRespondToRenewal] Responding to renewal:', {
        renewalId: selectedRenewal.renewalId,
        action: responseAction,
        hasDeclineReason: !!declineReason
      });

      // Gọi API để phản hồi
      const response = await renewalService.respondToRenewal(selectedRenewal.renewalId, {
        action: responseAction,
        declineReason: responseAction === 'DECLINED' ? declineReason.trim() : null
      });

      console.log(' [handleRespondToRenewal] Response successful:', response);

      // Hiển thị success message
      if (responseAction === 'CONFIRMED') {
        toast.success('Đã đồng ý gia hạn. Đợi Admin xác nhận và chọn ngày hết hạn mới.');
      } else {
        toast.success('Đã từ chối gia hạn. Lịch sẽ kết thúc theo ngày hết hạn hiện tại.');
      }

      // Đóng modal
      handleCloseResponseModal();

      // Refresh danh sách renewals
      // Renewal này sẽ không còn trong pending list nữa (status đã thay đổi)
      await fetchRenewals();
    } catch (error: any) {
      console.error(' [handleRespondToRenewal] Failed:', error);

      // Hiển thị error message
      toast.error(error.message || 'Không thể phản hồi renewal. Vui lòng thử lại.');
    } finally {
      setResponding(false);
    }
  };

  // ==================== PERMISSION CHECK ====================

  // ✅ BE đã thêm VIEW_RENEWAL_OWN và RESPOND_RENEWAL_OWN permissions (2025-12-30)
  const canViewRenewals = hasPermission(Permission.VIEW_RENEWAL_OWN);
  const canRespondToRenewals = hasPermission(Permission.RESPOND_RENEWAL_OWN);

  // ==================== RENDER ====================

  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_RENEWAL_OWN]}>
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yêu Cầu Gia Hạn Lịch Làm Việc</h1>
            <p className="text-gray-600 mt-1">
              Danh sách các yêu cầu gia hạn lịch làm việc đang chờ bạn phản hồi
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchRenewals}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* Info Card - Giải thích về Renewal */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  Hệ thống Renewal tự động
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  Hệ thống tự động phát hiện lịch làm việc cố định sắp hết hạn (28 ngày trước khi hết hạn) 
                  và tạo yêu cầu gia hạn. Bạn có thể đồng ý hoặc từ chối gia hạn.
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• <strong>Đồng ý:</strong> Lịch sẽ được gia hạn, Admin sẽ chọn ngày hết hạn mới</li>
                  <li>• <strong>Từ chối:</strong> Lịch sẽ kết thúc theo ngày hết hạn hiện tại</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && renewals.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Đang tải danh sách renewal requests...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && renewals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không có yêu cầu gia hạn nào
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Hiện tại không có lịch làm việc nào sắp hết hạn cần bạn phản hồi.
                Hệ thống sẽ tự động tạo yêu cầu gia hạn khi lịch của bạn sắp hết hạn.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Renewal Cards List */}
        {!loading && renewals.length > 0 && (
          <div className="space-y-4">
            {renewals.map((renewal) => {
              const daysRemaining = getDaysRemaining(renewal.expiresAt);
              const urgencyVariant = getUrgencyBadgeVariant(daysRemaining);

              return (
                <Card key={renewal.renewalId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          {renewal.workShiftName}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {/* Status Badge */}
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Đang chờ phản hồi
                          </Badge>
                          {/* Urgency Badge */}
                          <Badge variant={urgencyVariant}>
                            {daysRemaining === 0 
                              ? 'Hết hạn hôm nay' 
                              : `Còn ${daysRemaining} ngày để phản hồi`
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Message từ Backend */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">{renewal.message}</p>
                    </div>

                    {/* Chi tiết lịch hiện tại */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Chi tiết ca làm việc</Label>
                        <p className="text-sm font-medium">{renewal.shiftDetails}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Thời gian hiệu lực</Label>
                        <p className="text-sm">
                          {formatDate(renewal.effectiveFrom)} → {formatDate(renewal.effectiveTo)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Deadline phản hồi</Label>
                        <p className="text-sm font-medium text-red-600">
                          {formatDateTime(renewal.expiresAt)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Renewal ID</Label>
                        <p className="text-sm font-mono text-gray-600">{renewal.renewalId}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {canRespondToRenewals ? (
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          variant="default"
                          className="flex-1 flex items-center gap-2"
                          onClick={() => handleOpenResponseModal(renewal, 'CONFIRMED')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Đồng ý gia hạn
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 flex items-center gap-2"
                          onClick={() => handleOpenResponseModal(renewal, 'DECLINED')}
                        >
                          <XCircle className="h-4 w-4" />
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500 text-center">
                          Bạn không có quyền phản hồi yêu cầu gia hạn này
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && selectedRenewal && responseAction && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {responseAction === 'CONFIRMED' ? 'Xác nhận gia hạn' : 'Từ chối gia hạn'}
              </h2>

              {/* Thông tin renewal */}
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Ca làm việc:</strong> {selectedRenewal.workShiftName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Chi tiết:</strong> {selectedRenewal.shiftDetails}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Hiệu lực:</strong> {formatDate(selectedRenewal.effectiveFrom)} → {formatDate(selectedRenewal.effectiveTo)}
                </p>
              </div>

              {/* Nếu từ chối, hiển thị input để nhập lý do */}
              {responseAction === 'DECLINED' && (
                <div className="mb-4">
                  <Label htmlFor="declineReason" className="text-sm font-medium">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="declineReason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Nhập lý do từ chối gia hạn..."
                    className="mt-1"
                    disabled={responding}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng nhập lý do để hoàn tất thao tác từ chối.
                  </p>
                </div>
              )}

              {/* Confirmation message */}
              {responseAction === 'CONFIRMED' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Bạn sẽ đồng ý gia hạn lịch này. Admin sẽ xác nhận và chọn ngày hết hạn mới.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseResponseModal}
                  disabled={responding}
                >
                  Hủy
                </Button>
                <Button
                  variant={responseAction === 'CONFIRMED' ? 'default' : 'destructive'}
                  onClick={handleRespondToRenewal}
                  disabled={responding || (responseAction === 'DECLINED' && !declineReason.trim())}
                  className="flex items-center gap-2"
                >
                  {responding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {responseAction === 'CONFIRMED' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Xác nhận
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Từ chối
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

