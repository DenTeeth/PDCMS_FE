'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Plus, Edit, Trash2, CalendarDays, Clock, Calendar, Users, AlertCircle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Import types and services for Part-Time Registration
import { 
  ShiftRegistration, 
  CreateShiftRegistrationRequest,
  UpdateShiftRegistrationRequest,
  DayOfWeek 
} from '@/types/shiftRegistration';
import { WorkShift } from '@/types/workShift';
import { AvailableSlot, PartTimeSlot } from '@/types/workSlot';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { workShiftService } from '@/services/workShiftService';
import { workSlotService } from '@/services/workSlotService';
import { getEmployeeIdFromToken } from '@/lib/utils';

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
    effectiveFrom: ''
  });

  const [showPartTimeEditModal, setShowPartTimeEditModal] = useState(false);
  const [partTimeEditingRegistration, setPartTimeEditingRegistration] = useState<ShiftRegistration | null>(null);
  const [partTimeUpdating, setPartTimeUpdating] = useState(false);
  const [partTimeEditFormData, setPartTimeEditFormData] = useState<UpdateShiftRegistrationRequest>({});

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
    }
  }, [activeTab, partTimeCurrentPage, currentEmployeeId, availableTabs, isPartTimeFlex, hasPermission]);

  // Part-Time Registration Fetch
  const fetchPartTimeRegistrations = async () => {
    try {
      setPartTimeLoading(true);
      
      const response = await shiftRegistrationService.getMyRegistrations({
        page: partTimeCurrentPage,
        size: 10,
        sortBy: 'effectiveFrom',
        sortDirection: 'DESC'
      });
      
      // Handle both array and paginated responses
      // According to API spec: Employee view typically returns array directly
      if (Array.isArray(response)) {
        console.log('📋 Part-time registrations (array):', response);
        setPartTimeRegistrations(response);
        setPartTimeTotalPages(1);
        setPartTimeTotalElements(response.length);
      } else {
        console.log('📋 Part-time registrations (paginated):', response);
        setPartTimeRegistrations(response.content || []);
        setPartTimeTotalPages(response.totalPages || 0);
        setPartTimeTotalElements(response.totalElements || 0);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch part-time registrations:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to fetch your shift registrations');
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
      console.log('📋 [fetchWorkSlotsData] Loaded work slots:', {
        count: slotsResponse?.length || 0,
        slots: slotsResponse
      });
    } catch (error: any) {
      console.error('❌ [fetchWorkSlotsData] Failed to fetch work slots:', error);
      
      // Nếu lỗi 403 → User không có permission (expected cho employee)
      if (error.response?.status === 403) {
        console.log('ℹ️ [fetchWorkSlotsData] 403 Forbidden - User does not have permission to view all work slots');
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
      console.log('🚀 [fetchAvailableSlots] Starting fetch...');
      setLoadingAvailableSlots(true);
      
      console.log('📡 [fetchAvailableSlots] Calling shiftRegistrationService.getAvailableSlots()...');
      const slots = await shiftRegistrationService.getAvailableSlots();
      
      console.log('✅ [fetchAvailableSlots] API Response received:', {
        rawData: slots,
        isArray: Array.isArray(slots),
        length: Array.isArray(slots) ? slots.length : 'not an array',
        firstItem: Array.isArray(slots) && slots.length > 0 ? slots[0] : 'no items'
      });
      
      const slotsArray = slots || [];
      console.log('📋 [fetchAvailableSlots] Setting availableSlots:', {
        count: slotsArray.length,
        slots: slotsArray
      });
      
      setAvailableSlots(slotsArray);
      
      if (!slots || slotsArray.length === 0) {
        console.warn('⚠️ [fetchAvailableSlots] No available slots found');
        toast.info('Hiện tại không có suất nào còn trống. Vui lòng thử lại sau.');
      } else {
        console.log('✅ [fetchAvailableSlots] Successfully loaded', slotsArray.length, 'available slots');
      }
    } catch (error: any) {
      console.error('❌ [fetchAvailableSlots] Error fetching available slots:', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || error.message || 'Failed to load available slots');
    } finally {
      console.log('🏁 [fetchAvailableSlots] Finished (set loading to false)');
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
    
    // Validate based on employee type
    if (isPartTimeFlex) {
      // PART_TIME_FLEX: Need partTimeSlotId and effectiveFrom
      if (!partTimeCreateFormData.partTimeSlotId || !partTimeCreateFormData.effectiveFrom) {
        toast.error('Vui lòng chọn suất và ngày bắt đầu');
        return;
      }
    } else {
      // Admin/Manager with MANAGE_WORK_SLOTS: Use old form structure (if still needed)
      toast.error('Chức năng này chỉ dành cho nhân viên PART_TIME_FLEX. Vui lòng sử dụng trang quản lý.');
      return;
    }

    try {
      setPartTimeCreating(true);
      await shiftRegistrationService.createRegistration(partTimeCreateFormData);
      toast.success('Đăng ký ca làm việc thành công');
      setShowPartTimeCreateModal(false);
      setPartTimeCreateFormData({
        partTimeSlotId: 0,
        effectiveFrom: ''
      });
      // Refresh data
      await fetchPartTimeRegistrations();
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
      } else if (error.errorCode === 'REGISTRATION_CONFLICT' || error.response?.data?.errorCode === 'REGISTRATION_CONFLICT') {
        toast.error('Bạn đã đăng ký suất này rồi hoặc có ca làm việc trùng giờ.');
      } else {
        toast.error(error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to create shift registration');
      }
    } finally {
      setPartTimeCreating(false);
    }
  };

  const handlePartTimeEdit = (registration: ShiftRegistration) => {
    setPartTimeEditingRegistration(registration);
    setPartTimeEditFormData({
      effectiveTo: registration.effectiveTo || undefined,
      isActive: registration.isActive
    });
    setShowPartTimeEditModal(true);
  };

  const handlePartTimeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partTimeEditingRegistration) return;

    try {
      setPartTimeUpdating(true);
      await shiftRegistrationService.updateRegistration(
        partTimeEditingRegistration.registrationId, 
        partTimeEditFormData
      );
      toast.success('Shift registration updated successfully');
      setShowPartTimeEditModal(false);
      setPartTimeEditingRegistration(null);
      setPartTimeEditFormData({});
      fetchPartTimeRegistrations();
    } catch (error: any) {
      console.error('Failed to update registration:', error);
      toast.error(error.response?.data?.detail || 'Failed to update shift registration');
    } finally {
      setPartTimeUpdating(false);
    }
  };

  const handlePartTimeDelete = async () => {
    if (!partTimeDeletingRegistration) return;

    try {
      setPartTimeDeleting(true);
      await shiftRegistrationService.deleteRegistration(partTimeDeletingRegistration.registrationId);
      toast.success('Shift registration deleted successfully');
      setShowPartTimeDeleteModal(false);
      setPartTimeDeletingRegistration(null);
      fetchPartTimeRegistrations();
    } catch (error: any) {
      console.error('Failed to delete registration:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete shift registration');
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
    return workShift ? `${workShift.startTime} - ${workShift.endTime}` : '';
  };

  // Get shift name for registration - try multiple sources
  const getRegistrationShiftName = (registration: ShiftRegistration): string => {
    // First, try registration.workShiftName (from API response)
    if (registration.workShiftName && registration.workShiftName.trim() !== '') {
      return registration.workShiftName;
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

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_REGISTRATION_OWN, Permission.VIEW_FIXED_REGISTRATIONS_OWN]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header - Đơn giản hóa */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đăng Ký Ca Làm Việc</h1>
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

            {/* Available Slots Section - Carousel */}
            {(isPartTimeFlex || hasPermission(Permission.VIEW_AVAILABLE_SLOTS)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Các Suất Làm Việc Có Sẵn ({availableSlots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAvailableSlots ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                      <span className="text-gray-600">Đang tải...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-700 font-medium mb-1">Không có suất nào còn trống</p>
                      <p className="text-sm text-gray-500">Vui lòng thử lại sau</p>
                    </div>
                  ) : (
                    <Carousel className="w-full" autoplay={false}>
                      <CarouselContent>
                        {availableSlots.map((slot) => (
                          <CarouselItem key={slot.slotId} className="basis-full sm:basis-1/2 lg:basis-1/3">
                            <Card className="border">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                      {slot.shiftName}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline">
                                        <CalendarDays className="h-3 w-3 mr-1" />
                                        {getDayOfWeekLabel(slot.dayOfWeek)}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          slot.remaining > 0 
                                            ? 'bg-green-50 text-green-700' 
                                            : 'bg-red-50 text-red-700'
                                        }
                                      >
                                        <Users className="h-3 w-3 mr-1" />
                                        {slot.remaining > 0 ? `Còn ${slot.remaining} chỗ` : 'Đã đầy'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      setPartTimeCreateFormData({
                                        partTimeSlotId: slot.slotId,
                                        effectiveFrom: new Date().toISOString().split('T')[0]
                                      });
                                      setShowPartTimeCreateModal(true);
                                    }}
                                    className="w-full"
                                    size="sm"
                                    disabled={slot.remaining === 0}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {slot.remaining > 0 ? 'Đăng Ký' : 'Đã Đầy'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  )}
                </CardContent>
              </Card>
            )}

            {/* My Registrations Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Đăng Ký Của Tôi ({partTimeTotalElements})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {partTimeLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                    <span className="text-gray-600">Đang tải...</span>
                  </div>
                ) : partTimeRegistrations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-700 font-medium mb-2">Chưa có đăng ký ca làm việc</p>
                    <p className="text-sm text-gray-500">Vui lòng chọn suất ở trên để đăng ký</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partTimeRegistrations.map((registration) => (
                      <Card key={registration.registrationId}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {getRegistrationShiftName(registration)}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">
                                  {getDayOfWeekLabel(registration.dayOfWeek as DayOfWeek)}
                                </Badge>
                                <Badge className={registration.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
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
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePartTimeEdit(registration)}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Sửa
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPartTimeDeletingRegistration(registration);
                                  setShowPartTimeDeleteModal(true);
                                }}
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {partTimeTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Đăng Ký Ca Làm Việc</h2>
              <form onSubmit={handlePartTimeCreate} className="space-y-4">
                {isPartTimeFlex ? (
                  <>
                    {/* PART_TIME_FLEX: Use available slots */}
                    <div>
                      <Label htmlFor="createSlot">Chọn Suất Làm Việc *</Label>
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
                          onChange={(e) => setPartTimeCreateFormData(prev => ({
                            ...prev,
                            partTimeSlotId: parseInt(e.target.value) || 0
                          }))}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Chọn suất làm việc</option>
                          {availableSlots.map(slot => (
                            <option key={slot.slotId} value={slot.slotId}>
                              {slot.shiftName} - {getDayOfWeekLabel(slot.dayOfWeek)} (Còn {slot.remaining}{slot.quota ? `/${slot.quota}` : ''} chỗ)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="createEffectiveFrom">Từ ngày *</Label>
                      <Input
                        id="createEffectiveFrom"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={partTimeCreateFormData.effectiveFrom}
                        onChange={(e) => setPartTimeCreateFormData(prev => ({
                          ...prev,
                          effectiveFrom: e.target.value
                        }))}
                        required
                      />
                    </div>
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
                      setPartTimeCreateFormData({
                        partTimeSlotId: 0,
                        effectiveFrom: ''
                      });
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

        {/* PART-TIME EDIT MODAL */}
        {showPartTimeEditModal && partTimeEditingRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Sửa Đăng Ký</h2>
              <form onSubmit={handlePartTimeUpdate} className="space-y-4">
                <div>
                  <Label>Ca làm việc</Label>
                  <Input value={partTimeEditingRegistration?.workShiftName || 'N/A'} disabled className="bg-gray-50" />
                </div>
                
                <div>
                  <Label htmlFor="editEffectiveTo">Đến ngày</Label>
                  <Input
                    id="editEffectiveTo"
                    type="date"
                    value={partTimeEditFormData.effectiveTo || ''}
                    onChange={(e) => setPartTimeEditFormData(prev => ({
                      ...prev,
                      effectiveTo: e.target.value
                    }))}
                    min={partTimeEditingRegistration ? format(parseISO(partTimeEditingRegistration.effectiveFrom), 'yyyy-MM-dd') : undefined}
                  />
                  <p className="text-xs text-gray-500 mt-1">Để trống nếu không có ngày kết thúc</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPartTimeEditModal(false);
                      setPartTimeEditingRegistration(null);
                      setPartTimeEditFormData({});
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={partTimeUpdating}>
                    {partTimeUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Cập nhật'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

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
    </ProtectedRoute>
  );
}


