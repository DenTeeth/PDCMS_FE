'use client';

/**
 * Progress Summary Component
 * Enhanced with better visual design
 */

import { ProgressSummaryDTO } from '@/types/treatmentPlan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Calendar, FileCheck, Clock } from 'lucide-react';

interface ProgressSummaryProps {
  progress: ProgressSummaryDTO;
}

export default function ProgressSummary({ progress }: ProgressSummaryProps) {
  const phaseProgress = progress.totalPhases > 0
    ? (progress.completedPhases / progress.totalPhases) * 100
    : 0;

  const itemProgress = progress.totalItems > 0
    ? (progress.completedItems / progress.totalItems) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Phases Progress */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Tiến độ Giai đoạn</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hoàn thành</span>
            <span className="text-sm font-semibold">
              {progress.completedPhases} / {progress.totalPhases}
            </span>
          </div>
          <Progress value={phaseProgress} className="h-3" />
          <div className="text-xs text-muted-foreground text-right">
            {phaseProgress.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Items Progress */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Tiến độ Hạng mục</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hoàn thành</span>
            <span className="text-sm font-semibold">
              {progress.completedItems} / {progress.totalItems}
            </span>
          </div>
          <Progress value={itemProgress} className="h-3" />
          <div className="text-xs text-muted-foreground text-right">
            {itemProgress.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Statistics Cards - Simplified Design */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Sẵn sàng đặt lịch</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {progress.readyForBookingItems}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            hạng mục có thể đặt lịch ngay
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Đã hoàn thành</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {progress.completedItems}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            hạng mục đã hoàn tất
          </div>
        </div>
      </div>
    </div>
  );
}
