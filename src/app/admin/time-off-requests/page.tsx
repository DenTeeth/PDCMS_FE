'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
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
  faWallet,
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
import { workShiftService } from '@/services/workShiftService';
import {
  TimeOffRequest,
  TimeOffStatus,
  TIME_OFF_STATUS_CONFIG,
  CreateTimeOffRequestDto,
} from '@/types/timeOff';
import { TimeOffType } from '@/types/timeOff';
import { Employee } from '@/types/employee';
import { WorkShift } from '@/types/workShift';
import { useAuth } from '@/contexts/AuthContext';
import { TimeOffErrorHandler } from '@/utils/timeOffErrorHandler';
import { TimeOffDataEnricher } from '@/utils/timeOffDataEnricher';

// ⚡ Lazy load Leave Balances component để tối ưu tốc độ
const LeaveBalancesTab = lazy(() => import('@/components/admin/LeaveBalancesTab').then(mod => ({ default: mod.LeaveBalancesTab })));

// Tab types
type TabType = 'requests' | 'balances';

export default function AdminTimeOffRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ⚡ Tab state
  const [activeTab, setActiveTab] = useState<TabType>('requests');

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [viewDetails, setViewDetails] = useState<TimeOffRequest | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
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

      // ✅ Load timeOffTypes and workShifts FIRST (needed for enrichment)
      await Promise.all([
        loadTimeOffTypes(),
        loadEmployees(),
        loadWorkShifts()
      ]);

      // ✅ Then load requests (uses timeOffTypes and workShifts for enrichment)
      await loadTimeOffRequests();
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
        size: 20, // ⚡ Giảm từ 50 → 20 để load nhanh hơn
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });

      if (response.content && response.content.length > 0) {
        // ✅ Enrich data with timeOffTypeName, workShiftName, and totalDays
        const enrichedRequests = TimeOffDataEnricher.enrichRequests(
          response.content,
          timeOffTypes,
          workShifts
        );

        setTimeOffRequests(enrichedRequests);
      } else {
        setTimeOffRequests([]);
      }
    } catch (error) {
      console.error('Error loading time off requests:', error);
      setTimeOffRequests([]);
    }
  };

  const loadTimeOffTypes = async () => {
    try {
      const types = await TimeOffTypeService.getAllTimeOffTypes();
      setTimeOffTypes(types || []);
    } catch (error) {
      console.error('Error loading time off types:', error);
      try {
        const activeTypes = await TimeOffTypeService.getActiveTimeOffTypes();
        setTimeOffTypes(activeTypes || []);
      } catch (fallbackError) {
        setTimeOffTypes([]);
      }
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        page: 0,
        size: 100 // ⚡ Tăng lại lên 100 để đảm bảo load đủ nhân viên
      });
      setEmployees(response.content || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadWorkShifts = async () => {
    try {
      const shifts = await workShiftService.getAll(true); // Get only active shifts
      console.log('📋 Work Shifts loaded:', shifts);
      setWorkShifts(shifts);
    } catch (error) {
      console.error('Error loading work shifts:', error);
      setWorkShifts([]); // Fallback to empty array
    }
  };

  const handleCreateTimeOffRequest = async () => {
    // Auto-fill employeeId if user doesn't have VIEW_ALL permission
    const finalEmployeeId = canViewAll ? createForm.employeeId : Number(user?.employeeId);

    if (!finalEmployeeId || !createForm.timeOffTypeId || !createForm.startDate || !createForm.endDate || !createForm.reason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validation: If slotId is selected, startDate must equal endDate
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

      // ✅ Reload to get fresh data with enrichment
      await loadTimeOffRequests();

      alert(`✅ Tạo yêu cầu nghỉ phép thành công!\nMã yêu cầu: ${response.requestId}`);
    } catch (error: any) {
      const errorCode = error.response?.data?.code || error.response?.data?.error;
      const errorMsg = error.response?.data?.message || error.message || '';

      // Handle specific errors with detailed messages
      if (errorCode === 'INSUFFICIENT_BALANCE' || errorMsg?.includes('INSUFFICIENT') || errorMsg?.includes('không đủ')) {
        alert('❌ Lỗi: Không đủ số ngày phép!\n\nBạn không có đủ số ngày phép cho loại nghỉ này. Vui lòng kiểm tra số dư nghỉ phép của bạn hoặc chọn loại nghỉ phép khác.');
      } else if (errorCode === 'INVALID_DATE_RANGE' || errorMsg?.includes('DATE_RANGE')) {
        alert('❌ Lỗi: Khoảng thời gian không hợp lệ!\n\n- Ngày kết thúc phải sau hoặc bằng ngày bắt đầu\n- Khi chọn ca nghỉ (sáng/chiều), ngày bắt đầu và kết thúc phải giống nhau');
      } else if (errorCode === 'DUPLICATE_TIMEOFF_REQUEST' || error.response?.status === 409) {
        alert('⚠️ Lỗi: Yêu cầu nghỉ phép trùng lặp!\n\nĐã tồn tại một yêu cầu nghỉ phép trong khoảng thời gian này. Vui lòng kiểm tra lại danh sách yêu cầu của bạn.');
      } else if (errorCode === 'INVALID_SLOT_USAGE' || errorMsg?.includes('SLOT')) {
        alert('❌ Lỗi: Sử dụng ca nghỉ không đúng!\n\nKhi chọn nghỉ theo ca (sáng hoặc chiều), ngày bắt đầu và ngày kết thúc phải giống nhau.');
      } else if (errorCode === 'TYPE_NOT_FOUND' || errorMsg?.includes('TYPE') || error.response?.status === 404) {
        alert('❌ Lỗi: Không tìm thấy loại nghỉ phép!\n\nLoại nghỉ phép bạn chọn không tồn tại hoặc đã bị vô hiệu hóa.');
      } else if (error.response?.status === 403) {
        alert('❌ Lỗi: Không có quyền!\n\nBạn không có quyền tạo yêu cầu nghỉ phép.');
      } else if (error.response?.status === 400) {
        // Generic 400 errors - show validation errors if available
        const validationErrors = error.response?.data?.errors || [];
        if (validationErrors.length > 0) {
          const errorMessages = validationErrors.map((e: any) => `• ${e.field}: ${e.message}`).join('\n');
          alert(`❌ Lỗi validation:\n\n${errorMessages}`);
        } else {
          alert(`❌ Lỗi: ${errorMsg || 'Dữ liệu không hợp lệ'}`);
        }
      } else {
        alert(`❌ Lỗi: ${errorMsg || 'Không thể tạo yêu cầu nghỉ phép. Vui lòng thử lại sau.'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  // ⚡ useCallback để tránh re-create function mỗi lần render
  const handleApprove = useCallback(async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await TimeOffRequestService.approveTimeOffRequest(selectedRequest.requestId);

      setShowApproveModal(false);
      setSelectedRequest(null);
      loadTimeOffRequests();
      alert('✅ Đã duyệt yêu cầu nghỉ phép thành công!');
    } catch (error: any) {
      const errorInfo = TimeOffErrorHandler.handleApproveError(error, selectedRequest.requestId);
      alert(TimeOffErrorHandler.formatErrorMessage(errorInfo));

      if (errorInfo.shouldReload) {
        loadTimeOffRequests();
      }
      if (errorInfo.shouldRedirect) {
        window.location.href = errorInfo.shouldRedirect;
      }
    } finally {
      setProcessing(false);
    }
  }, [selectedRequest]);

  const handleReject = useCallback(async () => {
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
      alert('✅ Đã từ chối yêu cầu nghỉ phép!');
    } catch (error: any) {
      const errorInfo = TimeOffErrorHandler.handleRejectError(error, selectedRequest.requestId, rejectReason);
      alert(TimeOffErrorHandler.formatErrorMessage(errorInfo));

      if (errorInfo.shouldReload) {
        loadTimeOffRequests();
      }
      if (errorInfo.shouldRedirect) {
        window.location.href = errorInfo.shouldRedirect;
      }
    } finally {
      setProcessing(false);
    }
  }, [selectedRequest, rejectReason]);

  const handleCancel = useCallback(async () => {
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
      alert('✅ Đã hủy yêu cầu nghỉ phép!');
    } catch (error: any) {
      const errorInfo = TimeOffErrorHandler.handleCancelError(error, selectedRequest.requestId, cancelReason);
      alert(TimeOffErrorHandler.formatErrorMessage(errorInfo));

      if (errorInfo.shouldReload) {
        loadTimeOffRequests();
      }
      if (errorInfo.shouldRedirect) {
        window.location.href = errorInfo.shouldRedirect;
      }
    } finally {
      setProcessing(false);
    }
  }, [selectedRequest, cancelReason]);

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

  const openViewModal = async (request: TimeOffRequest) => {
    try {
      setShowViewModal(true);
      setLoadingDetails(true);

      // Gọi API để lấy chi tiết
      const details = await TimeOffRequestService.getTimeOffRequestById(request.requestId);

      // ✅ Enrich detail data
      const enrichedDetails = TimeOffDataEnricher.enrichRequest(
        details,
        timeOffTypes,
        workShifts
      );

      setViewDetails(enrichedDetails);
    } catch (error: any) {
      alert('Không thể tải chi tiết yêu cầu');
      setShowViewModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ⚡ Memoize filtered requests để tránh re-calculate mỗi lần render
  const filteredRequests = useMemo(() => {
    return timeOffRequests.filter((request) => {
      const matchesSearch =
        request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.timeOffTypeName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

      const matchesEmployee = employeeFilter === 'ALL' || request.employee?.employeeId.toString() === employeeFilter;

      const matchesDateFrom = !dateFrom || request.startDate >= dateFrom;
      const matchesDateTo = !dateTo || request.endDate <= dateTo;

      return matchesSearch && matchesStatus && matchesEmployee && matchesDateFrom && matchesDateTo;
    });
  }, [timeOffRequests, searchTerm, statusFilter, employeeFilter, dateFrom, dateTo]);

  // ⚡ Memoize stats calculation
  const stats = useMemo(() => ({
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === TimeOffStatus.PENDING).length,
    approved: filteredRequests.filter(r => r.status === TimeOffStatus.APPROVED).length,
    rejectedCancelled: filteredRequests.filter(r =>
      r.status === TimeOffStatus.REJECTED || r.status === TimeOffStatus.CANCELLED
    ).length,
  }), [filteredRequests]);

  // Helper to check if user can cancel a specific request
  const canCancelRequest = (request: TimeOffRequest) => {
    if (canCancelPending) return true;
    if (canCancelOwn && request.employee?.employeeId === Number(user?.employeeId)) return true;
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
        {activeTab === 'requests' && canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Tạo Yêu Cầu
          </Button>
        )}
      </div>

      {/* ⚡ TABS */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${activeTab === 'requests'
                ? 'text-[#8b5fbf] border-b-2 border-[#8b5fbf]'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4" />
            Time Off Requests
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${activeTab === 'balances'
                ? 'text-[#8b5fbf] border-b-2 border-[#8b5fbf]'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <FontAwesomeIcon icon={faWallet} className="h-4 w-4" />
            Leave Balances
          </button>
        </div>
      </div>

      {/* ⚡ TAB CONTENT */}
      {activeTab === 'requests' ? (
        <>{/* Time Off Requests Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Tổng số */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 text-xl" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>

            {/* Chờ duyệt */}
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Chờ duyệt</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faClock} className="text-yellow-700 text-xl" />
                </div>
                <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
              </div>
            </div>

            {/* Đã duyệt */}
            <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Đã duyệt</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faCheck} className="text-green-700 text-xl" />
                </div>
                <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
              </div>
            </div>

            {/* Từ chối/Hủy */}
            <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">Từ chối/Hủy</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faTimes} className="text-red-700 text-xl" />
                </div>
                <p className="text-3xl font-bold text-red-800">{stats.rejectedCancelled}</p>
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
                            <div>
                              <div className="font-medium text-gray-900">
                                {request.employee?.fullName || `Nhân viên ID: ${request.employee?.employeeId || 'N/A'}`}
                              </div>
                              <div className="text-xs text-gray-500">Người nghỉ</div>
                            </div>
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
                            <span>{request.timeOffTypeName || request.timeOffTypeId}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{request.totalDays || 0} ngày</span>
                            {request.workShiftName && (
                              <Badge variant="outline">{request.workShiftName}</Badge>
                            )}
                            {!request.workShiftName && request.workShiftId && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                {request.workShiftId}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-start space-x-2">
                            <span className="text-gray-500 font-medium">Người tạo:</span>
                            <span className="text-gray-900">
                              {request.requestedBy?.fullName || `User ID: ${request.requestedBy?.employeeId || 'N/A'}`}
                            </span>
                            <span className="text-gray-400">
                              • {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-gray-500 font-medium">Lý do:</span>
                            <span className="text-gray-700">{request.reason || 'Không có lý do'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end ml-auto">
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
                            onClick={() => openViewModal(request)}
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex-shrink-0 border-b px-6 py-4">
                  <h2 className="text-xl font-bold">Tạo Yêu Cầu Nghỉ Phép</h2>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {canViewAll && (
                      <div>
                        <Label htmlFor="employee">Nhân viên <span className="text-red-500">*</span></Label>
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
                      <Label htmlFor="timeOffType">Loại nghỉ phép <span className="text-red-500">*</span></Label>
                      <Select
                        value={createForm.timeOffTypeId}
                        onChange={(value) => setCreateForm(prev => ({ ...prev, timeOffTypeId: value }))}
                        options={timeOffTypes?.filter(type => type.isActive).map(type => ({
                          value: type.typeId,
                          label: type.typeName
                        })) || []}
                      />
                    </div>

                    <div>
                      <Label htmlFor="startDate">Ngày bắt đầu <span className="text-red-500">*</span></Label>
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
                      <Label htmlFor="endDate">Ngày kết thúc <span className="text-red-500">*</span></Label>
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
                          const newSlotId = value || null;
                          setCreateForm(prev => ({
                            ...prev,
                            slotId: newSlotId,
                            // If slot is selected, set endDate = startDate
                            endDate: newSlotId ? prev.startDate : prev.endDate
                          }));
                        }}
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
                    <Label htmlFor="reason">Lý do nghỉ phép <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="reason"
                      value={createForm.reason}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Nhập lý do nghỉ phép..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 mt-4 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleCreateTimeOffRequest}
                      disabled={processing}
                      className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
                    >
                      {processing ? 'Đang tạo...' : 'Tạo Yêu Cầu'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}      {/* Approve Modal */}
          {showApproveModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4 text-green-600">Xác nhận duyệt yêu cầu nghỉ phép</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã yêu cầu:</span>
                    <span className="font-semibold">{selectedRequest.requestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhân viên nghỉ:</span>
                    <span className="font-semibold">
                      {selectedRequest.employee?.fullName || `ID: ${selectedRequest.employee?.employeeId || 'N/A'}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại nghỉ:</span>
                    <span className="font-semibold">
                      {selectedRequest.timeOffTypeName || selectedRequest.timeOffTypeId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-semibold">
                      {format(new Date(selectedRequest.startDate), 'dd/MM/yyyy', { locale: vi })} -{' '}
                      {format(new Date(selectedRequest.endDate), 'dd/MM/yyyy', { locale: vi })}
                      {selectedRequest.workShiftName && ` (${selectedRequest.workShiftName})`}
                      {!selectedRequest.workShiftName && selectedRequest.workShiftId && ` (${selectedRequest.workShiftId})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng số ngày:</span>
                    <span className="font-semibold text-green-600">
                      {selectedRequest.totalDays || 0} ngày
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Người tạo đơn:</span>
                      <span className="font-semibold text-purple-600">
                        {selectedRequest.requestedBy?.fullName || `User ID: ${selectedRequest.requestedBy?.employeeId || 'N/A'}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian tạo:</span>
                      <span className="text-gray-700">
                        {format(new Date(selectedRequest.requestedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <span className="text-gray-600 block mb-1">Lý do:</span>
                    <p className="text-gray-900 italic">"{selectedRequest.reason || 'Không có lý do'}"</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-6 text-center font-medium">
                  Bạn có chắc chắn muốn duyệt yêu cầu này không?
                </p>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowApproveModal(false)}
                    disabled={processing}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? 'Đang xử lý...' : '✓ Duyệt'}
                  </Button>
                </div>
              </div>
            </div>
          )}      {/* Reject Modal */}
          {showRejectModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4 text-red-600">Từ chối yêu cầu nghỉ phép</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã yêu cầu:</span>
                    <span className="font-semibold">{selectedRequest.requestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhân viên:</span>
                    <span className="font-semibold">
                      {selectedRequest.employee?.fullName || `ID: ${selectedRequest.employee?.employeeId || 'N/A'}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Người tạo:</span>
                    <span className="font-semibold text-purple-600">
                      {selectedRequest.requestedBy?.fullName || `User ID: ${selectedRequest.requestedBy?.employeeId || 'N/A'}`}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <span className="text-gray-600 block mb-1">Lý do nghỉ:</span>
                    <p className="text-gray-900 italic text-sm">
                      "{selectedRequest.reason || 'Không có lý do'}"
                    </p>
                  </div>
                </div>

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
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={processing || !rejectReason.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {processing ? 'Đang xử lý...' : 'Từ chối'}
                  </Button>
                </div>
              </div>
            </div>
          )}      {/* Cancel Modal */}
          {showCancelModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Hủy yêu cầu</h2>
                <div className="mb-4">
                  <Label htmlFor="cancelReason">Lý do hủy <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy..."
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={processing || !cancelReason.trim()}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {processing ? 'Đang xử lý...' : 'Hủy yêu cầu'}
                  </Button>
                </div>
              </div>
            </div>
          )}      {/* View Details Modal */}
          {showViewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center border-b px-6 py-4 flex-shrink-0">
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết Yêu cầu Nghỉ phép</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowViewModal(false);
                      setViewDetails(null);
                    }}
                  >
                    ✕ Đóng
                  </Button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-4">

                  {loadingDetails ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5fbf] mx-auto"></div>
                      <p className="mt-4 text-gray-600">Đang tải chi tiết...</p>
                    </div>
                  ) : viewDetails ? (
                    <div className="space-y-6">
                      {/* Header Info */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Mã yêu cầu: {viewDetails.requestId}
                            </h3>
                            <Badge className={`mt-2 ${TIME_OFF_STATUS_CONFIG[viewDetails.status].bgColor} ${TIME_OFF_STATUS_CONFIG[viewDetails.status].textColor}`}>
                              {TIME_OFF_STATUS_CONFIG[viewDetails.status].label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Employee & Request Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                            <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-2 text-purple-600" />
                            Thông tin Nhân viên
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nhân viên nghỉ:</span>
                              <span className="font-semibold">
                                {viewDetails.employee?.fullName || `ID: ${viewDetails.employee?.employeeId || 'N/A'}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mã NV:</span>
                              <span className="font-semibold">{viewDetails.employee?.employeeCode || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                            <FontAwesomeIcon icon={faClock} className="h-5 w-5 mr-2 text-purple-600" />
                            Thông tin Yêu cầu
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Người tạo:</span>
                              <span className="font-semibold text-purple-600">
                                {viewDetails.requestedBy?.fullName || `User ID: ${viewDetails.requestedBy?.employeeId || 'N/A'}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Thời gian tạo:</span>
                              <span className="font-semibold">
                                {format(new Date(viewDetails.requestedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Off Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 mr-2 text-purple-600" />
                          Chi tiết Nghỉ phép
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 block mb-1">Loại nghỉ phép:</span>
                            <span className="font-semibold text-lg">
                              {viewDetails.timeOffTypeName || viewDetails.timeOffTypeId}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 block mb-1">Tổng số ngày:</span>
                            <span className="font-semibold text-lg text-green-600">
                              {viewDetails.totalDays || 0} ngày
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 block mb-1">Ngày bắt đầu:</span>
                            <span className="font-semibold">
                              {format(new Date(viewDetails.startDate), 'dd/MM/yyyy (EEEE)', { locale: vi })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 block mb-1">Ngày kết thúc:</span>
                            <span className="font-semibold">
                              {format(new Date(viewDetails.endDate), 'dd/MM/yyyy (EEEE)', { locale: vi })}
                            </span>
                          </div>
                          {viewDetails.workShiftName && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600 block mb-1">Ca nghỉ:</span>
                              <Badge variant="outline" className="text-base">
                                {viewDetails.workShiftName}
                              </Badge>
                            </div>
                          )}
                          {!viewDetails.workShiftName && viewDetails.workShiftId && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600 block mb-1">Ca nghỉ:</span>
                              <Badge variant="outline" className="text-base text-gray-500">
                                {viewDetails.workShiftId}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Lý do nghỉ phép:</h4>
                        <p className="text-gray-900 italic">
                          "{viewDetails.reason || 'Không có lý do'}"
                        </p>
                      </div>

                      {/* Approval/Rejection Info */}
                      {viewDetails.status === TimeOffStatus.APPROVED && viewDetails.approvedBy && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <FontAwesomeIcon icon={faCheck} className="h-5 w-5 mr-2" />
                            Thông tin Phê duyệt
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Người duyệt:</span>
                              <span className="font-semibold text-green-900">{viewDetails.approvedBy.fullName}</span>
                            </div>
                            {viewDetails.approvedAt && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Thời gian duyệt:</span>
                                <span className="font-semibold text-green-900">
                                  {format(new Date(viewDetails.approvedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {viewDetails.status === TimeOffStatus.REJECTED && viewDetails.rejectedReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                            <FontAwesomeIcon icon={faTimes} className="h-5 w-5 mr-2" />
                            Thông tin Từ chối
                          </h4>
                          <p className="text-red-900 italic">"{viewDetails.rejectedReason}"</p>
                        </div>
                      )}

                      {viewDetails.status === TimeOffStatus.CANCELLED && viewDetails.cancellationReason && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                            <FontAwesomeIcon icon={faBan} className="h-5 w-5 mr-2" />
                            Lý do Hủy
                          </h4>
                          <p className="text-orange-900 italic">"{viewDetails.cancellationReason}"</p>
                        </div>
                      )}

                      {/* Actions */}
                      {viewDetails.status === TimeOffStatus.PENDING && (
                        <div className="flex gap-3 pt-4 border-t">
                          {canApprove && (
                            <Button
                              onClick={() => {
                                setShowViewModal(false);
                                openApproveModal(viewDetails);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <FontAwesomeIcon icon={faCheck} className="mr-2" />
                              Duyệt
                            </Button>
                          )}
                          {canReject && (
                            <Button
                              onClick={() => {
                                setShowViewModal(false);
                                openRejectModal(viewDetails);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              <FontAwesomeIcon icon={faTimes} className="mr-2" />
                              Từ chối
                            </Button>
                          )}
                          {canCancelRequest(viewDetails) && (
                            <Button
                              onClick={() => {
                                setShowViewModal(false);
                                openCancelModal(viewDetails);
                              }}
                              className="flex-1 bg-orange-600 hover:bg-orange-700"
                            >
                              <FontAwesomeIcon icon={faBan} className="mr-2" />
                              Hủy
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600">Không có dữ liệu</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Suspense
          fallback={
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải Leave Balances...</p>
              </div>
            </div>
          }
        >
          <LeaveBalancesTab
            employees={employees}
            timeOffTypes={timeOffTypes}
          />
        </Suspense>
      )}
    </div>
  );
}
