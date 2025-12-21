/**
 * Auto-Schedule Suggestions Component
 * 
 * Displays appointment suggestions from auto-schedule API with:
 * - Holiday adjustments
 * - Spacing rules adjustments
 * - Employee contract warnings
 * - Time slot selection
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AppointmentSuggestion,
  SchedulingSummary,
  TimeSlot,
} from '@/types/treatmentPlan';
import { Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, UserX, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AutoScheduleSuggestionsProps {
  suggestions: AppointmentSuggestion[];
  summary: SchedulingSummary | null;
  isLoading?: boolean;
  error?: string | null;
  onSelectSlot?: (suggestion: AppointmentSuggestion, slot: TimeSlot) => void;
  onReassignDoctor?: (suggestion: AppointmentSuggestion) => void;
  onRetry?: () => void;
}

export const AutoScheduleSuggestions: React.FC<AutoScheduleSuggestionsProps> = ({
  suggestions,
  summary,
  isLoading = false,
  error,
  onSelectSlot,
  onReassignDoctor,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Đang tạo gợi ý lịch hẹn...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0 && !error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Không có gợi ý lịch hẹn nào</p>
        </CardContent>
      </Card>
    );
  }

  // Show error state with retry button
  if (error && suggestions.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-12 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Lỗi khi tạo gợi ý lịch hẹn</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan điều chỉnh</CardTitle>
            <CardDescription>
              Thống kê các điều chỉnh đã được áp dụng khi tạo gợi ý
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {summary.holidayAdjustments}
                </div>
                <div className="text-sm text-muted-foreground">Điều chỉnh ngày lễ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.spacingAdjustments}
                </div>
                <div className="text-sm text-muted-foreground">Điều chỉnh giãn cách</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.dailyLimitAdjustments}
                </div>
                <div className="text-sm text-muted-foreground">Giới hạn ngày</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {summary.totalDaysShifted}
                </div>
                <div className="text-sm text-muted-foreground">Tổng ngày đã dời</div>
              </div>
            </div>

            {/* Holidays Encountered */}
            {summary.holidaysEncountered && summary.holidaysEncountered.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Ngày lễ đã gặp:</p>
                <div className="flex flex-wrap gap-2">
                  {summary.holidaysEncountered.map((holiday, idx) => (
                    <Badge key={idx} variant="outline">
                      {format(new Date(holiday.date), 'dd/MM/yyyy', { locale: vi })} - {holiday.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.itemId}
            suggestion={suggestion}
            onSelectSlot={onSelectSlot}
            onReassignDoctor={onReassignDoctor}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Suggestion Card
interface SuggestionCardProps {
  suggestion: AppointmentSuggestion;
  onSelectSlot?: (suggestion: AppointmentSuggestion, slot: TimeSlot) => void;
  onReassignDoctor?: (suggestion: AppointmentSuggestion) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onSelectSlot,
  onReassignDoctor,
}) => {
  const hasAdjustment = suggestion.holidayAdjusted || suggestion.spacingAdjusted;
  const hasWarning = !!suggestion.warning;
  const requiresReassign = suggestion.requiresReassign === true;
  
  // Check if error is related to no doctor shifts
  const isNoDoctorShiftsError = suggestion.errorMessage?.includes('ca làm việc của bác sĩ') || 
                                 suggestion.errorMessage?.includes('doctor shifts') ||
                                 suggestion.adjustmentReason?.includes('ca làm việc của bác sĩ');
  
  // Check if no slots available (but not due to no doctor shifts)
  const hasNoSlots = (!suggestion.availableSlots || suggestion.availableSlots.length === 0) && 
                     suggestion.success && 
                     !isNoDoctorShiftsError;

  // Format dates
  const suggestedDate = suggestion.suggestedDate
    ? format(new Date(suggestion.suggestedDate), 'dd/MM/yyyy', { locale: vi })
    : 'N/A';
  const originalDate = suggestion.originalEstimatedDate
    ? format(new Date(suggestion.originalEstimatedDate), 'dd/MM/yyyy', { locale: vi })
    : 'N/A';

  if (!suggestion.success) {
    // Special styling for "no doctor shifts" error
    const isNoDoctorShifts = isNoDoctorShiftsError;
    
    return (
      <Card className={cn(
        'border-red-200 bg-red-50',
        isNoDoctorShifts && 'border-purple-200 bg-purple-50'
      )}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {isNoDoctorShifts ? (
              <UserX className="h-5 w-5 text-purple-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={cn(
                'font-semibold',
                isNoDoctorShifts ? 'text-purple-900' : 'text-red-900'
              )}>
                {suggestion.serviceName}
              </h4>
              <p className={cn(
                'text-sm mt-1',
                isNoDoctorShifts ? 'text-purple-700' : 'text-red-700'
              )}>
                {suggestion.errorMessage || suggestion.adjustmentReason}
              </p>
              {isNoDoctorShifts && (
                <p className="text-xs text-purple-600 mt-2">
                  💡 Gợi ý: Vui lòng chọn bác sĩ khác hoặc kiểm tra lịch làm việc của bác sĩ
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all',
        requiresReassign && 'border-orange-300 bg-orange-50/50',
        hasWarning && !requiresReassign && 'border-yellow-300 bg-yellow-50/50'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{suggestion.serviceName}</CardTitle>
            <CardDescription className="mt-1">
              Mã dịch vụ: {suggestion.serviceCode} • Item ID: {suggestion.itemId}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {suggestion.holidayAdjusted && (
              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                <Calendar className="h-3 w-3 mr-1" />
                Ngày lễ
              </Badge>
            )}
            {suggestion.spacingAdjusted && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                <Clock className="h-3 w-3 mr-1" />
                Giãn cách
              </Badge>
            )}
            {requiresReassign && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Cần đổi bác sĩ
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Information */}
        <div className="flex items-center gap-4">
          {hasAdjustment && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Dự kiến:</span>
              <span className="line-through">{originalDate}</span>
              <span>→</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-lg">Ngày gợi ý: {suggestedDate}</span>
          </div>
        </div>

        {/* Adjustment Reason */}
        {suggestion.adjustmentReason && (
          <Alert className={isNoDoctorShiftsError ? 'border-purple-200 bg-purple-50' : ''}>
            {isNoDoctorShiftsError && (
              <UserX className="h-4 w-4 text-purple-600" />
            )}
            <AlertDescription className={isNoDoctorShiftsError ? 'text-purple-800' : ''}>
              {suggestion.adjustmentReason}
              {isNoDoctorShiftsError && (
                <div className="mt-2 text-xs text-purple-600">
                  💡 Hệ thống đã tìm kiếm trong 30 ngày tới nhưng không tìm thấy ca làm việc của bác sĩ
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning (Employee Contract) */}
        {hasWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cảnh báo</AlertTitle>
            <AlertDescription className="mt-2">
              {suggestion.warning}
              {suggestion.employeeContractEndDate && (
                <div className="mt-2 text-sm">
                  Hợp đồng hết hạn: {format(new Date(suggestion.employeeContractEndDate), 'dd/MM/yyyy', { locale: vi })}
                </div>
              )}
              {requiresReassign && onReassignDoctor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onReassignDoctor(suggestion)}
                >
                  Chọn bác sĩ khác
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Available Time Slots */}
        {suggestion.availableSlots && suggestion.availableSlots.length > 0 && (
          <div>
            <Separator className="my-4" />
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Khung giờ trống:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {suggestion.availableSlots.map((slot, idx) => (
                <Button
                  key={idx}
                  variant={slot.available ? 'outline' : 'ghost'}
                  disabled={!slot.available || requiresReassign}
                  className={cn(
                    'justify-start',
                    slot.available && 'hover:bg-primary hover:text-primary-foreground',
                    !slot.available && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => slot.available && onSelectSlot?.(suggestion, slot)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {slot.startTime} - {slot.endTime}
                  {!slot.available && slot.unavailableReason && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({slot.unavailableReason})
                    </span>
                  )}
                </Button>
              ))}
            </div>
            {requiresReassign && (
              <p className="text-sm text-muted-foreground mt-2">
              ⚠️ Vui lòng chọn bác sĩ mới trước khi đặt lịch
            </p>
            )}
          </div>
        )}

        {/* No Slots Available - Different message based on reason */}
        {hasNoSlots && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Không có khung giờ trống</AlertTitle>
            <AlertDescription>
              {isNoDoctorShiftsError ? (
                <>
                  Bác sĩ không có ca làm việc vào ngày này. Vui lòng:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Chọn bác sĩ khác có ca làm việc</li>
                    <li>Hoặc kiểm tra lại lịch làm việc của bác sĩ</li>
                  </ul>
                </>
              ) : (
                <>
                  Tất cả khung giờ trong ngày này đã được đặt kín. Vui lòng:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Thử ngày khác</li>
                    <li>Hoặc chọn bác sĩ khác</li>
                  </ul>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoScheduleSuggestions;

