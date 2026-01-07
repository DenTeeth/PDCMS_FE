'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    percent: number;
  };
  color?: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'pink' | 'yellow';
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon,
  change,
  color = 'blue',
  subtitle,
}: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  const iconColorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    yellow: 'text-yellow-600',
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString('vi-VN');
    }
    return val;
  };

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const isCurrency = typeof value === 'number' && value >= 1000;

  return (
    <Card className={cn('border-2', colorClasses[color])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">
              {isCurrency ? formatCurrency(value as number) : formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {change && change.percent !== 0 && (
              <div className="flex items-center gap-1 mt-2">
                {change.percent > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    change.percent > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {change.percent > 0 ? '+' : ''}
                  {change.percent.toFixed(1)}%
                </span>
                {change.value !== 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({change.value > 0 ? '+' : ''}
                    {isCurrency
                      ? formatCurrency(change.value)
                      : change.value.toLocaleString('vi-VN')}
                    )
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn('p-3 rounded-lg', iconColorClasses[color])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


