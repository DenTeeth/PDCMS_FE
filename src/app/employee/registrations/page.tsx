'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Plus, Edit, Trash2, Eye, CalendarDays, Clock, Calendar, Users, AlertCircle } from 'lucide-react';
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
  CreateFixedRegistrationRequest,
  UpdateFixedRegistrationRequest,
  FixedRegistrationQueryParams,
  FixedRegistrationErrorCode
} from '@/types/fixedRegistration';
import { Employee, EmploymentType } from '@/types/employee';
import { fixedRegistrationService } from '@/services/fixedRegistrationService';
import { EmployeeService } from '@/services/employeeService';
import { useAuth } from '@/contexts/AuthContext';
import { canUseFixedRegistration } from '@/lib/utils';

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

// Helper: Get week number from date
const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

// Helper: Format week for display (Tuần instead of Week)
const formatWeekDisplay = (date: Date | null): string => {
  if (!date) return '';
  const weekNum = getWeekNumber(date);
  return `Tuần ${weekNum}, ${date.getFullYear()}`;
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

// Helper: Calculate hours from shift time (e.g., "08:00-12:00" = 4 hours, "8h-12h" = 4 hours)
const calculateShiftHours = (shiftName: string): number => {
  // Match patterns like "8h-12h" or "08:00-12:00" or "8:00-12:00"
  const timeMatch = shiftName.match(/(\d{1,2})[h:](\d{0,2})\D*(\d{1,2})[h:](\d{0,2})/);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const endHour = parseInt(timeMatch[3]);
    return endHour - startHour;
  }
  return 0;
};

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
  const hasManageFixedPermission = hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS);
  const isPartTimeFlex = user?.employmentType === 'PART_TIME_FLEX';

  // Determine available tabs and default tab using useMemo
  const { availableTabs, defaultTab } = useMemo(() => {
    let tabs: Array<'part-time' | 'fixed'> = [];
    let defaultTabValue: 'part-time' | 'fixed' = 'part-time';

    if (hasManagePermission) {
      // Condition 1: Has MANAGE_WORK_SLOTS → Show both tabs
      tabs = ['part-time', 'fixed'];
      defaultTabValue = 'part-time';
    } else if (hasManageFixedPermission) {
      // Condition 2: Has MANAGE_FIXED_REGISTRATIONS (Manager) → Show both tabs, default to fixed
      tabs = ['part-time', 'fixed'];
      defaultTabValue = 'fixed';
    } else if (isPartTimeFlex) {
      // Condition 3: No permissions AND is PART_TIME_FLEX → Only Part-time tab
      tabs = ['part-time'];
      defaultTabValue = 'part-time';
    } else {
      // Condition 4: No permissions AND NOT PART_TIME_FLEX → Only Fixed tab
      tabs = ['fixed'];
      defaultTabValue = 'fixed';
    }

    return { availableTabs: tabs, defaultTab: defaultTabValue };
  }, [hasManagePermission, hasManageFixedPermission, isPartTimeFlex]);

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
  const [formErrors, setFormErrors] = useState<{ effectiveFrom?: string; effectiveTo?: string; general?: string }>({});

  // Week-based registration state
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(1);
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
  const calculateTotalApprovedHours = useMemo(() => {
    return partTimeRegistrations
      .filter(r => r.status === 'APPROVED')
      .reduce((total, reg) => {
        const weeks = calculateWeeksBetween(reg.effectiveFrom, reg.effectiveTo);
        const hours = calculateShiftHours(reg.shiftName || '');
        return total + (hours * weeks);
      }, 0);
  }, [partTimeRegistrations]);

  // Update current approved hours whenever registrations change
  useEffect(() => {
    setCurrentApprovedHours(calculateTotalApprovedHours);
  }, [calculateTotalApprovedHours]);

  // ❌ REMOVED EDIT MODAL STATE - Registrations are immutable
  // const [showPartTimeEditModal, setShowPartTimeEditModal] = useState(false);
  // const [partTimeEditingRegistration, setPartTimeEditingRegistration] = useState<ShiftRegistration | null>(null);
  // const [partTimeUpdating, setPartTimeUpdating] = useState(false);
  // const [partTimeEditFormData, setPartTimeEditFormData] = useState<UpdateShiftRegistrationRequest>({});

  const [showPartTimeDeleteModal, setShowPartTimeDeleteModal] = useState(false);
  const [partTimeDeletingRegistration, setPartTimeDeletingRegistration] = useState<ShiftRegistration | null>(null);
  const [partTimeDeleting, setPartTimeDeleting] = useState(false);

  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loadingWorkShifts, setLoadingWorkShifts] = useState(false);

  // Work slots (PartTimeSlot[]) - for mapping partTimeSlotId to shiftName
  const [workSlots, setWorkSlots] = useState<PartTimeSlot[]>([]);
  const [loadingWorkSlots, setLoadingWorkSlots] = useState(false);

  // Available slots for PART_TIME_FLEX employees
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);
  const [slotDetailsMap, setSlotDetailsMap] = useState<Record<number, SlotDetailsResponse>>({});
  const [workSlotsMap, setWorkSlotsMap] = useState<Record<number, PartTimeSlot>>({});
  const [slotSortBy, setSlotSortBy] = useState<'date' | 'availability'>('date');
  const [slotMonthFilter, setSlotMonthFilter] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  const [slotDayFilter, setSlotDayFilter] = useState<DayOfWeek[]>([]); // Multi-select days
  const [registrationSortBy, setRegistrationSortBy] = useState<'status' | 'date'>('status');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // ==================== FIXED REGISTRATION STATE ====================
  const [fixedRegistrations, setFixedRegistrations] = useState<FixedShiftRegistration[]>([]);
  const [fixedLoading, setFixedLoading] = useState(true);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);

  // Fixed modals
  const [showFixedCreateModal, setShowFixedCreateModal] = useState(false);
  const [fixedCreating, setFixedCreating] = useState(false);
  const [fixedCreateFormData, setFixedCreateFormData] = useState<CreateFixedRegistrationRequest>({
    employeeId: 0,
    workShiftId: '',
    daysOfWeek: [],
    effectiveFrom: '',
    effectiveTo: null
  });

  const [showFixedEditModal, setShowFixedEditModal] = useState(false);
  const [fixedEditingRegistration, setFixedEditingRegistration] = useState<FixedShiftRegistration | null>(null);
  const [fixedUpdating, setFixedUpdating] = useState(false);
  const [fixedEditFormData, setFixedEditFormData] = useState<UpdateFixedRegistrationRequest>({});

  const [showFixedDetailsModal, setShowFixedDetailsModal] = useState(false);
  const [fixedDetailsRegistration, setFixedDetailsRegistration] = useState<FixedShiftRegistration | null>(null);

  const [fixedDeleting, setFixedDeleting] = useState(false);

  // Dropdown data (for managers with MANAGE_FIXED_REGISTRATIONS)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [hasViewEmployeePermission, setHasViewEmployeePermission] = useState<boolean | null>(null); // null = unknown, true/false = checked

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
        console.error('❌ [currentEmployeeId] Error extracting from token:', error);
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
      console.log('📋 [useEffect] Fetching Part-Time Registrations...');
      fetchPartTimeRegistrations();

      // Load available slots if user has VIEW_AVAILABLE_SLOTS permission (PART_TIME_FLEX)
      // Note: available slots API doesn't require employeeId in request
      if (isPartTimeFlex || hasPermission(Permission.VIEW_AVAILABLE_SLOTS)) {
        console.log('✅ [useEffect] Fetching Available Slots (PART_TIME_FLEX or has VIEW_AVAILABLE_SLOTS permission)');
        fetchAvailableSlots();
      } else {
        console.log('⚠️ [useEffect] Not fetching available slots - not PART_TIME_FLEX and no VIEW_AVAILABLE_SLOTS permission');
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
        console.warn('⚠️ [useEffect] currentEmployeeId is null/NaN - Part-Time Flex registration might still work (backend gets from token)');
      } else {
        console.log('✅ [useEffect] currentEmployeeId available:', currentEmployeeId);
      }
    } else if (activeTab === 'fixed' && availableTabs.includes('fixed')) {
      // Fetch fixed registrations
      // Backend will get employeeId from token if not provided in params
      fetchFixedRegistrations();
      
      // If user has MANAGE_FIXED_REGISTRATIONS, also load dropdown data
      if (hasManageFixedPermission) {
        fetchDropdownData();
      }
    }
  }, [activeTab, partTimeCurrentPage, currentEmployeeId, availableTabs, isPartTimeFlex, hasPermission, slotMonthFilter, filterEmployeeId, hasManageFixedPermission]);

  // Fetch dropdown data when modal opens (if not already loaded)
  useEffect(() => {
    if (showFixedCreateModal && hasManageFixedPermission && employees.length === 0 && !loadingDropdowns) {
      console.log('📋 [useEffect] Opening create modal, fetching dropdown data...');
      fetchDropdownData();
    }
  }, [showFixedCreateModal, hasManageFixedPermission]);

  // Part-Time Registration Fetch
  const fetchPartTimeRegistrations = async () => {
    try {
      setPartTimeLoading(true);

      // ✅ UPDATED: Backend now returns paginated response

      // Use correct API endpoint for part-time-flex registrations
      const response = await shiftRegistrationService.getRegistrations({
        page: partTimeCurrentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      }, 'part-time-flex');

      // Backend now ALWAYS returns paginated response (Spring Data Page object)
      console.log('✅ Part-time registrations (paginated):', {
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        currentPage: response.pageable?.pageNumber ?? partTimeCurrentPage,
        items: response.content?.length ?? 0
      });

      setPartTimeRegistrations(response.content || []);
      setPartTimeTotalPages(response.totalPages || 0);
      setPartTimeTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('❌ Failed to fetch part-time registrations:', error);

      // Extract detailed error message from 500 response
      let errorMessage = 'Failed to fetch your shift registrations';
      if (error.response?.status === 500) {
        console.error('🔥 [Backend 500 Error] Server error details:', {
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
        toast.warning('No work shifts available. Please contact admin to create work shifts.');
      }
    } catch (error: any) {
      console.error('Failed to fetch work shifts:', error);
      toast.error('Failed to load work shifts: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingWorkShifts(false);
    }
  };

  /**
   * Fetch work slots (PartTimeSlot[]) for mapping shift names
   * 
   * ⚠️ LƯU Ý QUAN TRỌNG:
   * - API này yêu cầu permission MANAGE_WORK_SLOTS (chỉ dành cho Admin/Manager)
   * - Employee KHÔNG có quyền này → Sẽ gây lỗi 403
   * - Chỉ gọi API này nếu user có permission MANAGE_WORK_SLOTS
   * - Employee chỉ cần xem registrations của chính họ, không cần xem tất cả work slots
   */
  const fetchWorkSlotsData = async () => {
    // Chỉ fetch nếu user có permission MANAGE_WORK_SLOTS
    // (Thường là Admin/Manager mới có permission này)
    if (!hasManagePermission) {
      console.log('ℹ️ [fetchWorkSlotsData] Skipping - User does not have MANAGE_WORK_SLOTS permission');
      setWorkSlots([]); // Set empty array
      return;
    }

    try {
      setLoadingWorkSlots(true);
      const slotsResponse = await workSlotService.getWorkSlots();
      setWorkSlots(slotsResponse || []);
      
      const slotsMap: Record<number, PartTimeSlot> = {};
      (slotsResponse || []).forEach(slot => {
        slotsMap[slot.slotId] = slot;
      });
      setWorkSlotsMap(slotsMap);
      
      console.log('📋 [fetchWorkSlotsData] Loaded work slots:', {
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
      setLoadingAvailableSlots(true);

      // Pass month filter to API if selected
      const monthParam = slotMonthFilter !== 'ALL' ? slotMonthFilter : undefined;
      console.log(` [fetchAvailableSlots] Calling shiftRegistrationService.getAvailableSlots(${monthParam || 'no filter'})...`);
      const slots = await shiftRegistrationService.getAvailableSlots(monthParam);

      console.log(' [fetchAvailableSlots] API Response received:', {
        rawData: slots,
        isArray: Array.isArray(slots),
        length: Array.isArray(slots) ? slots.length : 'not an array',
        firstItem: Array.isArray(slots) && slots.length > 0 ? slots[0] : 'no items'
      });

      const slotsArray = slots || [];
      console.log(' [fetchAvailableSlots] Setting availableSlots:', {
        count: slotsArray.length,
        slots: slotsArray
      });

      setAvailableSlots(slotsArray);

      // Fetch slot details for each slot (only if user has VIEW_AVAILABLE_SLOTS permission)
      const detailsMap: Record<number, SlotDetailsResponse> = {};
      const canViewSlotDetails = isPartTimeFlex || hasPermission(Permission.VIEW_AVAILABLE_SLOTS);
      
      if (canViewSlotDetails) {
        await Promise.all(
          slotsArray.map(async (slot) => {
            try {
              const details = await shiftRegistrationService.getSlotDetails(slot.slotId);
              detailsMap[slot.slotId] = details;
              console.log(`Slot ${slot.slotId} details:`, {
                quota: details.quota,
                overallRemaining: details.overallRemaining,
                registered: details.registered,
                monthlyData: details.availabilityByMonth?.map(m => ({
                  month: m.monthName,
                  available: m.totalDatesAvailable,
                  partial: m.totalDatesPartial,
                  full: m.totalDatesFull,
                  total: m.totalWorkingDays
                }))
              });
            } catch (error: any) {
              // Handle 403 Forbidden gracefully (user doesn't have VIEW_AVAILABLE_SLOTS permission)
              if (error.response?.status === 403) {
                console.warn(`No permission to view details for slot ${slot.slotId}. User needs VIEW_AVAILABLE_SLOTS permission.`);
              } else {
                console.error(`Failed to fetch details for slot ${slot.slotId}:`, error);
              }
            }
          })
        );
      } else {
        console.warn('User does not have permission VIEW_AVAILABLE_SLOTS permission. Skipping slot details fetch.');
      }
      setSlotDetailsMap(detailsMap);

      if (!slots || slotsArray.length === 0) {
        console.warn(' [fetchAvailableSlots] No available slots found');
        toast.info('Hiện tại không có suất nào còn trống. Vui lòng thử lại sau.');
      } else {
        console.log(' [fetchAvailableSlots] Successfully loaded', slotsArray.length, 'available slots');
      }
    } catch (error: any) {
      console.error(' [fetchAvailableSlots] Error fetching available slots:', {
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
        console.error(' [Backend 500 Error] Server error details:', {
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
      console.log(' [fetchAvailableSlots] Finished (set loading to false)');
      setLoadingAvailableSlots(false);
    }
  };

  // Fixed Registration Fetch
  const fetchFixedRegistrations = async () => {
    try {
      setFixedLoading(true);

      // Build params
      const params: FixedRegistrationQueryParams = {};
      
      // If user has MANAGE_FIXED_REGISTRATIONS, can filter by employeeId
      if (hasManageFixedPermission && filterEmployeeId) {
        params.employeeId = filterEmployeeId;
      } else if (!hasManageFixedPermission) {
        // If no permission, only show own registrations
        // Backend will get employeeId from token if not provided
        if (currentEmployeeId !== null && currentEmployeeId !== undefined && typeof currentEmployeeId === 'number') {
          params.employeeId = currentEmployeeId;
        }
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

  const fetchDropdownData = async () => {
    try {
      console.log(' [fetchDropdownData] Starting to fetch dropdown data...');
      setLoadingDropdowns(true);

      // Fetch active work shifts (reuse existing workShifts state)
      const shiftsResponse = await workShiftService.getAll(true);
      setWorkShifts(shiftsResponse || []);
      console.log(' [fetchDropdownData] Work shifts loaded:', shiftsResponse?.length || 0);

      // Fetch employees (only FULL_TIME and PART_TIME_FIXED)
      // Backend will handle permission check (VIEW_EMPLOYEE required)
      const employeeService = new EmployeeService();
      console.log(' [fetchDropdownData] Fetching employees...');
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 1000,
        isActive: true
      });
      console.log(' [fetchDropdownData] Employees loaded:', employeesResponse.content?.length || 0);

      // Filter to only employees who can use fixed registration
      const eligibleEmployees = (employeesResponse.content || []).filter(emp =>
        canUseFixedRegistration(emp.employeeType as EmploymentType)
      );
      console.log(' [fetchDropdownData] Eligible employees (after filter):', eligibleEmployees.length);
      setEmployees(eligibleEmployees);
      setHasViewEmployeePermission(true); // Success means user has permission
    } catch (error: any) {
      console.error(' [fetchDropdownData] Failed to fetch dropdown data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xem danh sách nhân viên (VIEW_EMPLOYEE)');
        setEmployees([]);
        setHasViewEmployeePermission(false); // 403 means no permission
      } else {
        toast.error('Failed to load dropdown data');
        setEmployees([]);
        setHasViewEmployeePermission(null); // Unknown - could be network error
      }
    } finally {
      setLoadingDropdowns(false);
      console.log(' [fetchDropdownData] Finished fetching dropdown data');
    }
  };

  // ==================== PART-TIME REGISTRATION HANDLERS ====================
  const handlePartTimeCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on employee type
    if (isPartTimeFlex) {
      // PART_TIME_FLEX: Need all required fields
      if (!partTimeCreateFormData.partTimeSlotId) {
        toast.error('Vui lòng chọn suất làm việc');
        return;
      }
      // Use selected slot days from selected slot instead of form dayOfWeek
      const selectedSlot = availableSlots.find(s => s.slotId === partTimeCreateFormData.partTimeSlotId);
      const slotDays = selectedSlot?.dayOfWeek ? selectedSlot.dayOfWeek.split(',').map(d => d.trim()) : [];
      if (!slotDays || slotDays.length === 0) {
        toast.error('Suất này chưa cấu hình ngày làm việc. Vui lòng chọn suất khác.');
        return;
      }
      if (!partTimeCreateFormData.effectiveFrom) {
        toast.error('Vui lòng chọn tuần bắt đầu');
        return;
      }

      // ✅ VALIDATE 21H WEEKLY LIMIT (CLIENT-SIDE)
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

      await shiftRegistrationService.createRegistration(requestData);
      toast.success('Đăng ký ca làm việc thành công! Chờ quản lý phê duyệt.');
      setShowPartTimeCreateModal(false);
      setPartTimeCreateFormData({ partTimeSlotId: 0, effectiveFrom: '', effectiveTo: '' });
      setSelectedSlotDays([]);
      setFormErrors({});
      // Refresh data
      await fetchPartTimeRegistrations();
      await fetchWorkSlotsData(); // Refresh work slots to update registered count
      if (isPartTimeFlex) {
        await fetchAvailableSlots();
      }
    } catch (error: any) {
      console.error('❌ Failed to create registration:', error);

      // Handle specific error codes
      if (error.errorCode === 'INVALID_EMPLOYEE_TYPE' || error.response?.data?.errorCode === 'INVALID_EMPLOYEE_TYPE') {
        toast.error('Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt.');
      } else if (error.errorCode === 'SLOT_IS_FULL' || error.response?.data?.errorCode === 'SLOT_IS_FULL') {
        toast.error('Suất này đã đủ người đăng ký. Vui lòng chọn suất khác.');
        await fetchAvailableSlots(); // Refresh available slots
      } else if (error.errorCode === 'WEEKLY_HOURS_LIMIT_EXCEEDED' || error.response?.data?.errorCode === 'WEEKLY_HOURS_LIMIT_EXCEEDED') {
        // ✅ HANDLE WEEKLY_HOURS_LIMIT_EXCEEDED FROM BACKEND
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


  const handlePartTimeDelete = async () => {
    if (!partTimeDeletingRegistration) return;

    try {
      setPartTimeDeleting(true);
      await shiftRegistrationService.deleteRegistration(partTimeDeletingRegistration.registrationId.toString());
      toast.success('Đã hủy đăng ký thành công');
      setShowPartTimeDeleteModal(false);
      setPartTimeDeletingRegistration(null);
      // Refresh both registrations and available slots to update quota
      await fetchPartTimeRegistrations();
      await fetchWorkSlotsData(); // Refresh work slots to update registered count
      if (isPartTimeFlex) {
        await fetchAvailableSlots();
      }
    } catch (error: any) {
      console.error('Failed to delete registration:', error);

      // Handle specific error codes from backend
      const status = error.response?.status;
      if (status === 409) {
        toast.error('Đăng ký này đã được hủy trước đó rồi');
      } else if (status === 404) {
        toast.error('Không tìm thấy đăng ký này');
      } else if (status === 403) {
        toast.error('Bạn không có quyền hủy đăng ký này');
      } else {
        toast.error(error.response?.data?.detail || 'Không thể hủy đăng ký. Vui lòng thử lại.');
      }
    } finally {
      setPartTimeDeleting(false);
    }
  };

  // ==================== FIXED REGISTRATION HANDLERS ====================
  const handleFixedCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasManageFixedPermission) {
      toast.error('Bạn không có quyền tạo đăng ký ca cố định');
      return;
    }

    if (!fixedCreateFormData.employeeId || fixedCreateFormData.employeeId === 0) {
      toast.error('Vui lòng chọn nhân viên');
      return;
    }

    if (!fixedCreateFormData.workShiftId) {
      toast.error('Vui lòng chọn ca làm việc');
      return;
    }

    if (fixedCreateFormData.daysOfWeek.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }

    if (!fixedCreateFormData.effectiveFrom) {
      toast.error('Vui lòng chọn ngày hiệu lực từ');
      return;
    }

    if (fixedCreateFormData.effectiveTo) {
      const fromDate = new Date(fixedCreateFormData.effectiveFrom);
      const toDate = new Date(fixedCreateFormData.effectiveTo);
      if (toDate <= fromDate) {
        toast.error('Ngày hiệu lực đến phải sau ngày hiệu lực từ');
        return;
      }
    }

    const invalidDays = fixedCreateFormData.daysOfWeek.filter(day => day < 1 || day > 7);
    if (invalidDays.length > 0) {
      toast.error(`Ngày không hợp lệ: ${invalidDays.join(', ')}. Ngày phải từ 1 (Thứ 2) đến 7 (Chủ nhật).`);
      return;
    }

    try {
      setFixedCreating(true);

      const payload: CreateFixedRegistrationRequest = {
        employeeId: fixedCreateFormData.employeeId,
        workShiftId: fixedCreateFormData.workShiftId,
        daysOfWeek: fixedCreateFormData.daysOfWeek.sort((a, b) => a - b),
        effectiveFrom: fixedCreateFormData.effectiveFrom,
        ...(fixedCreateFormData.effectiveTo && { effectiveTo: fixedCreateFormData.effectiveTo })
      };

      await fixedRegistrationService.createRegistration(payload);
      toast.success('Đã tạo đăng ký ca cố định thành công');
      setShowFixedCreateModal(false);
      resetFixedCreateForm();
      await fetchFixedRegistrations();
    } catch (error: any) {
      console.error('Failed to create fixed registration:', error);

      let errorMessage = 'Không thể tạo đăng ký ca cố định';

      if (error.errorCode === FixedRegistrationErrorCode.INVALID_EMPLOYEE_TYPE) {
        errorMessage = 'Loại nhân viên PART_TIME_FLEX không thể sử dụng đăng ký ca cố định. Vui lòng sử dụng đăng ký part-time.';
      } else if (error.errorCode === FixedRegistrationErrorCode.DUPLICATE_FIXED_SHIFT_REGISTRATION) {
        errorMessage = 'Nhân viên đã có đăng ký ca cố định đang hoạt động cho khoảng thời gian này';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.error(errorMessage);
    } finally {
      setFixedCreating(false);
    }
  };

  const resetFixedCreateForm = () => {
    setFixedCreateFormData({
      employeeId: 0,
      workShiftId: '',
      daysOfWeek: [],
      effectiveFrom: '',
      effectiveTo: null
    });
  };

  const handleFixedEdit = (registration: FixedShiftRegistration) => {
    setFixedEditingRegistration(registration);
    setFixedEditFormData({
      workShiftId: registration.workShiftId,
      daysOfWeek: [...registration.daysOfWeek],
      effectiveFrom: registration.effectiveFrom,
      effectiveTo: registration.effectiveTo || null
    });
    setShowFixedEditModal(true);
  };

  const handleFixedUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fixedEditingRegistration) return;

    if (!hasManageFixedPermission) {
      toast.error('Bạn không có quyền cập nhật đăng ký ca cố định');
      return;
    }

    if (fixedEditFormData.daysOfWeek && fixedEditFormData.daysOfWeek.length > 0) {
      const invalidDays = fixedEditFormData.daysOfWeek.filter(day => day < 1 || day > 7);
      if (invalidDays.length > 0) {
        toast.error(`Ngày không hợp lệ: ${invalidDays.join(', ')}. Ngày phải từ 1 (Thứ 2) đến 7 (Chủ nhật).`);
        return;
      }
    }

    if (fixedEditFormData.effectiveFrom && fixedEditFormData.effectiveTo) {
      const fromDate = new Date(fixedEditFormData.effectiveFrom);
      const toDate = new Date(fixedEditFormData.effectiveTo);
      if (toDate <= fromDate) {
        toast.error('Ngày hiệu lực đến phải sau ngày hiệu lực từ');
        return;
      }
    }

    try {
      setFixedUpdating(true);

      const payload: UpdateFixedRegistrationRequest = {
        ...(fixedEditFormData.workShiftId && { workShiftId: fixedEditFormData.workShiftId }),
        ...(fixedEditFormData.daysOfWeek && fixedEditFormData.daysOfWeek.length > 0 && {
          daysOfWeek: fixedEditFormData.daysOfWeek.sort((a, b) => a - b)
        }),
        ...(fixedEditFormData.effectiveFrom && { effectiveFrom: fixedEditFormData.effectiveFrom }),
        effectiveTo: fixedEditFormData.effectiveTo !== undefined ? fixedEditFormData.effectiveTo : undefined
      };

      await fixedRegistrationService.updateRegistration(fixedEditingRegistration.registrationId, payload);
      toast.success('Đã cập nhật đăng ký ca cố định thành công');
      setShowFixedEditModal(false);
      setFixedEditingRegistration(null);
      await fetchFixedRegistrations();
    } catch (error: any) {
      console.error('Failed to update fixed registration:', error);

      let errorMessage = 'Không thể cập nhật đăng ký ca cố định';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.error(errorMessage);
    } finally {
      setFixedUpdating(false);
    }
  };

  const handleFixedDelete = async (registration: FixedShiftRegistration) => {
    if (!hasManageFixedPermission) {
      toast.error('Bạn không có quyền xóa đăng ký ca cố định');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa đăng ký ca cố định cho ${registration.employeeName}?`)) {
      return;
    }

    try {
      setFixedDeleting(true);
      await fixedRegistrationService.deleteRegistration(registration.registrationId);
      toast.success('Đã xóa đăng ký ca cố định thành công');
      await fetchFixedRegistrations();
    } catch (error: any) {
      console.error('Failed to delete fixed registration:', error);

      let errorMessage = 'Không thể xóa đăng ký ca cố định';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.error(errorMessage);
    } finally {
      setFixedDeleting(false);
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
      // Sort by status: PENDING → APPROVED → REJECTED
      const statusOrder = { 'PENDING': 1, 'APPROVED': 2, 'REJECTED': 3 };
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
          if (month.totalDatesAvailable > 0) {
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

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_SCHEDULE_OWN]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header - Đơn giản hóa */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đăng ký ca làm việc</h1>
          <p className="text-gray-600 mt-1">Quản lý đăng ký ca làm việc của bạn</p>
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
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-lg">
                          Các suất làm việc có sẵn
                        </CardTitle>
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
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Hiển thị: {sortedAvailableSlots.length} / {availableSlots.length} suất
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
                            {slotMonthFilter !== 'ALL' && availableSlots.length > 0 && (
                              <div className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 flex items-center gap-1.5">
                                <span>ℹ️</span>
                                <span>Chỉ hiển thị ca làm việc có slot khả dụng trong tháng đã chọn. Chọn "Tất cả tháng" để xem tất cả ca.</span>
                              </div>
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
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-gray-600">Đầy (0-20%)</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Available Slots Table */}
                  {loadingAvailableSlots ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500 mr-2" />
                        <span className="text-gray-600">Đang tải...</span>
                      </CardContent>
                    </Card>
                  ) : sortedAvailableSlots.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        {availableSlots.length === 0 ? (
                          <>
                            <p className="text-gray-700 font-medium mb-1">Không có suất nào còn trống</p>
                            <p className="text-sm text-gray-500">Vui lòng thử lại sau</p>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-700 font-medium mb-1">Không tìm thấy suất phù hợp</p>
                            <p className="text-sm text-gray-500">Thử điều chỉnh bộ lọc của bạn</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearAllFilters}
                              className="mt-3"
                            >
                              Xóa bộ lọc
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
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

                                // Calculate weeks from date range (effectiveFrom to effectiveTo)
                                let totalWeeks = 0;
                                try {
                                  const from = parseISO(slot.effectiveFrom);
                                  const to = slot.effectiveTo ? parseISO(slot.effectiveTo) : new Date();
                                  totalWeeks = Math.ceil(differenceInWeeks(to, from, { roundingMethod: 'ceil' }));
                                  if (totalWeeks <= 0) totalWeeks = 1; // Minimum 1 week
                                } catch {
                                  totalWeeks = 0;
                                }

                                // Get số lượng đã đăng ký directly from API (BE now provides registered field)
                                // No need for manual calculation anymore - BE provides slotDetails.registered

                                return (
                                  <React.Fragment key={slot.slotId}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{slot.shiftName}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                          {slot.dayOfWeek.split(',').map((day, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {getDayOfWeekLabel(day.trim() as DayOfWeek)}
                                            </Badge>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm text-gray-600">
                                          {totalWeeks > 0 ? `${totalWeeks} tuần` : '-'}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {(() => {
                                            // Priority 1: Use workSlotsMap if available (for users with MANAGE_WORK_SLOTS permission)
                                            const workSlot = workSlotsMap[slot.slotId];
                                            if (workSlot?.quota !== undefined && workSlot.quota !== null) {
                                              const registeredCount = workSlot.registered ?? 0;
                                              return `${registeredCount}/${workSlot.quota}`;
                                            }
                                            
                                            // Priority 2: Use slotDetails if available (for users with VIEW_AVAILABLE_SLOTS permission)
                                            // Calculate from overallRemaining: currentRegistered = quota - overallRemaining
                                            if (slotDetails?.quota !== undefined && slotDetails.quota !== null) {
                                              if (slotDetails.overallRemaining !== undefined && slotDetails.overallRemaining !== null) {
                                                const currentRegistered = Math.max(0, slotDetails.quota - slotDetails.overallRemaining);
                                                return `${currentRegistered}/${slotDetails.quota}`;
                                              }
                                              return `0/${slotDetails.quota}`;
                                            }
                                            
                                            return '-';
                                          })()}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <Button
                                          onClick={() => {
                                            const daysOfWeek = slot.dayOfWeek ? slot.dayOfWeek.split(',').map(d => d.trim() as DayOfWeek) : [];
                                            const firstDay = daysOfWeek[0];
                                            const calculatedDate = firstDay ? getNextDateForDayOfWeek(firstDay) : '';

                                            setPartTimeCreateFormData({
                                              partTimeSlotId: slot.slotId,
                                              effectiveFrom: calculatedDate,
                                              effectiveTo: undefined
                                            });
                                            setSelectedSlotDays(daysOfWeek.map(d => String(d)));
                                            setShowPartTimeCreateModal(true);
                                          }}
                                          // Luôn enable button để test UI, không disable khi availableWeeks = 0
                                          size="sm"
                                        // Không set class opacity-50/cursor-not-allowed nữa
                                        >
                                          + Đăng Ký
                                        </Button>
                                      </td>
                                    </tr>
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
                      Đăng ký của tôi
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedPartTimeRegistrations.map((registration) => {
                        const statusConfig = {
                          PENDING: { color: 'bg-yellow-50 border-yellow-200', icon: <AlertCircle className="w-4 h-4" />, text: 'Chờ duyệt', textColor: 'text-yellow-700' },
                          APPROVED: { color: 'bg-green-50 border-green-200', icon: <CheckCircle className="w-4 h-4" />, text: 'Đã duyệt', textColor: 'text-green-700' },
                          REJECTED: { color: 'bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4" />, text: 'Từ chối', textColor: 'text-red-700' }
                        }[registration.status];

                        return (
                          <Card key={registration.registrationId} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base truncate">{getRegistrationShiftName(registration)}</CardTitle>
                                <Badge variant="outline" className={`${statusConfig.color} ${statusConfig.textColor} shrink-0`}>
                                  {statusConfig.text}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Bắt đầu:</span>
                                  <span className="font-medium">{formatDate(registration.effectiveFrom)}</span>
                                </div>
                                {registration.effectiveTo && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Kết thúc:</span>
                                    <span className="font-medium">{formatDate(registration.effectiveTo)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Đăng ký:</span>
                                  <span className="font-medium">
                                    {format(parseISO(registration.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                  </span>
                                </div>
                              </div>

                              {registration.status === 'REJECTED' && registration.reason && (
                                <div className="bg-red-50 border border-red-200 rounded p-2">
                                  <p className="text-xs font-semibold text-red-800 mb-1">Lý do:</p>
                                  <p className="text-xs text-red-700">{registration.reason}</p>
                                </div>
                              )}

                              {registration.processedBy && (
                                <div className="text-xs text-gray-500 border-t pt-2">
                                  <p>Xử lý: #{registration.processedBy}</p>
                                  {registration.processedAt && (
                                    <p>{format(parseISO(registration.processedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                  )}
                                </div>
                              )}

                              {registration.status === 'PENDING' && (
                                <div className="flex gap-2 pt-2 border-t">
                                  {/* ❌ REMOVED EDIT BUTTON - Registrations are immutable per backend design */}
                                  {/* To modify: Delete and create new registration */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPartTimeDeletingRegistration(registration);
                                      setShowPartTimeDeleteModal(true);
                                    }}
                                    className="flex-1 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Xóa
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
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
              {/* Header with Create Button (only for managers) */}
              {hasManageFixedPermission && (
                <div className="flex justify-end">
                  <Button onClick={() => {
                    setShowFixedCreateModal(true);
                    // Fetch dropdown data when opening modal (if not already loaded)
                    if (employees.length === 0 && !loadingDropdowns) {
                      fetchDropdownData();
                    }
                  }} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo mới
                  </Button>
                </div>
              )}

              {/* Filters (only for managers) */}
              {hasManageFixedPermission && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bộ lọc</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor="filterEmployee">Nhân viên</Label>
                        <select
                          id="filterEmployee"
                          value={filterEmployeeId?.toString() || ''}
                          onChange={(e) => setFilterEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tất cả nhân viên</option>
                          {employees.map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>
                              {emp.fullName} ({emp.employeeCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button variant="outline" onClick={() => setFilterEmployeeId(null)}>
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fixed Registrations Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {hasManageFixedPermission ? `Đăng ký ca làm cố định (${fixedRegistrations.length})` : `Lịch làm việc của tôi (${fixedRegistrations.length})`}
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
                      <p className="text-gray-700 font-medium mb-1">
                        {hasManageFixedPermission ? 'Không tìm thấy đăng ký ca cố định' : 'Chưa có lịch làm việc cố định'}
                      </p>
                      {!hasManageFixedPermission && (
                        <p className="text-sm text-gray-500">Liên hệ Admin/Manager để được gán lịch</p>
                      )}
                    </div>
                  ) : hasManageFixedPermission ? (
                    // Manager view: Table layout (like admin)
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Nhân viên</th>
                            <th className="text-left p-3 font-medium">Ca làm việc</th>
                            <th className="text-left p-3 font-medium">Ngày</th>
                            <th className="text-left p-3 font-medium">Thời gian hiệu lực</th>
                            <th className="text-left p-3 font-medium">Trạng thái</th>
                            <th className="text-left p-3 font-medium">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fixedRegistrations.map((registration) => (
                            <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-medium">{registration.employeeName}</div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-medium">{registration.workShiftName}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">
                                  {formatFixedDaysOfWeek(registration.daysOfWeek)}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <div>From: {formatDate(registration.effectiveFrom)}</div>
                                <div>To: {formatDate(registration.effectiveTo)}</div>
                              </td>
                              <td className="p-3">
                                <Badge className={registration.isActive ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-800"}>
                                  {registration.isActive ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Hoạt động
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Không hoạt động
                                    </>
                                  )}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setFixedDetailsRegistration(registration);
                                      setShowFixedDetailsModal(true);
                                    }}
                                    title="Xem chi tiết"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {hasManageFixedPermission && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFixedEdit(registration)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFixedDelete(registration)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    // Employee view: Card layout (read-only)
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
                                  <Badge variant={registration.isActive ? "active" : "inactive"}>
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Đăng ký ca làm việc</h2>
              <form onSubmit={handlePartTimeCreate} className="space-y-4">
                {isPartTimeFlex ? (
                  <>
                    {/* PART_TIME_FLEX: Use available slots */}
                    <div>
                      <Label htmlFor="createSlot">Chọn suất làm việc <span className="text-red-500">*</span></Label>
                      {loadingAvailableSlots ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-600">Đang tải danh sách suất...</span>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500 border rounded-md p-4">
                          Không có suất nào còn trống. Vui lòng thử lại sau.
                        </div>
                      ) : (
                        <select
                          id="createSlot"
                          value={partTimeCreateFormData.partTimeSlotId || ''}
                          onChange={(e) => {
                            const selectedSlot = availableSlots.find(s => s.slotId === parseInt(e.target.value));
                            const availableDays = selectedSlot?.dayOfWeek ? selectedSlot.dayOfWeek.split(',').map(d => d.trim()) : [];
                            setPartTimeCreateFormData(prev => ({
                              ...prev,
                              partTimeSlotId: parseInt(e.target.value) || 0,
                              effectiveFrom: selectedSlot?.effectiveFrom || '',
                              effectiveTo: undefined
                            }));
                            setSelectedSlotDays(availableDays.map(d => String(d)));

                            // Calculate hours per week from shift duration
                            if (selectedSlot) {
                              const hours = calculateShiftHours(selectedSlot.shiftName);
                              setHoursPerWeek(hours);
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Chọn suất làm việc</option>
                          {availableSlots.map(slot => (
                            <option key={slot.slotId} value={slot.slotId}>
                              {slot.shiftName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <Label>
                        Thứ trong tuần
                      </Label>
                      <div className="mt-2 text-sm text-gray-700">
                        {selectedSlotDays && selectedSlotDays.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedSlotDays.map(d => (
                              <Badge key={d} variant="outline">{getDayName(d as DayOfWeek)}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Vui lòng chọn suất làm việc trước</p>
                        )}
                      </div>
                    </div>

                    {/* Week Picker - Start from slot's first day */}
                    <div>
                      <Label htmlFor="weekStart">
                        Tuần bắt đầu <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="weekStart"
                          type="week"
                          min={format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-'W'ww")}
                          value={selectedWeekStart ? format(selectedWeekStart, "yyyy-'W'ww") : ''}
                          placeholder="Chọn tuần"
                          onChange={(e) => {
                            if (e.target.value && partTimeCreateFormData.partTimeSlotId) {
                              // Get selected slot to know which day it starts
                              const selectedSlot = availableSlots.find(s => s.slotId === partTimeCreateFormData.partTimeSlotId);
                              if (!selectedSlot) return;

                              // Get first day of the slot (e.g., "MONDAY" or "WEDNESDAY")
                              const firstDayOfSlot = selectedSlot.dayOfWeek.split(',')[0].trim() as DayOfWeek;

                              // Day of week mapping: MONDAY=1, TUESDAY=2, ..., SUNDAY=0
                              const dayMapping: Record<DayOfWeek, number> = {
                                'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4,
                                'FRIDAY': 5, 'SATURDAY': 6, 'SUNDAY': 0
                              };
                              const slotDayNumber = dayMapping[firstDayOfSlot];

                              // Parse selected week (get Monday of that week)
                              const [year, week] = e.target.value.split('-W');
                              const firstDayOfYear = new Date(parseInt(year), 0, 1);
                              const daysOffset = (parseInt(week) - 1) * 7;
                              const weekStart = addDays(firstDayOfYear, daysOffset);
                              const monday = startOfWeek(weekStart, { weekStartsOn: 1 });

                              // Calculate the actual start date (slot's first day of that week)
                              let actualStartDate = monday;
                              const mondayDay = 1;
                              const daysToAdd = slotDayNumber === 0 ? 6 : slotDayNumber - mondayDay; // Sunday is 6 days after Monday
                              actualStartDate = addDays(monday, daysToAdd);

                              // Validate: Not in the past
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              if (actualStartDate < today) {
                                toast.error(`Không thể chọn tuần trong quá khứ. Tuần này bắt đầu từ ${getDayName(firstDayOfSlot)} ${format(actualStartDate, 'dd/MM/yyyy')}`);
                                return;
                              }

                              // Validate: Not before slot's effective date
                              const slotStartDate = parseISO(selectedSlot.effectiveFrom);
                              if (actualStartDate < slotStartDate) {
                                toast.error(`Ca làm việc này chỉ có hiệu lực từ ${format(slotStartDate, 'dd/MM/yyyy')}. Vui lòng chọn tuần sau đó.`);
                                return;
                              }

                              setSelectedWeekStart(actualStartDate);

                              // Auto-calculate effectiveFrom
                              const from = format(actualStartDate, 'yyyy-MM-dd');
                              setPartTimeCreateFormData(prev => ({
                                ...prev,
                                effectiveFrom: from,
                                effectiveTo: undefined // Reset end date when changing start
                              }));

                              // Reset number of weeks
                              setNumberOfWeeks(1);
                            } else if (!partTimeCreateFormData.partTimeSlotId) {
                              toast.error('Vui lòng chọn suất làm việc trước');
                            }
                          }}
                          required
                          disabled={!partTimeCreateFormData.partTimeSlotId}
                          className="[&::-webkit-datetime-edit-week-field]:hidden [&::-webkit-datetime-edit-text]:hidden"
                        />
                        {selectedWeekStart && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-gray-600">
                            Tuần {getWeekNumber(selectedWeekStart)}, {selectedWeekStart.getFullYear()}
                          </div>
                        )}
                      </div>
                      {selectedWeekStart && partTimeCreateFormData.partTimeSlotId && (() => {
                        const selectedSlot = availableSlots.find(s => s.slotId === partTimeCreateFormData.partTimeSlotId);
                        const firstDay = selectedSlot?.dayOfWeek.split(',')[0].trim() as DayOfWeek;
                        return (
                          <p className="text-sm text-blue-600 mt-1">
                            Tuần bắt đầu từ {getDayName(firstDay)} {format(selectedWeekStart, 'dd/MM/yyyy')}
                          </p>
                        );
                      })()}
                      {!partTimeCreateFormData.partTimeSlotId && (
                        <p className="text-sm text-gray-500 mt-1">
                          Chọn suất làm việc trước để chọn tuần
                        </p>
                      )}
                    </div>

                    {/* Week Duration Dropdown */}
                    <div>
                      <Label htmlFor="weekDuration">
                        Số tuần đăng ký <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="weekDuration"
                        value={numberOfWeeks}
                        onChange={(e) => {
                          const weeks = parseInt(e.target.value);
                          setNumberOfWeeks(weeks);
                          // Auto-calculate effectiveTo
                          if (selectedWeekStart && partTimeCreateFormData.partTimeSlotId) {
                            const selectedSlot = availableSlots.find(s => s.slotId === partTimeCreateFormData.partTimeSlotId);
                            if (!selectedSlot) return;

                            // Calculate end date based on weeks
                            const calculatedEndDate = addDays(addWeeks(selectedWeekStart, weeks), -1);
                            
                            // Get slot's effective end date
                            const slotEndDate = parseISO(selectedSlot.effectiveTo);
                            
                            // Use the earlier date: calculated end date or slot's end date
                            const actualEndDate = calculatedEndDate > slotEndDate ? slotEndDate : calculatedEndDate;
                            
                            const to = format(actualEndDate, 'yyyy-MM-dd');
                            setPartTimeCreateFormData(prev => ({
                              ...prev,
                              effectiveTo: to
                            }));
                          }
                        }}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!selectedWeekStart || !partTimeCreateFormData.partTimeSlotId}
                      >
                        <option value="">-- Chọn số tuần --</option>
                        {selectedWeekStart && partTimeCreateFormData.partTimeSlotId && (() => {
                          const selectedSlot = availableSlots.find(s => s.slotId === partTimeCreateFormData.partTimeSlotId);
                          if (!selectedSlot) return null;

                          const slotEndDate = parseISO(selectedSlot.effectiveTo);
                          const maxWeeks = Math.floor(differenceInWeeks(slotEndDate, selectedWeekStart)) + 1;

                          return Array.from({ length: Math.max(1, maxWeeks) }, (_, i) => {
                            const weeks = i + 1;
                            const weekEndDate = addDays(addWeeks(selectedWeekStart, weeks), -1);
                            const actualEndDate = weekEndDate > slotEndDate ? slotEndDate : weekEndDate;

                            return (
                              <option key={weeks} value={weeks}>
                                {weeks} tuần ({format(selectedWeekStart, 'dd/MM')} - {format(actualEndDate, 'dd/MM/yyyy')})
                              </option>
                            );
                          });
                        })()}
                      </select>
                      {selectedWeekStart && numberOfWeeks > 0 && (
                        <p className="text-sm text-blue-600 font-medium mt-2">
                          Đăng ký {numberOfWeeks} tuần • {format(selectedWeekStart, 'dd/MM/yyyy')} - {partTimeCreateFormData.effectiveTo ? format(parseISO(partTimeCreateFormData.effectiveTo), 'dd/MM/yyyy') : '...'}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Chọn số tuần bạn muốn đăng ký (dựa trên tuần bắt đầu đã chọn)
                      </p>
                    </div>

                    {/* Hours Summary */}
                    {hoursPerWeek > 0 && numberOfWeeks > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-sm text-gray-900">📊 Tổng quan giờ làm</h3>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-gray-600">Giờ/tuần:</span>{' '}
                            <span className="font-semibold">{hoursPerWeek}h</span>
                          </p>
                          <p>
                            <span className="text-gray-600">Số tuần:</span>{' '}
                            <span className="font-semibold">{numberOfWeeks} tuần</span>
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            Tổng: {hoursPerWeek} × {numberOfWeeks} = {hoursPerWeek * numberOfWeeks}h
                          </p>
                        </div>

                        {/* Weekly limit warning */}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Đã dùng (đã duyệt):</span>
                            <span className="font-semibold">{currentApprovedHours}h/tuần</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Đăng ký mới:</span>
                            <span className="font-semibold">+{hoursPerWeek}h/tuần</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Tổng nếu duyệt:</span>
                            <span className={`font-bold ${currentApprovedHours + hoursPerWeek > 21 ? 'text-red-600' : 'text-green-600'}`}>
                              {currentApprovedHours + hoursPerWeek}h/tuần
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${currentApprovedHours + hoursPerWeek > 21 ? 'bg-red-500' : 'bg-green-500'
                                }`}
                              style={{ width: `${Math.min(100, ((currentApprovedHours + hoursPerWeek) / 21) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Giới hạn: 21h/tuần</p>

                          {/* Warning message */}
                          {currentApprovedHours + hoursPerWeek > 21 && (
                            <div className="mt-2 flex items-start gap-2 text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>
                                <strong>Cảnh báo:</strong> Vượt quá giới hạn 21h/tuần!
                                Đăng ký này có thể bị từ chối.
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

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPartTimeCreateModal(false);
                      setPartTimeCreateFormData({ partTimeSlotId: 0, effectiveFrom: '', effectiveTo: '' });
                      setSelectedSlotDays([]);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={partTimeCreating}>
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
              </form>
            </div>
          </div>
        )}

        {/* ❌ REMOVED EDIT MODAL - Registrations are immutable per backend design */}
        {/* Edit feature removed - employees should delete and create new registration instead */}

        {/* FIXED CREATE MODAL */}
        {showFixedCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Tạo đăng ký ca cố định</h2>
              <form onSubmit={handleFixedCreate} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="createEmployee">Nhân viên <span className="text-red-500">*</span></Label>
                  {hasViewEmployeePermission === false ? (
                    <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50">
                      <p className="text-sm text-red-600">
                        Bạn không có quyền <strong>VIEW_EMPLOYEE</strong> để xem danh sách nhân viên. 
                        Vui lòng liên hệ quản trị viên để được cấp quyền.
                      </p>
                    </div>
                  ) : (
                    <select
                      id="createEmployee"
                      value={fixedCreateFormData.employeeId}
                      onChange={(e) => {
                        const selectedEmp = employees.find(emp => emp.employeeId === e.target.value);
                        if (selectedEmp && !canUseFixedRegistration(selectedEmp.employeeType as EmploymentType)) {
                          toast.error('Nhân viên được chọn không thể sử dụng đăng ký ca cố định. Vui lòng sử dụng đăng ký part-time.');
                          return;
                        }
                        setFixedCreateFormData(prev => ({
                          ...prev,
                          employeeId: e.target.value ? parseInt(e.target.value) : 0
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loadingDropdowns}
                    >
                      <option value="0">Chọn nhân viên</option>
                      {employees.map(emp => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.fullName} ({emp.employeeCode}) - {emp.employeeType}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="createWorkShift">Ca làm việc <span className="text-red-500">*</span></Label>
                  <select
                    id="createWorkShift"
                    value={fixedCreateFormData.workShiftId}
                    onChange={(e) => setFixedCreateFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loadingDropdowns}
                  >
                    <option value="">Ca làm việc</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Ngày trong tuần <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6].map(day => (
                      <label key={day} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fixedCreateFormData.daysOfWeek.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFixedCreateFormData(prev => ({
                                ...prev,
                                daysOfWeek: [...prev.daysOfWeek, day]
                              }));
                            } else {
                              setFixedCreateFormData(prev => ({
                                ...prev,
                                daysOfWeek: prev.daysOfWeek.filter(d => d !== day)
                              }));
                            }
                          }}
                        />
                        <span>{DAY_LABELS[day]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="createEffectiveFrom"> Hiệu lực từ <span className="text-red-500">*</span></Label>
                    <Input
                      id="createEffectiveFrom"
                      type="date"
                      value={fixedCreateFormData.effectiveFrom}
                      onChange={(e) => setFixedCreateFormData(prev => ({
                        ...prev,
                        effectiveFrom: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="createEffectiveTo">Hiệu lực đến (Tùy chọn)</Label>
                    <Input
                      id="createEffectiveTo"
                      type="date"
                      value={fixedCreateFormData.effectiveTo || ''}
                      onChange={(e) => setFixedCreateFormData(prev => ({
                        ...prev,
                        effectiveTo: e.target.value || null
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowFixedCreateModal(false);
                      resetFixedCreateForm();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={fixedCreating || loadingDropdowns}>
                    {fixedCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo đăng ký'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FIXED EDIT MODAL */}
        {showFixedEditModal && fixedEditingRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Chỉnh sửa đăng ký ca cố định</h2>
              <form onSubmit={handleFixedUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label>ID</Label>
                  <Input value={fixedEditingRegistration.registrationId} disabled />
                </div>

                <div className="space-y-1">
                  <Label>Nhân viên</Label>
                  <Input value={fixedEditingRegistration.employeeName} disabled />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editWorkShift">Ca làm</Label>
                  <select
                    id="editWorkShift"
                    value={fixedEditFormData.workShiftId || fixedEditingRegistration.workShiftId}
                    onChange={(e) => setFixedEditFormData(prev => ({
                      ...prev,
                      workShiftId: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingDropdowns}
                  >
                    <option value="">Giữ nguyên: {fixedEditingRegistration.workShiftName}</option>
                    {workShifts.map(shift => (
                      <option key={shift.workShiftId} value={shift.workShiftId}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Ngày trong tuần</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => {
                      const currentDays = fixedEditFormData.daysOfWeek || fixedEditingRegistration.daysOfWeek;
                      return (
                        <label key={day} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentDays.includes(day)}
                            onChange={(e) => {
                              const currentDaysArray = fixedEditFormData.daysOfWeek || fixedEditingRegistration.daysOfWeek;
                              if (e.target.checked) {
                                setFixedEditFormData(prev => ({
                                  ...prev,
                                  daysOfWeek: [...currentDaysArray, day]
                                }));
                              } else {
                                setFixedEditFormData(prev => ({
                                  ...prev,
                                  daysOfWeek: currentDaysArray.filter(d => d !== day)
                                }));
                              }
                            }}
                          />
                          <span>{DAY_LABELS[day]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="editEffectiveFrom">Hiệu lực từ</Label>
                    <Input
                      id="editEffectiveFrom"
                      type="date"
                      value={fixedEditFormData.effectiveFrom || fixedEditingRegistration.effectiveFrom}
                      onChange={(e) => setFixedEditFormData(prev => ({
                        ...prev,
                        effectiveFrom: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editEffectiveTo">Hiệu lực đến</Label>
                    <Input
                      id="editEffectiveTo"
                      type="date"
                      value={fixedEditFormData.effectiveTo !== undefined ? (fixedEditFormData.effectiveTo || '') : (fixedEditingRegistration.effectiveTo || '')}
                      onChange={(e) => setFixedEditFormData(prev => ({
                        ...prev,
                        effectiveTo: e.target.value || null
                      }))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Để trống nếu không giới hạn</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowFixedEditModal(false);
                      setFixedEditingRegistration(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={fixedUpdating || loadingDropdowns}>
                    {fixedUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật đăng ký'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PART-TIME DELETE MODAL */}
        {showPartTimeDeleteModal && partTimeDeletingRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
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

        {/* FIXED DETAILS MODAL */}
        {showFixedDetailsModal && fixedDetailsRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
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
    </ProtectedRoute>
  );
}


