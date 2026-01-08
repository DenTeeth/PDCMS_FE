'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: 'currency' | 'percent' | 'number';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  format = 'number',
  className = '',
}: KPICardProps) {
  const formatValue = (val: number) => {
    // Handle null/undefined/NaN values
    if (val === null || val === undefined || isNaN(val)) {
      return format === 'currency' ? '0 ₫' : format === 'percent' ? '0%' : '0';
    }
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('vi-VN').format(val);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : trend.value === 0 ? (
                  <Minus className="h-4 w-4 text-gray-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend.isPositive
                      ? 'text-green-600'
                      : trend.value === 0
                      ? 'text-gray-400'
                      : 'text-red-600'
                  }`}
                >
                  {trend.value > 0 ? '+' : ''}
                  {trend.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#8b5fbf]/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-[#8b5fbf]" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
