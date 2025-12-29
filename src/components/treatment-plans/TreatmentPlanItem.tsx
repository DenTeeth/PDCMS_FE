'use client';

/**
 * Treatment Plan Item Component
 * Displays a single item in a phase
 */

import { ItemDetailDTO, PLAN_ITEM_STATUS_COLORS, PlanItemStatus, AppointmentSuggestion, TimeSlot } from '@/types/treatmentPlan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, Eye, Lock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface TreatmentPlanItemProps {
  item: ItemDetailDTO;
  onViewAppointment?: (appointmentCode: string) => void;
  onBookAppointment?: (itemId: number) => void;
  showActions?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: ItemDetailDTO) => void;
  suggestion?: AppointmentSuggestion | null; // Auto-schedule suggestion for this item
  onSelectSlot?: (suggestion: AppointmentSuggestion, slot: TimeSlot) => void; // Handle slot selection
}

export default function TreatmentPlanItem({
  item,
  onViewAppointment,
  onBookAppointment,
  showActions = true,
  selectable = false,
  selected = false,
  onToggleSelect,
  suggestion,
  onSelectSlot,
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

  // Safe status checks with null/undefined handling
  const isReadyForBooking = item.status === PlanItemStatus.READY_FOR_BOOKING;
  const isWaitingForPrerequisite = item.status === PlanItemStatus.WAITING_FOR_PREREQUISITE;

  return (
    <Card className="hover:shadow-lg transition-all border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Item Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-semibold text-muted-foreground">
                  #{item.sequenceNumber}
                </span>
                <h4 className="font-bold text-lg">{item.itemName}</h4>
              </div>
              
              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {item.serviceCode && (
                  <Badge variant="outline" className="text-xs font-mono uppercase bg-slate-50 border-slate-300 px-2.5 py-1">
                    {item.serviceCode}
                  </Badge>
                )}
                <Badge
                  style={{
                    backgroundColor: finalStatusInfo.bg,
                    borderColor: finalStatusInfo.border,
                    color: 'white',
                  }}
                  className="rounded-full px-3 py-1 text-xs font-medium border shadow-sm"
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
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {item.estimatedTimeMinutes != null && item.estimatedTimeMinutes > 0 
                    ? `${item.estimatedTimeMinutes} phút` 
                    : 'Chưa có'}
                </span>
              </div>
              {item.price != null && item.price > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{formatCurrency(item.price)}</span>
                </div>
              )}
              {item.completedAt && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
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

            {/* Auto-Schedule Suggestions - Integrated into item */}
            {suggestion && suggestion.itemId === item.itemId && (
              <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-50/30 rounded-lg p-4">
                <div className="space-y-3">
                  {/* Suggestion Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Gợi ý lịch hẹn tự động</span>
                    </div>
                    <div className="flex gap-2">
                      {suggestion.holidayAdjusted && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs">
                          Ngày lễ
                        </Badge>
                      )}
                      {suggestion.spacingAdjusted && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                          Giãn cách
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Suggested Date */}
                  {suggestion.success && suggestion.suggestedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        Ngày gợi ý: {format(new Date(suggestion.suggestedDate), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}

                  {/* Warning */}
                  {suggestion.warning && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{suggestion.warning}</AlertDescription>
                    </Alert>
                  )}

                  {/* Adjustment Reason */}
                  {suggestion.adjustmentReason && !suggestion.warning && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-xs text-blue-800">
                        {suggestion.adjustmentReason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Available Time Slots */}
                  {suggestion.availableSlots && suggestion.availableSlots.length > 0 && (
                    <div>
                      <Separator className="my-3" />
                      <h5 className="font-semibold mb-2 text-sm flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Khung giờ trống:
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {suggestion.availableSlots.map((slot, idx) => (
                          <Button
                            key={idx}
                            variant={slot.available ? 'outline' : 'ghost'}
                            disabled={!slot.available || suggestion.requiresReassign}
                            size="sm"
                            className={cn(
                              'justify-start text-xs h-8',
                              slot.available && 'hover:bg-primary hover:text-primary-foreground border-primary/30',
                              !slot.available && 'opacity-50 cursor-not-allowed'
                            )}
                            onClick={() => slot.available && onSelectSlot?.(suggestion, slot)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {slot.startTime} - {slot.endTime}
                          </Button>
                        ))}
                      </div>
                      {suggestion.requiresReassign && (
                        <p className="text-xs text-muted-foreground mt-2">
                          ⚠️ Vui lòng chọn bác sĩ mới trước khi đặt lịch
                        </p>
                      )}
                    </div>
                  )}

                  {/* Error State */}
                  {!suggestion.success && suggestion.errorMessage && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{suggestion.errorMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-2 shrink-0">
              {isReadyForBooking && onBookAppointment && (
                <Button
                  size="sm"
                  onClick={() => onBookAppointment(item.itemId)}
                  className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
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

