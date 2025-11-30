'use client';

/**
 * Treatment Plan Detail Component
 * Redesigned with Timeline/Progress Steps View
 */

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { TreatmentPlanDetailResponse, ApprovalStatus, ItemDetailDTO, PlanItemStatus } from '@/types/treatmentPlan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProgressSummary from './ProgressSummary';
import TreatmentPlanPhase from './TreatmentPlanPhase';
import ApproveRejectSection from './ApproveRejectSection';
import UpdatePricesModal from './UpdatePricesModal';
import type { LucideIcon } from 'lucide-react';
import {
  User,
  UserCog,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  Loader2,
  AlertTriangle,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import React from 'react';
import { format } from 'date-fns';
import { TREATMENT_PLAN_STATUS_COLORS } from '@/types/treatmentPlan';
import { cn } from '@/lib/utils';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { useAuth } from '@/contexts/AuthContext';

interface TreatmentPlanDetailProps {
  plan: TreatmentPlanDetailResponse;
  onViewAppointment?: (appointmentCode: string) => void;
  onBookAppointment?: (itemId: number) => void;
  showActions?: boolean;
  onPlanUpdated?: () => void; // Phase 3.5: Callback to refresh plan data
  onBookPlanItems?: (items: ItemDetailDTO[]) => void;
}

export default function TreatmentPlanDetail({
  plan,
  onViewAppointment,
  onBookAppointment,
  showActions = true,
  onPlanUpdated,
  onBookPlanItems,
}: TreatmentPlanDetailProps) {
  const { user } = useAuth();
  const statusInfo = TREATMENT_PLAN_STATUS_COLORS[plan.status];

  const canCreateAppointment = Boolean(
    user?.permissions?.includes('CREATE_APPOINTMENT')
  );
  // V21: API 5.12 - Submit for Review
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // V21.4: API 5.13 - Update Prices (Finance)
  const [showUpdatePricesModal, setShowUpdatePricesModal] = useState(false);

  // Phase 5: Bulk selection for booking
  const [selectedPlanItemIds, setSelectedPlanItemIds] = useState<number[]>([]);

  const allPlanItems = useMemo(
    () => plan.phases.flatMap((phase) => phase.items),
    [plan.phases]
  );

  const selectedPlanItems = useMemo(
    () => allPlanItems.filter((item) => selectedPlanItemIds.includes(item.itemId)),
    [allPlanItems, selectedPlanItemIds]
  );

  // Normalize approval status (backend may return string or null/undefined)
  // Note: approvalStatus và status là 2 cột riêng biệt trong DB
  // - status: TreatmentPlanStatus (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
  // - approvalStatus: ApprovalStatus (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
  const normalizeApprovalStatus = (status?: ApprovalStatus | string | null): ApprovalStatus => {
    // Nếu không có approvalStatus, mặc định là DRAFT (theo BE: default value)
    if (!status) return ApprovalStatus.DRAFT;
    if (typeof status === 'string') {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'DRAFT') return ApprovalStatus.DRAFT;
      if (upperStatus === 'PENDING_REVIEW' || upperStatus === 'PENDING_APPROVAL') return ApprovalStatus.PENDING_REVIEW;
      if (upperStatus === 'APPROVED') return ApprovalStatus.APPROVED;
      if (upperStatus === 'REJECTED') return ApprovalStatus.REJECTED;
      // Nếu không match, mặc định là DRAFT
      return ApprovalStatus.DRAFT;
    }
    return status as ApprovalStatus;
  };

  const normalizedApprovalStatus = normalizeApprovalStatus(plan.approvalStatus);
  const rejectionNote = plan.approvalMetadata?.notes?.trim();
  const isRejectedState =
    normalizedApprovalStatus === ApprovalStatus.REJECTED ||
    (normalizedApprovalStatus === ApprovalStatus.DRAFT && Boolean(rejectionNote));
  const isRejected = normalizedApprovalStatus === ApprovalStatus.REJECTED && Boolean(rejectionNote);
  const isReturnedToDraft =
    normalizedApprovalStatus === ApprovalStatus.DRAFT && Boolean(rejectionNote);
  const shouldShowRejectionBanner = (isRejected || isReturnedToDraft) && Boolean(rejectionNote);

  useEffect(() => {
    setSelectedPlanItemIds((prev) =>
      prev.filter((id) =>
        allPlanItems.some(
          (item) => item.itemId === id && item.status === PlanItemStatus.READY_FOR_BOOKING
        )
      )
    );
  }, [allPlanItems]);

  const readyForBookingItems = useMemo(
    () => allPlanItems.filter((item) => item.status === PlanItemStatus.READY_FOR_BOOKING),
    [allPlanItems]
  );

  const readyForBookingCount = readyForBookingItems.length;
  const canBulkBook =
    showActions &&
    canCreateAppointment &&
    normalizedApprovalStatus === ApprovalStatus.APPROVED &&
    readyForBookingCount > 0;

  const selectedTotalDuration = selectedPlanItems.reduce(
    (sum, item) => sum + (item.estimatedTimeMinutes || 0),
    0
  );

  const handleTogglePlanItemSelection = (item: ItemDetailDTO) => {
    if (
      !canBulkBook ||
      !canCreateAppointment ||
      item.status !== PlanItemStatus.READY_FOR_BOOKING
    ) {
      return;
    }
    setSelectedPlanItemIds((prev) =>
      prev.includes(item.itemId) ? prev.filter((id) => id !== item.itemId) : [...prev, item.itemId]
    );
  };

  const clearSelectedPlanItems = () => setSelectedPlanItemIds([]);

  const handleBookSelectedPlanItems = () => {
    if (!canCreateAppointment) {
      toast.error('Bạn không có quyền đặt lịch hẹn.');
      return;
    }
    if (!selectedPlanItems.length) {
      toast.error('Vui lòng chọn ít nhất một hạng mục READY_FOR_BOOKING.');
      return;
    }
    if (!onBookPlanItems) {
      toast.error('Chức năng đặt lịch nhiều hạng mục chưa khả dụng.');
      return;
    }
    onBookPlanItems(selectedPlanItems);
    setSelectedPlanItemIds([]);
  };

  const hasApprovePermission = Boolean(user?.permissions?.includes('APPROVE_TREATMENT_PLAN'));
  const hasManagePricingPermission = Boolean(user?.permissions?.includes('MANAGE_PLAN_PRICING'));
  const hasEditPermission = Boolean(
    user?.permissions?.some(permission =>
      ['CREATE_TREATMENT_PLAN', 'UPDATE_TREATMENT_PLAN'].includes(permission),
    ),
  );

  const treatmentStatusDescriptions: Record<
    string,
    string
  > = {
    PENDING: 'Lộ trình vừa được tạo, chưa bắt đầu thực hiện cho bệnh nhân.',
    IN_PROGRESS: 'Các hạng mục đang được triển khai, theo dõi tiến độ từng giai đoạn.',
    COMPLETED: 'Tất cả hạng mục đã hoàn thành. Có thể xem lại kết quả điều trị.',
    CANCELLED: 'Lộ trình đã bị hủy. Liên hệ quản lý để biết thêm chi tiết.',
  };

  const approvalStatusDescriptions: Record<ApprovalStatus, string> = {
    [ApprovalStatus.DRAFT]:
      'Bác sĩ có thể chỉnh sửa nội dung, bổ sung hạng mục và gửi quản lý duyệt.',
    [ApprovalStatus.PENDING_REVIEW]:
      'Đang chờ quản lý kiểm tra và phê duyệt. Nội dung bị khóa tạm thời.',
    [ApprovalStatus.PENDING_APPROVAL]:
      'Đang chờ quản lý kiểm tra và phê duyệt. Nội dung bị khóa tạm thời.',
    [ApprovalStatus.APPROVED]:
      'Quản lý đã duyệt. Lộ trình khóa nội dung và chờ kích hoạt (do BE xử lý).',
    [ApprovalStatus.REJECTED]:
      'Quản lý đã từ chối. Kiểm tra lý do và chỉnh sửa trước khi gửi lại.',
  };

  const approvalBadgeStyles: Record<
    ApprovalStatus | 'WARNING',
    { bg: string; text: string; label: string }
  > = {
    DRAFT: { bg: 'bg-slate-100 text-slate-700', text: 'text-slate-600', label: 'Bản nháp' },
    PENDING_REVIEW: {
      bg: 'bg-amber-100 text-amber-800',
      text: 'text-amber-700',
      label: 'Chờ duyệt',
    },
    PENDING_APPROVAL: {
      bg: 'bg-amber-100 text-amber-800',
      text: 'text-amber-700',
      label: 'Chờ duyệt',
    },
    APPROVED: {
      bg: 'bg-emerald-100 text-emerald-800',
      text: 'text-emerald-700',
      label: 'Đã duyệt',
    },
    REJECTED: {
      bg: 'bg-red-100 text-red-800',
      text: 'text-red-700',
      label: 'Đã từ chối',
    },
    WARNING: {
      bg: 'bg-red-100 text-red-800',
      text: 'text-red-700',
      label: 'Bị trả về',
    },
  };
  const approvalBadge = approvalBadgeStyles[isRejectedState ? 'WARNING' : normalizedApprovalStatus];

  type BannerVariant = 'info' | 'warning' | 'success' | 'danger';
  const actionBanner = (() => {
    if (isRejectedState && hasEditPermission) {
      return {
        variant: 'danger' as BannerVariant,
        title: 'Lộ trình đã bị trả về',
        message: 'Vui lòng xem lý do từ quản lý, chỉnh sửa các hạng mục cần thiết và gửi duyệt lại.',
        note: rejectionNote,
      };
    }
    if (normalizedApprovalStatus === ApprovalStatus.DRAFT && hasEditPermission) {
      return {
        variant: 'info' as BannerVariant,
        title: 'Lộ trình đang ở trạng thái nháp',
        message: 'Hoàn tất giai đoạn & hạng mục bắt buộc, sau đó bấm "Gửi duyệt" để thông báo quản lý.',
      };
    }
    if (normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW && hasApprovePermission) {
      return {
        variant: 'warning' as BannerVariant,
        title: 'Bạn có yêu cầu duyệt mới',
        message: 'Kiểm tra nội dung lộ trình rồi sử dụng khu vực "Duyệt/Từ chối" bên dưới.',
      };
    }
    if (normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW && hasEditPermission) {
      return {
        variant: 'info' as BannerVariant,
        title: 'Đang chờ quản lý duyệt',
        message: 'Nội dung bị khóa tạm thời. Bạn sẽ nhận thông báo khi quản lý xử lý xong.',
      };
    }
    if (normalizedApprovalStatus === ApprovalStatus.APPROVED) {
      return {
        variant: 'success' as BannerVariant,
        title: 'Lộ trình đã được duyệt',
        message: 'Bạn có thể theo dõi tiến độ điều trị.',
      };
    }
    return null;
  })();

  const bannerStyleMap: Record<BannerVariant, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
  };

  const bannerIconMap: Record<BannerVariant, LucideIcon> = {
    info: Info,
    warning: AlertTriangle,
    success: ShieldCheck,
    danger: AlertTriangle,
  };

  type StepState = 'done' | 'current' | 'todo' | 'warning';
  const approvalSteps: Array<{
    key: string;
    title: string;
    description: string;
    state: StepState;
  }> = [
    {
      key: 'draft',
      title: 'Bác sĩ soạn thảo',
      description: isRejectedState
        ? 'Đang bị trả về. Cần chỉnh sửa theo ghi chú.'
        : 'Có thể chỉnh sửa & gửi duyệt.',
      state: isRejectedState
        ? 'warning'
        : normalizedApprovalStatus === ApprovalStatus.DRAFT
          ? 'current'
          : 'done',
    },
    {
      key: 'pending',
      title: 'Chờ quản lý duyệt',
      description: 'Quản lý kiểm tra và quyết định duyệt hay trả về.',
      state:
        normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW
          ? 'current'
          : normalizedApprovalStatus === ApprovalStatus.APPROVED
            ? 'done'
            : 'todo',
    },
    {
      key: 'approved',
      title: 'Khóa & triển khai',
      description: 'Sau khi duyệt, lộ trình được khóa và chờ kích hoạt.',
      state: normalizedApprovalStatus === ApprovalStatus.APPROVED ? 'current' : 'todo',
    },
  ] as const;

  // Debug: Log approval status and permissions for troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 TreatmentPlanDetail Debug:', {
      planCode: plan.planCode,
      status: plan.status, // TreatmentPlanStatus (PENDING, IN_PROGRESS, etc.)
      approvalStatus: plan.approvalStatus, // ApprovalStatus (DRAFT, PENDING_REVIEW, etc.) - có thể null/undefined
      normalizedApprovalStatus,
      userPermissions: user?.permissions,
      userPermissionsCount: user?.permissions?.length || 0,
      hasCreatePermission: user?.permissions?.includes('CREATE_TREATMENT_PLAN'),
      hasUpdatePermission: user?.permissions?.includes('UPDATE_TREATMENT_PLAN'),
      hasApprovePermission: user?.permissions?.includes('APPROVE_TREATMENT_PLAN'),
      // Check if APPROVE_TREATMENT_PLAN exists in permissions array
      approvePermissionCheck: user?.permissions?.find(p => p.includes('APPROVE') || p.includes('approve')),
      phasesCount: plan.phases.length,
      hasItems: plan.phases.some(p => p.items.length > 0),
      canSubmitForReview: (user?.permissions?.includes('CREATE_TREATMENT_PLAN') || user?.permissions?.includes('UPDATE_TREATMENT_PLAN')) &&
        normalizedApprovalStatus === ApprovalStatus.DRAFT &&
        plan.phases.length > 0 &&
        plan.phases.some(p => p.items.length > 0),
      shouldShowApproveSection: normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW &&
        user?.permissions?.includes('APPROVE_TREATMENT_PLAN'),
      // Detailed check for approve section
      approveSectionCheck: {
        isPendingReview: normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW,
        hasPermission: user?.permissions?.includes('APPROVE_TREATMENT_PLAN'),
        shouldShow: normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW &&
          user?.permissions?.includes('APPROVE_TREATMENT_PLAN'),
      },
    });
  }

  // Check if can submit for review
  // Điều kiện: approvalStatus === DRAFT (hoặc null/undefined - mặc định là DRAFT)
  const canSubmitForReview =
    (user?.permissions?.includes('CREATE_TREATMENT_PLAN') || user?.permissions?.includes('UPDATE_TREATMENT_PLAN')) &&
    normalizedApprovalStatus === ApprovalStatus.DRAFT &&
    plan.phases.length > 0 &&
    plan.phases.some(p => p.items.length > 0);

  // Handle submit for review
  const handleSubmitForReview = async () => {
    if (!canSubmitForReview) return;

    setIsSubmitting(true);
    try {
      // API 5.12 returns updated plan with approvalStatus = PENDING_REVIEW
      const updatedPlan = await TreatmentPlanService.submitForReview(plan.planCode, {
        notes: submitNotes || undefined,
      });

      console.log('✅ Submit for review success - API 5.12 response:', {
        planCode: updatedPlan.planCode,
        status: updatedPlan.status,
        approvalStatus: updatedPlan.approvalStatus, // Should be "PENDING_REVIEW"
        normalized: normalizeApprovalStatus(updatedPlan.approvalStatus),
      });

      toast.success('Đã gửi duyệt lộ trình điều trị', {
        description: 'Lộ trình đã được gửi lên quản lý để duyệt',
      });

      setShowSubmitDialog(false);
      setSubmitNotes('');

      // Refresh plan data - onPlanUpdated will reload from API 5.2
      // This ensures we get the latest data including approvalStatus
      // Note: Có thể có delay nhỏ trong DB, nên cần refresh để đảm bảo có approvalStatus mới nhất
      if (onPlanUpdated) {
        // Add small delay to ensure DB transaction is committed
        await new Promise(resolve => setTimeout(resolve, 300));
        await onPlanUpdated();
      }
    } catch (error: any) {
      console.error('Error submitting for review:', error);
      if (error.response?.status === 409) {
        toast.error('Lộ trình đã được gửi duyệt rồi', {
          description: error.response?.data?.message || 'Không thể gửi duyệt lộ trình ở trạng thái này',
        });
      } else if (error.response?.status === 400) {
        toast.error('Không thể gửi duyệt', {
          description: error.response?.data?.message || 'Lộ trình phải có ít nhất 1 giai đoạn và 1 hạng mục',
        });
      } else {
        toast.error('Không thể gửi duyệt. Vui lòng thử lại.', {
          description: error.response?.data?.message || error.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa có';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null || amount === 0) {
      return '-';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getPaymentTypeText = (paymentType: string) => {
    const map: Record<string, string> = {
      FULL: 'Trả một lần',
      PHASED: 'Trả theo giai đoạn',
      INSTALLMENT: 'Trả góp',
    };
    return map[paymentType] || paymentType;
  };

  // Calculate overall progress
  const overallProgress = plan.progressSummary.totalItems > 0
    ? (plan.progressSummary.completedItems / plan.progressSummary.totalItems) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Rejection/Return Notice Banner */}
      {shouldShowRejectionBanner && (
        <Card className="border-2 border-red-300 bg-red-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-red-500 p-2">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-red-900">
                    {isRejected ? 'Lộ trình đã bị từ chối' : 'Lộ trình đã bị trả về bản nháp'}
                  </h3>
                  <Badge variant="destructive" className="text-xs">
                    Cần chỉnh sửa
                  </Badge>
                </div>
                <p className="text-sm text-red-700">
                  {isRejected
                    ? 'Lộ trình này đã bị quản lý từ chối. Vui lòng xem lý do bên dưới và chỉnh sửa trước khi gửi duyệt lại.'
                    : 'Lộ trình này đã bị quản lý trả về bản nháp. Vui lòng xem ghi chú bên dưới và cập nhật kế hoạch trước khi gửi duyệt lại.'}
                </p>
                <div className="mt-4 rounded-lg border-2 border-red-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-red-900 text-sm">
                        {isRejected ? 'Lý do từ chối từ quản lý:' : 'Ghi chú từ quản lý:'}
                      </p>
                      <p className="text-red-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {rejectionNote}
                      </p>
                    </div>
                  </div>
                </div>
                {plan.approvalMetadata?.approvedBy && (
                  <div className="text-xs text-red-600 mt-2">
                    <span className="font-medium">Người xử lý:</span>{' '}
                    {typeof plan.approvalMetadata.approvedBy === 'string'
                      ? plan.approvalMetadata.approvedBy
                      : plan.approvalMetadata.approvedBy.fullName ||
                      plan.approvalMetadata.approvedBy.employeeCode}
                    {plan.approvalMetadata.approvedAt && (
                      <span className="ml-2">
                        • {new Date(plan.approvalMetadata.approvedAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Header Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-2xl">{plan.planName}</CardTitle>
                <Badge
                  style={{
                    backgroundColor: statusInfo.bg,
                    borderColor: statusInfo.border,
                    color: 'white',
                  }}
                  className="text-sm px-3 py-1 whitespace-nowrap"
                >
                  {statusInfo.text}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  Mã lộ trình: <span className="font-mono font-semibold">{plan.planCode}</span>
                </div>
                {/* Approval Status Helper Text */}
                <div className="text-xs space-y-0.5">
                  {normalizedApprovalStatus === ApprovalStatus.APPROVED && (
                    <div className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã được duyệt
                    </div>
                  )}
                  {normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW && (
                    <div className="text-yellow-700 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Đang chờ quản lý duyệt
                    </div>
                  )}
                  {isRejectedState && (
                    <div className="text-red-600 font-medium">
                      {isRejected ? 'Lộ trình đã bị từ chối' : 'Lộ trình bị trả về bản nháp'}
                    </div>
                  )}
                  {normalizedApprovalStatus === ApprovalStatus.DRAFT && !isRejectedState && (
                    <div className="text-gray-600">
                      Lộ trình đang ở trạng thái bản nháp
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* V21: API 5.12 - Submit for Review Button */}
            {canSubmitForReview && (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Gửi duyệt
              </Button>
            )}
            {/* V21.4: API 5.13 - Update Prices Button (Finance/Manager only) */}
            {hasManagePricingPermission && (
              <Button
                onClick={() => setShowUpdatePricesModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Điều chỉnh giá
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall Progress Bar */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tiến độ tổng thể</span>
              <span className="text-muted-foreground">
                {plan.progressSummary.completedItems} / {plan.progressSummary.totalItems} hạng mục
                {' '}
                <span className="font-semibold text-primary">
                  ({overallProgress.toFixed(1)}%)
                </span>
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Hide actionBanner if rejection banner is already shown to avoid duplication */}
          {actionBanner && !shouldShowRejectionBanner && (() => {
            const BannerIcon = bannerIconMap[actionBanner.variant];
            return (
              <div
                className={cn(
                  'mt-4 rounded-lg border p-4',
                  bannerStyleMap[actionBanner.variant],
                )}
              >
                <div className="flex items-start gap-3">
                  <BannerIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-base">{actionBanner.title}</p>
                    <p>{actionBanner.message}</p>
                    {actionBanner.note && (
                      <div className="rounded-md bg-white/70 px-3 py-2 text-sm font-medium text-red-700">
                        Lý do từ quản lý: <span className="font-normal">{actionBanner.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <RefreshCw className="h-4 w-4" />
              Thống kê tiến độ điều trị
            </div>
            <ProgressSummary progress={plan.progressSummary} />
          </div>

          <div className="mt-8">
            <div className="mb-6 flex items-center gap-2 text-sm font-semibold">
              <RefreshCw className="h-4 w-4 text-primary" />
              Quy trình phê duyệt
            </div>

            {/* Stepper Design */}
            <div className="relative mb-12 px-8">
              {/* Steps Container */}
              <div className="relative flex justify-between items-center">
                {approvalSteps.map((step, index) => {
                  const isDone = step.state === 'done';
                  const isCurrent = step.state === 'current';
                  const isWarning = step.state === 'warning';
                  const isLast = index === approvalSteps.length - 1;

                  return (
                    <React.Fragment key={step.key}>
                      {/* Step */}
                      <div className="flex flex-col items-center group relative z-10">
                        {/* Step Circle */}
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white text-base font-bold transition-all duration-300 cursor-pointer',
                            isDone && 'border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-200',
                            isCurrent && 'border-primary text-primary shadow-lg shadow-primary/30 scale-110',
                            isWarning && 'border-red-500 text-red-600 shadow-lg shadow-red-200',
                            !isDone && !isCurrent && !isWarning && 'border-gray-300 text-gray-400'
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : isCurrent ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : isWarning ? (
                            <AlertTriangle className="h-6 w-6" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        {/* Tooltip on Hover - Removed icons from description */}
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl min-w-[200px]">
                            <div className="font-semibold mb-1">{step.title}</div>
                            <div className="text-gray-300">{step.description}</div>
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                          </div>
                        </div>

                        {/* Step Label */}
                        <div className="mt-3 text-center">
                          <p className={cn(
                            "text-xs font-medium transition-colors whitespace-nowrap",
                            isDone && "text-emerald-600",
                            isCurrent && "text-primary font-semibold",
                            isWarning && "text-red-600",
                            !isDone && !isCurrent && !isWarning && "text-gray-500"
                          )}>
                            {step.title}
                          </p>
                        </div>
                      </div>

                      {/* Connecting Line (only between steps, not after last) */}
                      {!isLast && (
                        <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative -mt-12">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              isDone ? "bg-emerald-500" : "bg-transparent"
                            )}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Info Stats - Colored Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {/* Doctor Info */}
            <div className="rounded-lg bg-purple-50 p-4 border border-purple-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Bác sĩ phụ trách</span>
              </div>
              <div className="font-bold text-gray-900 truncate">{plan.doctor.fullName}</div>
              <div className="text-xs text-purple-600 font-mono mt-1">{plan.doctor.employeeCode}</div>
            </div>

            {/* Patient Info */}
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Bệnh nhân</span>
              </div>
              <div className="font-bold text-gray-900 truncate">{plan.patient.fullName}</div>
              <div className="text-xs text-blue-600 font-mono mt-1">{plan.patient.patientCode}</div>
            </div>

            {/* Dates */}
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Thời gian</span>
              </div>
              <div className="font-bold text-gray-900">
                {formatDate(plan.startDate)}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                Kết thúc: {formatDate(plan.expectedEndDate)}
              </div>
            </div>

            {/* Financial */}
            {(plan.finalCost != null || plan.totalPrice != null) && (
              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Chi phí</span>
                </div>
                {plan.finalCost != null && (
                  <div className="font-bold text-lg text-emerald-600">
                    {formatCurrency(plan.finalCost)}
                  </div>
                )}
                {plan.discountAmount != null && plan.discountAmount > 0 && plan.totalPrice != null && (
                  <div className="text-xs text-gray-500 line-through mt-1">
                    {formatCurrency(plan.totalPrice)}
                  </div>
                )}
                <div className="text-xs text-emerald-600 mt-1">
                  {getPaymentTypeText(plan.paymentType)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {canBulkBook && (
        <Card className="border border-dashed border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">
                Đặt lịch trực tiếp từ hạng mục READY_FOR_BOOKING
              </p>
              {selectedPlanItemIds.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Đã chọn {selectedPlanItemIds.length} hạng mục
                  {selectedTotalDuration > 0 && ` · Tổng thời gian ~ ${selectedTotalDuration} phút`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chọn các hạng mục ở trạng thái READY_FOR_BOOKING để đặt lịch nhiều dịch vụ cùng lúc.
                </p>
              )}
              {selectedPlanItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPlanItems.map((item) => (
                    <span
                      key={item.itemId}
                      className="px-2 py-1 text-xs border rounded-full bg-white text-muted-foreground"
                    >
                      {item.itemName}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleBookSelectedPlanItems}
                disabled={selectedPlanItemIds.length === 0}
              >
                Đặt lịch ({selectedPlanItemIds.length})
              </Button>
              <Button
                variant="outline"
                onClick={clearSelectedPlanItems}
                disabled={selectedPlanItemIds.length === 0}
              >
                Bỏ chọn
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline/Progress Steps View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Các Giai Đoạn Điều Trị
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {plan.progressSummary.completedPhases} / {plan.progressSummary.totalPhases} giai đoạn hoàn thành
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {plan.phases.length > 0 ? (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              {/* Phases as Steps */}
              <div className="space-y-4 relative">
                {plan.phases.map((phase, index) => {
                  const isCompleted = phase.status === 'COMPLETED';
                  const isInProgress = phase.status === 'IN_PROGRESS';
                  const isPending = phase.status === 'PENDING';

                  return (
                    <div key={phase.phaseId} className="relative">
                      {/* Timeline Step Indicator */}
                      <div className="flex items-start gap-4">
                        {/* Step Circle */}
                        <div className={cn(
                          "relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-background transition-all",
                          isCompleted && "bg-green-500 text-white",
                          isInProgress && "bg-blue-500 text-white",
                          isPending && "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <span className="font-bold text-sm">{phase.phaseNumber}</span>
                          )}
                        </div>

                        {/* Phase Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <TreatmentPlanPhase
                            phase={phase}
                            onViewAppointment={onViewAppointment}
                            onBookAppointment={onBookAppointment}
                            showActions={showActions}
                            isLast={index === plan.phases.length - 1}
                            planApprovalStatus={normalizedApprovalStatus}
                            selectionEnabled={canBulkBook}
                            selectedItemIds={selectedPlanItemIds}
                            onToggleItemSelection={handleTogglePlanItemSelection}
                            canBookItems={canCreateAppointment}
                            onPhaseUpdated={() => {
                              // Phase 3.5: Phase updated - refresh plan data
                              if (onPlanUpdated) {
                                onPlanUpdated();
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có giai đoạn nào trong lộ trình này</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* V21: Bước 3 - Approve/Reject Section */}
      {/* Chỉ check permission, không check role (theo yêu cầu dự án) */}
      {normalizedApprovalStatus === ApprovalStatus.PENDING_REVIEW &&
        user?.permissions?.includes('APPROVE_TREATMENT_PLAN') && (
          <ApproveRejectSection
            plan={plan}
            onPlanUpdated={(updatedPlan) => {
              // Refresh plan data after approve/reject
              if (onPlanUpdated) {
                onPlanUpdated();
              }
            }}
          />
        )}

      {/* V21.4: API 5.13 - Update Prices Modal */}
      <UpdatePricesModal
        open={showUpdatePricesModal}
        onClose={() => setShowUpdatePricesModal(false)}
        planCode={plan.planCode}
        planName={plan.planName}
        items={plan.phases.flatMap((phase) => phase.items)}
        currentTotalCost={plan.totalPrice}
        onSuccess={() => {
          if (onPlanUpdated) {
            onPlanUpdated();
          }
        }}
      />

      {/* V21: API 5.12 - Submit for Review Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi duyệt lộ trình điều trị</DialogTitle>
            <DialogDescription>
              Lộ trình sẽ được gửi lên quản lý để duyệt. Bạn có thể thêm ghi chú (tùy chọn).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="submitNotes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="submitNotes"
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                placeholder="Nhập ghi chú cho quản lý..."
                maxLength={1000}
                rows={4}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {submitNotes.length} / 1000 ký tự
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSubmitDialog(false);
                setSubmitNotes('');
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi duyệt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
