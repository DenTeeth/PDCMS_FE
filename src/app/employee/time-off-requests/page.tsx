'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faBan,
  faCalendarAlt,
  faClock,
  faSearch,
  faPlus,
  faCheck,
  faTimes,
  faWallet,
  faFilter,
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

import { TimeOffRequestService } from '@/services/timeOffRequestService';
import { TimeOffTypeService } from '@/services/timeOffTypeService';
import { workShiftService } from '@/services/workShiftService';
import { employeeService } from '@/services/employeeService';
import { formatTimeToHHMM } from '@/lib/utils';
import {
  TimeOffRequest,
  TimeOffStatus,
  TIME_OFF_STATUS_CONFIG,
  CreateTimeOffRequestDto,
} from '@/types/timeOff';
import { TimeOffType } from '@/types/timeOff';
import { WorkShift } from '@/types/workShift';
import { Employee } from '@/types/employee';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { LeaveBalanceService } from '@/services/leaveBalanceService';
import { EmployeeLeaveBalancesResponse } from '@/types/leaveBalance';
import { toast } from 'sonner';
import { TimeOffDataEnricher } from '@/utils/timeOffDataEnricher';
import { lazy, Suspense } from 'react';

const LeaveBalancesTab = lazy(() => import('@/components/admin/LeaveBalancesTab').then(mod => ({ default: mod.LeaveBalancesTab })));

export default function EmployeeTimeOffRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError, clearError } = useApiErrorHandler();

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffType[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TimeOffStatus | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [timeOffTypeFilter, setTimeOffTypeFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'requests' | 'balances'>('requests');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusAction, setStatusAction] = useState<'approve' | 'reject' | 'cancel'>('approve');
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
    // Load employees if user has VIEW_LEAVE_ALL or APPROVE_TIME_OFF permission
    // (needed for LeaveBalancesTab management features)
    if (user?.permissions?.includes('VIEW_LEAVE_ALL') || user?.permissions?.includes('APPROVE_TIME_OFF')) {
      loadEmployees();
    }
  }, [user?.permissions]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load timeOffTypes and workShifts first (needed for enriching requests)
      await Promise.all([
        loadTimeOffTypes(),
        loadWorkShifts(),
        loadLeaveBalances()
      ]);
      // Then load and enrich requests
      await loadTimeOffRequests();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalances = async () => {
    // Only load leave balances if user has VIEW_LEAVE_OWN permission
    // Managers with VIEW_LEAVE_ALL don't need to see their own balances on this page
    const canViewOwn = user?.permissions?.includes('VIEW_LEAVE_OWN') || false;
    if (!canViewOwn) {
      // User doesn't have permission to view own balances, skip loading
      return;
    }

    // Validate employeeId exists and is a valid number
    if (!user?.employeeId) {
      // No employeeId - silently skip (might be a manager viewing all requests)
      return;
    }

    // Try to parse employeeId as number
    // Some users might have employeeId as string (e.g., "bacsi2"), which is invalid
    const employeeIdNum = Number(user.employeeId);
    if (isNaN(employeeIdNum) || employeeIdNum <= 0) {
      // Invalid employeeId format - silently skip (might be a manager or special account)
      // Don't log errors as this is expected for some user types
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalanceService.getEmployeeBalances(
        employeeIdNum,
        currentYear
      );
      setLeaveBalances(balances);
    } catch (error: any) {
      // Don't show error if 404 (no balances yet) or 403 (no permission)
      const status = error?.response?.status;
      if (status === 404) {
        // No balances found - this is OK for new employees
        setLeaveBalances(null);
      } else if (status === 403) {
        // No permission - silently ignore
        setLeaveBalances(null);
      } else {
        // Other errors - only log in development, don't show to user
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading leave balances:', {
            employeeId: employeeIdNum,
            status: error?.response?.status,
            message: error?.response?.data?.message || error.message
          });
        }
        setLeaveBalances(null);
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
      
      // Enrich requests with timeOffTypeName, workShiftName, and totalDays
      const enrichedRequests = TimeOffDataEnricher.enrichRequests(
        response.content || [],
        timeOffTypes,
        workShifts
      );
      
      setTimeOffRequests(enrichedRequests);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading time off requests:', error);
      }
      handleError(error, 'Không thể tải danh sách yêu cầu nghỉ phép. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const loadTimeOffTypes = async () => {
    try {
      const types = await TimeOffTypeService.getActiveTimeOffTypes();
      setTimeOffTypes(types);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading time off types:', error);
      }
    }
  };

  const loadWorkShifts = async () => {
    try {
      const shifts = await workShiftService.getAll(true);
      setWorkShifts(shifts);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading work shifts:', error);
      }
      setWorkShifts([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        page: 0,
        size: 100,
      });
      setEmployees(response.content);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading employees:', error);
      }
    }
  };

  const handleCreateTimeOffRequest = async () => {
    // Prevent duplicate submissions
    if (processing) {
      console.log(' Already processing, ignoring duplicate submit');
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
        ' Cảnh báo: Đã có yêu cầu nghỉ phép trong khoảng thời gian này.\n\n' +
        'Bạn có chắc chắn muốn tiếp tục tạo yêu cầu mới?'
      );
      if (!confirmSubmit) {
        return;
      }
    }

    // Validate required fields first
    if (!createForm.timeOffTypeId) {
      alert('Vui lòng chọn loại nghỉ phép');
      return;
    }
    if (!createForm.startDate) {
      alert('Vui lòng chọn ngày bắt đầu');
      return;
    }
    if (!createForm.endDate) {
      alert('Vui lòng chọn ngày kết thúc');
      return;
    }
    if (!createForm.reason || !createForm.reason.trim()) {
      alert('Vui lòng nhập lý do nghỉ phép');
      return;
    }
    // ✅ BE FIXED: employeeId is now optional - BE auto-fills from JWT token
    // For employee self-requests, we don't need to send employeeId
    // For admin creating for another employee, we would send employeeId (not implemented yet)
    const requestData: CreateTimeOffRequestDto = {
      // employeeId: undefined, // ✅ Omit for employee self-requests - BE auto-fills from JWT
      timeOffTypeId: createForm.timeOffTypeId,
      startDate: createForm.startDate,
      endDate: createForm.endDate,
      slotId: createForm.slotId,
      reason: createForm.reason.trim()
    };

    try {
      setProcessing(true);

      if (process.env.NODE_ENV === 'development') {
        console.log(' Creating time-off request:', requestData);
        console.log(' User context:', {
          employeeId: user?.employeeId,
          type: typeof user?.employeeId,
          user: user
        });
      }
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
      alert(`Tạo yêu cầu nghỉ phép thành công!\n\nMã yêu cầu: ${response.requestId}`);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(' Error creating time off request:', error.message);
        console.error(' Status:', error.response?.status);
        console.error(' Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.error(' Error Code:', error.response?.data?.errorCode || error.response?.data?.code || error.response?.data?.error);
        console.error(' Message:', error.response?.data?.message);
        console.error(' Detail:', error.response?.data?.detail);
        console.error(' Title:', error.response?.data?.title);
      }

      const status = error.response?.status;
      const errorData = error.response?.data || {};
      // BE may use 'error', 'errorCode', or 'code' field for error code
      const errorCode = errorData.errorCode || errorData.code || errorData.error;
      let errorMsg = '';

      if (status === 409) {
        // Conflict - overlapping requests or duplicate
        errorMsg = errorData.detail || errorData.message ||
          'Đã có yêu cầu nghỉ phép trong khoảng thời gian này. Vui lòng kiểm tra lại danh sách yêu cầu.';
      } else if (status === 400) {
        // Bad request - check for specific error codes
        // Priority: Always show 'detail' from BE response if available (BE provides detailed messages)
        if (errorCode === 'TIME_OFF_SAME_DAY_NOT_ALLOWED') {
          // Cannot request time-off for the same day (except emergency)
          // BE should provide 'detail' field with detailed message, but if not, use fallback
          errorMsg = errorData.detail || 
            'Không thể xin nghỉ trong chính ngày hôm nay. Vui lòng chọn từ ngày mai trở đi, hoặc chọn loại "Nghỉ khẩn cấp" nếu thực sự cần nghỉ hôm nay.';
        } else if (errorCode === 'DUPLICATE_BALANCE_RECORDS') {
          // Data corruption - duplicate balance records in database
          errorMsg = errorData.detail || errorData.message ||
            'Phát hiện dữ liệu bị trùng lặp trong hệ thống. Vui lòng liên hệ quản trị viên để xử lý.';
        } else if (errorCode === 'BALANCE_NOT_FOUND') {
          // No balance record - needs HR to initialize
          errorMsg = errorData.detail || errorData.message ||
            'Chưa có thông tin số dư ngày nghỉ. Vui lòng liên hệ phòng nhân sự để khởi tạo.';
        } else if (errorCode === 'INSUFFICIENT_LEAVE_BALANCE' || errorMsg?.includes('INSUFFICIENT') || errorMsg?.includes('không đủ')) {
          // Not enough balance - hết số dư phép
          // BE returns error code: "INSUFFICIENT_LEAVE_BALANCE" (from GlobalExceptionHandler)
          errorMsg = errorData.detail || errorData.message ||
            'Không đủ số ngày phép!\n\nBạn không còn số dư nghỉ phép cho loại nghỉ này. Vui lòng liên hệ phòng nhân sự để kiểm tra số dư nghỉ phép hoặc chọn loại nghỉ phép khác.';
        } else {
          // Other validation errors - prioritize 'detail' from BE
          if (errorData.detail) {
            // BE provides detailed message in 'detail' field
            errorMsg = errorData.detail;
          } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            // Show validation errors
            const errorList = errorData.errors.map((err: any) => `• ${err.field || 'Field'}: ${err.message || err.defaultMessage || 'Invalid'}`).join('\n');
            errorMsg = `Lỗi validation:\n\n${errorList}`;
          } else if (errorData.message) {
            errorMsg = errorData.message;
          } else {
            // Show full error data for debugging
            errorMsg = `Dữ liệu không hợp lệ:\n\n${JSON.stringify(errorData, null, 2)}`;
          }
        }
      } else if (status === 403) {
        // Forbidden
        errorMsg = errorData.detail || errorData.message || 'Bạn không có quyền tạo yêu cầu này.';
      } else {
        errorMsg = errorData.detail || errorData.message ||
          error.message || 'Không thể tạo yêu cầu nghỉ phép';
      }

      // Show simple error message to user
      alert(`Không thể tạo đơn nghỉ phép\n\n${errorMsg}`);
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
      alert('Đã hủy yêu cầu nghỉ phép thành công!');
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error cancelling request:', error);
      }
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || 'Không thể hủy yêu cầu';
      alert(`Lỗi: ${errorMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  const openCancelModal = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const openStatusModal = (request: TimeOffRequest, action: 'approve' | 'reject' | 'cancel') => {
    setSelectedRequest(request);
    setStatusAction(action);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    try {
      const loadingToast = toast.loading('Đang xử lý...');

      switch (statusAction) {
        case 'approve':
          await TimeOffRequestService.approveTimeOffRequest(selectedRequest.requestId);
          toast.dismiss(loadingToast);
          toast.success('Đã duyệt yêu cầu nghỉ phép');
          break;
        case 'reject':
          if (!statusReason.trim()) {
            toast.dismiss(loadingToast);
            toast.error('Vui lòng nhập lý do từ chối');
            return;
          }
          await TimeOffRequestService.rejectTimeOffRequest(selectedRequest.requestId, {
            rejectedReason: statusReason
          });
          toast.dismiss(loadingToast);
          toast.success('Đã từ chối yêu cầu nghỉ phép');
          break;
        case 'cancel':
          if (!statusReason.trim()) {
            toast.dismiss(loadingToast);
            toast.error('Vui lòng nhập lý do hủy');
            return;
          }
          await TimeOffRequestService.cancelTimeOffRequest(selectedRequest.requestId, {
            cancellationReason: statusReason
          });
          toast.dismiss(loadingToast);
          toast.success('Đã hủy yêu cầu nghỉ phép');
          break;
      }

      setShowStatusModal(false);
      setStatusReason('');
      setSelectedRequest(null);
      loadTimeOffRequests();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái yêu cầu');
    }
  };

  // ⚡ Memoize filtered requests - Sort by createdAt DESC (newest first)
  const filteredRequests = useMemo(() => {
    const filtered = timeOffRequests.filter((request) => {
      const matchesSearch =
        request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.timeOffTypeName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

      const matchesEmployee = employeeFilter === 'ALL' ||
        request.employee?.employeeId?.toString() === employeeFilter;

      const matchesTimeOffType = timeOffTypeFilter === 'ALL' || request.timeOffTypeId === timeOffTypeFilter;

      const matchesDateFrom = !dateFrom || request.startDate >= dateFrom;
      const matchesDateTo = !dateTo || request.endDate <= dateTo;

      return matchesSearch && matchesStatus && matchesEmployee && matchesTimeOffType && matchesDateFrom && matchesDateTo;
    });

    // Sort by createdAt DESC (newest first) - client-side to ensure correct order
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate).getTime();
      const dateB = new Date(b.createdAt || b.startDate).getTime();
      return dateB - dateA; // DESC: newest first
    });
  }, [timeOffRequests, searchTerm, statusFilter, employeeFilter, timeOffTypeFilter, dateFrom, dateTo]);

  // ⚡ Memoize stats calculation
  const stats = useMemo(() => ({
    total: filteredRequests.length,
    pending: filteredRequests.filter(r => r.status === TimeOffStatus.PENDING).length,
    approved: filteredRequests.filter(r => r.status === TimeOffStatus.APPROVED).length,
    rejectedCancelled: filteredRequests.filter(r =>
      r.status === TimeOffStatus.REJECTED || r.status === TimeOffStatus.CANCELLED
    ).length,
  }), [filteredRequests]);

  // Permission checks
  const canCreate = user?.permissions?.includes('CREATE_TIME_OFF') || false;
  const canViewAll = user?.permissions?.includes('VIEW_LEAVE_ALL') || false;
  const canApprove = user?.permissions?.includes('APPROVE_TIME_OFF') || false;
  const canReject = user?.permissions?.includes('APPROVE_TIME_OFF') || false;
  const canCancelPending = user?.permissions?.includes('APPROVE_TIME_OFF') || false;
  const canCancelOwn = user?.permissions?.includes('CREATE_TIME_OFF') || false;

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
          <h1 className="text-3xl font-bold text-gray-900">
            {canViewAll ? 'Quản lý yêu cầu nghỉ phép' : 'Yêu cầu nghỉ phép của tôi'}
          </h1>
          <p className="text-gray-600 mt-2">
            {canViewAll ? 'Duyệt và quản lý yêu cầu nghỉ phép của nhân viên' : 'Quản lý yêu cầu nghỉ phép'}
          </p>
        </div>
        {activeTab === 'requests' && canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
            disabled={!canCreate}
            title={!canCreate ? 'Bạn không có quyền tạo yêu cầu nghỉ phép' : ''}
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Tạo yêu cầu
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
            Yêu cầu nghỉ phép
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${activeTab === 'balances'
              ? 'text-[#8b5fbf] border-b-2 border-[#8b5fbf]'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <FontAwesomeIcon icon={faWallet} className="h-4 w-4" />
            Số dư nghỉ phép
          </button>
        </div>
      </div>

      {/* ⚡ TAB CONTENT */}
      {activeTab === 'requests' ? (
        <>
          {/* Summary Cards */}
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
              <p className="text-sm font-semibold text-red-800 mb-2">Từ chối/hủy</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faTimes} className="text-red-700 text-xl" />
                </div>
                <p className="text-3xl font-bold text-red-800">{stats.rejectedCancelled}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
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
                <div className="space-y-2">
                  <CustomSelect
                    label="Nhân viên"
                    value={employeeFilter}
                    onChange={(value: string) => setEmployeeFilter(value)}
                    options={[
                      { value: 'ALL', label: 'Tất cả nhân viên' },
                      ...employees.map(emp => ({
                        value: emp.employeeId.toString(),
                        label: emp.fullName || `${emp.firstName} ${emp.lastName}`
                      }))
                    ]}
                  />
                </div>
              )}

              <div className="space-y-2">
                <CustomSelect
                  label="Loại ngày nghỉ"
                  value={timeOffTypeFilter}
                  onChange={(value: string) => setTimeOffTypeFilter(value)}
                  options={[
                    { value: 'ALL', label: 'Tất cả loại' },
                    ...timeOffTypes
                      .filter(type => type.isActive)
                      .map(type => ({
                        value: type.typeId,
                        label: type.typeName || type.typeId
                      }))
                  ]}
                />
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Trạng thái"
                  value={statusFilter}
                  onChange={(value: string) => setStatusFilter(value as TimeOffStatus | 'ALL')}
                  options={[
                    { value: 'ALL', label: 'Tất cả' },
                    { value: TimeOffStatus.PENDING, label: 'Chờ duyệt' },
                    { value: TimeOffStatus.APPROVED, label: 'Đã duyệt' },
                    { value: TimeOffStatus.REJECTED, label: 'Từ chối' },
                    { value: TimeOffStatus.CANCELLED, label: 'Đã hủy' },
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
                    setTimeOffTypeFilter('ALL');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="w-full"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>

          {/* Time Off Requests List - Card Layout giống Admin */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => {
          const statusConfig = TIME_OFF_STATUS_CONFIG[request.status];
          const isPending = request.status === TimeOffStatus.PENDING;

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                        {request.totalDays !== undefined && request.totalDays !== null ? (
                          <span className="font-semibold">
                            {request.totalDays % 1 === 0 
                              ? `${request.totalDays} ngày` 
                              : `${request.totalDays} ngày`}
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-400">Đang tính...</span>
                        )}
                        {request.workShiftName && (
                          <Badge variant="outline">{request.workShiftName}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="text-gray-500 font-medium">Lý do:</span>
                        <span className="text-gray-700">{request.reason || 'Không có lý do'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end ml-auto flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/employee/time-off-requests/${request.requestId}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Chi tiết
                    </Button>

                    {isPending && (
                      <>
                        {canApprove && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => openStatusModal(request, 'approve')}
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                            Duyệt
                          </Button>
                        )}

                        {canReject && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => openStatusModal(request, 'reject')}
                          >
                            <FontAwesomeIcon icon={faTimes} className="mr-1" />
                            Từ chối
                          </Button>
                        )}

                        {canCancelRequest(request) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 hover:bg-orange-50 border-orange-300"
                            onClick={() => openStatusModal(request, 'cancel')}
                          >
                            <FontAwesomeIcon icon={faBan} className="h-4 w-4 mr-1" />
                            Hủy
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  {canViewAll ? 'Không có yêu cầu nghỉ phép nào.' : 'Bạn chưa có yêu cầu nghỉ phép nào.'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
        ) : (
        /* ⚡ TAB: Leave Balances */
        <div>
          {/* If user has APPROVE_TIME_OFF and VIEW_LEAVE_ALL, show full management tab */}
          {canApprove && canViewAll ? (
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
          ) : (
            /* Show own balances only */
            <>
              {leaveBalances && leaveBalances.balances.length > 0 ? (
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-900">
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 mr-2" />
                      Số dư ngày nghỉ năm {leaveBalances.cycle_year}
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
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">Chưa có thông tin số dư nghỉ phép.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex-shrink-0 border-b px-6 py-4">
              <h2 className="text-xl font-bold">Tạo yêu cầu nghỉ phép</h2>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="timeOffTypeId">Loại nghỉ phép <span className="text-red-500">*</span></Label>
                  <CustomSelect
                    value={createForm.timeOffTypeId}
                    onChange={(value) => setCreateForm(prev => ({ ...prev, timeOffTypeId: value }))}
                    options={(timeOffTypes || []).map(type => ({
                      value: type.typeId,
                      label: `${type.typeName}${type.isPaid ? ' (Có lương)' : ' (Không lương)'}`
                    }))}
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

                <div className="space-y-1">
                  <Label htmlFor="startDate">Ngày bắt đầu <span className="text-red-500">*</span></Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="endDate">Ngày kết thúc <span className="text-red-500">*</span></Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                    min={createForm.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-1">
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
                  <p className="text-xs text-gray-500">
                    {createForm.slotId ? 'Nghỉ theo ca: Ngày kết thúc sẽ tự động bằng ngày bắt đầu' : 'Để trống nếu nghỉ cả ngày'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason">Lý do nghỉ phép <span className="text-red-500">*</span></Label>
                <Textarea
                  id="reason"
                  value={createForm.reason}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do nghỉ phép..."
                  className="resize-none"
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
                            Cảnh báo: Trùng lịch nghỉ phép
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
                  className="bg-[#8b5fbf] hover:bg-[#7a4fb0]"
                >
                  {processing ? 'Đang tạo...' : 'Tạo yêu cầu'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Cancel Modal */}
      {showCancelModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Hủy yêu cầu</h2>
            <div className="mb-4 space-y-1">
              <Label htmlFor="cancelReason">Lý do hủy <span className="text-red-500">*</span></Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                className="resize-none"
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

      {/* Status Update Modal (Approve/Reject/Cancel) */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {statusAction === 'approve' && 'Duyệt yêu cầu nghỉ phép'}
                {statusAction === 'reject' && 'Từ chối yêu cầu nghỉ phép'}
                {statusAction === 'cancel' && 'Hủy yêu cầu nghỉ phép'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Yêu cầu: <strong>{selectedRequest.requestId}</strong>
                </p>

                {(statusAction === 'reject' || statusAction === 'cancel') && (
                  <div>
                    <Label htmlFor="statusReason">
                      {statusAction === 'reject' ? 'Lý do từ chối' : 'Lý do hủy'} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="statusReason"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder={`Nhập ${statusAction === 'reject' ? 'lý do từ chối' : 'lý do hủy'}...`}
                      className="resize-none"
                      rows={3}
                      required
                    />
                  </div>
                )}

                {statusAction === 'approve' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      Bạn có chắc chắn muốn duyệt yêu cầu này không?
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowStatusModal(false);
                      setStatusReason('');
                      setSelectedRequest(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={statusAction !== 'approve' && !statusReason.trim()}
                    className={
                      statusAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      statusAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-gray-600 hover:bg-gray-700'
                    }
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
