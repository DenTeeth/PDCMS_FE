'use client';

/**
 * Treatment Plan Progress Card Component
 * 
 * Displays a compact progress card for treatment plans
 * Used in dashboards and list views
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TreatmentPlanSummaryDTO, TreatmentPlanStatus, TREATMENT_PLAN_STATUS_COLORS } from '@/types/treatmentPlan';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, DollarSign, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreatmentPlanProgressCardProps {
  plan: TreatmentPlanSummaryDTO;
  onViewDetail?: (planCode: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function TreatmentPlanProgressCard({
  plan,
  onViewDetail,
  showActions = true,
  compact = false,
}: TreatmentPlanProgressCardProps) {
  const router = useRouter();

  // V32: Handle null status (when approval_status = DRAFT, plan not activated yet)
  const statusKey = plan.status || 'NULL';
  const statusColor = TREATMENT_PLAN_STATUS_COLORS[statusKey] || TREATMENT_PLAN_STATUS_COLORS.NULL;
  const statusLabel = plan.status === TreatmentPlanStatus.IN_PROGRESS 
    ? 'Đang điều trị' 
    : plan.status === TreatmentPlanStatus.COMPLETED 
    ? 'Hoàn thành' 
    : plan.status === TreatmentPlanStatus.PENDING 
    ? 'Chờ xử lý' 
    : plan.status === TreatmentPlanStatus.CANCELLED
    ? 'Đã hủy'
    : 'Chưa kích hoạt'; // null status

  // Calculate progress percentage
  // Note: TreatmentPlanSummaryDTO doesn't have progressSummary, so we'll show 0% or use a placeholder
  const progressPercentage = 0; // Will be updated when BE adds progressSummary to summary DTO

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(plan.planCode);
    } else {
      // Default navigation based on user role
      router.push(`/patient/treatment-plans/${plan.planCode}`);
    }
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewDetail}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm truncate">{plan.planName}</h3>
                <Badge variant={statusColor as any} className="text-xs">
                  {statusLabel}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate">Bệnh nhân: {plan.patientCode || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Bác sĩ: {plan.doctor?.fullName || 'N/A'}</span>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-1.5 mt-2" />
            </div>
            {showActions && (
              <Button variant="ghost" size="sm" className="shrink-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 line-clamp-2">{plan.planName}</CardTitle>
            <CardDescription className="text-xs">
              Mã: {plan.planCode}
            </CardDescription>
          </div>
          <Badge variant={statusColor as any} className="shrink-0">
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient & Doctor Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bệnh nhân</p>
              <p className="font-medium truncate">{plan.patientCode || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Bác sĩ</p>
              <p className="font-medium truncate">{plan.doctor?.fullName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-semibold">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Xem chi tiết để theo dõi tiến độ</span>
          </div>
        </div>

        {/* Dates & Financial */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {plan.startDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Bắt đầu</p>
                <p className="font-medium">
                  {format(new Date(plan.startDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
          )}
          {plan.expectedEndDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Dự kiến kết thúc</p>
                <p className="font-medium">
                  {format(new Date(plan.expectedEndDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
          )}
        </div>

        {plan.finalCost != null && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Chi phí</p>
              <p className="font-semibold text-primary">{formatCurrency(plan.finalCost)}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleViewDetail}
          >
            Xem chi tiết
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

