'use client';

/**
 * Reusable Treatment Plan Filters Component
 * Similar to AppointmentFilters component
 */

import { useState, useEffect } from 'react';
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
import { TreatmentPlanStatus } from '@/types/treatmentPlan';
import { Search, X } from 'lucide-react';

export interface TreatmentPlanFilters {
  patientCode?: string;
  status?: TreatmentPlanStatus;
  searchTerm?: string;
}

interface TreatmentPlanFiltersProps {
  filters: TreatmentPlanFilters;
  onFiltersChange: (filters: TreatmentPlanFilters) => void;
  onClearFilters: () => void;
  canViewAll?: boolean; // If false, hide patientCode filter (for patient view)
}

export default function TreatmentPlanFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  canViewAll = true,
}: TreatmentPlanFiltersProps) {
  // Search input - separate from applied filters
  // Only sync with searchTerm, not patientCode (patientCode is a separate filter)
  const [searchInput, setSearchInput] = useState(
    filters.searchTerm || ''
  );

  // Sync search input with searchTerm when filters change externally (e.g., from URL)
  // Note: patientCode is a separate filter, don't sync it with search input
  useEffect(() => {
    const currentSearch = filters.searchTerm || '';
    if (currentSearch !== searchInput) {
      setSearchInput(currentSearch);
    }
  }, [filters.searchTerm]);

  // Handle search button click
  // BE logic: searchTerm searches in planName and patient.fullName (case-insensitive LIKE)
  // patientCode is a separate exact match filter
  // We should use searchTerm for the search input since BE can search both plan name and patient name
  const handleSearch = () => {
    const searchValue = searchInput.trim();
    if (canViewAll) {
      // For employee/admin: Use searchTerm for search input (searches in plan name and patient name)
      // If user wants to filter by exact patient code, they should use a separate patientCode filter
      // But for search input, we use searchTerm which BE handles for both plan name and patient name
      onFiltersChange({
        ...filters,
        searchTerm: searchValue || undefined,
        // Keep existing patientCode if set (from URL or other sources)
        // Don't override it with search input
      });
    } else {
      // For patient: Use searchTerm only
      onFiltersChange({
        ...filters,
        searchTerm: searchValue || undefined,
        patientCode: undefined,
      });
    }
  };

  // Handle Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    if (canViewAll) {
      onFiltersChange({
        ...filters,
        searchTerm: undefined,
        // Keep patientCode if it was set from URL or other sources
        // Only clear searchTerm
      });
    } else {
      onFiltersChange({
        ...filters,
        searchTerm: undefined,
        patientCode: undefined,
      });
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    filters.patientCode || 
    filters.searchTerm || 
    filters.status
  );

  return (
    <div className="border rounded-lg bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-foreground">Bộ lọc</h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground h-8"
          >
            <X className="h-4 w-4 mr-1.5" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Filters Content */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Search / Patient Code */}
          <div className="flex-1 w-full sm:w-auto space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-foreground">
              Tìm kiếm
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="search"
                placeholder={canViewAll ? 'Tìm theo tên lộ trình hoặc tên bệnh nhân...' : 'Tìm kiếm...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-9 h-10"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                  onClick={handleClearSearch}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1 w-full sm:w-auto space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-foreground">
              Trạng thái
            </Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  status: value === 'all' ? undefined : (value as TreatmentPlanStatus),
                });
              }}
            >
              <SelectTrigger id="status" className="h-10 w-full sm:w-[200px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value={TreatmentPlanStatus.PENDING}>Chờ xử lý</SelectItem>
                <SelectItem value={TreatmentPlanStatus.IN_PROGRESS}>Đang thực hiện</SelectItem>
                <SelectItem value={TreatmentPlanStatus.COMPLETED}>Hoàn thành</SelectItem>
                <SelectItem value={TreatmentPlanStatus.CANCELLED}>Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="w-full sm:w-auto">
            <Button 
              onClick={handleSearch} 
              type="button"
              className="w-full sm:w-auto h-10 font-medium px-6"
              size="default"
            >
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

