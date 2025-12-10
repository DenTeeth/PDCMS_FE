'use client';

/**
 * Treatment Plan Item Component
 * Displays a single item in a phase
 */

import { ItemDetailDTO, PLAN_ITEM_STATUS_COLORS, PlanItemStatus } from '@/types/treatmentPlan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, Eye, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

interface TreatmentPlanItemProps {
  item: ItemDetailDTO;
  onViewAppointment?: (appointmentCode: string) => void;
  onBookAppointment?: (itemId: number) => void;
  showActions?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: ItemDetailDTO) => void;
}

export default function TreatmentPlanItem({
  item,
  onViewAppointment,
  onBookAppointment,
  showActions = true,
  selectable = false,
  selected = false,
  onToggleSelect,
}: TreatmentPlanItemProps) {
  // Get status info with fallback for unknown statuses
  // Log warning if status is not recognized or missing
  const itemStatus = item.status;
  
  // Check if status exists
  if (!itemStatus) {
    console.warn(`Missing PlanItemStatus for item ${item.itemId} (itemName: ${item.itemName}). Status is: ${itemStatus}. Using fallback.`);
  }
  
  const statusInfo = itemStatus ? PLAN_ITEM_STATUS_COLORS[itemStatus] : null;
  if (!statusInfo && itemStatus) {
    console.warn(`Unknown PlanItemStatus: "${itemStatus}" for item ${item.itemId} (itemName: ${item.itemName}). Using fallback.`);
  }
  
  // Fallback: Use PENDING status if status is missing/null/undefined
  const finalStatusInfo = statusInfo || PLAN_ITEM_STATUS_COLORS[PlanItemStatus.PENDING] || {
    bg: '#6B7280',
    border: '#4B5563',
    text: itemStatus || 'Chưa xác định',
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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  const canSelect = selectable && item.status === PlanItemStatus.READY_FOR_BOOKING;
  
  // Safe status checks with null/undefined handling
  const isReadyForBooking = item.status === PlanItemStatus.READY_FOR_BOOKING;
  const isWaitingForPrerequisite = item.status === PlanItemStatus.WAITING_FOR_PREREQUISITE;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Item Header */}
            <div className="flex items-center gap-2 flex-wrap">
              {canSelect && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggleSelect?.(item)}
                  aria-label={`Chọn hạng mục ${item.itemName}`}
                />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                #{item.sequenceNumber}
              </span>
              <h4 className="font-semibold">{item.itemName}</h4>
              {item.serviceCode && (
                <Badge variant="outline" className="text-xs font-mono uppercase">
                  {item.serviceCode}
                </Badge>
              )}
              <Badge
                style={{
                  backgroundColor: finalStatusInfo.bg,
                  borderColor: finalStatusInfo.border,
                  color: 'white',
                }}
                title={
                  isWaitingForPrerequisite
                    ? item.waitingForServiceName
                      ? `Cần hoàn thành dịch vụ: ${item.waitingForServiceName}`
                      : 'Cần hoàn thành dịch vụ tiên quyết trước'
                    : itemStatus ? undefined : 'Trạng thái chưa được xác định'
                }
              >
                {isWaitingForPrerequisite && (
                  <Lock className="h-3 w-3 mr-1 inline" />
                )}
                {finalStatusInfo.text}
              </Badge>
            </div>

            {/* V21: Clinical Rules Messaging - Show prerequisite info */}
            {isWaitingForPrerequisite && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Đang chờ dịch vụ tiên quyết</p>
                    {item.waitingForServiceName ? (
                      <p className="text-xs mt-1">
                        Cần hoàn thành: <span className="font-semibold">{item.waitingForServiceName}</span> trước khi có thể đặt lịch cho dịch vụ này.
                      </p>
                    ) : (
                      <p className="text-xs mt-1">
                        Dịch vụ này cần hoàn thành các dịch vụ tiên quyết trước khi có thể đặt lịch.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Thời gian: {item.estimatedTimeMinutes != null && item.estimatedTimeMinutes > 0 
                    ? `${item.estimatedTimeMinutes} phút` 
                    : 'Chưa có'}
                </span>
              </div>
              {item.price != null && item.price > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Giá: {formatCurrency(item.price)}</span>
                </div>
              )}
              {item.completedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Hoàn thành: {formatDate(item.completedAt)}</span>
                </div>
              )}
            </div>

            {/* Linked Appointments */}
            {item.linkedAppointments && item.linkedAppointments.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm font-medium mb-2">Lịch hẹn liên kết:</div>
                <div className="space-y-1">
                  {item.linkedAppointments.map((apt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div>
                        <span className="font-medium">{apt.code}</span>
                        <span className="text-muted-foreground ml-2">
                          {formatDate(apt.scheduledDate)}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {apt.status}
                        </Badge>
                      </div>
                      {onViewAppointment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAppointment(apt.code)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-2">
              {isReadyForBooking && onBookAppointment && (
                <Button
                  size="sm"
                  onClick={() => onBookAppointment(item.itemId)}
                >
                  Đặt lịch
                </Button>
              )}
              {isWaitingForPrerequisite && (
                <Button
                  size="sm"
                  disabled
                  title={
                    item.waitingForServiceName
                      ? `Cần hoàn thành dịch vụ: ${item.waitingForServiceName} trước`
                      : 'Cần hoàn thành dịch vụ tiên quyết trước'
                  }
                  className="cursor-not-allowed"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Chờ dịch vụ tiên quyết
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

