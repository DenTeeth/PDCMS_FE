'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { DashboardAlert } from '@/types/dashboard';

interface AlertBadgeProps {
  alert: DashboardAlert;
}

export function AlertBadge({ alert }: AlertBadgeProps) {
  const getIcon = () => {
    switch (alert.type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getColors = () => {
    switch (alert.severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg border ${getColors()}`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{alert.title}</p>
        <p className="text-xs mt-1 opacity-90">{alert.message}</p>
        {alert.value !== undefined && alert.threshold !== undefined && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="font-medium">Hiện tại: {alert.value}</span>
            <span className="opacity-75">/ Ngưỡng: {alert.threshold}</span>
          </div>
        )}
      </div>
    </div>
  );
}
