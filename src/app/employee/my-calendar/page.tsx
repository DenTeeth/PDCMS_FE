'use client';

/**
 * Employee My Calendar Page
 * Combines Shift Calendar (ca làm việc) and Appointment Calendar (lịch hẹn)
 * 
 * Features:
 * - Display shifts as background (opacity ~0.3, dashed border)
 * - Display appointments as overlay (opacity 1.0, solid border)
 * - Click shift → shift detail modal
 * - Click appointment → appointment detail page
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarDay, faCalendarWeek, faCalendar, faClock, faUser } from '@fortawesome/free-solid-svg-icons';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { appointmentService } from '@/services/appointmentService';
import { employeeService } from '@/services/employeeService';
import { holidayService } from '@/services/holidayService';
import { EmployeeShift, ShiftStatus } from '@/types/employeeShift';
import { AppointmentSummaryDTO, APPOINTMENT_STATUS_COLORS } from '@/types/appointment';
import { Employee } from '@/types/employee';
import { HolidayDate } from '@/types/holiday';
import { getEmployeeIdFromToken } from '@/lib/utils';
import { vi } from 'date-fns/locale';

export default function MyCalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [holidays, setHolidays] = useState<HolidayDate[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  // Modal states
  const [showShiftDetailModal, setShowShiftDetailModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null);
  const [shiftDetailLoading, setShiftDetailLoading] = useState(false);

  // Permissions - Updated to match BE naming
  const canViewShifts = user?.permissions?.includes('VIEW_SCHEDULE_OWN') || user?.permissions?.includes('VIEW_SCHEDULE_ALL') || false;
  const canViewAppointments = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canViewAll = user?.permissions?.includes('VIEW_SCHEDULE_ALL') || false;

  // Get current user's employee ID
  const currentEmployeeId = useMemo(() => {
    if (user?.employeeId !== undefined && user?.employeeId !== null) {
      const idStr = String(user.employeeId).trim();
      if (idStr && idStr !== 'undefined' && idStr !== 'null') {
        const idNum = parseInt(idStr, 10);
        if (!isNaN(idNum) && idNum > 0 && isFinite(idNum)) {
          return idNum;
        }
      }
    }

    if (user?.token) {
      try {
        const employeeIdStr = getEmployeeIdFromToken(user.token);
        if (employeeIdStr && employeeIdStr !== 'undefined' && employeeIdStr !== 'null') {
          const idStr = String(employeeIdStr).trim();
          if (idStr) {
            const idNum = parseInt(idStr, 10);
            if (!isNaN(idNum) && idNum > 0 && isFinite(idNum)) {
              return idNum;
            }
          }
        }
      } catch (error) {
        console.error('Error extracting employeeId from token:', error);
      }
    }

    return null;
  }, [user?.employeeId, user?.token]);

  // Request cancellation refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Load employee info to get employeeCode
  useEffect(() => {
    if (!currentEmployeeId) return;

    const loadEmployeeInfo = async () => {
      try {
        // Search employee list to find employee by employeeId
        // This is needed to get employeeCode for filtering appointments
        const response = await employeeService.getEmployees({
          page: 0,
          size: 100, // Get enough to find current employee
        });

        const foundEmployee = response.content?.find(
          (emp) => emp.employeeId === String(currentEmployeeId)
        );

        if (foundEmployee) {
          setEmployeeInfo(foundEmployee);
        }
      } catch (error) {
        console.error('Error loading employee info:', error);
        // Continue without employeeCode - will use fallback filter
      }
    };

    loadEmployeeInfo();
  }, [currentEmployeeId]);

  // Load shifts and appointments
  const loadData = useCallback(async (start: Date, end: Date) => {
    // For VIEW_SCHEDULE_OWN, we don't need currentEmployeeId - BE auto-filters by JWT token
    // Only need currentEmployeeId for appointments or if we have VIEW_SCHEDULE_ALL
    if (!canViewShifts && !canViewAppointments) {
      setLoading(false);
      return;
    }
    if (canViewAppointments && !currentEmployeeId) {
      // Need employeeId for appointments, but can still load shifts
      if (!canViewShifts) {
        setLoading(false);
        return;
      }
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isMounted = true;

    try {
      setLoading(true);

      // Get current employeeCode from state (use closure to avoid dependency)
      const currentEmployeeCode = employeeInfo?.employeeCode;

      // Load shifts and appointments in parallel
      const [shiftsData, appointmentsData] = await Promise.all([
        canViewShifts
          ? EmployeeShiftService.getShifts({
            start_date: format(start, 'yyyy-MM-dd'),
            end_date: format(end, 'yyyy-MM-dd'),
            // BE logic (EmployeeShiftController line 96-106):
            // - If VIEW_SCHEDULE_OWN: Do NOT pass employee_id, BE auto-filters by JWT token
            // - If VIEW_SCHEDULE_ALL: Can pass employee_id to view other employees
            ...(canViewAll && currentEmployeeId ? { employee_id: currentEmployeeId } : {}),
          }).catch((error) => {
            if (error.name === 'AbortError' || abortController.signal.aborted) {
              return [];
            }
            console.error('Error loading shifts:', error);
            return [];
          })
          : Promise.resolve([]),
        canViewAppointments
          ? (async () => {
            try {
              // If employeeCode is available, use it
              if (currentEmployeeCode) {
                const response = await appointmentService.getAppointmentsPage({
                  dateFrom: format(start, 'yyyy-MM-dd'),
                  dateTo: format(end, 'yyyy-MM-dd'),
                  employeeCode: currentEmployeeCode,
                  page: 0,
                  size: 1000,
                });
                return response.content || [];
              } else {
                // Fallback: fetch all appointments and filter by employeeId
                // This is not ideal, but works if backend filters by participant
                const response = await appointmentService.getAppointmentsPage({
                  dateFrom: format(start, 'yyyy-MM-dd'),
                  dateTo: format(end, 'yyyy-MM-dd'),
                  page: 0,
                  size: 1000,
                });

                // Filter appointments where current employee is doctor or participant
                // This is a workaround - ideally backend should filter by employeeCode
                return (response.content || []).filter((apt) => {
                  // Check if employee is doctor (primary employee)
                  const empCode = currentEmployeeCode || String(currentEmployeeId);
                  // Check if employee is doctor (primary employee)
                  const isDoctor = apt.doctor?.employeeCode === empCode;
                  // Check if employee is participant
                  const isParticipant = apt.participants?.some(
                    (p) => p.employeeCode === empCode
                  );
                  return isDoctor || isParticipant;
                });
              }
            } catch (error: any) {
              if (error.name === 'AbortError' || abortController.signal.aborted) {
                return [];
              }
              console.error('Error loading appointments:', error);
              return [];
            }
          })()
          : Promise.resolve([]),
      ]);

      // Check if request was cancelled or component unmounted
      if (abortController.signal.aborted || !isMounted) {
        return;
      }

      setShifts(shiftsData);
      setAppointments(appointmentsData);
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
        return;
      }
      console.error('Error loading data:', error);
      handleErrorRef.current(error);
    } finally {
      // Always update loading state if component is still mounted and request wasn't cancelled
      if (isMounted && !abortController.signal.aborted) {
        setLoading(false);
      }
      // Clear abort controller reference
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [currentEmployeeId, canViewShifts, canViewAppointments, employeeInfo?.employeeCode, canViewAll]);

  // Load initial data when component mounts and employeeInfo is ready
  useEffect(() => {
    // For VIEW_SCHEDULE_OWN, we can load shifts without currentEmployeeId (BE auto-filters by JWT)
    // Only need currentEmployeeId for appointments or if we have VIEW_SCHEDULE_ALL
    if (!canViewShifts && !canViewAppointments) return;
    
    // Load holidays for current month
    const loadInitialHolidays = async () => {
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');
        const holidayDates = await holidayService.getHolidaysInRange(startDateStr, endDateStr);
        setHolidays(holidayDates || []);
        console.log(' Initial holidays loaded:', holidayDates?.length || 0);
      } catch (error: any) {
        console.error('Failed to fetch initial holidays:', error);
        setHolidays([]);
      }
    };
    
    loadInitialHolidays();
    
    // If viewing appointments, need currentEmployeeId and employeeCode
    // But we can still load shifts even if employeeInfo is not ready yet
    if (canViewAppointments) {
      if (!currentEmployeeId || !employeeInfo?.employeeCode) {
        // Wait for employeeInfo to load before loading appointments
        // But if we can view shifts, load them now
        if (canViewShifts) {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          loadData(start, end);
        }
        return;
      }
    }

    // Load data for current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    loadData(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployeeId, canViewShifts, canViewAppointments, employeeInfo?.employeeCode]);

  // Handle FullCalendar dates change
  const handleDatesSet = useCallback(async (dateInfo: any) => {
    const start = new Date(dateInfo.start);
    const end = new Date(dateInfo.end);
    
    // Load holidays for the visible date range
    try {
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      const holidayDates = await holidayService.getHolidaysInRange(startDateStr, endDateStr);
      setHolidays(holidayDates || []);
      console.log(' Holidays loaded:', holidayDates?.length || 0);
    } catch (error: any) {
      console.error('Failed to fetch holidays:', error);
      // Don't show error - holidays are not critical
      setHolidays([]);
    }
    
    loadData(start, end);
  }, [loadData]);

  // Get shift color by status
  const getShiftColor = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.SCHEDULED:
        return { bg: '#3b82f6', border: '#3b82f6', text: '#ffffff' };
      case ShiftStatus.COMPLETED:
        return { bg: '#10b981', border: '#10b981', text: '#ffffff' };
      case ShiftStatus.CANCELLED:
        return { bg: '#6b7280', border: '#6b7280', text: '#ffffff' };
      case ShiftStatus.ON_LEAVE:
        return { bg: '#f59e0b', border: '#f59e0b', text: '#ffffff' };
      case ShiftStatus.ABSENT:
        return { bg: '#ef4444', border: '#ef4444', text: '#ffffff' };
      default:
        return { bg: '#9ca3af', border: '#9ca3af', text: '#ffffff' };
    }
  };

  // Convert shifts to calendar events (background style)
  const shiftEvents = useMemo(() => {
    return shifts.map((shift) => {
      const workShift = shift.workShift;
      const start = `${shift.workDate}T${workShift?.startTime || '08:00:00'}`;
      const end = `${shift.workDate}T${workShift?.endTime || '17:00:00'}`;

      const statusColor = getShiftColor(shift.status);

      return {
        id: `shift-${shift.employeeShiftId}`,
        title: workShift?.shiftName || 'Ca làm việc',
        start,
        end,
        allDay: false,
        backgroundColor: statusColor.bg,
        borderColor: statusColor.border,
        textColor: statusColor.text,
        classNames: ['shift-event'], // Custom class for styling
        extendedProps: {
          type: 'shift',
          shift,
        },
      };
    });
  }, [shifts]);

  // Convert appointments to calendar events (overlay style)
  const appointmentEvents = useMemo(() => {
    return appointments.map((appointment) => {
      const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
      const startDateTime = new Date(appointment.appointmentStartTime);
      const endDateTime = new Date(appointment.appointmentEndTime);

      const doctorName = appointment.doctor?.fullName || 'No Doctor';
      const patientName = appointment.patient?.fullName || 'Unknown Patient';

      // Format time range: "HH:mm - HH:mm"
      const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      const timeRange = `${formatTime(startDateTime)} - ${formatTime(endDateTime)}`;

      // Title: Show time range and doctor name
      const title = `${timeRange} - Dr. ${doctorName}`;

      return {
        id: appointment.appointmentCode,
        title,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: statusColor.bg,
        borderColor: statusColor.border,
        textColor: statusColor.text || '#ffffff',
        classNames: ['appointment-event'], // Custom class for styling
        extendedProps: {
          type: 'appointment',
          appointment,
          doctorName,
          patientName,
          timeRange,
        },
      };
    });
  }, [appointments]);

  // Convert holidays to calendar events (all-day background style)
  const holidayEvents = useMemo(() => {
    return holidays.map((holiday) => {
      const holidayDate = new Date(holiday.holidayDate);
      holidayDate.setHours(0, 0, 0, 0);
      
      return {
        id: `holiday-${holiday.holidayDate}-${holiday.definitionId}`,
        title: holiday.holidayName || 'Ngày lễ', // Empty title - holidays are background only
        start: holidayDate,
        allDay: true,
        backgroundColor: '#fef3c7', // Light yellow/amber
        borderColor: '#f59e0b', // Amber border
        borderWidth: 2, // Thicker border for better visibility
        textColor: '#000000', // Black text
        display: 'background', // Show as background highlight
        extendedProps: {
          type: 'holiday',
          isHoliday: true,
          holiday,
          holidayName: holiday.holidayName || 'Ngày lễ', // Store name for click handler
        },
      };
    });
  }, [holidays]);

  // Merge all events (holidays first as background, then shifts, then appointments)
  const allEvents = useMemo(() => {
    return [...holidayEvents, ...shiftEvents, ...appointmentEvents];
  }, [holidayEvents, shiftEvents, appointmentEvents]);

  // Handle event click
  const handleEventClick = useCallback(async (clickInfo: any) => {
    const eventType = clickInfo.event.extendedProps.type;

    // Check if clicked event is a holiday
    if (eventType === 'holiday' || clickInfo.event.extendedProps?.isHoliday) {
      const holiday = clickInfo.event.extendedProps.holiday as HolidayDate;
      toast.info(`${holiday.holidayName || 'Ngày lễ'} - ${format(new Date(holiday.holidayDate), 'dd/MM/yyyy', { locale: vi })}`);
      return;
    }

    if (eventType === 'shift') {
      const shift = clickInfo.event.extendedProps.shift as EmployeeShift;
      try {
        setShiftDetailLoading(true);
        const shiftDetail = await EmployeeShiftService.getShiftById(shift.employeeShiftId);
        setSelectedShift(shiftDetail);
        setShowShiftDetailModal(true);
      } catch (error: any) {
        console.error('Error loading shift detail:', error);
        handleErrorRef.current(error);
      } finally {
        setShiftDetailLoading(false);
      }
    } else if (eventType === 'appointment') {
      const appointment = clickInfo.event.extendedProps.appointment as AppointmentSummaryDTO;
      // Navigate to appointment detail page
      router.push(`/employee/booking/appointments/${appointment.appointmentCode}`);
    }
  }, [router]);

  // Navigation handlers
  const handlePrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      setCurrentDate(calendarApi.getDate());
    }
  };

  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setCurrentView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  return (
    <ProtectedRoute
      requiredBaseRole="employee"
      requiredPermissions={['VIEW_SCHEDULE_OWN', 'VIEW_APPOINTMENT_OWN']}
      requireAll={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch Của Tôi</h1>
            <p className="text-gray-600 mt-1">Xem ca làm việc và lịch hẹn của bạn</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-blue-500 bg-blue-500/30 rounded"></div>
            <span className="text-sm text-gray-700">Ca làm việc</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-solid border-green-500 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Lịch hẹn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}></div>
            <span className="text-sm text-gray-700">Ngày lễ</span>
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hôm nay
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('dayGridMonth')}
              >
                <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                Tháng
              </Button>
              <Button
                variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('timeGridWeek')}
              >
                <FontAwesomeIcon icon={faCalendarWeek} className="mr-1" />
                Tuần
              </Button>
              <Button
                variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('timeGridDay')}
              >
                <FontAwesomeIcon icon={faCalendarDay} className="mr-1" />
                Ngày
              </Button>
            </div>
          </div>
          <div className="p-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={currentView}
              initialDate={currentDate}
              events={allEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              headerToolbar={false}
              height="auto"
              locale="vi"
              firstDay={1} // Monday
              eventContent={(eventInfo) => {
                const eventType = eventInfo.event.extendedProps?.type;
                const isHoliday = eventInfo.event.extendedProps?.isHoliday;
                
                // Check if event ID starts with 'holiday-' as additional check
                const isHolidayById = eventInfo.event.id?.toString().startsWith('holiday-');

                // Holidays with display: 'background' should not show content
                // They are displayed as background highlight only
                if (isHoliday || eventType === 'holiday' || isHolidayById) {
                  return { html: '' }; // Return empty HTML to prevent any text rendering
                }

                if (eventType === 'shift') {
                  // Shift event: Show shift name
                  return (
                    <div className="p-1 overflow-hidden">
                      <div className="text-xs font-medium truncate">
                        {eventInfo.event.title}
                      </div>
                    </div>
                  );
                } else if (eventType === 'appointment') {
                  // Appointment event: Show time range and doctor name
                  const appointment = eventInfo.event.extendedProps?.appointment as AppointmentSummaryDTO;
                  const doctorName = eventInfo.event.extendedProps?.doctorName || appointment?.doctor?.fullName || 'No Doctor';
                  const timeRange = eventInfo.event.extendedProps?.timeRange || '';

                  return (
                    <div className="p-1 overflow-hidden cursor-pointer">
                      <div className="font-medium text-xs truncate">{timeRange}</div>
                      <div className="text-xs font-semibold truncate">
                        Dr. {doctorName}
                      </div>
                    </div>
                  );
                }

                // Default: Show title
                return (
                  <div className="p-1 overflow-hidden">
                    <div className="text-xs font-medium truncate">
                      {eventInfo.event.title}
                    </div>
                  </div>
                );
              }}
              className="my-calendar"
              {...({} as any)}
            />

            {/* Custom CSS for shift and appointment events */}
            <style jsx global>{`
                .my-calendar .fc-event.shift-event {
                  opacity: 0.3;
                  border-style: dashed !important;
                  border-width: 2px !important;
                  background-color: transparent !important;
                  background: repeating-linear-gradient(
                    45deg,
                    var(--fc-event-bg-color),
                    var(--fc-event-bg-color) 10px,
                    transparent 10px,
                    transparent 20px
                  );
                }
                .my-calendar .fc-event.shift-event .fc-event-title {
                  font-weight: 500;
                }
                .my-calendar .fc-event.appointment-event {
                  opacity: 1;
                  border-style: solid !important;
                  border-width: 2px !important;
                  z-index: 10;
                }
                .my-calendar .fc-event.appointment-event:hover {
                  opacity: 0.9;
                  transform: scale(1.02);
                  transition: all 0.2s;
                }
                .my-calendar .fc-timegrid-event {
                  cursor: pointer;
                }
              `}</style>
          </div>
        </Card>

        {/* Shift Detail Modal */}
        <Dialog open={showShiftDetailModal} onOpenChange={setShowShiftDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết ca làm việc</DialogTitle>
            </DialogHeader>
            {shiftDetailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedShift ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày làm việc</label>
                    <p className="text-sm font-semibold">{format(new Date(selectedShift.workDate), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ca làm việc</label>
                    <p className="text-sm font-semibold">{selectedShift.workShift?.shiftName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Thời gian</label>
                    <p className="text-sm font-semibold">
                      {selectedShift.workShift?.startTime} - {selectedShift.workShift?.endTime}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <div>
                      <Badge variant="outline" className="whitespace-nowrap">{selectedShift.status}</Badge>
                    </div>
                  </div>
                  {selectedShift.notes && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                      <p className="text-sm">{selectedShift.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShiftDetailModal(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

