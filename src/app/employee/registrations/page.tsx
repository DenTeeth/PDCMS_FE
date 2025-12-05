'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Plus, Edit, Trash2, CalendarDays, Clock, Calendar, Users, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Eye } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { MonthPicker } from '@/components/ui/month-picker';
import { toast } from 'sonner';
import { format, parseISO, addWeeks, startOfWeek, endOfWeek, differenceInWeeks, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

// Import types and services for Part-Time Registration
import {
  ShiftRegistration,
  CreateShiftRegistrationRequest,
  UpdateShiftRegistrationRequest,
  DayOfWeek
} from '@/types/shiftRegistration';
import { WorkShift } from '@/types/workShift';
import { AvailableSlot, PartTimeSlot, SlotDetailsResponse } from '@/types/workSlot';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { workShiftService } from '@/services/workShiftService';
import { workSlotService } from '@/services/workSlotService';
import { getEmployeeIdFromToken, formatTimeToHHMM } from '@/lib/utils';

// Import types and services for Fixed Registration
import {
  FixedShiftRegistration,
  FixedRegistrationQueryParams
} from '@/types/fixedRegistration';
import { fixedRegistrationService } from '@/services/fixedRegistrationService';
import { useAuth } from '@/contexts/AuthContext';

// Day labels mapping for Fixed Registration (numbers 1-7)
const DAY_LABELS: { [key: number]: string } = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật'
};

// Day labels mapping for Part-Time Registration (DayOfWeek enum)
const getDayOfWeekLabel = (day: DayOfWeek): string => {
  const dayMap = {
    [DayOfWeek.MONDAY]: 'T2',
    [DayOfWeek.TUESDAY]: 'T3',
    [DayOfWeek.WEDNESDAY]: 'T4',
    [DayOfWeek.THURSDAY]: 'T5',
    [DayOfWeek.FRIDAY]: 'T6',
    [DayOfWeek.SATURDAY]: 'T7',
    [DayOfWeek.SUNDAY]: 'CN'
  };
  return dayMap[day] || day;
};

// Get day name in Vietnamese
const getDayName = (day: DayOfWeek): string => {
  const dayMap: Record<DayOfWeek, string> = {
    'MONDAY': 'Thứ 2',
    'TUESDAY': 'Thứ 3',
    'WEDNESDAY': 'Thứ 4',
    'THURSDAY': 'Thứ 5',
    'FRIDAY': 'Thứ 6',
    'SATURDAY': 'Thứ 7',
    'SUNDAY': 'Chủ nhật'
  };
  return dayMap[day] || day;
};

// Get next date for a specific day of week from today
const getNextDateForDayOfWeek = (dayOfWeek: DayOfWeek): string => {
  const dayMap: Record<DayOfWeek, number> = {
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6,
    'SUNDAY': 0
  };

  const today = new Date();
  const targetDay = dayMap[dayOfWeek];
  const currentDay = today.getDay();

  // Calculate days until next occurrence of target day
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Move to next week if today or past
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilTarget);

  return nextDate.toISOString().split('T')[0];
};

// Map DayOfWeek string to JS numeric day (0=Sunday..6=Saturday)
const dayOfWeekToNumber = (day: DayOfWeek): number => {
  const map: Record<string, number> = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6
  };
  return map[day] ?? 0;
};

// Helper: Calculate hours from shift time
// Priority 1: Look up from workShifts data (has durationHours)
// Priority 2: Parse from shift name format
const calculateShiftHours = (shiftName: string, workShiftsData?: WorkShift[]): number => {
  // Try to find shift in workShifts data first (most accurate)
  if (workShiftsData && workShiftsData.length > 0) {
    const shift = workShiftsData.find(s => s.shiftName === shiftName);
    if (shift && shift.durationHours) {
      return shift.durationHours;
    }
  }

  // Fallback: Parse from shift name
  // Try to match patterns like:
  // - "8h-12h" or "(8h-12h)" 
  // - "08:00-12:00" or "(08:00-12:00)"
  // - "8:00-12:00"

  // First try: Match "Xh-Yh" format (e.g., "8h-12h", "18h-21h")
  let timeMatch = shiftName.match(/(\d{1,2})h\s*-\s*(\d{1,2})h/);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const endHour = parseInt(timeMatch[2]);
    return endHour - startHour;
  }

  // Second try: Match "X:MM-Y:MM" format (e.g., "08:00-12:00")
  timeMatch = shiftName.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const endHour = parseInt(timeMatch[3]);
    return endHour - startHour;
  }

  return 0;
};

// ==================== DATE PICKER COMPONENT ====================
interface DatePickerProps {
  value: string; // ISO date string (yyyy-MM-dd)
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: string; // ISO date string (yyyy-MM-dd)
  selectWeek?: boolean; // New prop for week selection mode
}

function DatePicker({ value, onChange, placeholder = 'Chọn ngày', required = false, minDate, selectWeek = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? parseISO(value) : null);
  const [currentMonth, setCurrentMonth] = useState<Date>(value ? parseISO(value) : new Date());
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      const date = parseISO(value);
      setSelectedDate(date);
      setCurrentMonth(date);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    const minDateTime = minDate ? parseISO(minDate).getTime() : 0;

    // If week selection mode, select the Monday of that week
    if (selectWeek) {
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      if (monday.getTime() < minDateTime) {
        toast.error('Không thể chọn tuần trong quá khứ');
        return;
      }
      setSelectedDate(monday);
      onChange(format(monday, 'yyyy-MM-dd'));
    } else {
      if (date.getTime() < minDateTime) {
        toast.error('Không thể chọn ngày trong quá khứ');
        return;
      }
      setSelectedDate(date);
      onChange(format(date, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstMonday = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const currentMonday = startOfWeek(date, { weekStartsOn: 1 });
    return Math.floor((currentMonday.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  };

  const isInSelectedWeek = (date: Date): boolean => {
    if (!selectedDate) return false;
    const selectedMonday = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const selectedSunday = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return date >= selectedMonday && date <= selectedSunday;
  };

  const isInHoveredWeek = (date: Date): boolean => {
    if (hoveredWeek === null) return false;
    return getWeekNumber(date) === hoveredWeek;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const minDateTime = minDate ? parseISO(minDate).getTime() : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get display text for week selection
  const getDisplayText = () => {
    if (!selectedDate) return placeholder;
    if (selectWeek) {
      const monday = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const sunday = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(monday, 'dd/MM/yyyy', { locale: vi })} - ${format(sunday, 'dd/MM/yyyy', { locale: vi })}`;
    }
    return format(selectedDate, 'dd/MM/yyyy', { locale: vi });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:border-[#8b5fbf] focus:outline-none focus:ring-2 focus:ring-[#8b5fbf] focus:border-transparent transition-all duration-200 flex items-center justify-between"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#8b5fbf] to-[#6a4a9e] text-white">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
            <span className="font-semibold text-sm">
              Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-gray-600 py-0.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isInWeek = selectWeek ? (isInSelectedWeek(day) || isInHoveredWeek(day)) : false;
                const isSelected = !selectWeek && selectedDate && day.getTime() === selectedDate.getTime();
                const isToday = day.getTime() === today.getTime();
                const isDisabled = selectWeek
                  ? startOfWeek(day, { weekStartsOn: 1 }).getTime() < minDateTime
                  : day.getTime() < minDateTime;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    onMouseEnter={() => selectWeek && setHoveredWeek(getWeekNumber(day))}
                    onMouseLeave={() => selectWeek && setHoveredWeek(null)}
                    disabled={isDisabled}
                    className={`aspect-square rounded text-[11px] font-medium transition-all duration-150
                      ${isInWeek && isInSelectedWeek(day)
                        ? 'bg-[#8b5fbf] text-white shadow-sm'
                        : isInWeek && !isInSelectedWeek(day)
                          ? 'bg-[#8b5fbf]/30 text-[#8b5fbf]'
                          : isSelected
                            ? 'bg-[#8b5fbf] text-white shadow-sm'
                            : isToday
                              ? 'bg-[#8b5fbf]/10 text-[#8b5fbf] font-bold'
                              : isDisabled
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-[#8b5fbf]/20'
                      }
                    `}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="w-full mt-2 px-2 py-1.5 text-xs font-medium text-[#8b5fbf] bg-[#8b5fbf]/10 hover:bg-[#8b5fbf]/20 rounded-md transition-colors"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Validate that the date range [from,to] includes at least one occurrence of each day in slotDays
const validateDateRangeFullCycle = (fromStr: string, toStr: string, slotDays: string[]) => {
  const result = { valid: false, missingDays: [] as string[] };
  if (!fromStr) return result;
  try {
    const from = parseISO(fromStr);
    let to = toStr ? parseISO(toStr) : null;
    if (!to) {
      // If no explicit to date, consider a 6-week window from 'from' to allow matching all weekdays
      to = new Date(from);
      to.setDate(from.getDate() + 42); // 6 weeks
    }

    // Normalize to start of day
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const needed = new Set(slotDays.map(d => d.trim()));
    const found = new Set<string>();

    // Iterate days between from and to (inclusive) — stop early if we've found all
    const cursor = new Date(from);
    while (cursor <= to && found.size < needed.size) {
      const dow = cursor.getDay(); // 0..6
      // Map numeric day to DayOfWeek string
      const dowStr = (Object.keys({ SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 }) as string[])
        .find(key => ({ SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 } as any)[key] === dow) as string;

      if (needed.has(dowStr)) found.add(dowStr);
      cursor.setDate(cursor.getDate() + 1);
    }

    const missing = Array.from(needed).filter(d => !found.has(d));
    result.valid = missing.length === 0;
    result.missingDays = missing;
    return result;
  } catch (e) {
    console.error('validateDateRangeFullCycle error', e);
    return result;
  }
};

// ==================== MAIN COMPONENT ====================
export default function EmployeeRegistrationsPage() {
  const { user, hasPermission } = useAuth();

  // Determine which tabs to show based on permissions and employee type
  const hasManagePermission = hasPermission(Permission.MANAGE_WORK_SLOTS);
  const isPartTimeFlex = user?.employmentType === 'PART_TIME_FLEX';

  // Determine available tabs and default tab using useMemo
  const { availableTabs, defaultTab } = useMemo(() => {
    let tabs: Array<'part-time' | 'fixed'> = [];
    let defaultTabValue: 'part-time' | 'fixed' = 'part-time';

    if (hasManagePermission) {
      // Condition 1: Has MANAGE_WORK_SLOTS → Show both tabs
      tabs = ['part-time', 'fixed'];
      defaultTabValue = 'part-time';
    } else if (isPartTimeFlex) {
      // Condition 2: No MANAGE_WORK_SLOTS AND is PART_TIME_FLEX → Only Part-time tab
      tabs = ['part-time'];
      defaultTabValue = 'part-time';
    } else {
      // Condition 3: No MANAGE_WORK_SLOTS AND NOT PART_TIME_FLEX → Only Fixed tab
      tabs = ['fixed'];
      defaultTabValue = 'fixed';
    }

    return { availableTabs: tabs, defaultTab: defaultTabValue };
  }, [hasManagePermission, isPartTimeFlex]);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'part-time' | 'fixed'>(defaultTab);

  // Reset active tab if current tab is not available
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [availableTabs, defaultTab, activeTab]);

  // ==================== PART-TIME REGISTRATION STATE ====================
  const [partTimeRegistrations, setPartTimeRegistrations] = useState<ShiftRegistration[]>([]);
  const [partTimeLoading, setPartTimeLoading] = useState(true);
  const [partTimeCurrentPage, setPartTimeCurrentPage] = useState(0);
  const [partTimeTotalPages, setPartTimeTotalPages] = useState(0);
  const [partTimeTotalElements, setPartTimeTotalElements] = useState(0);

  // Part-Time modals
  const [showPartTimeCreateModal, setShowPartTimeCreateModal] = useState(false);
  const [partTimeCreating, setPartTimeCreating] = useState(false);
  const [partTimeCreateFormData, setPartTimeCreateFormData] = useState<CreateShiftRegistrationRequest>({
    partTimeSlotId: 0,
    effectiveFrom: '',
    effectiveTo: ''
  });
  const [selectedSlotDays, setSelectedSlotDays] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [formErrors, setFormErrors] = useState<{ effectiveFrom?: string; effectiveTo?: string; general?: string }>({});

  // Part-time registration state
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(0);
  const [currentApprovedHours, setCurrentApprovedHours] = useState<number>(0);

  // Helper: Calculate number of weeks between two dates
  const calculateWeeksBetween = (from: string, to: string): number => {
    try {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      const weeks = Math.ceil(differenceInWeeks(toDate, fromDate, { roundingMethod: 'ceil' }));
      return Math.max(1, weeks); // Minimum 1 week
    } catch {
      return 1;
    }
  };

  // Helper: Calculate total approved hours from registrations
  const calculateTotalApprovedHours = () => {
    return partTimeRegistrations
      .filter(r => r.status === 'APPROVED')
      .reduce((total, reg) => {
        const weeks = calculateWeeksBetween(reg.effectiveFrom, reg.effectiveTo);
        const hours = calculateShiftHours(reg.shiftName || '', workShifts);
        return total + (hours * weeks);
      }, 0);
  };

  // Update current approved hours whenever registrations change
  useEffect(() => {
    setCurrentApprovedHours(calculateTotalApprovedHours());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partTimeRegistrations]);

  // REMOVED EDIT MODAL STATE - Registrations are immutable
  // const [showPartTimeEditModal, setShowPartTimeEditModal] = useState(false);
  // const [partTimeEditingRegistration, setPartTimeEditingRegistration] = useState<ShiftRegistration | null>(null);
  // const [partTimeUpdating, setPartTimeUpdating] = useState(false);
  // const [partTimeEditFormData, setPartTimeEditFormData] = useState<UpdateShiftRegistrationRequest>({});

  const [showPartTimeDeleteModal, setShowPartTimeDeleteModal] = useState(false);
  const [partTimeDeletingRegistration, setPartTimeDeletingRegistration] = useState<ShiftRegistration | null>(null);
  const [partTimeDeleting, setPartTimeDeleting] = useState(false);

  // View Details Modal
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [viewingRegistration, setViewingRegistration] = useState<ShiftRegistration | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);

  // Work slots (PartTimeSlot[]) - for mapping partTimeSlotId to shiftName
  const [workSlots, setWorkSlots] = useState<PartTimeSlot[]>([]);
  const [loadingWorkSlots, setLoadingWorkSlots] = useState(false);

  // Available slots for PART_TIME_FLEX employees
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);
  const [slotDetailsMap, setSlotDetailsMap] = useState<Record<number, SlotDetailsResponse>>({});
  const [expandedSlotId, setExpandedSlotId] = useState<number | null>(null);
  const [slotSortBy, setSlotSortBy] = useState<'date' | 'availability'>('date');
  const [slotMonthFilter, setSlotMonthFilter] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  const [slotDayFilter, setSlotDayFilter] = useState<DayOfWeek[]>([]); // Multi-select days
  const [registrationSortBy, setRegistrationSortBy] = useState<'status' | 'date'>('status');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('ALL');

  // ==================== FIXED REGISTRATION STATE ====================
  const [fixedRegistrations, setFixedRegistrations] = useState<FixedShiftRegistration[]>([]);
  const [fixedLoading, setFixedLoading] = useState(true);

  // Fixed modals
  const [showFixedDetailsModal, setShowFixedDetailsModal] = useState(false);
  const [fixedDetailsRegistration, setFixedDetailsRegistration] = useState<FixedShiftRegistration | null>(null);

  // Get current user's employee ID
  // Try multiple sources: user.employeeId, decode from token
  // Note: employeeId can be either string or number
  // For Fixed Registration, backend can also get employeeId from token if not provided
  const currentEmployeeId: string | number | null = useMemo(() => {
    // Try user.employeeId first
    if (user?.employeeId !== undefined && user?.employeeId !== null) {
      const idStr = String(user.employeeId).trim();
      if (idStr && idStr !== 'undefined' && idStr !== 'null') {
        // Try to parse as number, but if it fails, keep as string
        const idNum = parseInt(idStr, 10);
        if (!isNaN(idNum) && idNum > 0 && isFinite(idNum)) {
          return idNum; // Return as number
        } else {
          // Return as string if it's not a number (e.g., username like "ketoan")
          return idStr;
        }
      }
    }

    // If not in user object, try to decode from token
    if (user?.token) {
      try {
        const employeeIdStr = getEmployeeIdFromToken(user.token);
        if (employeeIdStr && employeeIdStr !== 'undefined' && employeeIdStr !== 'null') {
          const idStr = String(employeeIdStr).trim();
          if (idStr) {
            // Try to parse as number, but if it fails, keep as string
            const idNum = parseInt(idStr, 10);
            if (!isNaN(idNum) && idNum > 0 && isFinite(idNum)) {
              return idNum; // Return as number
            } else {
              // Return as string if it's not a number
              return idStr;
            }
          }
        }
      } catch (error) {
        console.error('[currentEmployeeId] Error extracting from token:', error);
      }
    }

    // Return null if not found - backend will get from token
    return null;
  }, [user?.employeeId, user?.token]);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (activeTab === 'part-time' && availableTabs.includes('part-time')) {
      // For Part-Time Flex registration, employeeId is optional (backend gets from token)
      // So we can still fetch available slots even without currentEmployeeId
      console.log('[useEffect] Fetching Part-Time Registrations...');
      fetchPartTimeRegistrations();

      // Load available slots if user has VIEW_AVAILABLE_SLOTS permission (PART_TIME_FLEX)
      // Note: available slots API doesn't require employeeId in request
      if (isPartTimeFlex || hasPermission(Permission.VIEW_AVAILABLE_SLOTS)) {
        console.log('[useEffect] Fetching Available Slots (PART_TIME_FLEX or has VIEW_AVAILABLE_SLOTS permission)');
        fetchAvailableSlots();
      } else {
        console.log('[useEffect] Not fetching available slots - not PART_TIME_FLEX and no VIEW_AVAILABLE_SLOTS permission');
        if (!isPartTimeFlex) {
          fetchWorkShifts();
        }
      }

      // Always fetch workShifts and workSlots to get shift names for registrations
      fetchWorkShifts();
      // Always fetch workShifts and workSlots to get shift names for registrations
      fetchWorkShifts();
      fetchWorkSlotsData();

      if (!currentEmployeeId) {
        console.warn('[useEffect] currentEmployeeId is null/NaN - Part-Time Flex registration might still work (backend gets from token)');
      } else {
        console.log('[useEffect] currentEmployeeId available:', currentEmployeeId);
      }
    } else if (activeTab === 'fixed' && availableTabs.includes('fixed')) {
      // Fetch fixed registrations
      // Backend will get employeeId from token if not provided in params
      fetchFixedRegistrations();
    }
  }, [activeTab, partTimeCurrentPage, currentEmployeeId, availableTabs, isPartTimeFlex, hasPermission, slotMonthFilter]);

  // Part-Time Registration Fetch
  const fetchPartTimeRegistrations = async () => {
    try {
      setPartTimeLoading(true);

      // UPDATED: Backend now returns paginated response
      const response = await shiftRegistrationService.getMyRegistrations({
        page: partTimeCurrentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      }, 'part-time-flex');

      // Backend now ALWAYS returns paginated response (Spring Data Page object)
      console.log('Part-time registrations (paginated):', {
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        currentPage: response.pageable?.pageNumber ?? partTimeCurrentPage,
        items: response.content?.length ?? 0
      });

      setPartTimeRegistrations(response.content || []);
      setPartTimeTotalPages(response.totalPages || 0);
      setPartTimeTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('Failed to fetch part-time registrations:', error);

      // Extract detailed error message from 500 response
      let errorMessage = 'Failed to fetch your shift registrations';
      if (error.response?.status === 500) {
        console.error('� [Backend 500 Error] Server error details:', {
          fullResponse: error.response,
          data: error.response.data,
          message: error.response.data?.message,
          detail: error.response.data?.detail,
          error: error.response.data?.error,
          trace: error.response.data?.trace
        });
        errorMessage = `Server error: ${error.response.data?.message || error.response.data?.detail || error.response.data?.error || 'Internal server error - check backend logs'}`;
      }

      toast.error(error.response?.data?.detail || error.response?.data?.message || error.message || errorMessage);
    } finally {
      setPartTimeLoading(false);
    }
  };

  const fetchWorkShifts = async () => {
    try {
      setLoadingWorkShifts(true);
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);

      if (!shiftsResponse || shiftsResponse.length === 0) {
        toast.warning('Hiện chưa có ca làm việc nào. Vui lòng liên hệ quản trị viên để tạo ca làm việc.');
      }
    } catch (error: any) {
      console.error('Failed to fetch work shifts:', error);
      toast.error('Không thể tải danh sách ca làm việc: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingWorkShifts(false);
    }
  };

  /**
   * Fetch work slots (PartTimeSlot[]) for mapping shift names
   * 
   * LƯU Ý QUAN TRỌNG:
   * - API này yêu cầu permission MANAGE_WORK_SLOTS (chỉ dành cho Admin/Manager)
   * - Employee KHÔNG có quyền này → Sẽ gây lỗi 403
   * - Chỉ gọi API này nếu user có permission MANAGE_WORK_SLOTS
   * - Employee chỉ cần xem registrations của chính họ, không cần xem tất cả work slots
   */
  const fetchWorkSlotsData = async () => {
    // Chỉ fetch nếu user có permission MANAGE_WORK_SLOTS
    // (Thường là Admin/Manager mới có permission này)
    if (!hasManagePermission) {
      console.log('[fetchWorkSlotsData] Skipping - User does not have MANAGE_WORK_SLOTS permission');
      setWorkSlots([]); // Set empty array
      return;
    }

    try {
      setLoadingWorkSlots(true);
      const slotsResponse = await workSlotService.getWorkSlots();
      setWorkSlots(slotsResponse || []);
      console.log('[fetchWorkSlotsData] Loaded work slots:', {
        count: slotsResponse?.length || 0,
        slots: slotsResponse
      });
    } catch (error: any) {
      console.error('[fetchWorkSlotsData] Failed to fetch work slots:', error);

      // Nếu lỗi 403 → User không có permission (expected cho employee)
      if (error.response?.status === 403) {
        console.log('[fetchWorkSlotsData] 403 Forbidden - User does not have permission to view all work slots');
        // Don't show error toast - this is expected for employees
      } else {
        // Các lỗi khác (500, network, etc.) - có thể log nhưng không hiển thị toast
        // vì đây là optional data
      }

      setWorkSlots([]); // Set empty array on error
    } finally {
      setLoadingWorkSlots(false);
    }
  };

  // Fetch available slots for PART_TIME_FLEX employees
  const fetchAvailableSlots = async () => {
    try {
      console.log('[fetchAvailableSlots] Starting fetch...');
      console.log('� [fetchAvailableSlots] Current state:', {
        slotMonthFilter,
        isPartTimeFlex,
        hasViewPermission: hasPermission(Permission.VIEW_AVAILABLE_SLOTS)
      });
      setLoadingAvailableSlots(true);

      // IMPORTANT: Month filter might hide slots that are still available
      // Backend filters by effectiveFrom month, but slots can span multiple months
      const monthParam = slotMonthFilter !== 'ALL' ? slotMonthFilter : undefined;
      console.log(`[fetchAvailableSlots] Calling API with month filter: ${monthParam || 'NO FILTER (showing all)'}`);

      const slots = await shiftRegistrationService.getAvailableSlots(monthParam);

      console.log('[fetchAvailableSlots] API Response received:', {
        rawData: slots,
        isArray: Array.isArray(slots),
        length: Array.isArray(slots) ? slots.length : 'not an array',
        firstItem: Array.isArray(slots) && slots.length > 0 ? slots[0] : 'no items',
        allSlots: slots
      });

      const slotsArray = slots || [];

      // DEBUG: Check each slot's availability
      console.log('[fetchAvailableSlots] Analyzing slot availability:');

      // Map backend field names to frontend
      // Backend uses: totalWeeksAvailable, availableWeeks, fullWeeks
      // Frontend expects: totalDatesAvailable, totalDatesEmpty, totalDatesFull
      const slotsWithMappedFields = slotsArray.map(slot => {
        const slotAny = slot as any; // Cast to any to access backend field names
        return {
          ...slot,
          // Map backend fields to frontend field names
          totalDatesAvailable: slotAny.totalWeeksAvailable || slot.totalDatesAvailable,
          totalDatesEmpty: slotAny.availableWeeks !== undefined ? slotAny.availableWeeks : slot.totalDatesEmpty,
          totalDatesFull: slotAny.fullWeeks !== undefined ? slotAny.fullWeeks : slot.totalDatesFull
        };
      });

      slotsWithMappedFields.forEach((slot, index) => {
        const isFull = slot.totalDatesEmpty === 0;
        const hasSpace = slot.totalDatesEmpty > 0;

        console.log(`  Slot ${index + 1}:`, {
          slotId: slot.slotId,
          shiftName: slot.shiftName,
          dayOfWeek: slot.dayOfWeek,
          effectiveFrom: slot.effectiveFrom,
          effectiveTo: slot.effectiveTo,
          // Mapped values from backend
          totalDatesAvailable: slot.totalDatesAvailable,  // = totalWeeksAvailable
          totalDatesEmpty: slot.totalDatesEmpty,          // = availableWeeks
          totalDatesFull: slot.totalDatesFull,            // = fullWeeks
          availabilitySummary: slot.availabilitySummary,
          isFull,
          hasSpace,
          percentageFull: slot.totalDatesAvailable > 0
            ? Math.round((slot.totalDatesFull / slot.totalDatesAvailable) * 100) + '%'
            : 'N/A'
        });

        if (isFull) {
          console.warn(`  Slot ${slot.slotId} (${slot.shiftName}) is FULL (0 weeks available)!`);
        } else if (hasSpace) {
          console.log(`  Slot ${slot.slotId} has ${slot.totalDatesEmpty}/${slot.totalDatesAvailable} weeks available!`);
        }
      });

      console.log('[fetchAvailableSlots] Setting availableSlots:', {
        count: slotsWithMappedFields.length,
        fullSlots: slotsWithMappedFields.filter(s => s.totalDatesEmpty === 0).length,
        partialSlots: slotsWithMappedFields.filter(s => s.totalDatesEmpty > 0 && s.totalDatesEmpty < s.totalDatesAvailable).length,
        emptySlots: slotsWithMappedFields.filter(s => s.totalDatesEmpty === s.totalDatesAvailable).length
      });

      setAvailableSlots(slotsWithMappedFields);

      // Fetch slot details for each slot
      const detailsMap: Record<number, SlotDetailsResponse> = {};
      await Promise.all(
        slotsArray.map(async (slot) => {
          try {
            const details = await shiftRegistrationService.getSlotDetails(slot.slotId);
            detailsMap[slot.slotId] = details;
          } catch (error) {
            console.error(`Failed to fetch details for slot ${slot.slotId}:`, error);
          }
        })
      );
      setSlotDetailsMap(detailsMap);

      if (!slots || slotsArray.length === 0) {
        console.warn('[fetchAvailableSlots] No available slots found');
        toast.info('Hiện tại không có suất nào còn trống. Vui lòng thử lại sau.');
      } else {
        console.log('[fetchAvailableSlots] Successfully loaded', slotsArray.length, 'available slots');
      }
    } catch (error: any) {
      console.error('[fetchAvailableSlots] Error fetching available slots:', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Extract detailed error message from 500 response
      let errorMessage = 'Failed to load available slots';
      if (error.response?.status === 500) {
        console.error('� [Backend 500 Error] Server error details:', {
          fullResponse: error.response,
          data: error.response.data,
          message: error.response.data?.message,
          detail: error.response.data?.detail,
          error: error.response.data?.error,
          trace: error.response.data?.trace
        });
        errorMessage = `Server error: ${error.response.data?.message || error.response.data?.detail || error.response.data?.error || 'Internal server error'}`;
      }

      toast.error(error.response?.data?.message || error.message || errorMessage);
    } finally {
      console.log('[fetchAvailableSlots] Finished (set loading to false)');
      setLoadingAvailableSlots(false);
    }
  };

  // Fixed Registration Fetch
  const fetchFixedRegistrations = async () => {
    try {
      setFixedLoading(true);

      // Build params - only include employeeId if we have it
      // If not provided, backend will get employeeId from token
      const params: FixedRegistrationQueryParams = {};
      if (currentEmployeeId !== null && currentEmployeeId !== undefined) {
        // Only add employeeId if it's a valid number
        // If it's a string (like username), backend should get from token
        if (typeof currentEmployeeId === 'number') {
          params.employeeId = currentEmployeeId;
        }
        // If it's a string, don't send it - backend will get from token
      }

      const response = await fixedRegistrationService.getRegistrations(params);
      setFixedRegistrations(response);
    } catch (error: any) {
      console.error('Failed to fetch fixed registrations:', error);
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch fixed shift registrations';
      toast.error(errorMessage);

      if (error.errorCode === 'EMPLOYEE_ID_REQUIRED' || error.response?.status === 400) {
        toast.error('Employee ID is required. Please contact administrator.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied: You can only view your own fixed shift registrations');
      }
    } finally {
      setFixedLoading(false);
    }
  };

  // ==================== PART-TIME REGISTRATION HANDLERS ====================
  const handlePartTimeCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[handlePartTimeCreate] Starting registration creation...');
    console.log('Form data:', partTimeCreateFormData);
    console.log('� User type:', { isPartTimeFlex, employeeType: user?.employmentType });

    // Validate based on employee type
    if (isPartTimeFlex) {
      // PART_TIME_FLEX: Need all required fields
      if (!partTimeCreateFormData.partTimeSlotId) {
        console.error('Validation failed: No slot selected');
        toast.error('Vui lòng chọn suất làm việc');
        setFormErrors({ general: 'Vui lòng chọn suất làm việc' });
        return;
      }
      // Use selected slot days from selected slot instead of form dayOfWeek
      const selectedSlot = availableSlots.find(s => s.slotId === partTimeCreateFormData.partTimeSlotId);
      console.log('Selected slot:', selectedSlot);

      const slotDays = selectedSlot?.dayOfWeek ? selectedSlot.dayOfWeek.split(',').map(d => d.trim()) : [];
      if (!slotDays || slotDays.length === 0) {
        console.error('Validation failed: No days configured for slot');
        toast.error('Suất này chưa cấu hình ngày làm việc. Vui lòng chọn suất khác.');
        setFormErrors({ general: 'Suất này chưa cấu hình ngày làm việc' });
        return;
      }

      if (!partTimeCreateFormData.effectiveFrom) {
        console.error('Validation failed: No start date');
        toast.error('Vui lòng chọn tuần bắt đầu');
        setFormErrors({ general: 'Vui lòng chọn tuần bắt đầu' });
        return;
      }

      console.log('Basic validation passed');
      console.log('� Slot days:', slotDays);
      console.log('� Date range:', { from: partTimeCreateFormData.effectiveFrom, to: partTimeCreateFormData.effectiveTo });

      // VALIDATE 21H WEEKLY LIMIT (CLIENT-SIDE)
      if (hoursPerWeek > 0 && currentApprovedHours + hoursPerWeek > 21) {
        const totalHours = currentApprovedHours + hoursPerWeek;
        toast.error(
          `Vượt giới hạn 21h/tuần! Hiện tại: ${currentApprovedHours}h, đăng ký mới: ${hoursPerWeek}h, tổng: ${totalHours}h`,
          { duration: 5000 }
        );
        setFormErrors({
          general: `Vượt giới hạn 21h/tuần! Bạn đã có ${currentApprovedHours}h được duyệt. Đăng ký mới ${hoursPerWeek}h sẽ vượt quá giới hạn.`
        });
        return;
      }

      // Validate dates if effectiveTo is provided
      if (partTimeCreateFormData.effectiveTo) {
        const from = new Date(partTimeCreateFormData.effectiveFrom);
        const to = new Date(partTimeCreateFormData.effectiveTo);
        if (to < from) {
          toast.error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
          return;
        }
      }
      // Client-side full-cycle validation: ensure range includes at least one occurrence of each slot day
      const fromDateStr = partTimeCreateFormData.effectiveFrom;
      const toDateStr = partTimeCreateFormData.effectiveTo || selectedSlot?.effectiveTo || '';
      const slotDaysArr = slotDays;
      const { valid, missingDays } = validateDateRangeFullCycle(fromDateStr, toDateStr, slotDaysArr);
      if (!valid) {
        const missing = missingDays.map(d => getDayName(d as DayOfWeek)).join(', ');
        const msg = `Khoảng thời gian bạn chọn không bao gồm đầy đủ các ngày làm việc (${missing}). Vui lòng chọn lại.`;
        setFormErrors({ general: msg });
        toast.error(msg);
        return;
      }
    } else {
      // Admin/Manager with MANAGE_WORK_SLOTS: Use old form structure (if still needed)
      toast.error('Chức năng này chỉ dành cho nhân viên PART_TIME_FLEX. Vui lòng sử dụng trang quản lý.');
      return;
    }

    try {
      setPartTimeCreating(true);
      setFormErrors({}); // Clear previous errors

      // If effectiveTo is not provided, use slot's effectiveTo
      // Build request payload: only the three required fields
      const requestData: any = {
        partTimeSlotId: partTimeCreateFormData.partTimeSlotId,
        effectiveFrom: partTimeCreateFormData.effectiveFrom
      };
      if (partTimeCreateFormData.effectiveTo) requestData.effectiveTo = partTimeCreateFormData.effectiveTo;
      if (!requestData.effectiveTo && requestData.partTimeSlotId) {
        const selectedSlot = availableSlots.find(s => s.slotId === requestData.partTimeSlotId);
        if (selectedSlot?.effectiveTo) {
          requestData.effectiveTo = selectedSlot.effectiveTo;
        }
      }

      console.log('� Sending request to API:', requestData);

      const result = await shiftRegistrationService.createRegistration(requestData);

      console.log('Registration created successfully:', result);
      toast.success('Đăng ký ca làm việc thành công! Chờ quản lý phê duyệt.', { duration: 5000 });

      setShowPartTimeCreateModal(false);
      setPartTimeCreateFormData({ partTimeSlotId: 0, effectiveFrom: '', effectiveTo: '' });
      setSelectedSlotDays([]);
      setSelectedSlot(null);
      setFormErrors({});
      setFormErrors({});
      // Refresh data
      await fetchPartTimeRegistrations();
      if (isPartTimeFlex) {
        await fetchAvailableSlots();
      }
    } catch (error: any) {
      console.error('Failed to create registration:', error);

      // Handle specific error codes
      if (error.errorCode === 'INVALID_EMPLOYEE_TYPE' || error.response?.data?.errorCode === 'INVALID_EMPLOYEE_TYPE') {
        toast.error('Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt.');
      } else if (error.errorCode === 'SLOT_IS_FULL' || error.response?.data?.errorCode === 'SLOT_IS_FULL') {
        toast.error('Suất này đã đủ người đăng ký. Vui lòng chọn suất khác.');
        await fetchAvailableSlots(); // Refresh available slots
      } else if (error.errorCode === 'WEEKLY_HOURS_LIMIT_EXCEEDED' || error.response?.data?.errorCode === 'WEEKLY_HOURS_LIMIT_EXCEEDED') {
        // HANDLE WEEKLY_HOURS_LIMIT_EXCEEDED FROM BACKEND
        const errorData = error.response?.data;
        const currentHours = errorData?.currentApprovedHours || currentApprovedHours;
        const requestedHours = errorData?.requestedHours || hoursPerWeek;
        const totalHours = errorData?.totalHours || (currentHours + requestedHours);
        const limit = errorData?.weeklyHoursLimit || 21;

        toast.error(
          `Vượt giới hạn ${limit}h/tuần! Hiện tại: ${currentHours}h, đăng ký mới: ${requestedHours}h, tổng: ${totalHours}h`,
          { duration: 6000 }
        );
        setFormErrors({
          general: `Vượt giới hạn ${limit}h/tuần! Bạn đã có ${currentHours}h được duyệt. Đăng ký mới ${requestedHours}h sẽ vượt quá giới hạn.`
        });
      } else if (error.response?.status === 400) {
        // Server-side validation failed - show user friendly message if present
        const detail = error.response?.data?.detail || error.response?.data?.message || '';
        if (detail) {
          const userMsg = detail.includes('đầy đủ') || detail.includes('cycle')
            ? 'Khoảng thời gian bạn chọn không bao gồm đầy đủ các ngày làm việc của Slot này. Vui lòng chọn lại.'
            : detail;
          toast.error(userMsg);
          setFormErrors({ general: userMsg });
        } else {
          toast.error('Yêu cầu không hợp lệ. Vui lòng kiểm tra lại.');
        }
        await fetchAvailableSlots();
      } else if (error.errorCode === 'REGISTRATION_CONFLICT' || error.response?.data?.errorCode === 'REGISTRATION_CONFLICT') {
        toast.error('Bạn đã đăng ký suất này rồi hoặc có ca làm việc trùng giờ.');
      } else {
        toast.error(error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to create shift registration');
      }
    } finally {
      setPartTimeCreating(false);
    }
  };

  // REMOVED handlePartTimeEdit and handlePartTimeUpdate functions
  // Registrations are immutable per backend design
  // Employees should delete and create new registration to modify

  const handleViewDetails = async (registration: ShiftRegistration) => {
    try {
      setLoadingDetails(true);
      setShowViewDetailsModal(true);

      // Call API to get full details
      const details = await shiftRegistrationService.getRegistrationById(registration.registrationId.toString());
      setViewingRegistration(details);
    } catch (error: any) {
      console.error('Failed to load registration details:', error);

      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.response?.data?.detail;

      if (status === 403) {
        toast.error('Bạn không có quyền xem đăng ký này');
      } else if (status === 404) {
        toast.error('Không tìm thấy đăng ký này');
      } else {
        toast.error(errorMessage || 'Không thể tải thông tin đăng ký');
      }

      setShowViewDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePartTimeDelete = async () => {
    if (!partTimeDeletingRegistration) return;

    try {
      setPartTimeDeleting(true);
      const response = await shiftRegistrationService.deleteRegistration(partTimeDeletingRegistration.registrationId.toString());

      // Response will have status = "CANCELLED"
      toast.success('Đã hủy đăng ký thành công');
      setShowPartTimeDeleteModal(false);
      setPartTimeDeletingRegistration(null);

      // Refresh registrations to show updated status
      fetchPartTimeRegistrations();
    } catch (error: any) {
      console.error('Failed to delete registration:', error);

      // Handle specific error codes from backend
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.response?.data?.detail;

      if (status === 409) {
        // 409 Conflict: Cannot cancel non-PENDING registration
        toast.error(errorMessage || 'Chỉ có thể hủy đơn đăng ký ở trạng thái Chờ duyệt');
      } else if (status === 404) {
        toast.error('Không tìm thấy đăng ký này');
      } else if (status === 403) {
        toast.error('Bạn không có quyền hủy đăng ký này');
      } else {
        toast.error(errorMessage || 'Không thể hủy đăng ký. Vui lòng thử lại.');
      }
    } finally {
      setPartTimeDeleting(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getWorkShiftName = (slotId: string | number) => {
    const workShift = workShifts.find(ws => ws.workShiftId === slotId);
    return workShift ? workShift.shiftName : slotId.toString();
  };

  const getWorkShiftTime = (slotId: string | number) => {
    const workShift = workShifts.find(ws => ws.workShiftId === slotId);
    return workShift ? `${formatTimeToHHMM(workShift.startTime)} - ${formatTimeToHHMM(workShift.endTime)}` : '';
  };

  // Get shift name for registration - try multiple sources
  const getRegistrationShiftName = (registration: ShiftRegistration): string => {
    // First, try registration.shiftName (from API response)
    if (registration.shiftName && registration.shiftName.trim() !== '') {
      return registration.shiftName;
    }

    // Second, try to find from availableSlots by partTimeSlotId
    const availableSlot = availableSlots.find(slot => slot.slotId === registration.partTimeSlotId);
    if (availableSlot && availableSlot.shiftName && availableSlot.shiftName.trim() !== '') {
      return availableSlot.shiftName;
    }

    // Third, try to find from workSlots (PartTimeSlot[]) by partTimeSlotId
    const workSlot = workSlots.find(slot => slot.slotId === registration.partTimeSlotId);
    if (workSlot && workSlot.workShiftName && workSlot.workShiftName.trim() !== '') {
      return workSlot.workShiftName;
    }

    // Fallback: return generic name
    return `Ca làm việc (ID: ${registration.partTimeSlotId})`;
  };

  const formatFixedDaysOfWeek = (days: number[]): string => {
    return days
      .sort((a, b) => a - b)
      .map(day => DAY_LABELS[day] || `Day ${day}`)
      .join(', ');
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Vô thời hạn';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Sort and filter available slots
  const sortedAvailableSlots = useMemo(() => {
    let slots = [...availableSlots];

    // TEMPORARILY DISABLED - Backend may return totalDatesEmpty=0 even when slots available
    // TODO: Fix after confirming backend field names
    // slots = slots.filter(slot => slot.totalDatesEmpty > 0);

    // Show ALL slots for now - users can see availability in details
    console.log('[sortedAvailableSlots] Processing slots:', {
      total: slots.length,
      slots: slots.map(s => ({
        id: s.slotId,
        name: s.shiftName,
        totalDatesEmpty: s.totalDatesEmpty,
        totalDatesAvailable: s.totalDatesAvailable,
        availabilitySummary: s.availabilitySummary
      }))
    });

    // NO NEED to filter by month - BE already filtered via API parameter
    // Month filter is handled by passing ?month=YYYY-MM to API

    // Filter by day of week (multi-select)
    if (slotDayFilter.length > 0) {
      slots = slots.filter(slot => {
        // dayOfWeek can be single or comma-separated (e.g., "MONDAY" or "MONDAY,TUESDAY")
        const slotDays = slot.dayOfWeek.split(',').map(d => d.trim() as DayOfWeek);
        // Check if ANY selected day matches ANY slot day
        return slotDayFilter.some(selectedDay => slotDays.includes(selectedDay));
      });
    }

    // Sort
    if (slotSortBy === 'date') {
      // Sort by effectiveFrom date (earliest first)
      return slots.sort((a, b) => {
        const dateA = new Date(a.effectiveFrom).getTime();
        const dateB = new Date(b.effectiveFrom).getTime();
        return dateA - dateB;
      });
    } else {
      // Sort by availability (most available first)
      return slots.sort((a, b) => {
        const availA = a.totalDatesEmpty;
        const availB = b.totalDatesEmpty;
        return availB - availA;
      });
    }
  }, [availableSlots, slotSortBy, slotDayFilter]);

  // Sort registrations by status
  const sortedPartTimeRegistrations = useMemo(() => {
    let regs = [...partTimeRegistrations];

    // Filter by status first
    if (registrationStatusFilter !== 'ALL') {
      regs = regs.filter(reg => reg.status === registrationStatusFilter);
    }

    // Then sort
    if (registrationSortBy === 'status') {
      // Sort by status: PENDING → APPROVED → REJECTED → CANCELLED
      const statusOrder = { 'PENDING': 1, 'APPROVED': 2, 'REJECTED': 3, 'CANCELLED': 4 };
      return regs.sort((a, b) => {
        const orderA = statusOrder[a.status as keyof typeof statusOrder] || 999;
        const orderB = statusOrder[b.status as keyof typeof statusOrder] || 999;
        return orderA - orderB;
      });
    } else {
      // Sort by date (newest first)
      return regs.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
  }, [partTimeRegistrations, registrationSortBy, registrationStatusFilter]);

  // Get available months from slot details (months with actual availability)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();

    // Get months from slotDetailsMap (actual availability from BE)
    Object.values(slotDetailsMap).forEach(details => {
      if (details?.availabilityByMonth) {
        details.availabilityByMonth.forEach(month => {
          if (month.totalDatesAvailable > 0 && month.monthName) {
            // Parse "November 2025" to "2025-11"
            const [monthName, year] = month.monthName.split(' ');
            const monthNumber = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
            const monthStr = `${year}-${monthNumber.toString().padStart(2, '0')}`;
            months.add(monthStr);
          }
        });
      }
    });

    // Fallback: If no slot details loaded yet, get from effectiveFrom
    if (months.size === 0) {
      availableSlots.forEach(slot => {
        const month = format(parseISO(slot.effectiveFrom), 'yyyy-MM');
        months.add(month);
      });
    }

    return Array.from(months).sort();
  }, [availableSlots, slotDetailsMap]);

  // Get month display name
  const getMonthDisplayName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `Tháng ${parseInt(month)}/${year}`;
  };

  // Toggle day filter (multi-select)
  const toggleDayFilter = (day: DayOfWeek) => {
    setSlotDayFilter(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSlotMonthFilter('ALL');
    setSlotDayFilter([]);
  };

  // ==================== REFRESH HANDLER ====================
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      // Refresh all data based on active tab
      if (activeTab === 'part-time') {
        await Promise.all([
          fetchPartTimeRegistrations(),
          isPartTimeFlex || hasPermission(Permission.VIEW_AVAILABLE_SLOTS) ? fetchAvailableSlots() : Promise.resolve()
        ]);
        toast.success('Đã cập nhật dữ liệu mới nhất!');
      } else {
        await fetchFixedRegistrations();
        toast.success('Đã cập nhật dữ liệu mới nhất!');
      }
    } catch (error) {
      toast.error('Không thể cập nhật dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_OWN, Permission.VIEW_FIXED_REGISTRATIONS_OWN]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đăng Ký Ca Làm Việc</h1>
            <p className="text-gray-600 mt-1">Quản lý đăng ký ca làm việc của bạn</p>
          </div>
          <Button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang cập nhật...' : 'Làm mới'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'part-time' | 'fixed')} className="space-y-6">
          {availableTabs.length > 1 && (
            <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
              {availableTabs.includes('part-time') && (
                <TabsTrigger value="part-time">
                  Đăng ký Part-time
                </TabsTrigger>
              )}
              {availableTabs.includes('fixed') && (
                <TabsTrigger value="fixed">
                  Ca làm việc cố định
                </TabsTrigger>
              )}
            </TabsList>
          )}

          {/* PART-TIME REGISTRATIONS TAB */}
          {availableTabs.includes('part-time') && (
            <TabsContent value="part-time" className="space-y-6">

              {/* Available Slots Section - Improved Design */}
              {(isPartTimeFlex || hasPermission(Permission.VIEW_AVAILABLE_SLOTS)) && (
                <>
                  {/* Header & Controls */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <CardTitle className="text-lg">
                            Các Suất Làm Việc Có Sẵn
                          </CardTitle>
                        </div>
                        <Button
                          onClick={async () => {
                            setLoadingAvailableSlots(true);
                            try {
                              await fetchAvailableSlots();
                              toast.success('Đã cập nhật danh sách suất!');
                            } catch (error) {
                              toast.error('Không thể cập nhật');
                            } finally {
                              setLoadingAvailableSlots(false);
                            }
                          }}
                          disabled={loadingAvailableSlots}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${loadingAvailableSlots ? 'animate-spin' : ''}`} />
                          Làm mới
                        </Button>
                      </div>

                      {/* Sort & Legend Controls */}
                      <div className="space-y-3">
                        {/* Month and Day Filters - Single Row */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Month Filter */}
                          <div className="flex-shrink-0">
                            <Label className="text-sm text-gray-600 font-medium mb-2 block">
                              Lọc theo tháng:
                            </Label>
                            <MonthPicker
                              value={slotMonthFilter}
                              onChange={setSlotMonthFilter}
                              availableMonths={availableMonths}
                              placeholder="Chọn tháng"
                            />
                          </div>

                          {/* Day Filter */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600 font-medium">
                                Lọc theo thứ: {slotDayFilter.length > 0 && `(${slotDayFilter.length} đã chọn)`}
                              </span>
                              {slotDayFilter.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSlotDayFilter([])}
                                  className="text-xs text-gray-500 hover:text-gray-700 h-auto py-1"
                                >
                                  Xóa chọn
                                </Button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Object.values(DayOfWeek).map(day => {
                                const isSelected = slotDayFilter.includes(day);
                                return (
                                  <Button
                                    key={day}
                                    variant={isSelected ? 'default' : 'outline'}
                                    onClick={() => toggleDayFilter(day)}
                                    size="sm"
                                    className={isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                  >
                                    {getDayOfWeekLabel(day)}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Hiển thị: {sortedAvailableSlots.length} / {availableSlots.filter(s => s.totalDatesEmpty > 0).length} suất
                            </span>
                            {(slotMonthFilter !== 'ALL' || slotDayFilter.length > 0) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-xs"
                              >
                                Xóa bộ lọc
                              </Button>
                            )}
                          </div>

                          {/* Sort Options */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Sắp xếp:</span>
                            <select
                              value={slotSortBy}
                              onChange={(e) => setSlotSortBy(e.target.value as 'date' | 'availability')}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="date">Ngày bắt đầu</option>
                              <option value="availability">Số slot còn</option>
                            </select>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-100">
                          <span className="text-gray-600 font-medium">Độ khả dụng:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            <span className="text-gray-600">Còn nhiều (&gt;50%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                            <span className="text-gray-600">Sắp đầy (20-50%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            <span className="text-gray-600">Đầy (0-20%)</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Available Slots Table - Redesigned */}
                  {loadingAvailableSlots ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                        <span className="text-gray-600 font-medium">Đang tải suất làm việc...</span>
                      </div>
                    </div>
                  ) : sortedAvailableSlots.length === 0 ? (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 shadow-sm">
                      <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-purple-600" />
                        </div>
                        {availableSlots.length === 0 ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có suất nào còn trống</h3>
                            <p className="text-sm text-gray-600">Vui lòng quay lại sau hoặc liên hệ quản lý</p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy suất phù hợp</h3>
                            <p className="text-sm text-gray-600 mb-4">Thử điều chỉnh bộ lọc của bạn</p>
                            <Button
                              onClick={clearAllFilters}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Xóa bộ lọc
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Ca làm việc
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Thứ
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Giờ/tuần
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Giới hạn tuần
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Tình trạng
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Hành động
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sortedAvailableSlots.map((slot) => {
                                const slotDetails = slotDetailsMap[slot.slotId];
                                const shiftHours = calculateShiftHours(slot.shiftName, workShifts);

                                // Calculate days per week from slot.dayOfWeek
                                const daysPerWeek = slot.dayOfWeek ? slot.dayOfWeek.split(',').length : 0;
                                const hoursPerWeek = shiftHours * daysPerWeek;

                                // FIX: Calculate TOTAL working days from slotDetails
                                // totalDatesAvailable = days with space (CHANGES with bookings)
                                // We need: TOTAL working days (NEVER changes)
                                let totalWorkingDays = 0;
                                if (slotDetails && slotDetails.availabilityByMonth) {
                                  // Sum up totalWorkingDays from all months
                                  totalWorkingDays = slotDetails.availabilityByMonth.reduce(
                                    (sum, month) => sum + month.totalWorkingDays, 0
                                  );
                                } else {
                                  // Fallback: Use totalDatesAvailable (may be inaccurate)
                                  totalWorkingDays = slot.totalDatesAvailable || 0;
                                }

                                // Calculate availability based on actual slots, not weeks
                                // IMPORTANT: Backend only counts APPROVED registrations
                                // Pending registrations do NOT reduce quota until approved by admin
                                let totalSlots, availableSlots, approvedSlots, availablePercent;

                                if (slotDetails && slotDetails.quota && slotDetails.availabilityByMonth) {
                                  // CORRECT: Calculate from monthly breakdown (not overallRemaining which is wrong)
                                  totalSlots = slotDetails.availabilityByMonth.reduce((sum, m) => sum + (m.totalWorkingDays * slotDetails.quota), 0);
                                  availableSlots = slotDetails.availabilityByMonth.reduce((sum, m) => sum + (m.totalDatesAvailable * slotDetails.quota), 0);
                                  approvedSlots = totalSlots - availableSlots;
                                  availablePercent = totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0;
                                } else {
                                  // Fallback to weeks (less accurate)
                                  const availableWeeks = slot.totalDatesEmpty || 0;
                                  totalSlots = totalWorkingDays;
                                  availableSlots = availableWeeks;
                                  approvedSlots = totalWorkingDays - availableWeeks;
                                  availablePercent = totalWorkingDays > 0 ? (availableWeeks / totalWorkingDays) * 100 : 0;
                                }

                                const getColorClass = () => {
                                  if (availablePercent >= 50) return 'bg-green-500';
                                  if (availablePercent >= 20) return 'bg-yellow-500';
                                  return 'bg-red-500';
                                };

                                const getStatusBadge = () => {
                                  if (availablePercent >= 50) return 'bg-green-100 text-green-800';
                                  if (availablePercent >= 20) return 'bg-yellow-100 text-yellow-800';
                                  return 'bg-red-100 text-red-800';
                                };

                                const getStatusText = () => {
                                  if (availablePercent >= 50) return 'Còn nhiều';
                                  if (availablePercent >= 20) return 'Sắp đầy';
                                  if (availablePercent > 0) return 'Gần đầy';
                                  return 'Đầy';
                                };

                                const isExpanded = expandedSlotId === slot.slotId;

                                return (
                                  <React.Fragment key={slot.slotId}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{slot.shiftName}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm text-gray-700">
                                          {slot.dayOfWeek.split(',').map((day, idx) =>
                                            getDayOfWeekLabel(day.trim() as DayOfWeek)
                                          ).join(', ')}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm font-semibold text-gray-900">{hoursPerWeek}h</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm text-gray-600">{totalWorkingDays} tuần</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="space-y-1.5">
                                          {/* Slot availability display */}
                                          <div className="text-sm font-medium text-gray-900">
                                            {availableSlots}/{totalSlots} slots
                                          </div>

                                          {/* Details Button */}
                                          {slotDetails?.availabilityByMonth && slotDetails.availabilityByMonth.length > 0 && (
                                            <button
                                              onClick={() => setExpandedSlotId(isExpanded ? null : slot.slotId)}
                                              className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                            >
                                              {isExpanded ? (
                                                <>Chi tiết <ChevronUp className="w-3 h-3" /></>
                                              ) : (
                                                <>Chi tiết <ChevronDown className="w-3 h-3" /></>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <Button
                                          onClick={() => {
                                            const daysOfWeek = slot.dayOfWeek ? slot.dayOfWeek.split(',').map(d => d.trim() as DayOfWeek) : [];
                                            const firstDay = daysOfWeek[0];
                                            const calculatedDate = firstDay ? getNextDateForDayOfWeek(firstDay) : '';

                                            setSelectedSlot(slot);

                                            // Mặc định = max(hôm nay, slot.effectiveFrom)
                                            const today = format(new Date(), 'yyyy-MM-dd');
                                            const slotStart = slot.effectiveFrom;
                                            const defaultDate = slotStart > today ? slotStart : today;

                                            setPartTimeCreateFormData({
                                              partTimeSlotId: slot.slotId,
                                              effectiveFrom: defaultDate,
                                              effectiveTo: undefined
                                            });
                                            setSelectedSlotDays(daysOfWeek.map(d => String(d)));
                                            setShowPartTimeCreateModal(true);
                                          }}
                                          disabled={availableSlots === 0}
                                          size="sm"
                                          className={availableSlots === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                          }
                                        >
                                          {availableSlots > 0 ? '+ Đăng Ký' : 'Đã Đầy'}
                                        </Button>
                                      </td>
                                    </tr>
                                    {isExpanded && slotDetails && (
                                      <tr>
                                        <td colSpan={6} className="px-4 py-3 bg-gray-50 border-t">
                                          <div className="text-xs font-semibold text-gray-700 mb-2"> Thông tin chi tiết</div>

                                          {/* Summary Info - Simple Text */}
                                          <div className="mb-3 text-xs text-gray-600">
                                            {(() => {
                                              // FIX: Calculate from monthly breakdown instead of overallRemaining
                                              const totalSlots = slotDetails.availabilityByMonth?.reduce((sum, m) => sum + (m.totalWorkingDays * slotDetails.quota), 0) || 0;
                                              const availableSlots = slotDetails.availabilityByMonth?.reduce((sum, m) => sum + (m.totalDatesAvailable * slotDetails.quota), 0) || 0;

                                              return (
                                                <>
                                                  <span className="font-medium">Quota/ngày:</span> {slotDetails.quota} slot/ngày •
                                                  <span className="font-medium ml-2">Tổng slots:</span> {totalSlots} •
                                                  <span className="font-medium ml-2 text-green-600">Còn có thể đăng ký:</span> {availableSlots} slots
                                                </>
                                              );
                                            })()}
                                          </div>

                                          {/* Monthly Breakdown Table */}
                                          {slotDetails.availabilityByMonth && slotDetails.availabilityByMonth.length > 0 && (
                                            <table className="w-full text-xs">
                                              <thead className="bg-white border-b">
                                                <tr>
                                                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Tháng</th>
                                                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Khả dụng</th>
                                                  <th className="px-3 py-2 text-right font-semibold text-gray-700">%</th>
                                                </tr>
                                              </thead>
                                              <tbody className="bg-white divide-y divide-gray-100">
                                                {slotDetails.availabilityByMonth.map((month, idx) => {
                                                  // LOGIC: Slot khả dụng = Tổng slot - Slot đã duyệt
                                                  // totalWorkingDays = tổng ngày làm việc trong tháng
                                                  // totalDatesAvailable = số ngày còn slot trống
                                                  const totalSlots = month.totalWorkingDays * slotDetails.quota;
                                                  const availableSlots = month.totalDatesAvailable * slotDetails.quota;
                                                  const approvedSlots = totalSlots - availableSlots;
                                                  const percentAvailable = totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0;

                                                  // Convert month name to Vietnamese
                                                  const getVietnameseMonth = (monthName: string) => {
                                                    if (!monthName) return '';
                                                    // Parse "November 2025" or "2025-11" format
                                                    if (monthName.includes('-')) {
                                                      const [year, month] = monthName.split('-');
                                                      return `Tháng ${parseInt(month)}/${year}`;
                                                    }
                                                    const [englishMonth, year] = monthName.split(' ');
                                                    const monthNumber = new Date(`${englishMonth} 1, ${year}`).getMonth() + 1;
                                                    return `Tháng ${monthNumber}/${year}`;
                                                  };

                                                  return (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                      <td className="px-3 py-2 text-gray-700">{getVietnameseMonth(month.monthName || month.month)}</td>
                                                      <td className="px-3 py-2 text-right">
                                                        <span className={`font-semibold ${percentAvailable > 70 ? 'text-green-600' : percentAvailable > 30 ? 'text-yellow-600' : percentAvailable > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                          {availableSlots}/{totalSlots} slot
                                                        </span>
                                                      </td>
                                                      <td className="px-3 py-2 text-right text-gray-500">
                                                        {percentAvailable.toFixed(0)}%
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          )}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* My Registrations Section */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-lg">
                      Đăng Ký Của Tôi
                    </CardTitle>
                  </div>

                  {/* Filter Controls */}
                  <div className="space-y-3">
                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={registrationStatusFilter === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setRegistrationStatusFilter('ALL')}
                        size="sm"
                        className={registrationStatusFilter === 'ALL' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      >
                        Tất cả ({partTimeRegistrations.length})
                      </Button>
                      <Button
                        variant={registrationStatusFilter === 'PENDING' ? 'default' : 'outline'}
                        onClick={() => setRegistrationStatusFilter('PENDING')}
                        size="sm"
                        className={registrationStatusFilter === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                      >
                        Chờ duyệt ({partTimeRegistrations.filter(r => r.status === 'PENDING').length})
                      </Button>
                      <Button
                        variant={registrationStatusFilter === 'APPROVED' ? 'default' : 'outline'}
                        onClick={() => setRegistrationStatusFilter('APPROVED')}
                        size="sm"
                        className={registrationStatusFilter === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        Đã duyệt ({partTimeRegistrations.filter(r => r.status === 'APPROVED').length})
                      </Button>
                      <Button
                        variant={registrationStatusFilter === 'REJECTED' ? 'default' : 'outline'}
                        onClick={() => setRegistrationStatusFilter('REJECTED')}
                        size="sm"
                        className={registrationStatusFilter === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        Từ chối ({partTimeRegistrations.filter(r => r.status === 'REJECTED').length})
                      </Button>
                      <Button
                        variant={registrationStatusFilter === 'CANCELLED' ? 'default' : 'outline'}
                        onClick={() => setRegistrationStatusFilter('CANCELLED')}
                        size="sm"
                        className={registrationStatusFilter === 'CANCELLED' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                      >
                        Đã hủy ({partTimeRegistrations.filter(r => r.status === 'CANCELLED').length})
                      </Button>
                    </div>

                    {/* Count Display */}
                    <div className="pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-600">
                        Hiển thị: {sortedPartTimeRegistrations.length} đăng ký
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>

                  {partTimeLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-500 mr-2" />
                      <span className="text-gray-600">Đang tải...</span>
                    </div>
                  ) : sortedPartTimeRegistrations.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      {partTimeRegistrations.length === 0 ? (
                        <>
                          <p className="text-gray-700 font-medium mb-2">Chưa có đăng ký ca làm việc</p>
                          <p className="text-sm text-gray-500">Vui lòng chọn suất ở trên để đăng ký</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-700 font-medium mb-2">Không tìm thấy đăng ký</p>
                          <p className="text-sm text-gray-500">Thử điều chỉnh bộ lọc của bạn</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ca làm</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thời gian</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Đăng ký lúc</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedPartTimeRegistrations.map((registration) => {
                            const statusConfig = {
                              PENDING: {
                                icon: <Clock className="w-4 h-4" />,
                                text: 'PENDING',
                                badgeColor: 'bg-orange-100 text-orange-700'
                              },
                              APPROVED: {
                                icon: <CheckCircle className="w-4 h-4" />,
                                text: 'APPROVED',
                                badgeColor: 'bg-green-100 text-green-700'
                              },
                              REJECTED: {
                                icon: <XCircle className="w-4 h-4" />,
                                text: 'REJECTED',
                                badgeColor: 'bg-red-100 text-red-700'
                              },
                              CANCELLED: {
                                icon: <XCircle className="w-4 h-4" />,
                                text: 'CANCELLED',
                                badgeColor: 'bg-gray-100 text-gray-700'
                              }
                            }[registration.status];

                            return (
                              <tr key={registration.registrationId} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{getRegistrationShiftName(registration)}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-gray-700">
                                    {formatDate(registration.effectiveFrom)}
                                    {registration.effectiveTo && (
                                      <span className="text-gray-500"> → {formatDate(registration.effectiveTo)}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={`${statusConfig.badgeColor} flex items-center gap-1 w-fit`}>
                                    {statusConfig.icon}
                                    {statusConfig.text}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {format(parseISO(registration.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewDetails(registration)}
                                      className="text-blue-600 hover:bg-blue-50"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    {registration.status === 'PENDING' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setPartTimeDeletingRegistration(registration);
                                          setShowPartTimeDeleteModal(true);
                                        }}
                                        className="text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {partTimeTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                      <div className="text-sm text-gray-700">
                        Hiển thị {partTimeCurrentPage * 10 + 1} - {Math.min((partTimeCurrentPage + 1) * 10, partTimeTotalElements)} trong {partTimeTotalElements} đăng ký
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPartTimeCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={partTimeCurrentPage === 0}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPartTimeCurrentPage(prev => Math.min(partTimeTotalPages - 1, prev + 1))}
                          disabled={partTimeCurrentPage === partTimeTotalPages - 1}
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* FIXED REGISTRATIONS TAB */}
          {availableTabs.includes('fixed') && (
            <TabsContent value="fixed" className="space-y-6">

              {/* Fixed Registrations Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Lịch Làm Việc Của Tôi ({fixedRegistrations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fixedLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500 mr-2" />
                      <span className="text-gray-600">Đang tải...</span>
                    </div>
                  ) : fixedRegistrations.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-700 font-medium mb-1">Chưa có lịch làm việc cố định</p>
                      <p className="text-sm text-gray-500">Liên hệ Admin/Manager để được gán lịch</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fixedRegistrations.map((registration) => (
                        <Card key={registration.registrationId}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                  {registration.workShiftName}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge variant="outline">
                                    {formatFixedDaysOfWeek(registration.daysOfWeek)}
                                  </Badge>
                                  <Badge variant={registration.isActive ? "default" : "secondary"}>
                                    <div className="flex items-center space-x-1">
                                      {registration.isActive ? (
                                        <CheckCircle className="h-3 w-3" />
                                      ) : (
                                        <XCircle className="h-3 w-3" />
                                      )}
                                      <span className="text-xs">{registration.isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                                    </div>
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>Từ: <strong>{formatDate(registration.effectiveFrom)}</strong></div>
                                {registration.effectiveTo && (
                                  <div>Đến: <strong>{formatDate(registration.effectiveTo)}</strong></div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* PART-TIME CREATE MODAL */}
        {showPartTimeCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-2xl my-4">
              {/* Fixed Header */}
              <div className="px-4 py-2.5 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">Đăng Ký Ca Làm Việc</h2>
              </div>

              {/* Content - NO SCROLL */}
              <div className="px-4 py-3">
                {/* Validation Errors */}
                {formErrors.general && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">{formErrors.general}</p>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handlePartTimeCreate(e); }} className="space-y-2.5">
                  {isPartTimeFlex ? (
                    <>
                      {/* PART_TIME_FLEX: Use available slots */}
                      <div>
                        <Label htmlFor="createSlot" className="text-sm">Chọn Suất Làm Việc <span className="text-red-500">*</span></Label>
                        {loadingAvailableSlots ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-xs text-gray-600">Đang tải...</span>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-2 text-xs text-gray-500 border rounded-md p-2">
                            <p>Không có suất nào còn trống</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              (Thử bỏ filter tháng nếu đang chọn)
                            </p>
                          </div>
                        ) : (
                          <>
                            <select
                              id="createSlot"
                              value={partTimeCreateFormData.partTimeSlotId || ''}
                              onChange={(e) => {
                                const foundSlot = availableSlots.find(s => s.slotId === parseInt(e.target.value));
                                setSelectedSlot(foundSlot || null);
                                setFormErrors({}); // Clear errors

                                const availableDays = foundSlot?.dayOfWeek ? foundSlot.dayOfWeek.split(',').map(d => d.trim()) : [];
                                setPartTimeCreateFormData(prev => ({
                                  ...prev,
                                  partTimeSlotId: parseInt(e.target.value) || 0,
                                  effectiveFrom: foundSlot?.effectiveFrom || '',
                                  effectiveTo: undefined
                                }));
                                setSelectedSlotDays(availableDays.map(d => String(d)));

                                // Calculate hours per week from shift duration
                                if (foundSlot) {
                                  const hours = calculateShiftHours(foundSlot.shiftName, workShifts);
                                  setHoursPerWeek(hours);
                                }
                              }}
                              className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b5fbf] focus:border-transparent"
                              required
                            >
                              <option value="">Chọn suất làm việc ({availableSlots.length} suất khả dụng)</option>
                              {availableSlots.map(slot => {
                                // Check if slot is full
                                const isFull = slot.totalDatesEmpty === 0;
                                const availabilityText = slot.availabilitySummary ||
                                  `${slot.totalDatesEmpty || 0}/${slot.totalDatesAvailable || 0} ngày còn trống`;

                                // Calculate availability percentage
                                const totalDates = slot.totalDatesAvailable || 0;
                                const availableDates = slot.totalDatesEmpty || 0;
                                const availPercent = totalDates > 0
                                  ? Math.round((availableDates / totalDates) * 100)
                                  : 0;

                                // Color indicator
                                const indicator = isFull ? '�' : availPercent > 70 ? '�' : availPercent > 30 ? '�' : '�';

                                return (
                                  <option
                                    key={slot.slotId}
                                    value={slot.slotId}
                                    disabled={isFull}
                                  >
                                    {slot.shiftName} - {slot.dayOfWeek.split(',').map(d => getDayOfWeekLabel(d.trim() as DayOfWeek)).join(', ')}
                                  </option>
                                );
                              })}
                            </select>

                            {selectedSlot && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-xs font-semibold text-blue-900">{selectedSlot.shiftName}</p>
                                <p className="text-[10px] text-gray-600 mt-0.5">
                                  {format(parseISO(selectedSlot.effectiveFrom), 'dd/MM/yyyy', { locale: vi })} → {format(parseISO(selectedSlot.effectiveTo), 'dd/MM/yyyy', { locale: vi })}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm">Thứ trong tuần</Label>
                        <div className="mt-1 text-sm text-gray-700">
                          {selectedSlotDays && selectedSlotDays.length > 0 ? (
                            selectedSlotDays.map(d => getDayOfWeekLabel(d as DayOfWeek)).join(', ')
                          ) : (
                            <span className="text-xs text-gray-500">Vui lòng chọn suất làm việc trước</span>
                          )}
                        </div>
                      </div>

                      {/* Week Calendar Picker */}
                      <div>
                        <Label htmlFor="weekSelect" className="text-sm">
                          Chọn ngày bắt đầu <span className="text-red-500">*</span>
                        </Label>
                        <DatePicker
                          value={partTimeCreateFormData.effectiveFrom}
                          onChange={(date) => {
                            setPartTimeCreateFormData(prev => ({
                              ...prev,
                              effectiveFrom: date,
                              effectiveTo: '' // Reset end date when start week changes
                            }));
                          }}
                          placeholder="Chọn ngày bắt đầu"
                          required={true}
                          minDate={format(new Date(), 'yyyy-MM-dd')}
                          selectWeek={true}
                        />
                        {partTimeCreateFormData.effectiveFrom && (
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Tuần từ {format(startOfWeek(parseISO(partTimeCreateFormData.effectiveFrom), { weekStartsOn: 1 }), 'dd/MM', { locale: vi })} đến {format(endOfWeek(parseISO(partTimeCreateFormData.effectiveFrom), { weekStartsOn: 1 }), 'dd/MM/yyyy', { locale: vi })}
                          </p>
                        )}
                      </div>

                      {/* Duration Dropdown */}
                      {partTimeCreateFormData.effectiveFrom && (
                        <div>
                          <Label htmlFor="durationWeeks">
                            Số tuần đăng ký <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="durationWeeks"
                            value={partTimeCreateFormData.effectiveTo || ''}
                            onChange={(e) => {
                              setPartTimeCreateFormData(prev => ({
                                ...prev,
                                effectiveTo: e.target.value
                              }));
                            }}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b5fbf] focus:border-transparent transition-all duration-200 bg-white hover:border-[#8b5fbf]"
                            required
                          >
                            <option value="">Chọn số tuần</option>
                            {(() => {
                              const startDate = parseISO(partTimeCreateFormData.effectiveFrom);
                              const slotEndDate = selectedSlot?.effectiveTo ? parseISO(selectedSlot.effectiveTo) : null;

                              if (!slotEndDate) {
                                // If no slot end date, allow up to 8 weeks
                                return [1, 2, 3, 4, 5, 6, 7, 8].map(weeks => {
                                  const lastWeekEnd = endOfWeek(addWeeks(startDate, weeks - 1), { weekStartsOn: 1 });
                                  const endDateStr = format(lastWeekEnd, 'yyyy-MM-dd');

                                  return (
                                    <option key={weeks} value={endDateStr}>
                                      {weeks} tuần ({format(startDate, 'dd/MM', { locale: vi })} - {format(lastWeekEnd, 'dd/MM/yyyy', { locale: vi })})
                                    </option>
                                  );
                                });
                              }

                              // Calculate max weeks available from start date to slot end date
                              const maxWeeks = Math.ceil(differenceInWeeks(slotEndDate, startDate, { roundingMethod: 'ceil' })) + 1;

                              // Generate options only for weeks that don't exceed slot end date
                              const options = [];
                              for (let weeks = 1; weeks <= Math.min(maxWeeks, 8); weeks++) {
                                const lastWeekEnd = endOfWeek(addWeeks(startDate, weeks - 1), { weekStartsOn: 1 });

                                // Only include this option if the end date doesn't exceed slot end date
                                if (lastWeekEnd <= slotEndDate) {
                                  const endDateStr = format(lastWeekEnd, 'yyyy-MM-dd');
                                  options.push(
                                    <option key={weeks} value={endDateStr}>
                                      {weeks} tuần ({format(startDate, 'dd/MM', { locale: vi })} - {format(lastWeekEnd, 'dd/MM/yyyy', { locale: vi })})
                                    </option>
                                  );
                                }
                              }

                              return options.length > 0 ? options : (
                                <option disabled>Không có tuần nào khả dụng</option>
                              );
                            })()}
                          </select>
                          {selectedSlot?.effectiveTo && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tối đa có thể đăng ký đến: <strong>{format(parseISO(selectedSlot.effectiveTo), 'dd/MM/yyyy', { locale: vi })}</strong>
                            </p>
                          )}
                          {partTimeCreateFormData.effectiveTo && (
                            <div className="mt-1.5 p-2 bg-[#8b5fbf]/5 border border-[#8b5fbf]/20 rounded-md">
                              <div className="flex items-center gap-1.5 text-xs">
                                <Calendar className="h-3 w-3 text-[#8b5fbf]" />
                                <span className="text-gray-700">
                                  <strong className="text-[#8b5fbf]">Khoảng thời gian:</strong>{' '}
                                  {format(parseISO(partTimeCreateFormData.effectiveFrom), 'dd/MM/yyyy', { locale: vi })} - {format(parseISO(partTimeCreateFormData.effectiveTo), 'dd/MM/yyyy', { locale: vi })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hours Summary */}
                      {hoursPerWeek > 0 && partTimeCreateFormData.effectiveFrom && partTimeCreateFormData.effectiveTo && (
                        <div className="bg-gradient-to-br from-[#8b5fbf]/10 to-[#6a4a9e]/10 border border-[#8b5fbf]/30 rounded-md p-2.5 space-y-1.5">
                          <h3 className="font-semibold text-xs text-[#6a4a9e] flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Tổng quan giờ làm
                          </h3>
                          <div className="text-xs space-y-0.5">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Giờ/tuần:</span>
                              <span className="font-semibold text-[#6a4a9e]">{hoursPerWeek}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Số tuần:</span>
                              <span className="font-semibold text-[#6a4a9e]">
                                {differenceInWeeks(parseISO(partTimeCreateFormData.effectiveTo), parseISO(partTimeCreateFormData.effectiveFrom))} tuần
                              </span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-[#8b5fbf] pt-1 border-t border-[#8b5fbf]/20">
                              <span>Tổng:</span>
                              <span>{hoursPerWeek * differenceInWeeks(parseISO(partTimeCreateFormData.effectiveTo), parseISO(partTimeCreateFormData.effectiveFrom))}h</span>
                            </div>
                          </div>

                          {/* Weekly limit warning */}
                          <div className="mt-2 pt-2 border-t border-[#8b5fbf]/20 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Đã dùng:</span>
                              <span className="font-semibold text-gray-700">{currentApprovedHours}h/tuần</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Đăng ký mới:</span>
                              <span className="font-semibold text-[#8b5fbf]">+{hoursPerWeek}h/tuần</span>
                            </div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-600">Tổng nếu duyệt:</span>
                              <span className={`font-bold ${currentApprovedHours + hoursPerWeek > 21 ? 'text-red-600' : 'text-green-600'}`}>
                                {currentApprovedHours + hoursPerWeek}h/tuần
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${currentApprovedHours + hoursPerWeek > 21 ? 'bg-red-500' : 'bg-green-500'
                                  }`}
                                style={{ width: `${Math.min(100, ((currentApprovedHours + hoursPerWeek) / 21) * 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-500">Giới hạn: 21h/tuần</p>

                            {/* Warning message */}
                            {currentApprovedHours + hoursPerWeek > 21 && (
                              <div className="mt-1.5 flex items-start gap-1.5 text-red-600 text-xs">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <p>
                                  <strong>Cảnh báo:</strong> Vượt quá giới hạn 21h/tuần!
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Chức năng này chỉ dành cho nhân viên PART_TIME_FLEX.
                    </div>
                  )}
                </form>
              </div>

              {/* Fixed Footer */}
              <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPartTimeCreateModal(false);
                      setPartTimeCreateFormData({ partTimeSlotId: 0, effectiveFrom: '', effectiveTo: '' });
                      setSelectedSlotDays([]);
                      setSelectedSlot(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    disabled={partTimeCreating || !partTimeCreateFormData.partTimeSlotId || !partTimeCreateFormData.effectiveFrom}
                    onClick={handlePartTimeCreate}
                    className="bg-[#8b5fbf] hover:bg-[#6a4a9e]"
                  >
                    {partTimeCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo đăng ký'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REMOVED EDIT MODAL - Registrations are immutable per backend design */}
        {/* Edit feature removed - employees should delete and create new registration instead */}

        {/* PART-TIME DELETE MODAL */}
        {showPartTimeDeleteModal && partTimeDeletingRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa đăng ký ca làm việc này không?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPartTimeDeleteModal(false);
                    setPartTimeDeletingRegistration(null);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handlePartTimeDelete}
                  disabled={partTimeDeleting}
                >
                  {partTimeDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW DETAILS MODAL */}
        {showViewDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Chi Tiết Đăng Ký</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowViewDetailsModal(false);
                    setViewingRegistration(null);
                  }}
                >
                  ✕
                </Button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : viewingRegistration ? (
                <div className="space-y-4">
                  {/* Registration ID */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Mã đăng ký</Label>
                      <div className="font-semibold">{viewingRegistration.registrationId}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Trạng thái</Label>
                      <div>
                        <Badge className={
                          viewingRegistration.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                            viewingRegistration.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              viewingRegistration.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                        }>
                          {viewingRegistration.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Employee Info */}
                  {viewingRegistration.employeeName && (
                    <div>
                      <Label className="text-sm text-gray-600">Nhân viên</Label>
                      <div className="font-semibold">{viewingRegistration.employeeName}</div>
                      <div className="text-sm text-gray-500">ID: {viewingRegistration.employeeId}</div>
                    </div>
                  )}

                  {/* Shift Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Ca làm việc</Label>
                      <div className="font-semibold">{viewingRegistration.shiftName}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Thứ</Label>
                      <div className="font-semibold">{getDayName(viewingRegistration.dayOfWeek as DayOfWeek)}</div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Từ ngày</Label>
                      <div className="font-semibold">{formatDate(viewingRegistration.effectiveFrom)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Đến ngày</Label>
                      <div className="font-semibold">{formatDate(viewingRegistration.effectiveTo)}</div>
                    </div>
                  </div>

                  {/* Dates */}
                  {viewingRegistration.dates && viewingRegistration.dates.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-600">Các ngày làm việc ({viewingRegistration.dates.length} ngày)</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {viewingRegistration.dates.map((date, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {formatDate(date)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {viewingRegistration.status === 'REJECTED' && viewingRegistration.reason && (
                    <div>
                      <Label className="text-sm text-gray-600">Lý do từ chối</Label>
                      <div className="text-red-600 bg-red-50 p-3 rounded">{viewingRegistration.reason}</div>
                    </div>
                  )}

                  {/* Processed Info */}
                  {viewingRegistration.processedBy && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm text-gray-600">Người xử lý</Label>
                        <div className="text-sm">ID: {viewingRegistration.processedBy}</div>
                      </div>
                      {viewingRegistration.processedAt && (
                        <div>
                          <Label className="text-sm text-gray-600">Thời gian xử lý</Label>
                          <div className="text-sm">{format(parseISO(viewingRegistration.processedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Created At */}
                  <div className="pt-4 border-t">
                    <Label className="text-sm text-gray-600">Ngày tạo</Label>
                    <div className="text-sm">{format(parseISO(viewingRegistration.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không có dữ liệu
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDetailsModal(false);
                    setViewingRegistration(null);
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FIXED DETAILS MODAL */}
        {showFixedDetailsModal && fixedDetailsRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Chi Tiết Lịch Làm Việc</h2>
              <div className="space-y-3">
                <div>
                  <Label>Ca làm việc</Label>
                  <Input value={fixedDetailsRegistration.workShiftName} disabled />
                </div>
                <div>
                  <Label>Thứ trong tuần</Label>
                  <Input value={formatFixedDaysOfWeek(fixedDetailsRegistration.daysOfWeek)} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Từ ngày</Label>
                    <Input value={formatDate(fixedDetailsRegistration.effectiveFrom)} disabled />
                  </div>
                  <div>
                    <Label>Đến ngày</Label>
                    <Input value={formatDate(fixedDetailsRegistration.effectiveTo)} disabled />
                  </div>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <Input value={fixedDetailsRegistration.isActive ? 'Đang hoạt động' : 'Tạm dừng'} disabled />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFixedDetailsModal(false);
                    setFixedDetailsRegistration(null);
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute >
  );
}


