'use client';

/**
 * Reusable Appointment Filters Component
 * Supports all filters from AppointmentFilterCriteria
 */

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
import { Search, X } from 'lucide-react';

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
    SCHEDULED: 'Scheduled',
    CHECKED_IN: 'Checked In',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card">
      {/* NEW: Combined Search - Search by code or name for patient/doctor/employee/room/service */}
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="search"
            type="text"
            placeholder="Search by code (patient/doctor/room/service)... (Press Enter)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10"
          />
        </div>
      </div>

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
            <SelectValue placeholder="Select date preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Dates</SelectItem>
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
        <Label htmlFor="dateFrom">Date From</Label>
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
        <Label htmlFor="dateTo">Date To</Label>
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

      {/* Status Filter - Multi-select */}
      <div className="min-w-[150px]">
        <Label htmlFor="status">Status</Label>
        <Select
          value={filters.status && filters.status.length > 0 ? filters.status.join(',') : 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              onFiltersChange({ ...filters, status: undefined });
            } else {
              onFiltersChange({ ...filters, status: [value as AppointmentStatus] });
            }
          }}
        >
          <SelectTrigger id="status" className="mt-1">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* Clear Filters Button */}
      <div className="min-w-[120px]">
        <Label className="opacity-0">Clear</Label>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="mt-1 w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

