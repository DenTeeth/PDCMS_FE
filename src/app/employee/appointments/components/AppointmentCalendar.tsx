'use client';

import { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarDay, faCalendarWeek, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, CalendarEvent, APPOINTMENT_STATUS_COLORS } from '@/types/appointment';
import { toast } from 'sonner';

interface AppointmentCalendarProps {
    onEventClick: (appointment: Appointment) => void;
}

export default function AppointmentCalendar({ onEventClick }: AppointmentCalendarProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Fetch appointments for current view
    const fetchAppointments = async (start: Date, end: Date) => {
        try {
            setLoading(true);
            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];
            const data = await appointmentService.getAppointmentsByDateRange(startDate, endDate);
            setAppointments(data || []); // Fallback to empty array
        } catch (error: any) {
            console.error('Failed to fetch appointments:', error);
            setAppointments([]); // Set empty array on error

            // Only show toast for non-500 errors or show friendlier message
            if (error.response?.status === 500) {
                toast.info('No appointments available', {
                    description: 'Backend service is not ready yet',
                });
            } else {
                toast.error('Failed to load appointments', {
                    description: error.message || 'Please try again later',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Convert appointments to calendar events
    const events: CalendarEvent[] = useMemo(() => {
        return appointments.map((appointment) => {
            const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
            const startDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
            const endDateTime = new Date(`${appointment.appointmentDate}T${appointment.endTime}`);

            return {
                id: appointment.id.toString(),
                title: `${appointment.patientName} - ${appointment.serviceName}`,
                start: startDateTime,
                end: endDateTime,
                backgroundColor: statusColor.bg,
                borderColor: statusColor.border,
                extendedProps: {
                    appointment,
                },
            };
        });
    }, [appointments]);

    // Handle date range change
    const handleDatesSet = (dateInfo: any) => {
        fetchAppointments(dateInfo.start, dateInfo.end);
        setCurrentDate(dateInfo.start);
    };

    // Handle event click
    const handleEventClick = (info: any) => {
        const appointment = info.event.extendedProps.appointment;
        onEventClick(appointment);
    };

    // View change handlers
    const [calendarRef, setCalendarRef] = useState<FullCalendar | null>(null);

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

    return (
        <Card className="p-6">
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
            </div>

            {/* Calendar */}
            <div className="appointment-calendar">
                <FullCalendar
                    ref={setCalendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false} // We use custom header
                    events={events}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    height="auto"
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
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
                    eventContent={(eventInfo) => (
                        <div className="p-1 overflow-hidden">
                            <div className="font-medium text-xs truncate">{eventInfo.timeText}</div>
                            <div className="text-xs truncate">{eventInfo.event.title}</div>
                        </div>
                    )}
                />
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
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
      `}</style>
        </Card>
    );
}
