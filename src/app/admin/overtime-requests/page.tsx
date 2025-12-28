'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faPlus,
  faCheck,
  faTimes,
  faBan,
  faCalendarAlt,
  faUser,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CustomSelect from '@/components/ui/custom-select';

import { OvertimeService } from '@/services/overtimeService';
import { employeeService } from '@/services/employeeService';
import { workShiftService } from '@/services/workShiftService';
import { validateOvertimeForm, showOvertimeError } from '@/utils/overtimeErrorHandler';
import { formatTimeToHHMM } from '@/lib/utils';
import {
  OvertimeRequest,
  OvertimeStatus,
  OVERTIME_STATUS_CONFIG,
  AVAILABLE_WORK_SHIFTS,
} from '@/types/overtime';
import { Employee } from '@/types/employee';
import { WorkShift } from '@/types/workShift';
import { useAuth } from '@/contexts/AuthContext';

interface OvertimeRequestFormData {
  employeeId?: number;
  workDate: string;
  workShiftId: string;
  reason: string;
}

export default function AdminOvertimeRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
  const [statusAction, setStatusAction] = useState<'approve' | 'reject' | 'cancel'>('approve');
  const [statusReason, setStatusReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formData, setFormData] = useState<OvertimeRequestFormData>({
    employeeId: undefined,
    workDate: '',
    workShiftId: '',
    reason: '',
  });

  // Load overtime requests
  useEffect(() => {
    loadOvertimeRequests();
    loadEmployees();
    loadWorkShifts();
  }, []);

  const loadOvertimeRequests = async () => {
    try {
      setLoading(true);
      const response = await OvertimeService.getOvertimeRequests({
        page: 0,
        size: 100, // Load nhiều hơn để hiển thị đầy đủ
        sort: 'createdAt,desc', // Mới nhất ở đầu
      });
      setOvertimeRequests(response.content);
    } catch (error) {
      console.error('Error loading overtime requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        page: 0,
        size: 100, // ⚡ Tăng lại lên 100 để đảm bảo load đủ nhân viên
        isActive: true,
      });
      setEmployees(response.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadWorkShifts = async () => {
    try {
      const response = await workShiftService.getAll();
      setWorkShifts(response);
    } catch (error) {
      console.error('Error loading work shifts:', error);
    }
  };

  const handleCreateOvertimeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate form data
      const validationError = validateOvertimeForm(formData);
      if (validationError) {
        alert(validationError);
        return;
      }

      // Additional validation for admin form
      if (!formData.employeeId || formData.employeeId <= 0) {
        alert('Vui lòng chọn nhân viên');
        return;
      }

      // Đảm bảo employeeId là number
      const requestData = {
        ...formData,
        employeeId: Number(formData.employeeId),
      };

      console.log(' Admin creating overtime request with data:', {
        requestData,
        employeeId: requestData.employeeId,
        employeeIdType: typeof requestData.employeeId,
        workDate: requestData.workDate,
        workShiftId: requestData.workShiftId,
        reason: requestData.reason
      });

      const response = await OvertimeService.createOvertimeRequest(requestData);

      setShowCreateForm(false);
      setFormData({
        employeeId: undefined,
        workDate: '',
        workShiftId: '',
        reason: '',
      });
      loadOvertimeRequests();
      alert(` Tạo yêu cầu làm thêm giờ thành công!\nMã yêu cầu: ${response.requestId}\nNhân viên: ${response.employee.fullName}\nTrạng thái: ${response.status}`);
    } catch (error: any) {
      console.error(' Error creating overtime request:', error);
      console.error(' Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.response?.data?.message,
        detail: error.response?.data?.detail,
        errors: error.response?.data?.errors
      });

      const status = error.response?.status;
      let errorMsg = '';

      if (status === 500) {
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          'Lỗi server khi xử lý yêu cầu. Vui lòng kiểm tra:\n' +
          '- Nhân viên có tồn tại?\n' +
          '- Ca làm việc có hợp lệ?\n' +
          '- Ngày làm việc có đúng định dạng?';
      } else if (status === 400) {
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          'Dữ liệu không hợp lệ';
      } else if (status === 409) {
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          'Đã có yêu cầu làm thêm giờ trong thời gian này';
      } else if (status === 403) {
        errorMsg = 'Không có quyền tạo yêu cầu làm thêm giờ';
      } else {
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          error.message || 'Không thể tạo yêu cầu làm thêm giờ';
      }

      alert(` Lỗi (${status || 'Unknown'}): ${errorMsg}`);
      showOvertimeError(error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    try {
      switch (statusAction) {
        case 'approve':
          await OvertimeService.approveOvertimeRequest(selectedRequest.requestId);
          break;
        case 'reject':
          await OvertimeService.rejectOvertimeRequest(selectedRequest.requestId, statusReason);
          break;
        case 'cancel':
          await OvertimeService.cancelOvertimeRequest(selectedRequest.requestId, statusReason);
          break;
      }
      setShowStatusModal(false);
      setStatusReason('');
      loadOvertimeRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openStatusModal = (request: OvertimeRequest, action: 'approve' | 'reject' | 'cancel') => {
    setSelectedRequest(request);
    setStatusAction(action);
    setStatusReason('');
    setShowStatusModal(true);
  };

  // ⚡ Memoize filtered requests - Sort by createdAt DESC (newest first)
  const filteredRequests = useMemo(() => {
    const filtered = overtimeRequests.filter((request) => {
      const matchesSearch =
        request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

      const matchesEmployee = employeeFilter === 'ALL' ||
        request.employeeId?.toString() === employeeFilter;

      const requestDate = new Date(request.workDate);
      const matchesDateFrom = !dateFrom || requestDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || requestDate <= new Date(dateTo);

      return matchesSearch && matchesStatus && matchesEmployee && matchesDateFrom && matchesDateTo;
    });

    // Sort by createdAt DESC (newest first) - client-side to ensure correct order
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.workDate).getTime();
      const dateB = new Date(b.createdAt || b.workDate).getTime();
      return dateB - dateA; // DESC: newest first
    });
  }, [overtimeRequests, searchTerm, statusFilter, employeeFilter, dateFrom, dateTo]);

  // ⚡ Memoize permission checks - Using new BE consolidated permissions
  // BE uses APPROVE_OVERTIME for both approve and reject
  const canApprove = useMemo(() => user?.permissions?.includes('APPROVE_OVERTIME'), [user?.permissions]);
  const canReject = useMemo(() => user?.permissions?.includes('APPROVE_OVERTIME'), [user?.permissions]); // Same as approve
  const canCancelPending = useMemo(() => user?.permissions?.includes('APPROVE_OVERTIME'), [user?.permissions]); // Admin can cancel
  const canCancelOwn = useMemo(() => user?.permissions?.includes('CREATE_OVERTIME'), [user?.permissions]); // User can cancel own
  const canCreate = useMemo(() => user?.permissions?.includes('CREATE_OVERTIME'), [user?.permissions]);

  // ⚡ useCallback helper function
  const canCancelRequest = useCallback((request: OvertimeRequest) => {
    if (canCancelPending) return true;
    if (canCancelOwn && request.employeeId === Number(user?.employeeId)) return true;
    return false;
  }, [canCancelPending, canCancelOwn, user?.employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu làm thêm giờ</h1>
          <p className="text-gray-600 mt-2">Quản lý và duyệt các yêu cầu làm thêm giờ của nhân viên</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Tạo yêu cầu
          </Button>
        )}
      </div>

      {/* Stats - Icon trước số */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tổng yêu cầu */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Tổng yêu cầu</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 text-xl" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{overtimeRequests.length}</p>
          </div>
        </div>

        {/* Chờ duyệt */}
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">Chờ duyệt</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faClock} className="text-yellow-700 text-xl" />
            </div>
            <p className="text-3xl font-bold text-yellow-800">
              {overtimeRequests.filter(r => r.status === OvertimeStatus.PENDING).length}
            </p>
          </div>
        </div>

        {/* Đã duyệt */}
        <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Đã duyệt</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheck} className="text-green-700 text-xl" />
            </div>
            <p className="text-3xl font-bold text-green-800">
              {overtimeRequests.filter(r => r.status === OvertimeStatus.APPROVED).length}
            </p>
          </div>
        </div>

        {/* Từ chối/Hủy */}
        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">Từ chối/Hủy</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faTimes} className="text-red-700 text-xl" />
            </div>
            <p className="text-3xl font-bold text-red-800">
              {overtimeRequests.filter(r =>
                r.status === OvertimeStatus.REJECTED || r.status === OvertimeStatus.CANCELLED
              ).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters - Bỏ Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Tìm kiếm</Label>
            <Input
              id="search"
              placeholder="Tìm theo mã yêu cầu hoặc tên nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <CustomSelect
              label="Nhân viên"
              value={employeeFilter}
              onChange={(value: string) => setEmployeeFilter(value)}
              options={[
                { value: 'ALL', label: 'Tất cả nhân viên' },
                ...employees.map((emp) => ({
                  value: emp.employeeId.toString(),
                  label: `${emp.fullName} (${emp.employeeCode})`,
                })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <CustomSelect
              label="Trạng thái"
              value={statusFilter}
              onChange={(value: string) => setStatusFilter(value as OvertimeStatus | 'ALL')}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                { value: OvertimeStatus.PENDING, label: 'Chờ duyệt' },
                { value: OvertimeStatus.APPROVED, label: 'Đã duyệt' },
                { value: OvertimeStatus.REJECTED, label: 'Từ chối' },
                { value: OvertimeStatus.CANCELLED, label: 'Đã hủy' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFrom">Từ ngày</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">Đến ngày</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Nút xóa bộ lọc */}
          <div className="space-y-2 flex flex-col justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setEmployeeFilter('ALL');
                setDateFrom('');
                setDateTo('');
              }}
              className="w-full"
            >
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Table - Bỏ Card để nhẹ máy */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu làm thêm giờ</h3>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-6 py-3 font-medium text-gray-700">Mã yêu cầu</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-700">Nhân viên</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-700">Ngày làm việc</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const statusConfig = OVERTIME_STATUS_CONFIG[request.status];
                  return (
                    <tr key={request.requestId} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{request.requestId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                          <span>{request.employeeName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                          <span>{format(new Date(request.workDate), 'dd/MM/yyyy', { locale: vi })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowViewModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Không có yêu cầu làm thêm giờ nào.</p>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-3">
              <CardTitle>Tạo yêu cầu làm thêm giờ</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateOvertimeRequest} className="space-y-4">
                <div className="space-y-1">
                  <Label>Nhân viên <span className="text-red-500">*</span></Label>
                  <CustomSelect
                    value={formData.employeeId ? formData.employeeId.toString() : ''}
                    onChange={(value: string) => setFormData({ ...formData, employeeId: parseInt(value) })}
                    options={employees.map((employee) => ({
                      value: employee.employeeId.toString(),
                      label: `${employee.fullName} (${employee.employeeCode})`,
                    }))}
                    placeholder={employees.length === 0 ? "Đang tải danh sách nhân viên..." : "Chọn nhân viên"}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="workDate">Ngày làm việc <span className="text-red-500">*</span></Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Ca làm việc <span className="text-red-500">*</span></Label>
                  <CustomSelect
                    value={formData.workShiftId}
                    onChange={(value: string) => setFormData({ ...formData, workShiftId: value })}
                    placeholder={workShifts.length === 0 ? "Đang tải danh sách ca làm việc..." : "Chọn ca làm việc"}
                    options={workShifts.map((shift) => ({
                      value: shift.workShiftId,
                      label: `${shift.shiftName} (${formatTimeToHHMM(shift.startTime)} - ${formatTimeToHHMM(shift.endTime)})`,
                    }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reason">Lý do <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Nhập lý do làm thêm giờ..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    Tạo yêu cầu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Chi tiết yêu cầu làm thêm giờ
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRequest(null);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                  <Badge className={`${OVERTIME_STATUS_CONFIG[selectedRequest.status].bgColor} ${OVERTIME_STATUS_CONFIG[selectedRequest.status].textColor}`}>
                    {OVERTIME_STATUS_CONFIG[selectedRequest.status].label}
                  </Badge>
                </div>

                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mã yêu cầu</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.requestId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nhân viên</p>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{selectedRequest.employeeName || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày làm việc</p>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedRequest.workDate), 'dd/MM/yyyy', { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ca làm việc</p>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {workShifts.find(s => s.workShiftId === selectedRequest.workShiftId)?.shiftName || selectedRequest.workShiftId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lý do</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{selectedRequest.reason || 'Không có lý do'}</p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Ngày tạo</p>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedRequest.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                  {selectedRequest.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                      <p className="text-sm text-gray-900">
                        {format(new Date(selectedRequest.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions for PENDING status */}
                {selectedRequest.status === OvertimeStatus.PENDING && (
                  <div className="flex gap-3 pt-4 border-t justify-end">
                    {canApprove && (
                      <Button
                        onClick={() => {
                          setShowViewModal(false);
                          setStatusAction('approve');
                          setShowStatusModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                        Duyệt
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        onClick={() => {
                          setShowViewModal(false);
                          setStatusAction('reject');
                          setStatusReason('');
                          setShowStatusModal(true);
                        }}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Từ chối
                      </Button>
                    )}
                    {canCancelRequest(selectedRequest) && (
                      <Button
                        onClick={() => {
                          setShowViewModal(false);
                          setStatusAction('cancel');
                          setStatusReason('');
                          setShowStatusModal(true);
                        }}
                        variant="outline"
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        <FontAwesomeIcon icon={faBan} className="mr-2" />
                        Hủy
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {statusAction === 'approve' && 'Duyệt yêu cầu'}
                {statusAction === 'reject' && 'Từ chối yêu cầu'}
                {statusAction === 'cancel' && 'Hủy yêu cầu'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Yêu cầu: <strong>{selectedRequest.requestId}</strong>
                </p>

                {(statusAction === 'reject' || statusAction === 'cancel') && (
                  <div>
                    <Label htmlFor="reason">
                      {statusAction === 'reject' ? 'Lý do từ chối' : 'Lý do hủy'} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder={`Nhập ${statusAction === 'reject' ? 'lý do từ chối' : 'lý do hủy'}...`}
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStatusModal(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={statusAction !== 'approve' && !statusReason.trim()}
                  >
                    {statusAction === 'approve' && 'Duyệt'}
                    {statusAction === 'reject' && 'Từ chối'}
                    {statusAction === 'cancel' && 'Hủy'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
