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
import { employeeService } from '@/services/employeeService';
import {
  TimeOffRequest,
  TimeOffStatus,
  TIME_OFF_STATUS_CONFIG,
  TimeOffSlot,
  TIME_OFF_SLOT_CONFIG,
  CreateTimeOffRequestDto,
} from '@/types/timeOff';
import { TimeOffType } from '@/types/timeOff';
import { Employee } from '@/types/employee';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminTimeOffRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TimeOffStatus | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Permissions
  const canViewAll = user?.permissions?.includes('VIEW_TIMEOFF_ALL');
  const canViewOwn = user?.permissions?.includes('VIEW_TIMEOFF_OWN');
  const canCreate = user?.permissions?.includes('CREATE_TIMEOFF');
  const canApprove = user?.permissions?.includes('APPROVE_TIMEOFF');
  const canReject = user?.permissions?.includes('REJECT_TIMEOFF');
  const canCancelPending = user?.permissions?.includes('CANCEL_TIMEOFF_PENDING');
  const canCancelOwn = user?.permissions?.includes('CANCEL_TIMEOFF_OWN');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Create form states
  const [createForm, setCreateForm] = useState<CreateTimeOffRequestDto>({
    employeeId: undefined,
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
        loadEmployees()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeOffRequests = async () => {
    try {
      const response = await TimeOffRequestService.getTimeOffRequests({
        page: 0,
        size: 50,
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setTimeOffRequests(response.content || []);
    } catch (error) {
      console.error('Error loading time off requests:', error);
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

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        page: 0,
        size: 100
      });
      setEmployees(response.content || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCreateTimeOffRequest = async () => {
    // Auto-fill employeeId if user doesn't have VIEW_ALL permission
    const finalEmployeeId = canViewAll ? createForm.employeeId : Number(user?.employeeId);

    if (!finalEmployeeId || !createForm.timeOffTypeId || !createForm.startDate || !createForm.endDate || !createForm.reason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validation: If slot is selected, startDate must equal endDate
    if (createForm.slotId && createForm.startDate !== createForm.endDate) {
      alert('Khi nghỉ theo ca, ngày bắt đầu và ngày kết thúc phải giống nhau');
      return;
    }

    try {
      setProcessing(true);
      const response = await TimeOffRequestService.createTimeOffRequest({
        ...createForm,
        employeeId: finalEmployeeId
      });

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
      console.error('Error creating time off request:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.code;

      // Handle specific errors
      if (errorMsg?.includes('INSUFFICIENT_LEAVE_BALANCE')) {
        alert('Lỗi: Bạn không đủ số ngày phép cho loại phép này');
      } else if (errorMsg?.includes('INVALID_DATE_RANGE')) {
        alert('Lỗi: Khoảng thời gian nghỉ không hợp lệ. Khi nghỉ theo ca, ngày bắt đầu và kết thúc phải giống nhau.');
      } else if (errorMsg?.includes('DUPLICATE_TIMEOFF_REQUEST')) {
        alert('Lỗi: Đã tồn tại yêu cầu nghỉ phép trùng với khoảng thời gian này');
      } else {
        alert(`Lỗi: ${errorMsg || 'Không thể tạo yêu cầu nghỉ phép'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await TimeOffRequestService.approveTimeOffRequest(selectedRequest.requestId);

      setShowApproveModal(false);
      setSelectedRequest(null);
      loadTimeOffRequests();
      alert('Đã duyệt yêu cầu nghỉ phép thành công!');
    } catch (error: any) {
      console.error('Error approving request:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.code;

      if (errorMsg?.includes('INVALID_STATE_TRANSITION')) {
        alert('Lỗi: Yêu cầu này không còn ở trạng thái "Chờ duyệt". Trang sẽ được tải lại.');
        loadTimeOffRequests();
      } else if (errorMsg?.includes('FORBIDDEN') || error.response?.status === 403) {
        alert('Lỗi: Bạn không có quyền thực hiện hành động này');
      } else if (errorMsg?.includes('NOT_FOUND') || error.response?.status === 404) {
        alert('Lỗi: Không tìm thấy yêu cầu này');
        loadTimeOffRequests();
      } else {
        alert(`Lỗi: ${errorMsg || 'Không thể duyệt yêu cầu'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setProcessing(true);
      await TimeOffRequestService.rejectTimeOffRequest(selectedRequest.requestId, {
        rejectedReason: rejectReason
      });

      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
      loadTimeOffRequests();
      alert('Đã từ chối yêu cầu nghỉ phép!');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.code;

      if (errorMsg?.includes('INVALID_STATE_TRANSITION')) {
        alert('Lỗi: Yêu cầu này không còn ở trạng thái "Chờ duyệt". Trang sẽ được tải lại.');
        loadTimeOffRequests();
      } else if (errorMsg?.includes('FORBIDDEN') || error.response?.status === 403) {
        alert('Lỗi: Bạn không có quyền thực hiện hành động này');
      } else if (errorMsg?.includes('NOT_FOUND') || error.response?.status === 404) {
        alert('Lỗi: Không tìm thấy yêu cầu này');
        loadTimeOffRequests();
      } else {
        alert(`Lỗi: ${errorMsg || 'Không thể từ chối yêu cầu'}`);
      }
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
      const errorMsg = error.response?.data?.message || error.response?.data?.code;

      if (errorMsg?.includes('INVALID_STATE_TRANSITION')) {
        alert('Lỗi: Yêu cầu này không còn ở trạng thái "Chờ duyệt". Trang sẽ được tải lại.');
        loadTimeOffRequests();
      } else if (errorMsg?.includes('FORBIDDEN') || error.response?.status === 403) {
        alert('Lỗi: Bạn không có quyền thực hiện hành động này');
      } else if (errorMsg?.includes('NOT_FOUND') || error.response?.status === 404) {
        alert('Lỗi: Không tìm thấy yêu cầu này');
        loadTimeOffRequests();
      } else {
        alert(`Lỗi: ${errorMsg || 'Không thể hủy yêu cầu'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const openApproveModal = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const openRejectModal = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openCancelModal = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const filteredRequests = timeOffRequests.filter((request) => {
    const matchesSearch =
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.timeOffTypeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

    const matchesEmployee = employeeFilter === 'ALL' || request.employeeId.toString() === employeeFilter;

    const matchesDateFrom = !dateFrom || request.startDate >= dateFrom;
    const matchesDateTo = !dateTo || request.endDate <= dateTo;

    return matchesSearch && matchesStatus && matchesEmployee && matchesDateFrom && matchesDateTo;
  });

  // Stats calculation
  const stats = {
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === TimeOffStatus.PENDING).length,
    approved: filteredRequests.filter(r => r.status === TimeOffStatus.APPROVED).length,
    rejectedCancelled: filteredRequests.filter(r =>
      r.status === TimeOffStatus.REJECTED || r.status === TimeOffStatus.CANCELLED
    ).length,
  };

  // Helper to check if user can cancel a specific request
  const canCancelRequest = (request: TimeOffRequest) => {
    if (canCancelPending) return true;
    if (canCancelOwn && request.employeeId === Number(user?.employeeId)) return true;
    return false;
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Yêu Cầu Nghỉ Phép</h1>
          <p className="text-gray-600 mt-2">Duyệt và quản lý yêu cầu nghỉ phép của nhân viên</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Tạo Yêu Cầu
          </Button>
        )}
      </div>

      {/* Stats - Dạng div thay vì Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng số</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chờ duyệt</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã duyệt</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Từ chối/Hủy</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejectedCancelled}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faTimes} className="text-red-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {/* Filters - Bỏ Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search">Tìm kiếm</Label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
              />
              <Input
                id="search"
                placeholder="Mã yêu cầu, nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {canViewAll && (
            <div>
              <Select
                label="Nhân viên"
                value={employeeFilter}
                onChange={(value) => setEmployeeFilter(value)}
                options={[
                  { value: 'ALL', label: 'Tất cả nhân viên' },
                  ...employees.map(emp => ({
                    value: emp.employeeId.toString(),
                    label: `${emp.lastName} ${emp.firstName}`
                  }))
                ]}
              />
            </div>
          )}

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

          <div>
            <Label htmlFor="dateFrom">Từ ngày</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dateTo">Đến ngày</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Time Off Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => {
          const statusConfig = TIME_OFF_STATUS_CONFIG[request.status];
          const canManage = request.status === TimeOffStatus.PENDING;

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

                  <div className="flex items-center gap-2">
                    {request.status === TimeOffStatus.PENDING ? (
                      <>
                        {canApprove && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApproveModal(request)}
                            className="text-green-600 hover:bg-green-50 border-green-300"
                          >
                            <FontAwesomeIcon icon={faCheck} className="h-4 w-4 mr-1" />
                            Duyệt
                          </Button>
                        )}

                        {canReject && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRejectModal(request)}
                            className="text-red-600 hover:bg-red-50 border-red-300"
                          >
                            <FontAwesomeIcon icon={faTimes} className="h-4 w-4 mr-1" />
                            Từ chối
                          </Button>
                        )}

                        {canCancelRequest(request) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancelModal(request)}
                            className="text-orange-600 hover:bg-orange-50 border-orange-300"
                          >
                            <FontAwesomeIcon icon={faBan} className="h-4 w-4 mr-1" />
                            Hủy
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/time-off-requests/${request.requestId}`)}
                      >
                        <FontAwesomeIcon icon={faEye} className="h-4 w-4 mr-1" />
                        Xem
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Tạo Yêu Cầu Nghỉ Phép</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {canViewAll && (
                <div>
                  <Label htmlFor="employee">Nhân viên *</Label>
                  <Select
                    value={createForm.employeeId?.toString() || ''}
                    onChange={(value) => setCreateForm(prev => ({ ...prev, employeeId: parseInt(value) }))}
                    options={employees?.map(emp => ({
                      value: emp.employeeId.toString(),
                      label: `${emp.fullName} (${emp.employeeCode})`
                    })) || []}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="timeOffType">Loại nghỉ phép *</Label>
                <Select
                  value={createForm.timeOffTypeId}
                  onChange={(value) => setCreateForm(prev => ({ ...prev, timeOffTypeId: value }))}
                  options={timeOffTypes?.map(type => ({
                    value: type.typeId,
                    label: type.typeName
                  })) || []}
                />
              </div>

              <div>
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setCreateForm(prev => ({
                      ...prev,
                      startDate: newStartDate,
                      // Auto-set endDate = startDate if slot is selected
                      endDate: prev.slotId ? newStartDate : prev.endDate
                    }));
                  }}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Ngày kết thúc *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={!!createForm.slotId}
                  className={createForm.slotId ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              </div>

              <div className={canViewAll ? '' : 'md:col-span-2'}>
                <Label htmlFor="slot">Ca nghỉ (tùy chọn)</Label>
                <Select
                  value={createForm.slotId || ''}
                  onChange={(value) => {
                    const newSlotId = value ? value as TimeOffSlot : null;
                    setCreateForm(prev => ({
                      ...prev,
                      slotId: newSlotId,
                      // If slot is selected, set endDate = startDate
                      endDate: newSlotId ? prev.startDate : prev.endDate
                    }));
                  }}
                  options={[
                    { value: '', label: 'Nghỉ cả ngày' },
                    { value: TimeOffSlot.MORNING, label: TIME_OFF_SLOT_CONFIG[TimeOffSlot.MORNING].label },
                    { value: TimeOffSlot.AFTERNOON, label: TIME_OFF_SLOT_CONFIG[TimeOffSlot.AFTERNOON].label },
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {createForm.slotId ? 'Nghỉ theo ca: Ngày kết thúc sẽ tự động bằng ngày bắt đầu' : 'Để trống nếu nghỉ cả ngày'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="reason">Lý do nghỉ phép *</Label>
              <Textarea
                id="reason"
                value={createForm.reason}
                onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Nhập lý do nghỉ phép..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateTimeOffRequest}
                disabled={processing}
                className="flex-1 bg-[#8b5fbf] hover:bg-[#7a4fa8]"
              >
                {processing ? 'Đang tạo...' : 'Tạo Yêu Cầu'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Xác nhận duyệt</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn duyệt yêu cầu nghỉ phép này không?
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowApproveModal(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processing ? 'Đang xử lý...' : 'Duyệt'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Từ chối yêu cầu</h2>
            <div className="mb-4">
              <Label htmlFor="rejectReason">Lý do từ chối *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
                required
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {processing ? 'Đang xử lý...' : 'Từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
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
