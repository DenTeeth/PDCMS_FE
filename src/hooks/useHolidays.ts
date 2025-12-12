/**
 * useHolidays Hook
 * Fetches and caches holidays for a given year
 * BE_4: Holiday Management Integration
 */

import { useState, useEffect } from 'react';
import { holidayService } from '@/services/holidayService';

interface UseHolidaysOptions {
  year?: number;
  enabled?: boolean;
}

interface UseHolidaysReturn {
  holidays: string[]; // Array of ISO date strings (YYYY-MM-DD)
  isLoading: boolean;
  error: string | null;
  isHoliday: (date: string | Date) => boolean;
  getHolidayName: (date: string | Date) => string | null;
  refetch: () => Promise<void>;
}

export function useHolidays(options: UseHolidaysOptions = {}): UseHolidaysReturn {
  const { year = new Date().getFullYear(), enabled = true } = options;

  const [holidays, setHolidays] = useState<string[]>([]);
  const [holidayMap, setHolidayMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await holidayService.getHolidaysForYear(year);
      
      if (response && response.holidays) {
        const holidayDates = response.holidays.map(h => h.date);
        const map = new Map<string, string>();
        
        response.holidays.forEach(h => {
          map.set(h.date, h.holidayName);
        });

        setHolidays(holidayDates);
        setHolidayMap(map);
      }
    } catch (err: any) {
      console.error('Failed to fetch holidays:', err);
      setError(err.message || 'Không thể tải danh sách ngày lễ');
      setHolidays([]);
      setHolidayMap(new Map());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [year, enabled]);

  const normalizeDate = (date: string | Date): string => {
    if (typeof date === 'string') {
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Try to parse
      return new Date(date).toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  const isHoliday = (date: string | Date): boolean => {
    try {
      const normalized = normalizeDate(date);
      return holidays.includes(normalized);
    } catch {
      return false;
    }
  };

  const getHolidayName = (date: string | Date): string | null => {
    try {
      const normalized = normalizeDate(date);
      return holidayMap.get(normalized) || null;
    } catch {
      return null;
    }
  };

  return {
    holidays,
    isLoading,
    error,
    isHoliday,
    getHolidayName,
    refetch: fetchHolidays,
  };
}

