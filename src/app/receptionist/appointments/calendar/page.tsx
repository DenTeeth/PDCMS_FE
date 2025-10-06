'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Users,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { appointments } from '@/data/receptionist-data';

export default function AppointmentCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Generate time slots (8 AM to 6 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const weekDates = getWeekDates(currentWeek);
  const timeSlots = generateTimeSlots();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateString);
  };

  const getAppointmentAtTimeSlot = (date: Date, time: string) => {
    const appointments = getAppointmentsForDate(date);
    return appointments.find(apt => apt.time === time);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointment Calendar</h1>
          <p className="text-gray-600 mt-2">
            Manage appointments in calendar view
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-lg font-semibold text-gray-900">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </Card>

      {/* Schedule Grid */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row - Days of Week */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
              <div className="p-4 text-sm font-medium text-gray-600 border-r border-gray-200">
                Time
              </div>
              {weekDates.map((date, index) => {
                const appointmentCount = getAppointmentsForDate(date).length;
                return (
                  <div
                    key={date.toISOString()}
                    className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                      isToday(date) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {dayNames[index]}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday(date) ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {formatDate(date)}
                    </div>
                    {appointmentCount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time Slots Grid */}
            <div className="max-h-[600px] overflow-y-auto">
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-25">
                  {/* Time Column */}
                  <div className="p-3 text-sm text-gray-600 border-r border-gray-200 bg-gray-50 font-medium">
                    {formatTime(timeSlot)}
                  </div>
                  
                  {/* Day Columns */}
                  {weekDates.map((date) => {
                    const appointment = getAppointmentAtTimeSlot(date, timeSlot);
                    return (
                      <div
                        key={`${date.toISOString()}-${timeSlot}`}
                        className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[60px] ${
                          isToday(date) ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {appointment && (
                          <div 
                            className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${
                              appointment.duration > 30 ? 'row-span-2' : ''
                            }`}
                            style={{
                              backgroundColor: appointment.status === 'completed' ? '#f3f4f6' : 
                                             appointment.status === 'confirmed' ? '#dcfce7' : 
                                             appointment.status === 'scheduled' ? '#dbeafe' : 
                                             appointment.status === 'cancelled' ? '#fee2e2' : '#fef3c7'
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-semibold text-gray-900 truncate">
                                {appointment.patientName}
                              </h4>
                              <Badge className={`${getStatusColor(appointment.status)} border text-xs px-1 py-0`}>
                                {appointment.status}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-600 truncate mb-1">
                              {appointment.service}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {appointment.duration}m
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                Room 101
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="flex items-center text-xs text-gray-500">
                                <Phone className="h-3 w-3 mr-1" />
                                {appointment.patientPhone}
                              </span>
                              <Button variant="outline" size="sm" className="h-5 px-2 text-xs">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {weekDates.slice(0, 4).map((date) => {
          const dayAppointments = getAppointmentsForDate(date);
          const completedCount = dayAppointments.filter(apt => apt.status === 'completed').length;
          const pendingCount = dayAppointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length;
          
          return (
            <Card key={date.toISOString()} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </h3>
                {isToday(date) && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Today</Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{dayAppointments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    Completed:
                  </span>
                  <span className="font-medium text-green-600">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-blue-600" />
                    Pending:
                  </span>
                  <span className="font-medium text-blue-600">{pendingCount}</span>
                </div>
              </div>
              
              {dayAppointments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Next: {dayAppointments.find(apt => apt.status === 'scheduled' || apt.status === 'confirmed')?.patientName || 'None'}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Status Legend</h3>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
