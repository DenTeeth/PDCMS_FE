'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { appointments } from '@/data/admin-data';
import { Appointment } from '@/types/admin';

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesDate = !filterDate || appointment.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
    };
    return icons[status as keyof typeof icons] || AlertCircle;
  };

  // Calendar functions
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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

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
    return filteredAppointments.filter(apt => apt.date === dateString);
  };

  const getAppointmentAtTimeSlot = (date: Date, time: string) => {
    const appointments = getAppointmentsForDate(date);
    return appointments.find(apt => apt.time === time);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const weekDates = getWeekDates(currentWeek);
  const timeSlots = generateTimeSlots();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <ProtectedRoute requiredBaseRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
            <p className="text-gray-600">View and manage patient appointments</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </Button>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-700">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Pending */}
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">{appointments.filter(a => a.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          {/* Confirmed */}
          <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-green-800">Confirmed</p>
                <p className="text-2xl font-bold text-green-800">{appointments.filter(a => a.status === 'confirmed').length}</p>
              </div>
            </div>
          </div>
          {/* Completed */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-blue-800">Completed</p>
                <p className="text-2xl font-bold text-blue-800">{appointments.filter(a => a.status === 'completed').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Filters and Calendar Controls */}
        <Card>
          <CardContent className="p-6">
            {/* Search and Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Tìm theo tên bệnh nhân, bác sĩ hoặc dịch vụ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Đang chờ</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
              <div className="md:w-48">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Calendar View Controls */}
            {viewMode === 'calendar' && (
              <div className="flex items-center justify-between border-t pt-4">
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

                <Button variant="outline" onClick={goToToday}>
                  Today
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        {viewMode === 'calendar' && (
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
                        className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {dayNames[index]}
                        </div>
                        <div className={`text-lg font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-700'
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
                            className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[60px] ${isToday(date) ? 'bg-blue-50/30' : ''
                              }`}
                          >
                            {appointment && (
                              <div
                                className="p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200"
                                style={{
                                  backgroundColor: appointment.status === 'completed' ? '#dbeafe' :
                                    appointment.status === 'confirmed' ? '#dcfce7' :
                                      appointment.status === 'pending' ? '#fef3c7' :
                                        appointment.status === 'cancelled' ? '#fee2e2' : '#f3f4f6'
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-xs font-semibold text-gray-900 truncate">
                                    {appointment.patientName}
                                  </h4>
                                  <span className={`${getStatusColor(appointment.status)} border text-xs px-1 py-0 rounded`}>
                                    {appointment.status}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-600 truncate mb-1">
                                  {appointment.service}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {appointment.doctorName}
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
        )}

        {/* Appointments List */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const StatusIcon = getStatusIcon(appointment.status);
              return (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <StatusIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h3>
                            <p className="text-sm text-gray-500">{appointment.service}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <span className="font-medium">Doctor:</span>
                            <span className="ml-1">{appointment.doctorName}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="font-medium">Phone:</span>
                            <span className="ml-1">{appointment.patientPhone}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium">Date:</span>
                            <span className="ml-1">{new Date(appointment.date).toLocaleDateString('en-US')}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="font-medium">Time:</span>
                            <span className="ml-1">{appointment.time}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 ml-4 flex-shrink-0">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Daily Summary Cards */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weekDates.slice(0, 4).map((date) => {
              const dayAppointments = getAppointmentsForDate(date);
              const completedCount = dayAppointments.filter(apt => apt.status === 'completed').length;
              const pendingCount = dayAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length;

              return (
                <Card key={date.toISOString()} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </h3>
                    {isToday(date) && (
                      <span className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 rounded">Today</span>
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
                        Next: {dayAppointments.find(apt => apt.status === 'pending' || apt.status === 'confirmed')?.patientName || 'None'}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Status Legend */}
        {viewMode === 'calendar' && (
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Status Legend</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {viewMode === 'list' && filteredAppointments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterDate
                  ? 'Try changing filters or search keywords'
                  : 'No appointments have been scheduled yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
