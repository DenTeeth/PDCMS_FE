'use client';

/**
 * Reusable Treatment Plan List Component
 * Similar to AppointmentList component
 */

import { useMemo } from 'react';
import { OptimizedTable, OptimizedTableColumn } from '@/components/ui/optimized-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TreatmentPlanSummaryDTO, TreatmentPlanStatus, TREATMENT_PLAN_STATUS_COLORS } from '@/types/treatmentPlan';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface TreatmentPlanListProps {
  plans: TreatmentPlanSummaryDTO[];
  loading: boolean;
  onRowClick: (plan: TreatmentPlanSummaryDTO) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showActions?: boolean; // Show action buttons (default: true)
  patientCode?: string; // Patient code for navigation
}

export default function TreatmentPlanList({
  plans,
  loading,
  onRowClick,
  currentPage,
  totalPages,
  onPageChange,
  showActions = true,
  patientCode,
}: TreatmentPlanListProps) {
  const getStatusBadge = (plan: TreatmentPlanSummaryDTO) => {
    const status = plan.status;
    const approvalStatus = plan.approvalStatus;
    
    // Issue #47: BE auto-complete logic only runs on item status update
    // If plan has all phases completed but no recent action → status may still be null
    // Note: TreatmentPlanSummaryDTO doesn't have phases/progressSummary, so we can't calculate here
    // This is a limitation - BE should add progressSummary to SummaryDTO (Issue #35) or fix via SQL (Issue #47)
    
    // If status is null, determine based on approvalStatus
    if (status === null) {
      if (approvalStatus === 'APPROVED') {
        // Plan is approved but status is null
        // Could be: (1) Not started yet → PENDING, or (2) All phases completed but BE didn't update → COMPLETED
        // Without phases data, we can't determine. Show PENDING as default (plan not activated yet)
        // TODO: BE should add progressSummary to SummaryDTO (Issue #35) to enable accurate calculation
        const statusInfo = TREATMENT_PLAN_STATUS_COLORS['PENDING'];
        return (
          <Badge
            style={{
              backgroundColor: statusInfo.bg,
              borderColor: statusInfo.border,
              color: 'white',
            }}
          >
            {statusInfo.text}
          </Badge>
        );
      } else if (approvalStatus === 'DRAFT') {
        // Plan is still in draft → Show NULL/DRAFT
        const statusInfo = TREATMENT_PLAN_STATUS_COLORS['NULL'];
        return (
          <Badge
            style={{
              backgroundColor: statusInfo.bg,
              borderColor: statusInfo.border,
              color: '#6B7280',
            }}
          >
            {statusInfo.text}
          </Badge>
        );
      } else if (approvalStatus === 'PENDING_REVIEW' || approvalStatus === 'PENDING_APPROVAL') {
        // Plan is pending review → Show PENDING
        const statusInfo = TREATMENT_PLAN_STATUS_COLORS['PENDING'];
        return (
          <Badge
            style={{
              backgroundColor: statusInfo.bg,
              borderColor: statusInfo.border,
              color: 'white',
            }}
          >
            Chờ duyệt
          </Badge>
        );
      }
    }
    
    // Use actual status if available
    const statusKey = status || 'NULL';
    const statusInfo = TREATMENT_PLAN_STATUS_COLORS[statusKey];
    return (
      <Badge
        className="whitespace-nowrap"
        style={{
          backgroundColor: statusInfo.bg,
          borderColor: statusInfo.border,
          color: statusKey === 'NULL' ? '#6B7280' : 'white',
        }}
      >
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
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

  const columns: OptimizedTableColumn<TreatmentPlanSummaryDTO>[] = useMemo(() => [
    {
      key: 'planName',
      header: 'Tên Lộ trình',
      accessor: (plan) => (
        <div>
          <div className="font-medium">{plan.planName}</div>
          <div className="text-sm text-muted-foreground">ID: {plan.patientPlanId}</div>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Bác sĩ',
      accessor: (plan) => (
        <div>
          <div className="font-medium">{plan.doctor.fullName}</div>
          <div className="text-sm text-muted-foreground">{plan.doctor.employeeCode}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Thời gian',
      accessor: (plan) => (
        <div>
          <div className="text-sm">
            <span className="text-muted-foreground">Bắt đầu: </span>
            {formatDate(plan.startDate)}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Dự kiến: </span>
            {formatDate(plan.expectedEndDate)}
          </div>
        </div>
      ),
    },
    {
      key: 'paymentType',
      header: 'Hình thức thanh toán',
      accessor: (plan) => (
        <Badge variant="outline">
          {getPaymentTypeText(plan.paymentType)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      accessor: (plan) => getStatusBadge(plan),
    },
    ...(showActions ? [{
      key: 'actions',
      header: 'Thao tác',
      accessor: (plan) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(plan);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Xem
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    } as OptimizedTableColumn<TreatmentPlanSummaryDTO>] : []),
  ], [onRowClick, showActions]);

  return (
    <div className="space-y-4">
      {/* Table */}
      <OptimizedTable
        data={plans}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        emptyMessage="Không tìm thấy lộ trình điều trị nào"
      />

      {/* Pagination - Below table, centered */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <div className="text-sm font-medium min-w-[100px] text-center">
            Trang {currentPage + 1} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || loading}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

