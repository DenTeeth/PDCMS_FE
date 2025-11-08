'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faCheck,
  faTimes,
  faBan,
  faEye,
  faCalendarAlt,
  faUser,
  faClock,
  faSearch,
  faPlus,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CustomSelect from '@/components/ui/custom-select';

import { TimeOffRequestService } from '@/services/timeOffRequestService';
import { TimeOffTypeService } from '@/services/timeOffTypeService';
import { workShiftService } from '@/services/workShiftService';
import { formatTimeToHHMM } from '@/lib/utils';
import {
  TimeOffRequest,
  TimeOffStatus,
  TIME_OFF_STATUS_CONFIG,
  CreateTimeOffRequestDto,
} from '@/types/timeOff';
import { TimeOffType } from '@/types/timeOff';
import { WorkShift } from '@/types/workShift';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { LeaveBalanceService } from '@/services/leaveBalanceService';
import { EmployeeLeaveBalancesResponse } from '@/types/leaveBalance';

export default function EmployeeTimeOffRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError, clearError } = useApiErrorHandler();

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TimeOffStatus | 'ALL'>('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Create form states
  const [createForm, setCreateForm] = useState<CreateTimeOffRequestDto>({
    employeeId: undefined, // Will be inferred from JWT
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    slotId: null,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTimeOffRequests(),
        loadTimeOffTypes(),
        loadWorkShifts(),
        loadLeaveBalances()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalances = async () => {
    if (!user?.employeeId) return;

    try {
      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalanceService.getEmployeeBalances(
        Number(user.employeeId),
        currentYear
      );
      setLeaveBalances(balances);
    } catch (error: any) {
      console.error('Error loading leave balances:', error);
      // Don't show error if 404 (no balances yet)
      if (error?.response?.status !== 404) {
        handleError(error, 'Không thể tải số dư ngày nghỉ');
      }
    }
  };

  const loadTimeOffRequests = async () => {
    try {
      clearError(); // Clear any previous errors
      const response = await TimeOffRequestService.getTimeOffRequests({
        page: 0,
        size: 50,
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setTimeOffRequests(response.content || []);
    } catch (error: any) {
      console.error('Error loading time off requests:', error);
      handleError(error, 'Không thể tải danh sách yêu cầu nghỉ phép. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const loadTimeOffTypes = async () => {
    try {
      const types = await TimeOffTypeService.getActiveTimeOffTypes();
      setTimeOffTypes(types);
    } catch (error) {
      console.error('Error loading time off types:', error);
    }
  };

  const loadWorkShifts = async () => {
    try {
      const shifts = await workShiftService.getAll(true);
      setWorkShifts(shifts);
    } catch (error) {
      console.error('Error loading work shifts:', error);
      setWorkShifts([]);
    }
  };

  const handleCreateTimeOffRequest = async () => {
    // Prevent duplicate submissions
    if (processing) {
      console.log('⚠️ Already processing, ignoring duplicate submit');
      return;
    }

    if (!createForm.timeOffTypeId || !createForm.startDate || !createForm.endDate || !createForm.reason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate dates
    const startDate = new Date(createForm.startDate);
    const endDate = new Date(createForm.endDate);

    if (endDate < startDate) {
      alert('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      return;
    }

    // Check for overlapping requests (client-side validation)
    const hasOverlap = timeOffRequests.some(request => {
      // Only check pending/approved requests
      if (request.status === 'REJECTED' || request.status === 'CANCELLED') {
        return false;
      }

      const reqStart = new Date(request.startDate);
      const reqEnd = new Date(request.endDate);

      // Check if date ranges overlap
      return (startDate <= reqEnd) && (endDate >= reqStart);
    });

    if (hasOverlap) {
      const confirmSubmit = confirm(
        '⚠️ Cảnh báo: Đã có yêu cầu nghỉ phép trong khoảng thời gian này.\n\n' +
        'Bạn có chắc chắn muốn tiếp tục tạo yêu cầu mới?'
      );
      if (!confirmSubmit) {
        return;
      }
    }

    try {
      setProcessing(true);

      // For employee self-requests, use employeeId from auth context
      const requestData = {
        timeOffTypeId: createForm.timeOffTypeId,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        slotId: createForm.slotId,
        reason: createForm.reason,
        employeeId: Number(user?.employeeId) // Get from logged-in user
      };

      console.log('🔍 Creating time-off request:', requestData);
      const response = await TimeOffRequestService.createTimeOffRequest(requestData);

      setShowCreateModal(false);
      setCreateForm({
        employeeId: undefined,
        timeOffTypeId: '',
        startDate: '',
        endDate: '',
        slotId: null,
        reason: ''
      });
      loadTimeOffRequests();
      alert(`✅ Tạo yêu cầu nghỉ phép thành công! Mã yêu cầu: ${response.requestId}`);
    } catch (error: any) {
      console.error('❌ Error creating time off request:', error);
      console.error('📋 Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message,
        detail: error.response?.data?.detail
      });

      const status = error.response?.status;
      let errorMsg = '';

      if (status === 409) {
        // Conflict - overlapping requests or duplicate
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          'Đã có yêu cầu nghỉ phép trong khoảng thời gian này. Vui lòng kiểm tra lại danh sách yêu cầu.';
      } else if (status === 400) {
        // Bad request - validation error
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (status === 403) {
        // Forbidden
        errorMsg = 'Bạn không có quyền tạo yêu cầu này.';
      } else {
        errorMsg = error.response?.data?.detail || error.response?.data?.message ||
          error.message || 'Không thể tạo yêu cầu nghỉ phép';
      }

      alert(`❌ Lỗi (${status || 'Unknown'}): ${errorMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      setProcessing(true);
      await TimeOffRequestService.cancelTimeOffRequest(selectedRequest.requestId, {
        cancellationReason: cancelReason
      });

      setShowCancelModal(false);
      setSelectedRequest(null);
      setCancelReason('');
      loadTimeOffRequests();
      alert('Đã hủy yêu cầu nghỉ phép!');
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      alert(`Lỗi: ${error.response?.data?.message || 'Không thể hủy yêu cầu'}`);
    } finally {
      setProcessing(false);
    }
  };

  const openCancelModal = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const filteredRequests = timeOffRequests.filter((request) => {
    const matchesSearch =
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  // Show unauthorized message if 403 error
  if (is403Error) {
    return (
      <UnauthorizedMessage
        title="Không có quyền truy cập"
        message="Tài khoản của bạn chưa được cấp quyền để xem yêu cầu nghỉ phép. Vui lòng liên hệ quản trị viên để được cấp quyền."
        onRefresh={loadData}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yêu Cầu Nghỉ Phép Của Tôi</h1>
          <p className="text-gray-600 mt-2">Quản lý yêu cầu nghỉ phép của bạn</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
          Tạo Yêu Cầu Nghỉ Phép
        </Button>
      </div>

      {/* Leave Balances Card */}
      {leaveBalances && leaveBalances.balances.length > 0 && (
        <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 mr-2" />
              Số Dư Ngày Nghỉ Năm {leaveBalances.cycle_year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveBalances.balances.map((balance) => (
                <div
                  key={balance.balance_id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {balance.time_off_type.type_name}
                    </h3>
                    <Badge variant={balance.time_off_type.is_paid ? 'default' : 'secondary'}>
                      {balance.time_off_type.is_paid ? 'Có lương' : 'Không lương'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng số ngày:</span>
                      <span className="font-semibold text-gray-900">{balance.total_days_allowed} ngày</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đã sử dụng:</span>
                      <span className="font-semibold text-orange-600">{balance.days_taken} ngày</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">Còn lại:</span>
                      <span className={`font-bold text-lg ${balance.days_remaining > 5 ? 'text-green-600' :
                          balance.days_remaining > 0 ? 'text-yellow-600' :
                            'text-red-600'
                        }`}>
                        {balance.days_remaining} ngày
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <Input
                id="search"
                placeholder="Tìm theo mã yêu cầu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <CustomSelect
                label="Trạng thái"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as TimeOffStatus | 'ALL')}
                options={[
                  { value: 'ALL', label: 'Tất cả' },
                  { value: TimeOffStatus.PENDING, label: 'Chờ duyệt' },
                  { value: TimeOffStatus.APPROVED, label: 'Đã duyệt' },
                  { value: TimeOffStatus.REJECTED, label: 'Từ chối' },
                  { value: TimeOffStatus.CANCELLED, label: 'Đã hủy' },
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadTimeOffRequests}
                variant="outline"
                className="w-full"
              >
                <FontAwesomeIcon icon={faFilter} className="h-4 w-4 mr-2" />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Off Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => {
          const statusConfig = TIME_OFF_STATUS_CONFIG[request.status];
          const canCancel = request.status === TimeOffStatus.PENDING;

          return (
            <Card key={request.requestId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.requestId}
                      </h3>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                        <span>{request.employee?.fullName || request.employee?.firstName}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4" />
                        <span>
                          {format(new Date(request.startDate), 'dd/MM/yyyy', { locale: vi })} -
                          {format(new Date(request.endDate), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                        <span>{request.timeOffTypeName || 'N/A'}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{request.totalDays} ngày</span>
                        {request.workShiftName && (
                          <Badge variant="outline">{request.workShiftName}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Lý do:</strong> {request.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/employee/time-off-requests/${request.requestId}`)}
                    >
                      <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                      Chi tiết
                    </Button>

                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCancelModal(request)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <FontAwesomeIcon icon={faBan} className="h-4 w-4" />
                        Hủy
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 border-b px-6 py-4">
              <h2 className="text-xl font-bold">Tạo Yêu Cầu Nghỉ Phép</h2>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CustomSelect
                    label="Loại nghỉ phép *"
                    value={createForm.timeOffTypeId}
                    onChange={(value) => setCreateForm(prev => ({ ...prev, timeOffTypeId: value }))}
                    options={timeOffTypes?.map(type => ({
                      value: type.typeId,
                      label: `${type.typeName}${type.isPaid ? ' (Có lương)' : ' (Không lương)'}`
                    })) || []}
                    required
                  />
                  {createForm.timeOffTypeId && (
                    <div className="mt-2 text-sm text-gray-600">
                      {(() => {
                        const selectedType = timeOffTypes?.find(t => t.typeId === createForm.timeOffTypeId);
                        return selectedType ? (
                          <div>
                            <p><strong>Mã:</strong> {selectedType.typeCode}</p>
                            <p><strong>Yêu cầu phê duyệt:</strong> {selectedType.requiresApproval ? 'Có' : 'Không'}</p>
                            {selectedType.description && (
                              <p><strong>Mô tả:</strong> {selectedType.description}</p>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Ngày kết thúc *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                    min={createForm.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Ca làm việc (nếu nghỉ nửa ngày)"
                    value={createForm.slotId || ''}
                    onChange={(value) => setCreateForm(prev => ({
                      ...prev,
                      slotId: value || null,
                      // If slot is selected, set endDate = startDate
                      endDate: value ? prev.startDate : prev.endDate
                    }))}
                    options={[
                      { value: '', label: 'Nghỉ cả ngày' },
                      ...workShifts.map(shift => ({
                        value: shift.workShiftId,
                        label: `${shift.shiftName} (${formatTimeToHHMM(shift.startTime)} - ${formatTimeToHHMM(shift.endTime)})`
                      }))
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {createForm.slotId ? 'Nghỉ theo ca: Ngày kết thúc sẽ tự động bằng ngày bắt đầu' : 'Để trống nếu nghỉ cả ngày'}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Lý do nghỉ phép *</Label>
                <Textarea
                  id="reason"
                  value={createForm.reason}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do nghỉ phép..."
                  rows={3}
                />
              </div>

              {/* Conflict Warning */}
              {createForm.startDate && createForm.endDate && (() => {
                const startDate = new Date(createForm.startDate);
                const endDate = new Date(createForm.endDate);

                const overlappingRequests = timeOffRequests.filter(request => {
                  if (request.status === 'REJECTED' || request.status === 'CANCELLED') {
                    return false;
                  }
                  const reqStart = new Date(request.startDate);
                  const reqEnd = new Date(request.endDate);
                  return (startDate <= reqEnd) && (endDate >= reqStart);
                });

                if (overlappingRequests.length > 0) {
                  return (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                      <div className="flex items-start">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-900 mb-2">
                            ⚠️ Cảnh báo: Trùng lịch nghỉ phép
                          </h4>
                          <p className="text-sm text-yellow-800 mb-2">
                            Đã có {overlappingRequests.length} yêu cầu nghỉ phép trong khoảng thời gian này:
                          </p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {overlappingRequests.map(req => (
                              <li key={req.requestId} className="flex items-center">
                                <Badge variant={req.status === 'PENDING' ? 'default' : 'secondary'} className="mr-2">
                                  {TIME_OFF_STATUS_CONFIG[req.status]?.label || req.status}
                                </Badge>
                                <span>
                                  {format(new Date(req.startDate), 'dd/MM/yyyy')} - {format(new Date(req.endDate), 'dd/MM/yyyy')}
                                  {req.timeOffTypeName ? ` - ${req.timeOffTypeName}` : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateTimeOffRequest}
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Đang tạo...' : 'Tạo Yêu Cầu'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Cancel Modal */}
      {showCancelModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Hủy yêu cầu</h2>
            <div className="mb-4">
              <Label htmlFor="cancelReason">Lý do hủy *</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                rows={3}
                required
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCancel}
                disabled={processing || !cancelReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {processing ? 'Đang xử lý...' : 'Hủy yêu cầu'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
