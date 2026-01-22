'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faCalendarAlt, faUser, faPlus, faChartBar, faClock, faUserCheck, faUserTimes, faExclamationTriangle, faListAlt } from '@fortawesome/free-solid-svg-icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { EmployeeShiftService } from '@/services/employeeShiftService';
import { workShiftService } from '@/services/workShiftService';
import { EmployeeService } from '@/services/employeeService';
import { holidayService } from '@/services/holidayService';
import { EmployeeShift, ShiftStatus, ShiftSummaryResponse } from '@/types/employeeShift';
import { WorkShift as WorkShiftTemplate } from '@/types/workShift';
import { Employee } from '@/types/employee';
import { HolidayDate } from '@/types/holiday';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeToHHMM } from '@/lib/utils';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';

export default function ShiftCalendarPage() {
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [holidays, setHolidays] = useState<HolidayDate[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShiftTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  // Summary state
  const [summaryData, setSummaryData] = useState<ShiftSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryDateRange, setSummaryDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    employee_id: '',
    work_date: '',
    work_shift_id: '',
    notes: '',
  });

  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
  });

  // Permissions - Updated to match BE naming and add backward compatibility
  // Logic: User needs ONE of these permissions:
  // - VIEW_SCHEDULE_ALL: Can view all employees' shifts (Manager/Admin)
  // - VIEW_SCHEDULE_OWN: Can only view own shifts (Employee)
  const canViewAll = user?.permissions?.includes('VIEW_SCHEDULE_ALL') || false;
  const canViewOwn = user?.permissions?.includes('VIEW_SCHEDULE_OWN') || false;
  const canViewShifts = canViewAll || canViewOwn;

  // 🚨 IMPORTANT: Manual shift creation is for Manager/Admin ONLY
  // This is NOT for employee self-registration (use /registrations for that)
  // BE uses MANAGE_FIXED_REGISTRATIONS for creating/updating/deleting shifts manually
  // Purpose: Manager creates ad-hoc shifts for employees (special cases, replacements, etc.)
  // Example: Employee sick, manager assigns replacement shift to another employee
  const canCreate =
    user?.permissions?.includes('MANAGE_FIXED_REGISTRATIONS') || false;

  const canUpdate =
    user?.permissions?.includes('MANAGE_FIXED_REGISTRATIONS') || false;

  const canDelete =
    user?.permissions?.includes('MANAGE_FIXED_REGISTRATIONS') || false;

  // Summary chỉ hiển thị cho user có VIEW_SCHEDULE_ALL (có thể xem tất cả)
  const canViewSummary = canViewAll;

  // Debug permissions
  console.log('User permissions:', user?.permissions);
  console.log('Can view all (VIEW_SCHEDULE_ALL):', canViewAll);
  console.log('Can view own (VIEW_SCHEDULE_OWN):', canViewOwn);
  console.log('Can view shifts:', canViewShifts);
  console.log(' User employeeId:', user?.employeeId); // Debug employeeId

  // Load data
  useEffect(() => {
    loadData();
    // Không tự động load summary, chờ user nhập đủ thông tin
  }, []);

  // Sync currentDate with FullCalendar when it mounts
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentView = calendarApi.view;
      const currentDate = currentView.calendar.getDate();
      setCurrentDate(currentDate);
    }
  }, []);

  useEffect(() => {
    if (currentDate) {
      console.log('Current date changed, reloading data for:', format(currentDate, 'yyyy-MM-dd'));
      loadShifts();
    }
  }, [currentDate, selectedEmployee]);

  // Handle FullCalendar view changes
  const handleDatesSet = async (dateInfo: any) => {
    console.log('Dates set:', dateInfo);

    // Get the middle date of the view to determine the correct month/year
    // This fixes the issue where start date might be from previous month
    const startDate = new Date(dateInfo.start);
    const endDate = new Date(dateInfo.end);
    const middleDate = new Date((startDate.getTime() + endDate.getTime()) / 2);

    // Fetch holidays for the visible date range
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      const holidayDates = await holidayService.getHolidaysInRange(startDateStr, endDateStr);
      setHolidays(holidayDates || []);
      console.log(' Holidays loaded:', holidayDates?.length || 0);
    } catch (error: any) {
      console.error('Failed to fetch holidays:', error);
      // Don't show error - holidays are not critical
      setHolidays([]);
    }

    // Update currentDate to keep title in sync with calendar
    setCurrentDate(prevDate => {
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();
      const newMonth = middleDate.getMonth();
      const newYear = middleDate.getFullYear();

      // Only update if month/year actually changed to avoid unnecessary re-renders
      if (prevMonth !== newMonth || prevYear !== newYear) {
        console.log('Month/Year changed from', prevMonth + 1, prevYear, 'to', newMonth + 1, newYear);
        return middleDate;
      }

      // Return prevDate to avoid triggering useEffect
      return prevDate;
    });
  };


  const loadData = async () => {
    try {
      setLoading(true);
      console.log(' Loading shift calendar data...');

      // Load work shifts
      const workShiftsData = await workShiftService.getAll(true); // Chỉ lấy ca làm việc đang hoạt động
      setWorkShifts(workShiftsData);
      console.log(' Work shifts loaded:', workShiftsData.length);

      // Load employees list only if user has VIEW_SCHEDULE_ALL (can view all employees' shifts)
      if (canViewAll) {
        try {
          const employeeService = new EmployeeService();
          const employeesResponse = await employeeService.getEmployees({});
          setEmployees(employeesResponse.content || []);
          console.log(' Employees loaded:', employeesResponse.content?.length || 0);
        } catch (error: any) {
          console.warn('Cannot load employees list:', error.message);
          toast.warning('Không thể tải danh sách nhân viên');
          // Nếu không load được employees, vẫn tiếp tục với shifts
          setEmployees([]);
        }
      } else {
        // If only VIEW_SCHEDULE_OWN, clear employees list (not needed)
        setEmployees([]);
      }

      // Load shifts
      await loadShifts();
    } catch (error: any) {
      console.error(' Error loading data:', error);
      toast.error('Không thể tải dữ liệu lịch làm việc');
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      // Don't set loading here to avoid re-render loop
      // setLoading(true); // ⭐ REMOVED to prevent infinite loop

      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      // Build params object
      const params: any = {
        start_date: startDate,
        end_date: endDate,
      };

      // Logic based on permissions:
      // - VIEW_SCHEDULE_ALL: Can view all employees, can filter by selectedEmployee
      // - VIEW_SCHEDULE_OWN: Can only view own shifts, DO NOT pass employee_id (BE auto-filters by JWT)
      if (canViewAll) {
        // User with VIEW_SCHEDULE_ALL: Can view all employees' shifts
        // If selectedEmployee is set, filter by that employee; otherwise show all
        if (selectedEmployee) {
          params.employee_id = selectedEmployee;
          console.log(' VIEW_SCHEDULE_ALL: Filtering by employee_id:', selectedEmployee);
        } else {
          // No employee selected, show all employees' shifts
          console.log(' VIEW_SCHEDULE_ALL: Showing all employees\' shifts');
        }
      } else if (canViewOwn) {
        // User with VIEW_SCHEDULE_OWN: Can only view own shifts
        // DO NOT pass employee_id - Backend will auto-filter by JWT token
        console.log(' VIEW_SCHEDULE_OWN: Backend will auto-filter by JWT token (own shifts only)');
      }

      console.log(' API params:', params);
      console.log(' Fetching shifts from API...');

      const shiftsData = await EmployeeShiftService.getShifts(params);

      console.log(' Shifts loaded:', shiftsData.length, 'shifts');
      console.log('� Shifts data:', shiftsData);
      setShifts(shiftsData);

      if (shiftsData.length === 0) {
        toast.info(`Không có ca làm việc nào trong tháng ${format(currentDate, 'MM/yyyy')}`);
      }
    } catch (error: any) {
      console.error(' Error loading shifts:', error);
      toast.error('Không thể tải danh sách ca làm việc');
      handleError(error);
    }
    // Don't set loading false here - let loadData handle it
  };

  // Load summary data
  const loadSummary = async () => {
    // Validation: Kiểm tra có đủ thông tin không
    if (!summaryDateRange.startDate || !summaryDateRange.endDate) {
      setSummaryError('Vui lòng chọn khoảng thời gian trước khi xem thống kê');
      return;
    }

    try {
      setSummaryLoading(true);
      setSummaryError(null);

      // Build params object for summary
      const params: any = {
        start_date: summaryDateRange.startDate,
        end_date: summaryDateRange.endDate,
      };

      // Summary logic: Only VIEW_SCHEDULE_ALL can view summary
      // If selectedEmployee is set, filter by that employee; otherwise show all
      if (canViewAll && selectedEmployee) {
        params.employee_id = selectedEmployee;
        console.log(' Summary: Filtering by employee_id:', selectedEmployee);
      } else if (canViewAll) {
        // No employee selected, show summary for all employees
        console.log(' Summary: Showing summary for all employees');
      }
      // If VIEW_SCHEDULE_OWN: Summary is not available (canViewSummary = false)

      console.log('Loading summary with params:', params);

      const summaryData = await EmployeeShiftService.getShiftSummary(params);

      console.log(' Summary data received:', summaryData);
      setSummaryData(summaryData);

      if (summaryData.length > 0) {
        const totalShifts = summaryData.reduce((sum, item) => sum + item.total_shifts, 0);
        toast.success(`Đã tải thống kê: ${totalShifts} ca làm việc`);
      } else {
        toast.info('Không có dữ liệu ca làm việc trong khoảng thời gian này');
      }
    } catch (error: any) {
      console.error(' Error loading summary:', error);
      setSummaryError('Không thể tải dữ liệu thống kê');
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Convert shifts to calendar events
  const getCalendarEvents = () => {
    console.log('getCalendarEvents called:', {
      shiftsCount: shifts.length,
      workShiftsCount: workShifts.length,
      employeesCount: employees.length,
      sampleShift: shifts[0],
      sampleEmployee: employees[0]
    });

    // Convert shifts to events
    const shiftEvents = shifts.map(shift => {
      // Use workShift from shift object if available (from API response), otherwise lookup from workShifts array
      const workShift = shift.workShift || workShifts.find(ws => ws.workShiftId === shift.workShiftId);

      // Use employee from shift object if available, otherwise lookup from employees array
      // Handle both number and string types for employeeId comparison
      const employee = shift.employee || employees.find(emp => {
        const empId = typeof emp.employeeId === 'string' ? parseInt(emp.employeeId) : emp.employeeId;
        return empId === shift.employeeId;
      });

      const employeeName = employee?.fullName || shift.employee?.fullName || 'N/A';
      const shiftName = workShift?.shiftName || shift.workShift?.shiftName || shift.workShiftId;

      const start = `${shift.workDate}T${workShift?.startTime || shift.workShift?.startTime || '08:00:00'}`;
      const end = `${shift.workDate}T${workShift?.endTime || shift.workShift?.endTime || '17:00:00'}`;

      return {
        id: shift.employeeShiftId,
        title: `${employeeName} - ${shiftName}`,
        start,
        end,
        allDay: false,
        backgroundColor: getEventColor(shift.status),
        borderColor: getEventColor(shift.status),
        textColor: '#ffffff',
        extendedProps: {
          employeeName,
          shiftName,
          status: shift.status,
          workShiftId: shift.workShiftId,
          workDate: shift.workDate
        }
      };
    });

    // Convert holidays to all-day events
    const holidayEvents = holidays.map((holiday) => {
      const holidayDate = new Date(holiday.holidayDate);
      holidayDate.setHours(0, 0, 0, 0);

      return {
        id: `holiday-${holiday.holidayDate}-${holiday.definitionId}`,
        title: holiday.holidayName || 'Ngày lễ',
        start: holidayDate,
        allDay: true,
        backgroundColor: '#fef3c7', // Light yellow/amber
        borderColor: '#f59e0b', // Amber border
        borderWidth: 2, // Thicker border for better visibility
        textColor: '#000000', // Black text
        display: 'background', // Show as background highlight
        extendedProps: {
          isHoliday: true,
          holiday,
        },
      };
    });

    console.log(' Calendar events generated:', {
      shifts: shiftEvents.length,
      holidays: holidayEvents.length,
      total: shiftEvents.length + holidayEvents.length
    });

    return [...shiftEvents, ...holidayEvents];
  };

  const getEventColor = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.SCHEDULED: return '#3b82f6';
      case ShiftStatus.COMPLETED: return '#10b981';
      case ShiftStatus.CANCELLED: return '#6b7280';
      case ShiftStatus.ON_LEAVE: return '#f59e0b';
      case ShiftStatus.ABSENT: return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Handle event click
  const handleEventClick = async (clickInfo: any) => {
    // Check if clicked event is a holiday
    if (clickInfo.event.extendedProps?.isHoliday) {
      const holiday = clickInfo.event.extendedProps.holiday as HolidayDate;
      toast.info(`${holiday.holidayName || 'Ngày lễ'} - ${format(new Date(holiday.holidayDate), 'dd/MM/yyyy', { locale: vi })}`);
      return;
    }

    // Handle shift click
    try {
      setDetailLoading(true);
      const shiftId = clickInfo.event.id;
      console.log('Event clicked:', shiftId);

      // Find shift in current data first
      const existingShift = shifts.find(shift => shift.employeeShiftId === shiftId);
      if (existingShift) {
        setSelectedShift(existingShift);
        setShowDetailModal(true);
        setDetailLoading(false);
        return;
      }

      // If not found, fetch from API
      const shiftDetail = await EmployeeShiftService.getShiftById(shiftId);
      setSelectedShift(shiftDetail);
      setShowDetailModal(true);
    } catch (error: any) {
      console.error('Error loading shift detail:', error);
      handleError(error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle create shift
  const handleCreateShift = async () => {
    try {
      console.log(' Creating shift:', createForm);

      // Show loading toast
      const loadingToast = toast.loading("Đang tạo ca làm việc...");

      const shiftData = {
        employee_id: parseInt(createForm.employee_id),
        work_date: createForm.work_date,
        work_shift_id: createForm.work_shift_id,
        notes: createForm.notes || undefined,
      };

      const createdShift = await EmployeeShiftService.createShift(shiftData);
      console.log(' Shift created:', createdShift);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Reset form
      setCreateForm({
        employee_id: '',
        work_date: '',
        work_shift_id: '',
        notes: '',
      });

      // Close modal
      setShowCreateModal(false);

      // Show success message với thông tin chi tiết
      const employeeName = employees.find(emp => emp.employeeId === createForm.employee_id)?.fullName || 'nhân viên';
      const shiftName = workShifts.find(ws => ws.workShiftId === createForm.work_shift_id)?.shiftName || createForm.work_shift_id;
      toast.success(`Đã tạo ca làm cho ${employeeName} - ${shiftName} vào ngày ${format(new Date(createForm.work_date), 'dd/MM/yyyy')}`);

      // Reload shifts để hiển thị ca làm mới lên calendar
      console.log(' Reloading shifts to display new shift on calendar...');
      await loadShifts();
      console.log(' Calendar updated with new shift');

    } catch (error: any) {
      console.error(' Error creating shift:', error);
      handleCreateError(error);
    }
  };

  // Handle create shift errors
  const handleCreateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;
    const errorTitle = error.response?.data?.title;
    const errorProperties = error.response?.data?.properties;

    // BR-37: Handle Weekly Working Hours Limit (48 hours/week)
    if (errorTitle === 'Vượt Giới Hạn 48 Giờ/Tuần' ||
      errorMessage?.includes('48 giờ/tuần') ||
      errorMessage?.includes('giới hạn giờ làm việc tuần')) {

      if (errorProperties) {
        const { existingHours, newShiftHours, weekStart, weekEnd, maxWeeklyHours } = errorProperties;
        toast.error(
          `Vượt giới hạn ${maxWeeklyHours || 48}h/tuần!\n` +
          `Nhân viên đã có ${existingHours}h trong tuần (${weekStart} đến ${weekEnd}).\n` +
          `Không thể thêm ca ${newShiftHours}h này.`,
          { duration: 6000 }
        );
      } else {
        toast.error(
          errorMessage || "Không thể tạo ca làm: Vượt giới hạn 48 giờ làm việc/tuần.",
          { duration: 5000 }
        );
      }
      return;
    }

    switch (errorCode) {
      case 'HOLIDAY_CONFLICT':
        toast.error("Không thể tạo ca làm vào ngày nghỉ lễ. Vui lòng sử dụng quy trình OT.");
        break;
      case 'SLOT_CONFLICT':
        toast.error("Nhân viên đã có lịch làm việc vào ngày và ca này.");
        break;
      case 'RELATED_RESOURCE_NOT_FOUND':
        if (errorMessage?.includes('Nhân viên')) {
          toast.error("Nhân viên không tồn tại.");
        } else if (errorMessage?.includes('Ca làm việc')) {
          toast.error("Mẫu ca làm việc không tồn tại.");
        } else {
          toast.error("Tài nguyên liên quan không tồn tại.");
        }
        break;
      case 'FORBIDDEN':
        toast.error("Bạn không có quyền tạo ca làm việc.");
        break;
      default:
        handleError(error);
    }
  };

  // Handle update shift
  const handleUpdateShift = async () => {
    if (!selectedShift) return;

    try {
      console.log(' Updating shift:', selectedShift.employeeShiftId, updateForm);

      // Show loading toast
      const loadingToast = toast.loading("Đang cập nhật ca làm việc...");

      const updateData = {
        status: updateForm.status || undefined,
        notes: updateForm.notes || undefined,
      };

      const updatedShift = await EmployeeShiftService.updateShift(selectedShift.employeeShiftId, updateData);
      console.log(' Shift updated:', updatedShift);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Reset form
      setUpdateForm({
        status: '',
        notes: '',
      });

      // Close modals
      setShowUpdateModal(false);
      setShowDetailModal(false);

      // Show success message với thông tin chi tiết
      const statusText = updateForm.status === 'COMPLETED' ? 'Hoàn thành' :
        updateForm.status === 'CANCELLED' ? 'Đã hủy' :
          updateForm.status === 'ABSENT' ? 'Vắng mặt' : updateForm.status;
      toast.success(`Đã cập nhật ca làm thành: ${statusText}`);

      // Reload shifts để hiển thị trạng thái mới lên calendar
      console.log(' Reloading shifts to display updated status on calendar...');
      await loadShifts();
      console.log(' Calendar updated with new status');

    } catch (error: any) {
      console.error(' Error updating shift:', error);
      handleUpdateError(error);
    }
  };

  // Handle update shift errors
  const handleUpdateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'SHIFT_FINALIZED':
        toast.error("Không thể cập nhật ca làm đã hoàn thành/đã hủy.");
        break;
      case 'error.invalid.status.transition':
        toast.error("Không thể cập nhật thủ công trạng thái thành 'Nghỉ phép'. Vui lòng tạo yêu cầu nghỉ phép.");
        break;
      case 'FORBIDDEN':
        toast.error("Bạn không có quyền cập nhật ca làm việc.");
        break;
      case 'SHIFT_NOT_FOUND':
        toast.error("Ca làm việc không tồn tại hoặc bạn không có quyền truy cập.");
        break;
      default:
        handleError(error);
    }
  };

  // Handle delete shift
  const handleDeleteShift = async () => {
    if (!selectedShift) return;

    try {
      console.log(' Deleting shift:', selectedShift.employeeShiftId);

      // Show loading toast
      const loadingToast = toast.loading("Đang hủy ca làm việc...");

      await EmployeeShiftService.deleteShift(selectedShift.employeeShiftId);
      console.log(' Shift deleted');

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Close modals
      setShowDeleteModal(false);
      setShowDetailModal(false);

      // Show success message
      const employeeName = selectedShift.employee?.fullName || 'nhân viên';
      const shiftName = selectedShift.workShift?.shiftName || selectedShift.workShiftId;
      toast.success(`Đã hủy ca làm của ${employeeName} - ${shiftName}`);

      // Reload shifts để cập nhật calendar (xóa shift khỏi calendar)
      console.log(' Reloading shifts to remove deleted shift from calendar...');
      await loadShifts();
      console.log(' Calendar updated - shift removed');

    } catch (error: any) {
      console.error(' Error deleting shift:', error);
      handleDeleteError(error);
    }
  };

  // Handle delete shift errors
  const handleDeleteError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

    switch (errorCode) {
      case 'CANNOT_CANCEL_BATCH':
        toast.error("Không thể hủy ca làm mặc định của nhân viên Full-time. Vui lòng tạo yêu cầu nghỉ phép.");
        break;
      case 'CANNOT_CANCEL_COMPLETED':
        toast.error("Không thể hủy ca làm đã hoàn thành.");
        break;
      case 'FORBIDDEN':
        toast.error("Bạn không có quyền hủy ca làm việc.");
        break;
      case 'SHIFT_NOT_FOUND':
        toast.error("Ca làm việc không tồn tại hoặc bạn không có quyền truy cập.");
        break;
      default:
        handleError(error);
    }
  };


  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  return (
    <ProtectedRoute
      requiredBaseRole="employee"
      requiredPermissions={['VIEW_SCHEDULE_OWN', 'VIEW_SCHEDULE_ALL']}
      requireAll={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch ca làm việc </h1>
            <p className="text-gray-600 mt-1">Quản lý và theo dõi lịch làm việc của nhân viên</p>
          </div>
          <div className="flex gap-2">
            {canCreate && (
              <Button onClick={() => setShowCreateModal(true)}>
                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                Tạo ca làm mới
              </Button>
            )}
            <Button onClick={loadShifts} variant="outline" disabled={loading}>
              <FontAwesomeIcon icon={faSyncAlt} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Đang tải...' : 'Tải lại'}
            </Button>
          </div>
        </div>


        {/* Summary Dashboard - Step by Step Guide */}
        {canViewSummary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faChartBar} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Thống kê ca làm việc</h3>
                <p className="text-sm text-gray-600">Theo dõi hiệu suất làm việc của nhân viên</p>
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div className="space-y-4">
              {/* Step 1: Select Employee */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-sm font-medium text-gray-700">Chọn nhân viên:</span>
                </div>
                <select
                  value={selectedEmployee?.toString() || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]"
                >
                  <option value="">Tất cả nhân viên</option>
                  {employees.map(employee => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
                {selectedEmployee && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ {employees.find(emp => emp.employeeId === String(selectedEmployee))?.fullName}
                  </div>
                )}
              </div>

              {/* Step 2: Select Date Range */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-sm font-medium text-gray-700">Chọn khoảng thời gian:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={summaryDateRange.startDate}
                    onChange={(e) => setSummaryDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <span className="text-gray-500">đến</span>
                  <input
                    type="date"
                    value={summaryDateRange.endDate}
                    onChange={(e) => setSummaryDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                {summaryDateRange.startDate && summaryDateRange.endDate && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ {summaryDateRange.startDate} - {summaryDateRange.endDate}
                  </div>
                )}
              </div>

              {/* Step 3: View Data */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-sm font-medium text-gray-700">Xem dữ liệu:</span>
                </div>
                <Button
                  onClick={loadSummary}
                  size="sm"
                  disabled={summaryLoading || !summaryDateRange.startDate || !summaryDateRange.endDate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FontAwesomeIcon icon={faSyncAlt} className={`mr-1 ${summaryLoading ? 'animate-spin' : ''}`} />
                  {summaryLoading ? 'Đang tải...' : 'Xem thống kê'}
                </Button>
              </div>
            </div>

            {/* Summary Results */}
            {summaryLoading ? (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-lg p-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : summaryError ? (
              <div className="mt-6 text-center py-8 bg-red-50 rounded-lg border border-red-200">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mb-2 text-red-500" />
                <p className="text-red-600 font-medium">{summaryError}</p>
                <Button
                  onClick={loadSummary}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  Thử lại
                </Button>
              </div>
            ) : summaryData && summaryData.length > 0 ? (
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Kết quả thống kê:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const totalShifts = summaryData.reduce((sum, item) => sum + item.total_shifts, 0);
                      const statusCounts = summaryData.reduce((acc, item) => {
                        Object.entries(item.status_breakdown).forEach(([status, count]) => {
                          acc[status] = (acc[status] || 0) + count;
                        });
                        return acc;
                      }, {} as Record<string, number>);

                      return (
                        <>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{totalShifts}</div>
                            <div className="text-xs text-blue-700">Tổng ca làm</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{statusCounts.SCHEDULED || 0}</div>
                            <div className="text-xs text-yellow-700">Đã lên lịch</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{statusCounts.COMPLETED || 0}</div>
                            <div className="text-xs text-green-700">Hoàn thành</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">{statusCounts.CANCELLED || 0}</div>
                            <div className="text-xs text-gray-700">Đã hủy</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : summaryData && summaryData.length === 0 ? (
              <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <FontAwesomeIcon icon={faChartBar} className="text-2xl mb-2 text-gray-400" />
                <p className="text-gray-500">Không có dữ liệu trong khoảng thời gian đã chọn</p>
              </div>
            ) : !summaryData ? (
              <div className="mt-6 text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
                <FontAwesomeIcon icon={faChartBar} className="text-2xl mb-2 text-blue-400" />
                <p className="text-blue-600 font-medium">Chọn nhân viên và khoảng thời gian, sau đó click "Xem thống kê"</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Calendar */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-white">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-600 text-sm" />
                </div>
                {format(currentDate, 'MMMM yyyy', { locale: vi }).charAt(0).toUpperCase() + format(currentDate, 'MMMM yyyy', { locale: vi }).slice(1).toLowerCase()}
              </CardTitle>
            </div>
          </CardHeader>

          {/* Legend - Chú thích */}
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faListAlt} className="text-purple-600 text-sm" />
              <span className="text-sm font-semibold text-gray-700">Chú thích trạng thái</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-xs font-medium text-gray-600">Đã lên lịch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-xs font-medium text-gray-600">Hoàn thành</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-500"></div>
                <span className="text-xs font-medium text-gray-600">Đã hủy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-xs font-medium text-gray-600">Nghỉ phép</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-xs font-medium text-gray-600">Vắng mặt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}></div>
                <span className="text-xs font-medium text-gray-600">Ngày lễ</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <div className="text-gray-600">Đang tải lịch làm việc...</div>
                  </div>
                </div>
              ) : (
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={viewMode}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  buttonText={{
                    today: 'Hôm nay',
                    month: 'Tháng',
                    week: 'Tuần',
                    day: 'Ngày'
                  }}
                  locale="vi"
                  events={getCalendarEvents()}
                  height="100%"
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                  slotDuration="00:30:00"
                  slotLabelInterval="01:00:00"
                  allDaySlot={false}
                  nowIndicator={true}
                  scrollTime="08:00:00"
                  slotEventOverlap={false}
                  eventOverlap={false}
                  eventDisplay="block"
                  eventMaxStack={10}
                  dayMaxEvents={3}
                  moreLinkClick="popover"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                  slotLabelContent={(arg) => {
                    const date = arg.date;
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                  }}
                  datesSet={handleDatesSet}
                  eventClick={handleEventClick}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Calendar Styles */}
        <style jsx global>{`
          .fc {
            font-family: inherit;
          }
          .fc .fc-button-primary {
            background-color: #8b5fbf;
            border-color: #8b5fbf;
            transition: all 0.2s;
          }
          .fc .fc-button-primary:hover {
            background-color: #7a4fb0;
            border-color: #7a4fb0;
          }
          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background-color: #6a3f9e;
            border-color: #6a3f9e;
          }
          .fc .fc-daygrid-day.fc-day-today {
            background-color: #faf5ff !important;
          }
          .fc .fc-daygrid-day-number {
            color: #6b7280;
            font-weight: 500;
            padding: 4px;
          }
          .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
            background-color: #8b5fbf;
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .fc-event {
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .fc-event:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
        `}</style>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} />
                Chi tiết ca làm việc
              </DialogTitle>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : selectedShift ? (
              <div className="space-y-4">
                {/* Employee Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedShift.employee?.fullName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      ID: {selectedShift.employeeId}
                    </div>
                  </div>
                </div>

                {/* Shift Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Ngày làm việc:</span>
                    <span className="text-sm text-gray-900">
                      {format(new Date(selectedShift.workDate), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Ca làm việc:</span>
                    <span className="text-sm text-gray-900">
                      {selectedShift.workShift?.shiftName || selectedShift.workShiftId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Thời gian:</span>
                    <span className="text-sm text-gray-900">
                      {formatTimeToHHMM(selectedShift.workShift?.startTime || '08:00')} - {formatTimeToHHMM(selectedShift.workShift?.endTime || '17:00')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                    <Badge
                      style={{
                        backgroundColor: getEventColor(selectedShift.status),
                        borderColor: getEventColor(selectedShift.status),
                        color: 'white',
                      }}
                    >
                      {selectedShift.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Nguồn:</span>
                    <span className="text-sm text-gray-900">
                      {selectedShift.shiftType}
                    </span>
                  </div>

                  {selectedShift.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ghi chú:</span>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-900">
                        {selectedShift.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy thông tin ca làm việc
              </div>
            )}

            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </Button>
                {canUpdate && selectedShift && (
                  <Button
                    variant="outline"
                    disabled={selectedShift.status === 'COMPLETED' || selectedShift.status === 'CANCELLED'}
                    onClick={() => {
                      setUpdateForm({
                        status: selectedShift.status,
                        notes: selectedShift.notes || '',
                      });
                      setShowUpdateModal(true);
                    }}
                    title={
                      selectedShift.status === 'COMPLETED' || selectedShift.status === 'CANCELLED'
                        ? "Không thể cập nhật ca làm đã hoàn thành/đã hủy"
                        : "Cập nhật ca làm việc"
                    }
                  >
                    Cập nhật
                  </Button>
                )}
                {canDelete && selectedShift && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Hủy ca
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPlus} />
                Tạo ca làm mới
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Employee Selection */}
              <div>
                <Label htmlFor="employee-select" className="text-sm font-medium text-gray-700">
                  Nhân viên *
                </Label>
                <select
                  id="employee-select"
                  value={createForm.employee_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, employee_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Chọn nhân viên</option>
                  {employees.map(employee => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Date */}
              <div>
                <Label htmlFor="work-date" className="text-sm font-medium text-gray-700">
                  Ngày làm việc *
                </Label>
                <input
                  id="work-date"
                  type="date"
                  value={createForm.work_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, work_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Work Shift */}
              <div>
                <Label htmlFor="work-shift-select" className="text-sm font-medium text-gray-700">
                  Mẫu ca *
                </Label>
                <select
                  id="work-shift-select"
                  value={createForm.work_shift_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, work_shift_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Chọn mẫu ca</option>
                  {workShifts.map(workShift => (
                    <option key={workShift.workShiftId} value={workShift.workShiftId}>
                      {workShift.shiftName} ({formatTimeToHHMM(workShift.startTime)} - {formatTimeToHHMM(workShift.endTime)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Ghi chú
                </Label>
                <textarea
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Nhập ghi chú (không bắt buộc)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateShift}
                disabled={!createForm.employee_id || !createForm.work_date || !createForm.work_shift_id}
              >
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} />
                Cập nhật ca làm việc
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <Label htmlFor="update-status" className="text-sm font-medium text-gray-700">
                  Trạng thái
                </Label>
                <select
                  id="update-status"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="SCHEDULED">Đã lên lịch</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                  <option value="ABSENT">Vắng mặt</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="update-notes" className="text-sm font-medium text-gray-700">
                  Ghi chú
                </Label>
                <textarea
                  id="update-notes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Nhập ghi chú cập nhật"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleUpdateShift}
                disabled={!updateForm.status}
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} />
                Hủy ca làm việc
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-red-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Xác nhận hủy ca làm việc
                </h3>
                <p className="text-gray-600">
                  Bạn có chắc chắn muốn hủy ca làm việc này không? Hành động này không thể hoàn tác.
                </p>
                {selectedShift && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                    <div className="text-sm text-gray-600">
                      <strong>Nhân viên:</strong> {selectedShift.employee?.fullName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Ngày:</strong> {format(new Date(selectedShift.workDate), 'dd/MM/yyyy', { locale: vi })}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Ca:</strong> {selectedShift.workShift?.shiftName || selectedShift.workShiftId}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteShift}
              >
                Xác nhận hủy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
