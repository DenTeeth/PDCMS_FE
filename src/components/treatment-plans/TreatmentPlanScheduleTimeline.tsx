'use client';

/**
 * Treatment Plan Schedule Timeline Component
 * Displays auto-calculated schedule with suggested dates for each item
 * BE_4: Treatment Plan Auto-Scheduling
 * 
 * UPDATED: Now matches BE API response structure (BE Guide 3, lines 415-470)
 */

import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  CalculateScheduleResponse, 
  AppointmentScheduleItem,
} from '@/types/treatmentPlan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface TreatmentPlanScheduleTimelineProps {
  schedule: CalculateScheduleResponse;
  onBookService?: (serviceId: number, serviceCode: string, scheduledDate: string) => void;
}

export default function TreatmentPlanScheduleTimeline({
  schedule,
  onBookService,
}: TreatmentPlanScheduleTimelineProps) {
  return (
    <div className="space-y-6">
      {/* Schedule Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ngày bắt đầu</p>
              <p className="font-semibold text-blue-900">
                {format(new Date(schedule.startDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ngày kết thúc</p>
              <p className="font-semibold text-blue-900">
                {format(new Date(schedule.endDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ngày làm việc</p>
              <p className="font-semibold text-green-700">
                {schedule.actualWorkingDays} ngày
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ngày lễ bỏ qua</p>
              <p className="font-semibold text-orange-700">
                {schedule.holidaysSkipped} ngày
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {schedule.warnings && schedule.warnings.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-2">Lưu ý về lịch trình</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-800">
                  {schedule.warnings.map((warning: any, idx: number) => (
                    <li key={idx} className="text-sm">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constraints Applied Info */}
      {schedule.metadata && schedule.metadata.constraintsApplied.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 mb-2">
                  Ràng buộc đã áp dụng
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {schedule.metadata.constraintsApplied.map((constraint, idx) => {
                    const service = schedule.appointmentSchedule.find(
                      item => item.serviceId === constraint.serviceId
                    );
                    const constraintLabel = 
                      constraint.constraintType === 'MINIMUM_PREPARATION_DAYS' ? 'Chuẩn bị' :
                      constraint.constraintType === 'RECOVERY_DAYS' ? 'Hồi phục' :
                      constraint.constraintType === 'SPACING_DAYS' ? 'Giãn cách' :
                      constraint.constraintType;
                    
                    return (
                      <div key={idx} className="text-sm text-purple-800">
                        <strong>{service?.serviceName}:</strong> {constraintLabel} {constraint.constraintValue} ngày
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200" />

        {/* Timeline items */}
        <div className="space-y-8">
          {schedule.appointmentSchedule.map((item: AppointmentScheduleItem, index: number) => {
            const isLast = index === schedule.appointmentSchedule.length - 1;

            return (
              <div key={item.serviceId} className="relative pl-16">
                {/* Timeline dot */}
                <div className="absolute left-3.5 top-3 h-5 w-5 rounded-full border-2 bg-green-100 border-green-500">
                  <div className="absolute inset-0.5 rounded-full bg-green-500" />
                </div>

                {/* Sequence number */}
                <Badge 
                  variant="outline" 
                  className="absolute left-0 top-2 w-7 h-7 rounded-full flex items-center justify-center p-0 text-xs font-bold"
                >
                  {item.sequenceNumber}
                </Badge>

                {/* Item card */}
                <Card className="border-green-200 bg-green-50/30">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{item.serviceName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Mã dịch vụ: {item.serviceCode}
                        </p>
                      </div>
                      {onBookService && (
                        <Button
                          size="sm"
                          onClick={() => onBookService(item.serviceId, item.serviceCode, item.scheduledDate)}
                          className="shrink-0"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Đặt lịch
                        </Button>
                      )}
                    </div>

                    {/* Suggested date */}
                    <div className="flex items-center gap-2 mb-3 p-3 bg-white rounded-lg border border-green-200">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Ngày đề xuất</p>
                        <p className="font-semibold text-green-900">
                          {format(new Date(item.scheduledDate), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ngày làm việc
                      </Badge>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-800">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Arrow to next item */}
                {!isLast && (
                  <div className="absolute left-6 top-full mt-2 -ml-2">
                    <ArrowRight className="h-4 w-4 text-blue-400 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metadata Summary */}
      {schedule.metadata && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Thống kê lịch trình</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Tổng số dịch vụ</p>
                <p className="font-semibold text-gray-900">{schedule.metadata.totalServices} dịch vụ</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Khoảng cách trung bình</p>
                <p className="font-semibold text-gray-900">{schedule.metadata.averageIntervalDays} ngày</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Thời gian dự kiến</p>
                <p className="font-semibold text-gray-900">{schedule.estimatedDurationDays} ngày</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
