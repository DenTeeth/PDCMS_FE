'use client';

/**
 * Treatment Plan Phase Component
 * Redesigned as expandable step in timeline
 */

import { ApprovalStatus, PhaseDetailDTO, ItemDetailDTO, PlanItemStatus } from '@/types/treatmentPlan';
// Issue #47 RESOLVED: No longer need calculatePhaseStatus - trust BE status directly
import { getPhaseProgress } from '@/utils/treatmentPlanStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Calendar, Clock, Plus, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import TreatmentPlanItem from './TreatmentPlanItem';
import AddItemsToPhaseModal from './AddItemsToPhaseModal';
import ReorderItems from './ReorderItems';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { GripVertical } from 'lucide-react';
import AutoScheduleConfigModal from './AutoScheduleConfigModal';
import { AutoScheduleRequest } from '@/types/treatmentPlan';

import { AppointmentSuggestion, TimeSlot } from '@/types/treatmentPlan';

interface TreatmentPlanPhaseProps {
  phase: PhaseDetailDTO;
  onViewAppointment?: (appointmentCode: string) => void;
  onBookAppointment?: (itemId: number) => void;
  showActions?: boolean;
  isLast?: boolean;
  onPhaseUpdated?: () => void; // Phase 3.5: Callback to refresh phase data
  planApprovalStatus?: ApprovalStatus;
  selectionEnabled?: boolean;
  selectedItemIds?: number[];
  onToggleItemSelection?: (item: ItemDetailDTO) => void;
  canBookItems?: boolean;
  suggestionsMap?: Map<number, AppointmentSuggestion>; // Map itemId -> suggestion
  onSelectSlot?: (suggestion: AppointmentSuggestion, slot: TimeSlot) => void; // Handle slot selection
  onPhaseAutoSchedule?: (phaseId: number, config: AutoScheduleRequest) => Promise<void>; // Handle phase-level auto-schedule
}

export default function TreatmentPlanPhase({
  phase,
  onViewAppointment,
  onBookAppointment,
  showActions = true,
  isLast = false,
  onPhaseUpdated,
  planApprovalStatus = ApprovalStatus.DRAFT,
  selectionEnabled = false,
  selectedItemIds = [],
  onToggleItemSelection,
  canBookItems = true,
  suggestionsMap,
  onSelectSlot,
  onPhaseAutoSchedule,
}: TreatmentPlanPhaseProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);

  // Phase 3.5: Check permission
  const canUpdate = user?.permissions?.includes('MANAGE_TREATMENT_PLAN') || false; // ✅ BE: MANAGE_TREATMENT_PLAN covers create/update/delete
  
  // V21.4: Emergent items (API 5.7) allowed for DRAFT and APPROVED plans
  const isDraftPlan = planApprovalStatus === ApprovalStatus.DRAFT;
  const isApprovedPlan = planApprovalStatus === ApprovalStatus.APPROVED;
  const isPendingApproval =
    planApprovalStatus === ApprovalStatus.PENDING_REVIEW ||
    planApprovalStatus === ApprovalStatus.PENDING_APPROVAL;
  const isApprovalLocked = isPendingApproval;

  // V21.4: Allow adding items when DRAFT (for editing) or APPROVED (for emergent items)
  const canAddItems =
    showActions &&
    canUpdate &&
    phase.status !== 'COMPLETED' &&
    !isApprovalLocked &&
    (isDraftPlan || isApprovedPlan);

  const getPhaseStatusColor = (status: string) => {
    const statusMap: Record<string, { bg: string; border: string; text: string }> = {
      PENDING: { bg: '#9CA3AF', border: '#6B7280', text: 'Chờ xử lý' },
      IN_PROGRESS: { bg: '#3B82F6', border: '#2563EB', text: 'Đang thực hiện' },
      COMPLETED: { bg: '#10B981', border: '#059669', text: 'Hoàn thành' },
    };
    return statusMap[status] || { bg: '#9CA3AF', border: '#6B7280', text: status };
  };

  // Issue #47 RESOLVED: BE has fixed existing data and ensures status is correct
  // Trust BE phase status directly - no need to calculate from items
  // BE (Issue #40) queries items directly from DB and auto-completes phases correctly
  const effectivePhaseStatus = phase.status || 'PENDING';
  const statusInfo = getPhaseStatusColor(effectivePhaseStatus);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa có';
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  // Use utility function for progress calculation
  const progress = getPhaseProgress(phase);

  // Calculate completed and total items for display
  const completedItems = phase.items?.filter(
    (item) => item.status === 'COMPLETED' || item.status === 'SKIPPED'
  ).length || 0;
  const totalItems = phase.items?.length || 0;

  // Use calculated status for display logic
  const isCompleted = effectivePhaseStatus === 'COMPLETED';
  const isInProgress = effectivePhaseStatus === 'IN_PROGRESS';

  // Check if phase can use auto-schedule
  const readyForBookingItems = phase.items?.filter(
    (item) => item.status === PlanItemStatus.READY_FOR_BOOKING
  ) || [];
  const canAutoSchedulePhase =
    canBookItems &&
    planApprovalStatus === ApprovalStatus.APPROVED &&
    readyForBookingItems.length > 0 &&
    !!onPhaseAutoSchedule;

  // Handle phase auto-schedule
  const handlePhaseAutoSchedule = async (config: AutoScheduleRequest) => {
    if (!onPhaseAutoSchedule) return;
    try {
      await onPhaseAutoSchedule(phase.phaseId, config);
      setShowAutoScheduleModal(false);
    } catch (error) {
      console.error('[TreatmentPlanPhase] Auto-schedule error:', error);
    }
  };

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isOpen && "shadow-md border-primary/20"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Phase Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        Giai đoạn {phase.phaseNumber}: {phase.phaseName}
                      </h3>
                      <Badge
                        style={{
                          backgroundColor: statusInfo.bg,
                          borderColor: statusInfo.border,
                          color: 'white',
                        }}
                        className="text-xs"
                      >
                        {statusInfo.text}
                      </Badge>
                    </div>

                    {/* Phase Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Bắt đầu: {formatDate(phase.startDate)}</span>
                      </div>
                      {phase.completionDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Hoàn thành: {formatDate(phase.completionDate)}</span>
                        </div>
                      )}
                      {phase.estimatedDurationDays && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Dự kiến: {phase.estimatedDurationDays} ngày</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse Icon */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(!isOpen);
                    }}
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {completedItems} / {totalItems} hạng mục hoàn thành
                    </span>
                    <span className={cn(
                      "font-semibold",
                      isCompleted && "text-green-600",
                      isInProgress && "text-blue-600",
                      !isCompleted && !isInProgress && "text-muted-foreground"
                    )}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={cn(
                      "h-2",
                      isCompleted && "[&>div]:bg-green-500",
                      isInProgress && "[&>div]:bg-blue-500"
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 border-t bg-muted/30">
            <div className="mt-4 space-y-3">
              {phase.items.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Danh sách hạng mục ({phase.items.length})
                    </div>
                    {/* Phase 3.5: Add Items Button (API 5.7) */}
                    {showActions && canUpdate && (
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="flex gap-2">
                        {/* Phase-Level Auto-Schedule Button (NEW) - TEMPORARILY DISABLED */}
                        {/* {canAutoSchedulePhase && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setShowAutoScheduleModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CalendarCheck className="h-3 w-3 mr-1" />
                            Gợi ý lịch hẹn
                          </Button>
                        )} */}
                        {/* V21.5: API 5.14 - Reorder Items Button */}
                        {phase.items.length > 1 && (
                          <Button
                            size="sm"
                            variant={isReorderMode ? 'default' : 'outline'}
                            onClick={() => setIsReorderMode(!isReorderMode)}
                            disabled={phase.status === 'COMPLETED' || isApprovalLocked}
                          >
                            <GripVertical className="h-3 w-3 mr-1" />
                            {isReorderMode ? 'Hoàn tất' : 'Sắp xếp'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddItemsModal(true)}
                          disabled={!canAddItems}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Thêm hạng mục
                        </Button>
                      </div>
                      {!canAddItems && (
                        <span className="text-xs text-muted-foreground max-w-xs text-right">
                          {phase.status === 'COMPLETED'
                            ? 'Phase đã hoàn thành, không thể thêm hạng mục mới.'
                            : isApprovalLocked
                              ? 'Lộ trình đang chờ duyệt nên bị khóa chỉnh sửa.'
                              : 'Không thể thêm hạng mục trong trạng thái hiện tại.'}
                        </span>
                      )}
                    </div>
                    )}
                  </div>
                  {/* V21.5: API 5.14 - Reorder Mode or Normal View */}
                  {isReorderMode ? (
                    <ReorderItems
                      phaseId={phase.phaseId}
                      phaseName={phase.phaseName}
                      items={phase.items}
                      onSuccess={() => {
                        setIsReorderMode(false);
                        if (onPhaseUpdated) {
                          onPhaseUpdated();
                        }
                      }}
                      disabled={phase.status === 'COMPLETED' || isApprovalLocked}
                    />
                  ) : (
                    phase.items.map((item) => (
                      <TreatmentPlanItem
                        key={item.itemId}
                        item={item}
                        onViewAppointment={onViewAppointment}
                        onBookAppointment={
                          canBookItems ? onBookAppointment : undefined
                        }
                        showActions={showActions}
                        selectable={
                          selectionEnabled &&
                          canBookItems &&
                          planApprovalStatus === ApprovalStatus.APPROVED &&
                          item.status === PlanItemStatus.READY_FOR_BOOKING
                        }
                        selected={selectedItemIds.includes(item.itemId)}
                        onToggleSelect={onToggleItemSelection}
                        suggestion={suggestionsMap?.get(item.itemId) || null}
                        onSelectSlot={onSelectSlot}
                      />
                    ))
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Chưa có hạng mục nào trong giai đoạn này</p>
                  </div>
                  {/* Phase 3.5: Add Items Button (API 5.7) */}
                  {canAddItems && (
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddItemsModal(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Thêm hạng mục đầu tiên
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Phase 3.5: Add Items Modal (API 5.7) - V21.4: Support autoSubmit parameter */}
      <AddItemsToPhaseModal
        open={showAddItemsModal}
        onClose={() => setShowAddItemsModal(false)}
        phaseId={phase.phaseId}
        phaseName={phase.phaseName}
        planApprovalStatus={planApprovalStatus}
        onSuccess={() => {
          // Refresh phase data
          if (onPhaseUpdated) {
            onPhaseUpdated();
          }
        }}
      />

      {/* Phase-Level Auto-Schedule Config Modal (NEW) */}
      <AutoScheduleConfigModal
        open={showAutoScheduleModal}
        onClose={() => setShowAutoScheduleModal(false)}
        onConfirm={handlePhaseAutoSchedule}
        defaultDoctorCode={undefined} // Phase doesn't have default doctor
        isLoading={false}
      />
    </Card>
  );
}
