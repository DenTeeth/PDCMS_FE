'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
  RotateCcw,
  Users,
  Eye
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { EmployeeShift, ShiftStatus, ShiftSource } from '@/types/employeeShift';

// Helper function to format time to HH:mm (remove seconds)
const formatTime = (time: string | null | undefined): string => {
  if (!time) return '';
  // If time is in format HH:mm:ss, return HH:mm
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};

interface EmployeeShiftsFormData {
  workDate?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  source?: ShiftSource;
  status?: ShiftStatus;
}

export default function AdminEmployeeShiftsPage() {
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<ShiftSource | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Form data for filters
  const [formData, setFormData] = useState<EmployeeShiftsFormData>({
    workDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Load shifts
  useEffect(() => {
    loadEmployeeShifts();
  }, [currentPage, formData, statusFilter, sourceFilter]);

  const loadEmployeeShifts = async () => {
    try {
      setLoading(true);
      const params = {
        workDate: formData.workDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        employeeId: formData.employeeId,
        source: sourceFilter === 'ALL' ? undefined : sourceFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: currentPage,
        size: 20,
        sort: 'workDate,asc'
      };

      const response = await EmployeeShiftService.getEmployeeShifts(params);
      setShifts(response.content);
      setTotalPages(Math.ceil(response.totalElements / 20));
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Error loading employee shifts:', error);
    } finally {
      setLoading(false);
    }
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

  const handleDateFilter = (date: string) => {
    setDateFilter(date);
    setFormData(prev => ({
      ...prev,
      workDate: date || undefined,
      startDate: undefined,
      endDate: undefined
    }));
    setCurrentPage(0);
  };

  const handleDateRangeFilter = (startDate: string, endDate: string) => {
    setFormData(prev => ({
      ...prev,
      workDate: undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }));
    setCurrentPage(0);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: ShiftStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
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
      case 'SCHEDULED':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <RotateCcw className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'NO_SHOW':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Filter shifts based on search
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = searchTerm === '' ||
      shift.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.workShift.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <ProtectedRoute requiredBaseRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Ca Làm Việc</h1>
            <p className="text-gray-600 mt-1">
              Xem và quản lý ca làm việc của tất cả nhân viên
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={loadEmployeeShifts}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Làm mới'
              )}
            </Button>
          </div>
        </div>

        {/* Filters - Bỏ Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Bộ lọc</span>
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm nhân viên, ca làm việc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => handleDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                <Input
                  type="date"
                  onChange={(e) => {
                    const endDate = document.getElementById('endDate') as HTMLInputElement;
                    handleDateRangeFilter(e.target.value, endDate?.value || '');
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                <Input
                  id="endDate"
                  type="date"
                  onChange={(e) => {
                    const startDate = document.getElementById('startDate') as HTMLInputElement;
                    handleDateRangeFilter(startDate?.value || '', e.target.value);
                  }}
                  className="w-full"
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
                  <option value="IN_PROGRESS">Đang thực hiện</option>
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
            </div>
          </div>
        </div>

        {/* Shifts List - Bỏ Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Danh sách ca làm việc ({filteredShifts.length})</span>
            </h3>
          </div>
          <div className="p-6">
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
                  Không có ca làm việc nào phù hợp với bộ lọc đã chọn.
                </p>
              </div>
            ) : (
              <div className="space-y-4">{filteredShifts.map((shift) => (
                <div
                  key={shift.shiftId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {shift.employeeName}
                        </h3>
                        <span className="text-gray-500">-</span>
                        <span className="text-lg font-medium text-gray-700">
                          {shift.workShift.shiftName}
                        </span>
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
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
                            {formatTime(shift.workShift.startTime)} - {formatTime(shift.workShift.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-medium">ID:</span>
                          <span className="font-mono text-xs">{shift.shiftId}</span>
                        </div>

                        {shift.registrationId && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Đăng ký:</span>
                            <span className="font-mono text-xs">{shift.registrationId}</span>
                          </div>
                        )}

                        {shift.notes && (
                          <div className="md:col-span-4">
                            <span className="font-medium">Ghi chú:</span> {shift.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement view details
                          console.log('View shift details:', shift.shiftId);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Chi tiết
                      </Button>
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
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
