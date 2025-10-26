'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { EmployeeShift, ShiftStatus, ShiftSource } from '@/types/employeeShift';

interface MyShiftsFormData {
  startDate: string;
  endDate: string;
  status: ShiftStatus | 'ALL';
}

export default function MyShiftsPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<ShiftSource | 'ALL'>('ALL');

  // Form data for date range
  const [formData, setFormData] = useState<MyShiftsFormData>({
    startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    status: 'ALL'
  });

  // Load shifts
  useEffect(() => {
    if (user?.employeeId) {
      loadMyShifts();
    }
  }, [user, currentPage, formData.startDate, formData.endDate, statusFilter]);

  const loadMyShifts = async () => {
    try {
      setLoading(true);
      
      const params = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: currentPage,
        size: 20
      };

      const response = await EmployeeShiftService.getMyShifts(params);
      
      setShifts(response.content || []);
      setTotalPages(Math.ceil((response.totalElements || 0) / 20));
      setTotalElements(response.totalElements || 0);
    } catch (error: any) {
      console.error('Error loading my shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    setFormData({
      ...formData,
      startDate: format(startOfWeek(newWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(newWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    });
    setCurrentPage(0);
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    setFormData({
      ...formData,
      startDate: format(startOfWeek(newWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(newWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    });
    setCurrentPage(0);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    setCurrentWeek(today);
    setFormData({
      ...formData,
      startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    });
    setCurrentPage(0);
  };

  // Filter handlers
  const handleStatusFilter = (status: ShiftStatus | 'ALL') => {
    setStatusFilter(status);
    setCurrentPage(0);
  };

  const handleSourceFilter = (source: ShiftSource | 'ALL') => {
    setSourceFilter(source);
    setCurrentPage(0);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case ShiftStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ShiftStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case ShiftStatus.NO_SHOW:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get source badge color
  const getSourceBadgeColor = (source: ShiftSource) => {
    switch (source) {
      case 'BATCH_JOB':
        return 'bg-purple-100 text-purple-800';
      case 'REGISTRATION_JOB':
        return 'bg-blue-100 text-blue-800';
      case 'MANUAL':
        return 'bg-orange-100 text-orange-800';
      case 'OVERTIME':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.SCHEDULED:
        return <Clock className="h-4 w-4" />;
      case ShiftStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case ShiftStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      case ShiftStatus.NO_SHOW:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Filter shifts based on search and filters
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = searchTerm === '' || 
      shift.workShift.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === 'ALL' || shift.source === sourceFilter;
    
    return matchesSearch && matchesSource;
  });

  return (
    <ProtectedRoute requiredBaseRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ca Làm Việc Của Tôi</h1>
            <p className="text-gray-600 mt-1">
              Xem lịch ca làm việc từ {format(parseISO(formData.startDate), 'dd/MM/yyyy', { locale: vi })} đến {format(parseISO(formData.endDate), 'dd/MM/yyyy', { locale: vi })}
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Bộ lọc</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm ca làm việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value as ShiftStatus | 'ALL')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="SCHEDULED">Đã lên lịch</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                  <option value="NO_SHOW">Vắng mặt</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nguồn</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => handleSourceFilter(e.target.value as ShiftSource | 'ALL')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="BATCH_JOB">Tự động (Full-time)</option>
                  <option value="REGISTRATION_JOB">Đăng ký (Part-time)</option>
                  <option value="MANUAL">Thủ công</option>
                  <option value="OVERTIME">Tăng ca</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <Button
                  onClick={loadMyShifts}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Làm mới'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shifts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Danh sách ca làm việc ({filteredShifts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : filteredShifts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có ca làm việc</h3>
                <p className="text-gray-600">
                  Không có ca làm việc nào trong khoảng thời gian đã chọn.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredShifts.map((shift) => (
                  <div
                    key={shift.shiftId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {shift.workShift.shiftName}
                          </h3>
                          <Badge className={getStatusBadgeColor(shift.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(shift.status)}
                              <span>{shift.status}</span>
                            </div>
                          </Badge>
                          <Badge className={getSourceBadgeColor(shift.source)}>
                            {shift.source}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(parseISO(shift.workDate), 'dd/MM/yyyy', { locale: vi })} 
                              ({format(parseISO(shift.workDate), 'EEEE', { locale: vi })})
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {shift.workShift.startTime} - {shift.workShift.endTime}
                            </span>
                          </div>
                          
                          {shift.notes && (
                            <div className="md:col-span-3">
                              <span className="font-medium">Ghi chú:</span> {shift.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Hiển thị {currentPage * 20 + 1} - {Math.min((currentPage + 1) * 20, totalElements)} trong {totalElements} ca làm việc
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1 || loading}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
