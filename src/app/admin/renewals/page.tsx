'use client';

/**
 * Admin Renewal Management Page
 * 
 * Trang này cho phép Admin/Manager:
 * 1. Xem danh sách TẤT CẢ renewal requests (tất cả status)
 * 2. Filter theo status, employee
 * 3. Finalize renewal đã được nhân viên CONFIRMED
 * 
 * Workflow:
 * - Employee phản hồi renewal → Status = CONFIRMED hoặc DECLINED
 * - Admin xem danh sách renewals đã CONFIRMED
 * - Admin chọn ngày hết hạn mới và click "Finalize"
 * - Backend tự động:
 *   1. Vô hiệu hóa lịch cũ (is_active = false)
 *   2. Tạo lịch mới với effective_from = old_effective_to + 1 day
 *   3. Copy days of week từ lịch cũ
 *   4. Update renewal status = FINALIZED
 * 
 * Dựa trên: CRON_JOB_AND_RENEWAL_API_GUIDE.md
 * Last updated: 2025-01-XX
 */

import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  AlertCircle,
  Info,
  Filter,
  Eye,
  Check,
  X,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays, addMonths, addYears } from 'date-fns';
import { vi } from 'date-fns/locale';

// Import types và services
import { ShiftRenewal, RenewalStatus, FinalizeRenewalRequest } from '@/types/renewal';
import { renewalService } from '@/services/renewalService';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { EmployeeService } from '@/services/employeeService';

/**
 * Helper function: Format date để hiển thị
 */
const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return dateString;
  }
};

/**
 * Helper function: Format datetime để hiển thị
 */
const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return dateString;
  }
};

/**
 * Helper function: Lấy badge color dựa trên status
 */
const getStatusBadge = (status: RenewalStatus) => {
  switch (status) {
    case RenewalStatus.PENDING_ACTION:
      return { variant: 'outline' as const, icon: Clock, label: 'Chờ phản hồi', color: 'text-blue-600' };
    case RenewalStatus.CONFIRMED:
      return { variant: 'default' as const, icon: CheckCircle, label: 'Đã đồng ý', color: 'text-green-600' };
    case RenewalStatus.DECLINED:
      return { variant: 'secondary' as const, icon: XCircle, label: 'Đã từ chối', color: 'text-red-600' };
    case RenewalStatus.FINALIZED:
      return { variant: 'default' as const, icon: CheckCircle, label: 'Đã hoàn tất', color: 'text-green-600' };
    case RenewalStatus.EXPIRED:
      return { variant: 'destructive' as const, icon: XCircle, label: 'Đã quá hạn', color: 'text-red-600' };
    default:
      return { variant: 'outline' as const, icon: AlertCircle, label: status, color: 'text-gray-600' };
  }
};

// ==================== MAIN COMPONENT ====================
export default function AdminRenewalsPage() {
  const { user, hasPermission } = useAuth();

  // ==================== STATE MANAGEMENT ====================

  /**
   * Danh sách TẤT CẢ renewal requests (tất cả status)
   * Admin có thể xem renewals của tất cả nhân viên
   */
  const [allRenewals, setAllRenewals] = useState<ShiftRenewal[]>([]);

  /**
   * Loading state
   */
  const [loading, setLoading] = useState(true);

  /**
   * Danh sách employees (để filter)
   */
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  /**
   * Filter states
   */
  const [statusFilter, setStatusFilter] = useState<RenewalStatus | 'ALL'>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<number | 'ALL'>('ALL');

  /**
   * Finalize modal state
   */
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<ShiftRenewal | null>(null);
  const [newEffectiveTo, setNewEffectiveTo] = useState('');
  const [finalizing, setFinalizing] = useState(false);

  // ==================== COMPUTED VALUES ====================

  /**
   * Lọc renewals dựa trên filters
   * Chỉ hiển thị renewals phù hợp với statusFilter và employeeFilter
   */
  const filteredRenewals = useMemo(() => {
    let filtered = [...allRenewals];

    // Filter theo status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter theo employee
    if (employeeFilter !== 'ALL') {
      filtered = filtered.filter(r => r.employeeId === employeeFilter);
    }

    // Sort: PENDING_ACTION trước, sau đó CONFIRMED, sau đó các status khác
    filtered.sort((a, b) => {
      const priority: Record<RenewalStatus, number> = {
        [RenewalStatus.PENDING_ACTION]: 1,
        [RenewalStatus.CONFIRMED]: 2,
        [RenewalStatus.EXPIRED]: 3,
        [RenewalStatus.DECLINED]: 4,
        [RenewalStatus.FINALIZED]: 5
      };
      return (priority[a.status] || 99) - (priority[b.status] || 99);
    });

    return filtered;
  }, [allRenewals, statusFilter, employeeFilter]);

  /**
   * Thống kê renewals theo status
   */
  const renewalStats = useMemo(() => {
    return {
      total: allRenewals.length,
      pending: allRenewals.filter(r => r.status === RenewalStatus.PENDING_ACTION).length,
      confirmed: allRenewals.filter(r => r.status === RenewalStatus.CONFIRMED).length,
      declined: allRenewals.filter(r => r.status === RenewalStatus.DECLINED).length,
      finalized: allRenewals.filter(r => r.status === RenewalStatus.FINALIZED).length,
      expired: allRenewals.filter(r => r.status === RenewalStatus.EXPIRED).length
    };
  }, [allRenewals]);

  // ==================== FETCH DATA ====================

  /**
   * Fetch danh sách TẤT CẢ renewals từ API
   * 
   * API: GET /api/v1/admin/registrations/renewals
   * 
   * Query Parameters:
   * - status: Filter theo status (optional)
   * - employeeId: Filter theo employee (optional)
   */
  const fetchRenewals = async () => {
    try {
      setLoading(true);
      console.log(' [fetchRenewals] Fetching all renewals...');

      const params: { status?: RenewalStatus; employeeId?: number } = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (employeeFilter !== 'ALL') {
        params.employeeId = employeeFilter;
      }

      const data = await renewalService.getAllRenewals(params);

      console.log(' [fetchRenewals] Received renewals:', {
        count: data.length,
        renewals: data
      });

      setAllRenewals(data || []);
    } catch (error: any) {
      console.error(' [fetchRenewals] Failed to fetch renewals:', error);
      toast.error(error.message || 'Không thể tải danh sách renewal requests');
      setAllRenewals([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch danh sách employees (để filter)
   */
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const employeeService = new EmployeeService();
      const response = await employeeService.getEmployees({
        page: 0,
        size: 1000,
        isActive: true
      });

      const employeeList = response.content || [];
      setEmployees(employeeList);
    } catch (error: any) {
      console.error(' [fetchEmployees] Failed to fetch employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  /**
   * Fetch data khi component mount và khi filters thay đổi
   */
  useEffect(() => {
    fetchRenewals();
  }, [statusFilter, employeeFilter]); // Re-fetch khi filters thay đổi

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ==================== HANDLERS ====================

  /**
   * Mở modal để finalize renewal
   * @param renewal Renewal cần finalize (phải có status = CONFIRMED)
   */
  const handleOpenFinalizeModal = (renewal: ShiftRenewal) => {
    if (renewal.status !== RenewalStatus.CONFIRMED) {
      toast.error('Chỉ có thể finalize renewal đã được nhân viên CONFIRMED');
      return;
    }

    setSelectedRenewal(renewal);

    // Set default date: old effective_to + 1 năm
    try {
      const oldDate = parseISO(renewal.effectiveTo);
      const newDate = addYears(oldDate, 1);
      setNewEffectiveTo(format(newDate, 'yyyy-MM-dd'));
    } catch {
      setNewEffectiveTo('');
    }

    setShowFinalizeModal(true);
  };

  /**
   * Đóng finalize modal
   */
  const handleCloseFinalizeModal = () => {
    setShowFinalizeModal(false);
    setSelectedRenewal(null);
    setNewEffectiveTo('');
  };

  /**
   * Finalize renewal
   * 
   * API: POST /api/v1/admin/registrations/renewals/finalize
   * 
   * Business Logic:
   * - Vô hiệu hóa lịch cũ
   * - Tạo lịch mới với effective_from = old_effective_to + 1 day
   * - newEffectiveTo phải > old effective_to
   */
  const handleFinalizeRenewal = async () => {
    if (!selectedRenewal || !newEffectiveTo) {
      toast.error('Vui lòng chọn ngày hết hạn mới');
      return;
    }

    // Validate: newEffectiveTo phải > old effective_to
    try {
      const oldDate = parseISO(selectedRenewal.effectiveTo);
      const newDate = parseISO(newEffectiveTo);

      if (newDate <= oldDate) {
        toast.error('Ngày hết hạn mới phải sau ngày hết hạn cũ');
        return;
      }
    } catch {
      toast.error('Ngày không hợp lệ');
      return;
    }

    try {
      setFinalizing(true);

      console.log(' [handleFinalizeRenewal] Finalizing renewal:', {
        renewalId: selectedRenewal.renewalId,
        newEffectiveTo
      });

      const request: FinalizeRenewalRequest = {
        renewalRequestId: selectedRenewal.renewalId,
        newEffectiveTo
      };

      const response = await renewalService.finalizeRenewal(request);

      console.log(' [handleFinalizeRenewal] Finalized successfully:', response);

      toast.success('Đã hoàn tất gia hạn! Lịch mới đã được tạo.');

      // Đóng modal
      handleCloseFinalizeModal();

      // Refresh danh sách
      await fetchRenewals();
    } catch (error: any) {
      console.error(' [handleFinalizeRenewal] Failed:', error);
      toast.error(error.message || 'Không thể finalize renewal. Vui lòng thử lại.');
    } finally {
      setFinalizing(false);
    }
  };

  /**
   * Quick action: Set newEffectiveTo = old + 3 tháng
   */
  const handleQuickAction3Months = () => {
    if (!selectedRenewal) return;
    try {
      const oldDate = parseISO(selectedRenewal.effectiveTo);
      const newDate = addMonths(oldDate, 3);
      setNewEffectiveTo(format(newDate, 'yyyy-MM-dd'));
    } catch {
      // Ignore
    }
  };

  /**
   * Quick action: Set newEffectiveTo = old + 6 tháng
   */
  const handleQuickAction6Months = () => {
    if (!selectedRenewal) return;
    try {
      const oldDate = parseISO(selectedRenewal.effectiveTo);
      const newDate = addMonths(oldDate, 6);
      setNewEffectiveTo(format(newDate, 'yyyy-MM-dd'));
    } catch {
      // Ignore
    }
  };

  /**
   * Quick action: Set newEffectiveTo = old + 1 năm
   */
  const handleQuickAction1Year = () => {
    if (!selectedRenewal) return;
    try {
      const oldDate = parseISO(selectedRenewal.effectiveTo);
      const newDate = addYears(oldDate, 1);
      setNewEffectiveTo(format(newDate, 'yyyy-MM-dd'));
    } catch {
      // Ignore
    }
  };

  // ==================== PERMISSION CHECK ====================

  const canManageRenewals = hasPermission(Permission.MANAGE_FIXED_REGISTRATIONS);

  // ==================== RENDER ====================

  return (
    <ProtectedRoute requiredPermissions={[Permission.MANAGE_FIXED_REGISTRATIONS]}>
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý yêu cầu gia hạn</h1>
            <p className="text-gray-600 mt-1">
              Quản lý và hoàn tất các yêu cầu gia hạn lịch làm việc
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchRenewals}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{renewalStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Tổng cộng</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{renewalStats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">Chờ phản hồi</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{renewalStats.confirmed}</p>
                <p className="text-xs text-gray-500 mt-1">Đã đồng ý</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{renewalStats.finalized}</p>
                <p className="text-xs text-gray-500 mt-1">Đã hoàn tất</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{renewalStats.declined}</p>
                <p className="text-xs text-gray-500 mt-1">Đã từ chối</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{renewalStats.expired}</p>
                <p className="text-xs text-gray-500 mt-1">Đã quá hạn</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="statusFilter">Trạng thái</Label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RenewalStatus | 'ALL')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value={RenewalStatus.PENDING_ACTION}>Chờ phản hồi</option>
                  <option value={RenewalStatus.CONFIRMED}>Đã đồng ý</option>
                  <option value={RenewalStatus.DECLINED}>Đã từ chối</option>
                  <option value={RenewalStatus.FINALIZED}>Đã hoàn tất</option>
                  <option value={RenewalStatus.EXPIRED}>Đã quá hạn</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="employeeFilter">Nhân viên</Label>
                <select
                  id="employeeFilter"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingEmployees}
                >
                  <option value="ALL">Tất cả nhân viên</option>
                  {employees.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewals Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách Renewal Requests ({filteredRenewals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Đang tải...</span>
              </div>
            ) : filteredRenewals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Không có renewal request nào phù hợp với bộ lọc
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Renewal ID</th>
                      <th className="text-left p-3 font-medium">Nhân viên</th>
                      <th className="text-left p-3 font-medium">Ca làm việc</th>
                      <th className="text-left p-3 font-medium">Thời gian hiệu lực</th>
                      <th className="text-left p-3 font-medium">Trạng thái</th>
                      <th className="text-left p-3 font-medium">Deadline</th>
                      <th className="text-left p-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRenewals.map((renewal) => {
                      const statusBadge = getStatusBadge(renewal.status);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <tr key={renewal.renewalId} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <span className="font-mono text-sm">{renewal.renewalId}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{renewal.employeeName}</div>
                            <div className="text-sm text-gray-500">ID: {renewal.employeeId}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{renewal.workShiftName}</div>
                            <div className="text-sm text-gray-500">{renewal.shiftDetails}</div>
                          </td>
                          <td className="p-3 text-sm">
                            {formatDate(renewal.effectiveFrom)} → {formatDate(renewal.effectiveTo)}
                          </td>
                          <td className="p-3">
                            <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
                              <StatusIcon className={`h-3 w-3 ${statusBadge.color}`} />
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {renewal.expiresAt ? formatDateTime(renewal.expiresAt) : 'N/A'}
                          </td>
                          <td className="p-3">
                            {renewal.status === RenewalStatus.CONFIRMED && canManageRenewals && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenFinalizeModal(renewal)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Finalize
                              </Button>
                            )}
                            {renewal.status !== RenewalStatus.CONFIRMED && (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finalize Modal */}
        {showFinalizeModal && selectedRenewal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Hoàn tất gia hạn</h2>

              {/* Thông tin renewal */}
              <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Nhân viên:</strong> {selectedRenewal.employeeName}
                </p>
                <p className="text-sm">
                  <strong>Ca làm việc:</strong> {selectedRenewal.workShiftName}
                </p>
                <p className="text-sm">
                  <strong>Chi tiết:</strong> {selectedRenewal.shiftDetails}
                </p>
                <p className="text-sm">
                  <strong>Thời gian hiện tại:</strong> {formatDate(selectedRenewal.effectiveFrom)} → {formatDate(selectedRenewal.effectiveTo)}
                </p>
              </div>

              {/* Date picker */}
              <div className="mb-4">
                <Label htmlFor="newEffectiveTo" className="text-sm font-medium mb-2 block">
                  Ngày hết hạn mới <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newEffectiveTo"
                  type="date"
                  value={newEffectiveTo}
                  onChange={(e) => setNewEffectiveTo(e.target.value)}
                  className="mt-1"
                  disabled={finalizing}
                  min={selectedRenewal.effectiveTo ? format(parseISO(selectedRenewal.effectiveTo), 'yyyy-MM-dd') : undefined}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ngày hết hạn mới phải sau {formatDate(selectedRenewal.effectiveTo)}
                </p>
              </div>

              {/* Quick actions */}
              <div className="mb-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAction3Months}
                  disabled={finalizing}
                >
                  + 3 tháng
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAction6Months}
                  disabled={finalizing}
                >
                  + 6 tháng
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAction1Year}
                  disabled={finalizing}
                >
                  + 1 năm
                </Button>
              </div>

              {/* Info message */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Sau khi finalize, hệ thống sẽ tự động:
                  <br />• Vô hiệu hóa lịch cũ
                  <br />• Tạo lịch mới từ {formatDate(selectedRenewal.effectiveTo)} + 1 ngày
                  <br />• Copy days of week từ lịch cũ
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseFinalizeModal}
                  disabled={finalizing}
                >
                  Hủy
                </Button>
                <Button
                  variant="default"
                  onClick={handleFinalizeRenewal}
                  disabled={finalizing || !newEffectiveTo}
                  className="flex items-center gap-2"
                >
                  {finalizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Hoàn tất
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

