'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppointmentFilterCriteria, AppointmentStatus, DatePreset } from '@/types/appointment';
import { Search, X, Filter, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface AppointmentFiltersProps {
  filters: Partial<AppointmentFilterCriteria>;
  onFiltersChange: (filters: Partial<AppointmentFilterCriteria>) => void;
  onClearFilters: () => void;
  canViewAll?: boolean; // If false, hide VIEW_ALL only filters (patientCode, patientName, patientPhone, employeeCode)
}

export default function AppointmentFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  canViewAll = true,
}: AppointmentFiltersProps) {
  // Search input - separate from debounced value
  // NEW: Combined search for patient/doctor/employee/room/service codes and names
  const [searchInput, setSearchInput] = useState(
    filters.searchCode || filters.patientName || filters.patientPhone || filters.employeeCode || filters.roomCode || filters.serviceCode || ''
  );

  // Debounced search - triggers filter change after 1000ms or on Enter
  const debouncedSearch = useDebounce(searchInput, 1000);

  // Sort dropdown state
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Sync search input with filters (only when filters change from outside, not from our own changes)
  useEffect(() => {
    const currentSearch = filters.searchCode || filters.patientName || filters.patientPhone || filters.employeeCode || filters.roomCode || filters.serviceCode || '';
    if (currentSearch !== searchInput) {
      setSearchInput(currentSearch);
    }
  }, [filters.searchCode, filters.patientName, filters.patientPhone, filters.employeeCode, filters.roomCode, filters.serviceCode]);

  // Track previous debounced value to prevent unnecessary updates
  const prevDebouncedSearchRef = useRef<string>('');
  const filtersRef = useRef(filters);
  const onFiltersChangeRef = useRef(onFiltersChange);

  // Update refs when values change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Handle debounced search - only trigger when debounced value actually changes
  useEffect(() => {
    const searchValue = debouncedSearch.trim();

    // Skip if debounced value hasn't changed
    if (prevDebouncedSearchRef.current === searchValue) {
      return;
    }

    // Update ref
    prevDebouncedSearchRef.current = searchValue;

    const currentSearchCode = filtersRef.current.searchCode || '';

    // Skip if search value matches current filter (avoid unnecessary updates)
    if (searchValue && currentSearchCode === searchValue) {
      return;
    }

    // Skip if clearing and filters are already clear
    if (!searchValue && !currentSearchCode) {
      return;
    }

    // Only update if search value changed
    if (searchValue) {
      if (currentSearchCode !== searchValue) {
        // NEW: Use searchCode instead of separate filters
        // Clear old separate filters when using searchCode
        onFiltersChangeRef.current({
          searchCode: searchValue,
          patientName: undefined,
          patientPhone: undefined,
          employeeCode: undefined,
          roomCode: undefined,
          serviceCode: undefined,
        });
      }
    } else {
      // Clear search filter only if it exists
      if (currentSearchCode) {
        onFiltersChangeRef.current({ searchCode: undefined });
      }
    }
  }, [debouncedSearch]); // Only depend on debouncedSearch

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to get sort label
  const getSortLabel = () => {
    const labels: Record<string, string> = {
      appointmentStartTime: 'Thời gian',
      appointmentCode: 'Mã lịch hẹn',
      patientCode: 'Mã bệnh nhân',
    };
    return labels[filters.sortBy || 'appointmentStartTime'] || 'Sắp xếp';
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Trigger immediate search on Enter
      const searchValue = searchInput.trim();
      // NEW: Use searchCode instead of separate filters
      onFiltersChange({
        ...filters,
        searchCode: searchValue || undefined,
        patientName: undefined,
        patientPhone: undefined,
        employeeCode: undefined,
        roomCode: undefined,
        serviceCode: undefined,
      });
    }
  };

  const datePresetLabels: Record<DatePreset, string> = {
    [DatePreset.TODAY]: 'Today',
    [DatePreset.THIS_WEEK]: 'This Week',
    [DatePreset.NEXT_7_DAYS]: 'Next 7 Days',
    [DatePreset.THIS_MONTH]: 'This Month',
  };

  const statusLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Đã đặt lịch',
    CHECKED_IN: 'Đã check-in',
    IN_PROGRESS: 'Đang điều trị',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    CANCELLED_LATE: 'Hủy muộn',
    NO_SHOW: 'Không đến',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên ca, ID, thời gian..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-10 border-gray-300 focus:border-[#8b5fbf] focus:ring-[#8b5fbf] text-sm"
            />
          </div>
        </div>

        {/* Sort Dropdown + Direction */}
        <div className="flex items-center gap-2">
          {/* Dropdown chọn field */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-[#8b5fbf] rounded-lg text-xs sm:text-sm font-medium text-[#8b5fbf] hover:bg-[#f3f0ff] transition-colors bg-white whitespace-nowrap"
            >
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span>{getSortLabel()}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden">
                <div className="p-2">
                  {[
                    { value: 'appointmentStartTime', label: 'Thời gian' },
                    { value: 'appointmentCode', label: 'Mã lịch hẹn' },
                    { value: 'patientCode', label: 'Mã bệnh nhân' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onFiltersChange({ ...filters, sortBy: option.value });
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${(filters.sortBy || 'appointmentStartTime') === option.value
                        ? 'bg-[#8b5fbf] text-white'
                        : 'text-gray-700 hover:bg-[#f3f0ff]'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Direction buttons */}
          <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
            <button
              onClick={() => {
                onFiltersChange({ ...filters, sortDirection: 'ASC' });
              }}
              className={`p-1.5 rounded transition-all ${filters.sortDirection === 'ASC'
                ? 'bg-[#8b5fbf] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              title="Tăng dần"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                onFiltersChange({ ...filters, sortDirection: 'DESC' });
              }}
              className={`p-1.5 rounded transition-all ${(filters.sortDirection || 'DESC') === 'DESC'
                ? 'bg-[#8b5fbf] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              title="Giảm dần"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3 overflow-x-auto">
        <button
          onClick={() => onFiltersChange({ ...filters, status: undefined })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap ${!filters.status || filters.status.length === 0
            ? 'bg-[#8b5fbf] text-white shadow-[0_2px_8px_rgba(139,95,191,0.4)]'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Tất cả
        </button>
        {Object.entries(statusLabels).map(([value, label]) => {
          const isActive = filters.status?.includes(value as AppointmentStatus);
          return (
            <button
              key={value}
              onClick={() => {
                onFiltersChange({ ...filters, status: [value as AppointmentStatus] });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap ${isActive
                ? 'bg-[#8b5fbf] text-white shadow-[0_2px_8px_rgba(139,95,191,0.4)]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.substring(0, 3)}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filters - Optional Row */}
      {(filters.dateFrom || filters.dateTo || filters.datePreset) && (
        <div className="flex flex-wrap items-end gap-4 pt-3 border-t border-gray-100 mt-3">
          {/* Date Preset */}
          <div className="min-w-[150px]">
            <Label htmlFor="datePreset">Date Preset</Label>
            <Select
              value={filters.datePreset || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  onFiltersChange({ ...filters, datePreset: undefined, dateFrom: undefined, dateTo: undefined });
                } else {
                  onFiltersChange({ ...filters, datePreset: value as DatePreset, dateFrom: undefined, dateTo: undefined });
                }
              }}
            >
              <SelectTrigger id="datePreset" className="mt-1">
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="none">Tất cả</SelectItem>
                {Object.entries(datePresetLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="min-w-[150px]">
            <Label htmlFor="dateFrom">Ngày bắt đầu</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => {
                onFiltersChange({ ...filters, dateFrom: e.target.value || undefined, datePreset: undefined });
              }}
              className="mt-1"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[150px]">
            <Label htmlFor="dateTo">Ngày kết thúc</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => {
                onFiltersChange({ ...filters, dateTo: e.target.value || undefined, datePreset: undefined });
              }}
              className="mt-1"
            />
          </div>

          {/* Clear Filters Button */}
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="mb-0"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

