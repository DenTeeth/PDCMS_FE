'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppointmentHeatmapData } from '@/types/dashboard';
import { Calendar } from 'lucide-react';

interface HeatmapChartProps {
  data: AppointmentHeatmapData[];
  title?: string;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ 
  data, 
  title = 'Phân bố lịch hẹn theo giờ' 
}) => {
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Find max count for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach(item => {
    const key = `${item.dayOfWeek}-${item.hour}`;
    dataMap.set(key, item.count);
  });

  // Get color intensity based on count
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getTextColorClass = (count: number) => {
    const intensity = count / maxCount;
    return intensity >= 0.6 ? 'text-white' : 'text-gray-700';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hours header */}
            <div className="flex mb-1">
              <div className="w-24 flex-shrink-0"></div>
              <div className="flex flex-1 gap-1">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    className="w-12 text-center text-xs text-gray-600 flex-shrink-0"
                  >
                    {hour}h
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {daysOfWeek.map((day, dayIndex) => (
                <div key={dayIndex} className="flex gap-1">
                  <div className="w-24 flex-shrink-0 text-sm font-medium text-gray-700 flex items-center">
                    {day}
                  </div>
                  <div className="flex flex-1 gap-1">
                    {hours.map(hour => {
                      const count = dataMap.get(`${dayIndex}-${hour}`) || 0;
                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className={`w-12 h-12 flex items-center justify-center rounded text-xs font-medium transition-all hover:ring-2 hover:ring-blue-400 cursor-pointer flex-shrink-0 ${getColorClass(count)} ${getTextColorClass(count)}`}
                          title={`${day} ${hour}:00 - ${count} lịch hẹn`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Ít</span>
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-gray-100 rounded"></div>
                <div className="w-6 h-6 bg-blue-100 rounded"></div>
                <div className="w-6 h-6 bg-blue-200 rounded"></div>
                <div className="w-6 h-6 bg-blue-300 rounded"></div>
                <div className="w-6 h-6 bg-blue-400 rounded"></div>
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <span className="text-gray-600">Nhiều</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
