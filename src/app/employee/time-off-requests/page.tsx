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
import Select from '@/components/ui/select';

import { TimeOffRequestService } from '@/services/timeOffRequestService';
import { TimeOffTypeService } from '@/services/timeOffTypeService';
import { workShiftService } from '@/services/workShiftService';
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

export default function EmployeeTimeOffRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError, clearError } = useApiErrorHandler();

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
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
        loadWorkShifts()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
    if (!createForm.timeOffTypeId || !createForm.startDate || !createForm.endDate || !createForm.reason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
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
      alert(`Tạo yêu cầu nghỉ phép thành công! Mã yêu cầu: ${response.requestId}`);
    } catch (error: any) {
      console.error('❌ Error creating time off request:', error);
      console.error('📋 Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.response?.data?.message
      });

      const errorMsg = error.response?.data?.message || error.message || 'Không thể tạo yêu cầu nghỉ phép';
      alert(`❌ Lỗi: ${errorMsg}`);
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
              <Select
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
                        <span>{request.employeeName}</span>
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
                        <span>{request.timeOffTypeName}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{request.totalDays} ngày</span>
                        {request.slotName && (
                          <Badge variant="outline">{request.slotName}</Badge>
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
                  <Label htmlFor="timeOffType">Loại nghỉ phép *</Label>
                  <Select
                    value={createForm.timeOffTypeId}
                    onChange={(value) => setCreateForm(prev => ({ ...prev, timeOffTypeId: value }))}
                    options={timeOffTypes?.map(type => ({
                      value: type.typeId,
                      label: `${type.typeName}${type.isPaid ? ' (Có lương)' : ' (Không lương)'}`
                    })) || []}
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
                  <Label htmlFor="slot">Ca làm việc (nếu nghỉ nửa ngày)</Label>
                  <Select
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
                        label: `${shift.shiftName} (${shift.startTime} - ${shift.endTime})`
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
