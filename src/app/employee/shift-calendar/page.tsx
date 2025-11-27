'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faCalendarAlt, faUser, faPlus, faChartBar, faClock, faUserCheck, faUserTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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
import { EmployeeShift, ShiftStatus, ShiftSummaryResponse } from '@/types/employeeShift';
import { WorkShift as WorkShiftTemplate } from '@/types/workShift';
import { Employee } from '@/types/employee';
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

  // Permissions
  const canViewAll = user?.permissions?.includes('VIEW_SHIFTS_ALL') || false;
  const canViewOwn = user?.permissions?.includes('VIEW_SHIFTS_OWN') || false;
  const canCreate = user?.permissions?.includes('CREATE_SHIFTS') || false;
  const canUpdate = user?.permissions?.includes('UPDATE_SHIFTS') || false;
  const canDelete = user?.permissions?.includes('DELETE_SHIFTS') || false;
  const canViewSummary = user?.permissions?.includes('VIEW_SHIFTS_SUMMARY') || false;

  // Manager có thể xem tất cả nếu có quyền VIEW_SHIFTS_ALL hoặc là manager
  const isManager = user?.roles?.includes('ROLE_MANAGER') || false;
  const canViewShifts = canViewAll || canViewOwn || isManager;

  // Debug permissions
  console.log('User permissions:', user?.permissions);
  console.log('User roles:', user?.roles);
  console.log('Can view all:', canViewAll);
  console.log('Can view own:', canViewOwn);
  console.log('Is manager:', isManager);
  console.log('Can view shifts:', canViewShifts);

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
  const handleDatesSet = (dateInfo: any) => {
    console.log('Dates set:', dateInfo);
    const newDate = new Date(dateInfo.start);

    // Update currentDate to keep title in sync with calendar
    setCurrentDate(prevDate => {
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();
      const newMonth = newDate.getMonth();
      const newYear = newDate.getFullYear();

      // Only update if month/year actually changed to avoid unnecessary re-renders
      if (prevMonth !== newMonth || prevYear !== newYear) {
        console.log('Month/Year changed from', prevMonth + 1, prevYear, 'to', newMonth + 1, newYear);
        return newDate;
      }

      return prevDate;
    });
  };


  const loadData = async () => {
    try {
      setLoading(true);

      // Load work shifts
      const workShiftsData = await workShiftService.getAll();
      setWorkShifts(workShiftsData);

      // Load employees if can view all or is manager
      if (canViewAll || isManager) {
        try {
          const employeeService = new EmployeeService();
          const employeesResponse = await employeeService.getEmployees({});
          setEmployees(employeesResponse.content || []);
        } catch (error: any) {
          console.warn('Cannot load employees list:', error.message);
          // Nếu không load được employees, vẫn tiếp tục với shifts
          setEmployees([]);
        }
      }

      // Load shifts
      await loadShifts();
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const shiftsData = await EmployeeShiftService.getShifts({
        start_date: startDate,
        end_date: endDate,
        employee_id: selectedEmployee || undefined,
      });

      setShifts(shiftsData);
    } catch (error: any) {
      console.error('Error loading shifts:', error);
      handleError(error);
    }
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

      console.log('Loading summary with params:', {
        start_date: summaryDateRange.startDate,
        end_date: summaryDateRange.endDate,
        employee_id: selectedEmployee || undefined,
      });

      const summaryData = await EmployeeShiftService.getShiftSummary({
        start_date: summaryDateRange.startDate,
        end_date: summaryDateRange.endDate,
        ...(selectedEmployee && { employee_id: selectedEmployee }),
      });

      console.log('Summary data received:', summaryData);
      setSummaryData(summaryData);
    } catch (error: any) {
      console.error('Error loading summary:', error);
      setSummaryError('Không thể tải dữ liệu thống kê');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Convert shifts to calendar events
  const getCalendarEvents = () => {
    return shifts.map(shift => {
      const workShift = workShifts.find(ws => ws.workShiftId === shift.workShiftId);
      const employee = employees.find(emp => emp.employeeId === String(shift.employeeId));

      const employeeName = employee?.fullName || 'N/A';
      const shiftName = workShift?.shiftName || shift.workShiftId;

      const start = `${shift.workDate}T${workShift?.startTime || '08:00:00'}`;
      const end = `${shift.workDate}T${workShift?.endTime || '17:00:00'}`;

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
      console.log('Creating shift:', createForm);

      const shiftData = {
        employee_id: parseInt(createForm.employee_id),
        work_date: createForm.work_date,
        work_shift_id: createForm.work_shift_id,
        notes: createForm.notes || undefined,
      };

      await EmployeeShiftService.createShift(shiftData);

      // Reset form
      setCreateForm({
        employee_id: '',
        work_date: '',
        work_shift_id: '',
        notes: '',
      });

      // Close modal
      setShowCreateModal(false);

      // Reload shifts
      await loadShifts();

      // Show success message
      console.log('✅ Shift created successfully');
      toast.success("Tạo ca làm việc thành công!");

    } catch (error: any) {
      console.error('Error creating shift:', error);
      handleCreateError(error);
    }
  };

  // Handle create shift errors
  const handleCreateError = (error: any) => {
    const errorCode = error.response?.data?.error;
    const errorMessage = error.response?.data?.message;

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
      console.log('Updating shift:', selectedShift.employeeShiftId, updateForm);

      const updateData = {
        status: updateForm.status || undefined,
        notes: updateForm.notes || undefined,
      };

      await EmployeeShiftService.updateShift(selectedShift.employeeShiftId, updateData);

      // Reset form
      setUpdateForm({
        status: '',
        notes: '',
      });

      // Close modals
      setShowUpdateModal(false);
      setShowDetailModal(false);

      // Reload shifts
      await loadShifts();

      // Show success message
      console.log('✅ Shift updated successfully');
      toast.success("Cập nhật ca làm việc thành công!");

    } catch (error: any) {
      console.error('Error updating shift:', error);
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
      console.log('Deleting shift:', selectedShift.employeeShiftId);

      await EmployeeShiftService.deleteShift(selectedShift.employeeShiftId);

      // Close modals
      setShowDeleteModal(false);
      setShowDetailModal(false);

      // Reload shifts
      await loadShifts();

      // Show success message
      console.log('✅ Shift deleted successfully');
      toast.success("Hủy ca làm việc thành công!");

    } catch (error: any) {
      console.error('Error deleting shift:', error);
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
      requiredPermissions={['VIEW_SHIFTS_OWN', 'VIEW_SHIFTS_ALL']}
      requireAll={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch Ca Làm Việc</h1>
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
                <h3 className="text-lg font-semibold text-gray-900">Thống kê Ca Làm Việc</h3>
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarAlt} />
                {format(currentDate, 'MMMM yyyy', { locale: vi })}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                  slotLabelContent={(arg) => {
                    // Format as HH:mm (24h format without "giờ")
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


        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Chú thích</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-600">Đã lên lịch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">Hoàn thành</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span className="text-sm text-gray-600">Đã hủy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Nghỉ phép</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-gray-600">Vắng mặt</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Ghi chú
                </Label>
                <textarea
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              <div>
                <Label htmlFor="update-notes" className="text-sm font-medium text-gray-700">
                  Ghi chú
                </Label>
                <textarea
                  id="update-notes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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