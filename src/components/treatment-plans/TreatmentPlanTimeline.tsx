'use client';

/**
 * Treatment Plan Timeline Component
 * 
 * Displays a visual timeline of treatment plan phases and items
 * Shows progress and status for each phase
 */

import { TreatmentPlanDetailResponse, PhaseDetailDTO, ItemDetailDTO, PlanItemStatus } from '@/types/treatmentPlan';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, Calendar, ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TreatmentPlanTimelineProps {
  plan: TreatmentPlanDetailResponse;
  onItemClick?: (item: ItemDetailDTO) => void;
  onPhaseClick?: (phase: PhaseDetailDTO) => void;
  onAppointmentClick?: (appointmentCode: string) => void;
}

export default function TreatmentPlanTimeline({
  plan,
  onItemClick,
  onPhaseClick,
  onAppointmentClick,
}: TreatmentPlanTimelineProps) {
  const [openPopoverItemId, setOpenPopoverItemId] = useState<number | null>(null);

  const getItemStatusIcon = (status: PlanItemStatus | null | undefined) => {
    if (!status) {
      console.warn(`[TreatmentPlanTimeline] Missing status for item. Using default icon.`);
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
    
    switch (status) {
      case PlanItemStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case PlanItemStatus.IN_PROGRESS:
      case PlanItemStatus.SCHEDULED:
        return <Clock className="h-4 w-4 text-blue-600" />;
      case PlanItemStatus.WAITING_FOR_PREREQUISITE:
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case PlanItemStatus.READY_FOR_BOOKING:
        return <Clock className="h-4 w-4 text-purple-600" />;
      case PlanItemStatus.PENDING:
        return <Clock className="h-4 w-4 text-gray-600" />;
      case PlanItemStatus.SKIPPED:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        console.warn(`[TreatmentPlanTimeline] Unknown PlanItemStatus: "${status}". Using default icon.`);
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getItemStatusColor = (status: PlanItemStatus | null | undefined): string => {
    if (!status) {
      console.warn(`[TreatmentPlanTimeline] Missing status for item. Using default color.`);
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    switch (status) {
      case PlanItemStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case PlanItemStatus.IN_PROGRESS:
      case PlanItemStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case PlanItemStatus.WAITING_FOR_PREREQUISITE:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case PlanItemStatus.READY_FOR_BOOKING:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case PlanItemStatus.PENDING:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case PlanItemStatus.SKIPPED:
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        console.warn(`[TreatmentPlanTimeline] Unknown PlanItemStatus: "${status}". Using default color.`);
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseProgress = (phase: PhaseDetailDTO): number => {
    if (!phase.items || phase.items.length === 0) return 0;
    const completed = phase.items.filter(item => item.status === PlanItemStatus.COMPLETED).length;
    return Math.round((completed / phase.items.length) * 100);
  };

  return (
    <div className="space-y-6">
      {plan.phases && plan.phases.length > 0 ? (
        plan.phases.map((phase, phaseIndex) => {
          const phaseProgress = getPhaseProgress(phase);
          const isLastPhase = phaseIndex === plan.phases.length - 1;

          return (
            <div key={phase.phaseId} className="relative">
              {/* Timeline Line */}
              {!isLastPhase && (
                <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
              )}

              {/* Phase Card */}
              <Card 
                className={cn(
                  "relative hover:shadow-md transition-shadow",
                  onPhaseClick && "cursor-pointer"
                )}
                onClick={() => onPhaseClick?.(phase)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Phase Number/Icon */}
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
                        phase.status === 'COMPLETED' 
                          ? "bg-green-100 text-green-700 border-2 border-green-300"
                          : phase.status === 'IN_PROGRESS'
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-gray-100 text-gray-700 border-2 border-gray-300"
                      )}>
                        {phase.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          phase.phaseNumber
                        )}
                      </div>
                    </div>

                    {/* Phase Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{phase.phaseName}</h3>
                        </div>
                        <Badge variant={phase.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {phase.status === 'COMPLETED' ? 'Hoàn thành' : 
                           phase.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Chưa bắt đầu'}
                        </Badge>
                      </div>

                      {/* Phase Dates */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        {phase.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Bắt đầu: {format(new Date(phase.startDate), 'dd/MM/yyyy', { locale: vi })}</span>
                          </div>
                        )}
                        {phase.completionDate && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Hoàn thành: {format(new Date(phase.completionDate), 'dd/MM/yyyy', { locale: vi })}</span>
                          </div>
                        )}
                        {phase.estimatedDurationDays && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Dự kiến: {phase.estimatedDurationDays} ngày</span>
                          </div>
                        )}
                      </div>

                      {/* Phase Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tiến độ giai đoạn</span>
                          <span className="font-semibold">{phaseProgress}%</span>
                        </div>
                        <Progress value={phaseProgress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {phase.items?.filter(item => item.status === PlanItemStatus.COMPLETED).length || 0}/
                          {phase.items?.length || 0} hạng mục đã hoàn thành
                        </div>
                      </div>

                      {/* Phase Items */}
                      {phase.items && phase.items.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Hạng mục ({phase.items.length})</h4>
                          {phase.items.map((item, itemIndex) => {
                            const hasLinkedAppointments = item.linkedAppointments && item.linkedAppointments.length > 0;
                            const isPopoverOpen = openPopoverItemId === item.itemId;

                            return (
                              <div
                                key={item.itemId}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                  getItemStatusColor(item.status),
                                  (onItemClick || hasLinkedAppointments) && "cursor-pointer hover:shadow-sm"
                                )}
                                onClick={() => {
                                  if (hasLinkedAppointments) {
                                    setOpenPopoverItemId(isPopoverOpen ? null : item.itemId);
                                  } else {
                                    onItemClick?.(item);
                                  }
                                }}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {getItemStatusIcon(item.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm">
                                        {item.sequenceNumber}. {item.itemName}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                      {item.serviceCode && (
                                          <span className="font-mono">{item.serviceCode}</span>
                                        )}
                                        {item.estimatedTimeMinutes && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.estimatedTimeMinutes} phút
                                          </span>
                                      )}
                                      </div>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs shrink-0", getItemStatusColor(item.status))}
                                    >
                                      {!item.status ? 'Chưa xác định' :
                                       item.status === PlanItemStatus.COMPLETED ? 'Hoàn thành' :
                                       item.status === PlanItemStatus.IN_PROGRESS ? 'Đang thực hiện' :
                                       item.status === PlanItemStatus.SCHEDULED ? 'Đã đặt lịch' :
                                       item.status === PlanItemStatus.READY_FOR_BOOKING ? 'Sẵn sàng đặt lịch' :
                                       item.status === PlanItemStatus.WAITING_FOR_PREREQUISITE ? 'Chờ điều kiện' :
                                       item.status === PlanItemStatus.PENDING ? 'Chờ xử lý' :
                                       item.status === PlanItemStatus.SKIPPED ? 'Đã bỏ qua' :
                                       'Chưa bắt đầu'}
                                    </Badge>
                                  </div>
                                  {hasLinkedAppointments && (
                                    <Popover open={isPopoverOpen} onOpenChange={(open) => setOpenPopoverItemId(open ? item.itemId : null)}>
                                      <PopoverTrigger asChild>
                                        <div className="flex items-center gap-2 mt-2 text-xs cursor-pointer hover:text-primary transition-colors">
                                          <Calendar className="h-3 w-3" />
                                          <span className="text-muted-foreground hover:text-primary">
                                            {item.linkedAppointments.length} lịch hẹn
                                          </span>
                                          <ChevronDown className={cn("h-3 w-3 transition-transform", isPopoverOpen && "rotate-180")} />
                                        </div>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                                        <div className="p-3 border-b">
                                          <h4 className="font-semibold text-sm">Lịch sử lịch hẹn</h4>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {item.itemName}
                                          </p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                          {item.linkedAppointments.map((apt, aptIndex) => (
                                            <div
                                              key={aptIndex}
                                              className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onAppointmentClick) {
                                                  onAppointmentClick(apt.code);
                                                } else if (onItemClick) {
                                                  // Fallback: navigate to first appointment
                                                  onItemClick(item);
                                                }
                                              }}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs font-semibold">{apt.code}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                      {apt.status === 'COMPLETED' ? 'Hoàn thành' :
                                                       apt.status === 'SCHEDULED' ? 'Đã đặt lịch' :
                                                       apt.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                                                       apt.status === 'CANCELLED' ? 'Đã hủy' :
                                                       apt.status === 'NO_SHOW' ? 'Không đến' :
                                                       apt.status || 'Chưa xác định'}
                                                    </Badge>
                                                  </div>
                                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                      {apt.scheduledDate 
                                                        ? format(new Date(apt.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: vi })
                                                        : 'Chưa có ngày'}
                                                    </span>
                                                  </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                {onItemClick && !hasLinkedAppointments && (
                                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Chưa có giai đoạn nào trong lộ trình điều trị</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

