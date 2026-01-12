"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Start Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Từ ngày</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={(date) => onStartDateChange(date || null)}
              locale={vi}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Đến ngày</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={(date) => onEndDateChange(date || null)}
              locale={vi}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
