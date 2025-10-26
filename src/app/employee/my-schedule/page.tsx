'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Info
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';
import { ShiftRegistration, DayOfWeek } from '@/types/shiftRegistration';
import { workShiftService } from '@/services/workShiftService';
import { WorkShift } from '@/types/workShift';

interface ScheduleItem {
  date: string;
  dayOfWeek: string;
  workShift: WorkShift;
  registration: ShiftRegistration;
  isActive: boolean;
}

export default function MySchedulePage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Load data
  useEffect(() => {
    if (user?.employeeId) {
      loadData();
    }
  }, [user, currentWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyRegistrations(),
        fetchWorkShifts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const response = await shiftRegistrationService.getMyRegistrations({
        page: 0,
        size: 100
      });
      setRegistrations(response.content || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchWorkShifts = async () => {
    try {
      const shifts = await workShiftService.getAll();
      setWorkShifts(shifts || []);
    } catch (error) {
      console.error('Error fetching work shifts:', error);
    }
  };

  // Generate schedule items for current week
  useEffect(() => {
    if (registrations.length > 0 && workShifts.length > 0) {
      generateScheduleItems();
    }
  }, [registrations, workShifts, currentWeek]);

  const generateScheduleItems = () => {
    const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const items: ScheduleItem[] = [];

    // Generate dates for the week
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayOfWeek = format(d, 'EEEE').toUpperCase() as DayOfWeek;

      // Find active registrations for this day
      const activeRegistrations = registrations.filter(reg => 
        reg.active && 
        reg.daysOfWeek.includes(dayOfWeek) &&
        isWithinInterval(d, {
          start: parseISO(reg.effectiveFrom),
          end: reg.effectiveTo ? parseISO(reg.effectiveTo) : new Date('2099-12-31')
        })
      );

      // Create schedule items for each registration
      activeRegistrations.forEach(reg => {
        const workShift = workShifts.find(ws => ws.workShiftId === reg.slotId);
        if (workShift) {
          items.push({
            date: dateStr,
            dayOfWeek,
            workShift,
            registration: reg,
            isActive: reg.active
          });
        }
      });
    }

    setScheduleItems(items);
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Get day name in Vietnamese
  const getDayName = (dayOfWeek: string) => {
    const dayMap: Record<string, string> = {
      'MONDAY': 'Thứ 2',
      'TUESDAY': 'Thứ 3',
      'WEDNESDAY': 'Thứ 4',
      'THURSDAY': 'Thứ 5',
      'FRIDAY': 'Thứ 6',
      'SATURDAY': 'Thứ 7',
      'SUNDAY': 'Chủ nhật'
    };
    return dayMap[dayOfWeek] || dayOfWeek;
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // Group schedule items by date
  const groupedSchedule = scheduleItems.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  return (
    <ProtectedRoute requiredBaseRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch Làm Việc Của Tôi</h1>
            <p className="text-gray-600 mt-1">
              Lịch ca làm việc dựa trên đăng ký từ {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM/yyyy', { locale: vi })} đến {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              disabled={loading}
            >
              Hôm nay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Thông tin lịch làm việc</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Lịch này được tạo dựa trên các đăng ký ca làm việc của bạn. 
                  Nếu bạn chưa thấy lịch, hãy đăng ký ca làm việc trước.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <span>Lịch làm việc tuần này</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : scheduleItems.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch làm việc</h3>
                <p className="text-gray-600 mb-4">
                  Bạn chưa có đăng ký ca làm việc nào cho tuần này.
                </p>
                <Button
                  onClick={() => window.location.href = '/employee/part_time_management'}
                  variant="outline"
                >
                  Đăng ký ca làm việc
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSchedule).map(([date, items]) => (
                  <div
                    key={date}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {format(parseISO(date), 'dd/MM/yyyy', { locale: vi })}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getDayName(items[0].dayOfWeek)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {items.length} ca làm việc
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div
                          key={`${item.date}-${index}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {item.workShift.shiftName}
                              </h4>
                              <Badge className={getStatusBadgeColor(item.isActive)}>
                                <div className="flex items-center space-x-1">
                                  {item.isActive ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                  <span>{item.isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {item.workShift.startTime} - {item.workShift.endTime}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <span>Đăng ký:</span>
                                <span className="font-mono text-xs">{item.registration.registrationId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Summary */}
        {registrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Tóm tắt đăng ký</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrations.map((reg) => {
                  const workShift = workShifts.find(ws => ws.workShiftId === reg.slotId);
                  return (
                    <div
                      key={reg.registrationId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {workShift?.shiftName || 'Ca không xác định'}
                        </h4>
                        <Badge className={getStatusBadgeColor(reg.active)}>
                          {reg.active ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Ngày:</span> {reg.daysOfWeek.map(day => getDayName(day)).join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Từ:</span> {format(parseISO(reg.effectiveFrom), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                        {reg.effectiveTo && (
                          <div>
                            <span className="font-medium">Đến:</span> {format(parseISO(reg.effectiveTo), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                        )}
                        {workShift && (
                          <div>
                            <span className="font-medium">Giờ:</span> {workShift.startTime} - {workShift.endTime}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
