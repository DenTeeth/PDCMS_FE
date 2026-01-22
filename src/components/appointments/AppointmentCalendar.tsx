'use client';


import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarDay, faCalendarWeek, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { appointmentService } from '@/services/appointmentService';
import { holidayService } from '@/services/holidayService';
import { AppointmentSummaryDTO, CalendarEvent, APPOINTMENT_STATUS_COLORS, AppointmentFilterCriteria, resolveAppointmentStatus } from '@/types/appointment';
import { HolidayDate } from '@/types/holiday';
import { toast } from 'sonner';

interface AppointmentCalendarProps {
    onEventClick: (appointment: AppointmentSummaryDTO) => void;
    filters?: Partial<AppointmentFilterCriteria>; // Optional filters
    loading?: boolean; // Optional external loading state
    canViewAll?: boolean; // If false, remove VIEW_ALL only filters (for VIEW_APPOINTMENT_OWN)
}

export default function AppointmentCalendar({ 
    onEventClick, 
    filters,
    loading: externalLoading,
    canViewAll = true, // Default to true for backward compatibility
}: AppointmentCalendarProps) {
    const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
    const [holidays, setHolidays] = useState<HolidayDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Fetch holidays for current view
    const fetchHolidays = useCallback(async (start: Date, end: Date) => {
        try {
            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];
            const holidayDates = await holidayService.getHolidaysInRange(startDate, endDate);
            setHolidays(holidayDates || []);
        } catch (error: any) {
            console.error('Failed to fetch holidays:', error);
            setHolidays([]);
            // Don't show error toast for holidays - it's not critical
        }
    }, []);

    // Fetch appointments for current view
    const fetchAppointments = useCallback(async (start: Date, end: Date) => {
        try {
            setLoading(true);
            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];
            
            // Fetch holidays and appointments in parallel
            await Promise.all([
                fetchHolidays(start, end),
                (async () => {
                    // Build filter criteria
                    const criteria: AppointmentFilterCriteria = {
                        ...filters,
                        dateFrom: startDate,
                        dateTo: endDate,
                        page: 0,
                        size: 1000, // Get all appointments for date range
                    };


                    if (!canViewAll) {
                        // Remove any entity filters that require VIEW_APPOINTMENT_ALL
                        delete criteria.employeeCode;
                        delete criteria.patientCode;
                        delete criteria.patientName;
                        delete criteria.patientPhone;
                    }
                    
                    console.log('[AppointmentCalendar] Fetching appointments:', {
                        dateFrom: startDate,
                        dateTo: endDate,
                        canViewAll,
                        criteria,
                    });
                    
                    const response = await appointmentService.getAppointmentsPage(criteria);
                    console.log('[AppointmentCalendar] Fetched appointments:', {
                        total: response.totalElements,
                        count: response.content?.length || 0,
                    });
                    setAppointments(response.content || []);
                })(),
            ]);
        } catch (error: any) {
            console.error('Failed to fetch appointments:', error);
            setAppointments([]);

            if (error.response?.status === 500) {
                toast.info('Không có lịch hẹn nào', {
                    description: 'Dịch vụ chưa sẵn sàng',
                });
            } else {
                toast.error('Không thể tải danh sách lịch hẹn', {
                    description: error.message || 'Vui lòng thử lại sau',
                });
            }
        } finally {
            setLoading(false);
        }
    }, [filters, canViewAll, fetchHolidays]); // Dependencies: filters, canViewAll, and fetchHolidays

    // Convert appointments and holidays to calendar events
    const events: CalendarEvent[] = useMemo(() => {
        const appointmentEvents: CalendarEvent[] = appointments.map((appointment) => {
            // Use computedStatus if available, otherwise fall back to status
            const displayStatus = resolveAppointmentStatus(appointment.status, appointment.computedStatus);
            const statusColor = APPOINTMENT_STATUS_COLORS[displayStatus];
            const startDateTime = new Date(appointment.appointmentStartTime);
            const endDateTime = new Date(appointment.appointmentEndTime);
            
            // Build title: Doctor Name (primary info for distinguishing appointments)
            // Since appointment durations vary, keep display simple: Doctor + Time
            const doctorName = appointment.doctor?.fullName || 'No Doctor';
            const patientName = appointment.patient?.fullName || 'Unknown Patient';
            const serviceNames = appointment.services
                .map(s => s.serviceName)
                .join(', ');
            
            // Title format: "Dr. [Doctor Name]" - simple and clear
            const title = `Dr. ${doctorName}`;

            return {
                id: appointment.appointmentCode,
                title,
                start: startDateTime,
                end: endDateTime,
                backgroundColor: statusColor.bg,
                borderColor: statusColor.border,
                extendedProps: {
                    appointment,
                    doctorName,
                    patientName,
                    serviceNames,
                    isHoliday: false,
                },
            };
        });

        // Convert holidays to all-day events
        const holidayEvents: CalendarEvent[] = holidays.map((holiday) => {
            const holidayDate = new Date(holiday.holidayDate);
            // Set to start of day
            holidayDate.setHours(0, 0, 0, 0);
            const endDate = new Date(holidayDate);
            
            return {
                id: `holiday-${holiday.holidayDate}-${holiday.definitionId}`,
                title: holiday.holidayName || 'Ngày lễ',
                start: holidayDate,
                end: endDate,
                backgroundColor: '#fef3c7', // Light yellow/amber
                borderColor: '#f59e0b', // Amber border
                extendedProps: {
                    isHoliday: true,
                    holiday,
                    holidayName: holiday.holidayName,
                    holidayDate: holiday.holidayDate,
                    appointment: {} as AppointmentSummaryDTO, // Required by CalendarEvent interface
                },
            } as CalendarEvent;
        });

        return [...appointmentEvents, ...holidayEvents];
    }, [appointments, holidays]);

    // Handle date range change
    const handleDatesSet = (dateInfo: any) => {
        const start = new Date(dateInfo.start);
        const end = new Date(dateInfo.end);
        currentDateRangeRef.current = { start, end };
        hasInitializedRef.current = true; // Mark as initialized
        console.log('[AppointmentCalendar] handleDatesSet called:', { start, end });
        fetchAppointments(start, end);
        setCurrentDate(start);
    };

    // Handle event click
    const handleEventClick = (info: any) => {
        const appointment: AppointmentSummaryDTO = info.event.extendedProps.appointment;
        onEventClick(appointment);
    };

    // View change handlers
    const [calendarRef, setCalendarRef] = useState<FullCalendar | null>(null);
    const currentDateRangeRef = useRef<{ start: Date; end: Date } | null>(null);
    const hasInitializedRef = useRef(false);

    // Initial fetch when component mounts or calendar ref is ready
    useEffect(() => {
        if (calendarRef && !hasInitializedRef.current) {
            // Get initial date range from calendar
            const api = calendarRef.getApi();
            const view = api.view;
            if (view) {
                const start = new Date(view.activeStart);
                const end = new Date(view.activeEnd);
                currentDateRangeRef.current = { start, end };
                console.log('[AppointmentCalendar] Initial fetch triggered:', { start, end });
                fetchAppointments(start, end);
                hasInitializedRef.current = true;
            } else {
                // Fallback: if view is not ready, wait a bit and try again
                const timeout = setTimeout(() => {
                    if (calendarRef && !hasInitializedRef.current) {
                        const api = calendarRef.getApi();
                        const view = api.view;
                        if (view) {
                            const start = new Date(view.activeStart);
                            const end = new Date(view.activeEnd);
                            currentDateRangeRef.current = { start, end };
                            console.log('[AppointmentCalendar] Fallback initial fetch:', { start, end });
                            fetchAppointments(start, end);
                            hasInitializedRef.current = true;
                        }
                    }
                }, 100);
                return () => clearTimeout(timeout);
            }
        }
    }, [calendarRef, fetchAppointments]);

    // Re-fetch when filters or canViewAll change
    useEffect(() => {
        if (calendarRef && currentDateRangeRef.current) {
            // Re-fetch with current date range when filters change
            fetchAppointments(currentDateRangeRef.current.start, currentDateRangeRef.current.end);
        }
    }, [fetchAppointments, calendarRef]); // Re-fetch when fetchAppointments changes (which depends on filters and canViewAll)

    const changeView = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
        setCurrentView(view);
        if (calendarRef) {
            const api = calendarRef.getApi();
            api.changeView(view);
        }
    };

    const goToToday = () => {
        if (calendarRef) {
            const api = calendarRef.getApi();
            api.today();
            setCurrentDate(new Date());
        }
    };

    const goToPrev = () => {
        if (calendarRef) {
            const api = calendarRef.getApi();
            api.prev();
        }
    };

    const goToNext = () => {
        if (calendarRef) {
            const api = calendarRef.getApi();
            api.next();
        }
    };

    const isLoading = externalLoading !== undefined ? externalLoading : loading;

    return (
        <Card className="p-6 relative">
            {/* Calendar Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                {/* View Switcher */}
                <div className="flex gap-2">
                    <Button
                        variant={currentView === 'timeGridDay' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeView('timeGridDay')}
                    >
                        <FontAwesomeIcon icon={faCalendarDay} className="mr-2" />
                        Day
                    </Button>
                    <Button
                        variant={currentView === 'timeGridWeek' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeView('timeGridWeek')}
                    >
                        <FontAwesomeIcon icon={faCalendarWeek} className="mr-2" />
                        Week
                    </Button>
                    <Button
                        variant={currentView === 'dayGridMonth' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => changeView('dayGridMonth')}
                    >
                        <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                        Month
                    </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPrev}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNext}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
                {Object.entries(APPOINTMENT_STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color.bg, borderColor: color.border, borderWidth: 1 }}
                        />
                        <span className="text-gray-700">{color.text}</span>
                    </div>
                ))}
                {/* Holiday Legend */}
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1 }}
                    />
                    <span className="text-gray-700 font-semibold">Ngày lễ</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="appointment-calendar">
                <FullCalendar
                    ref={setCalendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false}
                    events={events}
                    eventClick={(info) => {
                        // Only handle click for appointments, not holidays
                        if (info.event.extendedProps.isHoliday) {
                            return; // Don't trigger appointment click for holidays
                        }
                        handleEventClick(info);
                    }}
                    datesSet={handleDatesSet}
                    height="auto"
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={true}
                    nowIndicator={true}
                    editable={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={3}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    eventContent={(eventInfo) => {
                        // Handle holiday events differently
                        if (eventInfo.event.extendedProps.isHoliday) {
                            const holidayName = eventInfo.event.extendedProps.holidayName || 'Ngày lễ';
                            return (
                                <div className="p-2 overflow-hidden">
                                    <div className="text-base font-bold text-black leading-tight">
                                        {holidayName}
                                    </div>
                                </div>
                            );
                        }

                        // Handle appointment events
                        const appointment = eventInfo.event.extendedProps.appointment as AppointmentSummaryDTO;
                        const doctorName = eventInfo.event.extendedProps.doctorName || 'No Doctor';
                        const patientName = eventInfo.event.extendedProps.patientName || 'Unknown Patient';
                        const serviceNames = eventInfo.event.extendedProps.serviceNames || '';
                        
                        // Format time range: "HH:mm - HH:mm"
                        const startTime = new Date(appointment.appointmentStartTime);
                        const endTime = new Date(appointment.appointmentEndTime);
                        const formatTime = (date: Date) => {
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            return `${hours}:${minutes}`;
                        };
                        const timeRange = `${formatTime(startTime)} - ${formatTime(endTime)}`;
                        
                        const displayStatus = resolveAppointmentStatus(appointment.status, appointment.computedStatus);
                        return (
                            <div 
                                className="p-1 overflow-hidden cursor-pointer"
                                title={`Doctor: ${doctorName}\nPatient: ${patientName}\nServices: ${serviceNames}\nStatus: ${displayStatus}`}
                            >
                                <div className="font-medium text-xs truncate">{timeRange}</div>
                                <div className="text-xs font-semibold truncate" title={doctorName}>
                                    Dr. {doctorName}
                                </div>
                            </div>
                        );
                    }}
                />
            </div>

            {isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* CSS for FullCalendar customization */}
            <style jsx global>{`
                .appointment-calendar .fc {
                    font-family: inherit;
                }
                .appointment-calendar .fc-event {
                    cursor: pointer;
                    border-radius: 4px;
                    padding: 2px 4px;
                }
                .appointment-calendar .fc-event:hover {
                    opacity: 0.8;
                }
                .appointment-calendar .fc-daygrid-event {
                    white-space: normal;
                }
                .appointment-calendar .fc-col-header-cell {
                    background-color: #f3f4f6;
                    font-weight: 600;
                }
                .appointment-calendar .fc-timegrid-slot {
                    height: 3rem;
                }
                /* Holiday styling */
                .appointment-calendar .fc-event[data-is-holiday="true"] {
                    background-color: #fef3c7 !important;
                    border-color: #f59e0b !important;
                    border-width: 2px !important;
                }
                .appointment-calendar .fc-event[data-is-holiday="true"] .fc-event-title {
                    color: #000000 !important;
                    font-weight: bold !important;
                    font-size: 0.875rem !important;
                }
                .appointment-calendar .fc-daygrid-day[data-holiday="true"] {
                    background-color: #fef3c7 !important;
                }
            `}</style>
        </Card>
    );
}

