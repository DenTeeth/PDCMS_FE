'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Import types and services
import {
  ShiftRegistration,
  ShiftRegistrationQueryParams,
} from '@/types/shiftRegistration';
import { shiftRegistrationService } from '@/services/shiftRegistrationService';

// Day labels mapping - Short version
const getDayOfWeekLabel = (day: string): string => {
  const dayMap: Record<string, string> = {
    'MONDAY': 'T2',
    'TUESDAY': 'T3',
    'WEDNESDAY': 'T4',
    'THURSDAY': 'T5',
    'FRIDAY': 'T6',
    'SATURDAY': 'T7',
    'SUNDAY': 'CN'
  };
  return dayMap[day] || day;
};

// ==================== MAIN COMPONENT ====================
export default function RegistrationRequestsPage() {
  const { hasPermission } = useAuth();
  
  // State management
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([]);
  const [slotDetailsMap, setSlotDetailsMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<ShiftRegistration | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchRegistrations();
  }, [currentPage]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params: ShiftRegistrationQueryParams = {
        page: currentPage,
        size: 100, // Load nhiều hơn để hiển thị đầy đủ
        sortBy: 'registrationId',
        sortDirection: 'DESC' // Mới nhất lên đầu
      };

      // Add status filter if not ALL
      if (filterStatus !== 'ALL') {
        // Note: You may need to add status filter to the API
      }

      const response = await shiftRegistrationService.getRegistrations(params, 'part-time-flex');
      console.log(' Registrations:', response);

      // Handle both array and paginated responses
      if (Array.isArray(response)) {
        setRegistrations(response);
        setTotalElements(response.length);
        setTotalPages(1);
      } else {
        setRegistrations(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      }

      // Fetch slot details for each unique partTimeSlotId
      const uniqueSlotIds = [...new Set(
        (Array.isArray(response) ? response : response.content || [])
          .map((reg: ShiftRegistration) => reg.partTimeSlotId)
          .filter(Boolean)
      )];

      if (uniqueSlotIds.length > 0) {
        fetchSlotDetails(uniqueSlotIds);
      }
    } catch (error: any) {
      console.error('Failed to fetch registrations:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch slot details for quota information
  const fetchSlotDetails = async (slotIds: number[]) => {
    // Check permission before fetching slot details
    const canViewSlotDetails = hasPermission(Permission.VIEW_AVAILABLE_SLOTS) || 
                               hasPermission(Permission.MANAGE_WORK_SLOTS);
    
    if (!canViewSlotDetails) {
      console.log('[fetchSlotDetails] User does not have VIEW_AVAILABLE_SLOTS or MANAGE_WORK_SLOTS permission. Skipping slot details fetch.');
      return;
    }

    try {
      const detailsMap: Record<number, any> = {};

      // Fetch details for each slot
      await Promise.all(
        slotIds.map(async (slotId) => {
          try {
            const details = await shiftRegistrationService.getSlotDetails(slotId);
            detailsMap[slotId] = details;
          } catch (error: any) {
            // Handle 403 Forbidden gracefully (user doesn't have permission)
            if (error.response?.status === 403) {
              console.warn(`[fetchSlotDetails] No permission to view details for slot ${slotId}. User needs VIEW_AVAILABLE_SLOTS or MANAGE_WORK_SLOTS permission.`);
            } else {
              console.error(`[fetchSlotDetails] Failed to fetch details for slot ${slotId}:`, error);
            }
          }
        })
      );

      setSlotDetailsMap(detailsMap);
    } catch (error) {
      console.error('[fetchSlotDetails] Failed to fetch slot details:', error);
    }
  };

  // ==================== APPROVE/REJECT ====================
  const handleApprove = (registration: ShiftRegistration) => {
    setSelectedRegistration(registration);
    setShowApproveModal(true);
  };

  const handleReject = (registration: ShiftRegistration) => {
    setSelectedRegistration(registration);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRegistration) return;

    if (processing) return;

    try {
      setProcessing(true);
      await shiftRegistrationService.updateRegistrationStatus(
        selectedRegistration.registrationId.toString(),
        'APPROVED'
      );
      toast.success('Registration approved successfully!');
      setShowApproveModal(false);

      //  Refresh slot details to update quota immediately
      const slotId = selectedRegistration.partTimeSlotId;
      if (slotId) {
        try {
          const updatedDetails = await shiftRegistrationService.getSlotDetails(slotId);
          setSlotDetailsMap(prev => ({
            ...prev,
            [slotId]: updatedDetails
          }));
          console.log(' Slot details refreshed after approval:', updatedDetails);
        } catch (error) {
          console.error('Failed to refresh slot details:', error);
        }
      }

      setSelectedRegistration(null);
      await fetchRegistrations();
    } catch (error: any) {
      console.error('Failed to approve registration:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to approve registration';
      
      // Check for specific error types
      if (errorMsg.includes('đã có ca làm việc')) {
        // Existing shift conflict - show detailed message
        toast.error(errorMsg, { duration: 8000 });
      } else if (errorMsg.includes('Vượt giới hạn') && errorMsg.includes('h/tuần')) {
        // Weekly hours limit exceeded
        toast.error(errorMsg, { duration: 6000 });
      } else if (errorMsg.includes('tự phê duyệt')) {
        // Self-approval not allowed (BR-41)
        toast.error('❌ ' + errorMsg, { duration: 5000 });
      } else if (errorMsg.includes('quota') || errorMsg.includes('Slot đã đầy')) {
        // Quota exceeded
        toast.error('⚠️ ' + errorMsg);
      } else {
        // Generic error
        toast.error(errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRegistration) return;
    if (processing) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      setProcessing(true);
      await shiftRegistrationService.updateRegistrationStatus(
        selectedRegistration.registrationId.toString(),
        'REJECTED',
        rejectReason.trim()
      );
      toast.success('Registration rejected successfully!');
      setShowRejectModal(false);

      //  Refresh slot details to update quota immediately (in case rejection frees up slots)
      const slotId = selectedRegistration.partTimeSlotId;
      if (slotId) {
        try {
          const updatedDetails = await shiftRegistrationService.getSlotDetails(slotId);
          setSlotDetailsMap(prev => ({
            ...prev,
            [slotId]: updatedDetails
          }));
          console.log(' Slot details refreshed after rejection:', updatedDetails);
        } catch (error) {
          console.error('Failed to refresh slot details:', error);
        }
      }

      setSelectedRegistration(null);
      setRejectReason('');
      await fetchRegistrations();
    } catch (error: any) {
      console.error('Failed to reject registration:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to reject registration';
      
      if (errorMsg.includes('tự phê duyệt')) {
        // Self-approval related error
        toast.error('❌ ' + errorMsg, { duration: 5000 });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Chờ duyệt
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã duyệt
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Đã từ chối
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="outline" className="whitespace-nowrap">{status}</Badge>;
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    // Status filter
    if (filterStatus !== 'ALL' && reg.status !== filterStatus) {
      return false;
    }

    // Search filter (search by employee name, shift name)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesEmployeeName = reg.employeeName?.toLowerCase().includes(search);
      const matchesShiftName = reg.shiftName?.toLowerCase().includes(search);

      if (!matchesEmployeeName && !matchesShiftName) {
        return false;
      }
    }

    return true;
  }); const pendingCount = registrations.filter(r => r.status === 'PENDING').length;
  const approvedCount = registrations.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = registrations.filter(r => r.status === 'REJECTED').length;

  // ==================== RENDER ====================
  return (
    <ProtectedRoute requiredPermissions={[Permission.MANAGE_WORK_SLOTS]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yêu cầu đăng ký</h1>
            <p className="text-gray-600 mt-1">Xem xét và phê duyệt đăng ký ca làm việc của nhân viên</p>
          </div>
          <Button onClick={fetchRegistrations} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng số yêu cầu</p>
                  <p className="text-2xl font-bold">{totalElements}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Đang chờ</p>
                  <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Đã duyệt</p>
                  <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc & Tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Tên nhân viên, ca làm việc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="filterStatus">Trạng thái</Label>
                <select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Đang chờ</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Đã từ chối</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="space-y-2 flex flex-col justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('ALL');
                  }}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Yêu cầu đăng ký ({filteredRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Không tìm thấy yêu cầu đăng ký</p>
                <p className="text-sm">Thử điều chỉnh bộ lọc của bạn</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Nhân viên</th>
                      <th className="text-left p-3 font-medium">Ca làm</th>
                      <th className="text-left p-3 font-medium">Thứ</th>
                      <th className="text-left p-3 font-medium">Trạng thái</th>
                      <th className="text-left p-3 font-medium">Đăng ký lúc</th>
                      <th className="text-left p-3 font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((registration) => {
                      const slotDetails = slotDetailsMap[registration.partTimeSlotId];

                      return (
                        <tr key={registration.registrationId} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium text-gray-900">
                              {registration.employeeName || `Nhân viên #${registration.employeeId}`}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-medium text-gray-900">{registration.shiftName}</div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-gray-700">
                              {registration.dayOfWeek.split(',').map(d => getDayOfWeekLabel(d.trim())).join(', ')}
                            </span>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(registration.status)}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {formatDateTime(registration.createdAt)}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 items-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRegistration(registration);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Xem
                              </Button>
                              {registration.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-800 hover:bg-green-50 border-green-200"
                                    onClick={() => handleApprove(registration)}
                                    disabled={slotDetails && slotDetails.overallRemaining === 0}
                                    title={slotDetails && slotDetails.overallRemaining === 0 ? 'Slot đã đầy' : ''}
                                  >
                                    Phê duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-800 hover:bg-red-50 border-red-200"
                                    onClick={() => handleReject(registration)}
                                  >
                                    Từ chối
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, totalElements)} of {totalElements} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approve Modal */}
        {showApproveModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Phê duyệt đăng ký
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Bạn có chắc chắn muốn phê duyệt yêu cầu đăng ký này không?
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhân viên:</span>
                    <span className="font-medium">{selectedRegistration.employeeName || `Nhân viên #${selectedRegistration.employeeId}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ca làm việc:</span>
                    <span className="font-medium">{selectedRegistration.shiftName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giai đoạn:</span>
                    <span className="font-medium">
                      {formatDate(selectedRegistration.effectiveFrom)} - {formatDate(selectedRegistration.effectiveTo)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày làm việc:</span>
                    <span className="font-medium">{selectedRegistration.dates.length} ngày</span>
                  </div>
                </div>
              </div>
              <div className="border-t px-6 py-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRegistration(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={confirmApprove}
                  disabled={processing}
                  className="text-green-800 hover:bg-green-50 border-green-200"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang phê duyệt...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Phê duyệt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Từ chối đăng ký
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Vui lòng cung cấp lý do từ chối yêu cầu đăng ký này.
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhân viên:</span>
                    <span className="font-medium">{selectedRegistration.employeeName || `Nhân viên #${selectedRegistration.employeeId}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ca làm việc:</span>
                    <span className="font-medium">{selectedRegistration.shiftName}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rejectReason">
                    Reason <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                    placeholder="Nhập lý do từ chối..."
                    required
                  />
                </div>
              </div>
              <div className="border-t px-6 py-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRegistration(null);
                    setRejectReason('');
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmReject}
                  disabled={processing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang từ chối...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Từ chối
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Chi tiết đăng ký #{selectedRegistration.registrationId}
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nhân viên</p>
                    <p className="font-medium">{selectedRegistration.employeeName || `Nhân viên #${selectedRegistration.employeeId}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ca làm việc</p>
                    <p className="font-medium">{selectedRegistration.shiftName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thứ trong tuần</p>
                    <p className="font-medium">{selectedRegistration.dayOfWeek.split(',').map(d => getDayOfWeekLabel(d.trim())).join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    {getStatusBadge(selectedRegistration.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thời gian đăng ký</p>
                    <p className="font-medium">
                      {formatDate(selectedRegistration.effectiveFrom)} - {formatDate(selectedRegistration.effectiveTo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng số ngày làm việc</p>
                    <p className="font-medium">{selectedRegistration.dates?.length || 0} ngày</p>
                  </div>
                </div>

                {selectedRegistration.dates && selectedRegistration.dates.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Selected Dates:</p>
                    <div className="flex flex-wrap gap-2">
                      {[...selectedRegistration.dates]
                        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                        .map((date, idx) => (
                          <Badge key={idx} variant="outline">
                            {formatDate(date)}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Processing Information - Show if processed or has reason (for auto-cancelled) */}
                {(selectedRegistration.processedBy || selectedRegistration.reason || selectedRegistration.processedAt) && (
                  <div className={`p-4 rounded-lg ${
                    selectedRegistration.status === 'CANCELLED' 
                      ? 'bg-orange-50 border border-orange-200' 
                      : selectedRegistration.status === 'REJECTED'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className="text-sm font-medium mb-2">
                      {selectedRegistration.status === 'CANCELLED' && 'Lý do Hủy'}
                      {selectedRegistration.status === 'REJECTED' && 'Lý do Từ chối'}
                      {selectedRegistration.status === 'APPROVED' && 'Thông tin xử lý'}
                      {!['CANCELLED', 'REJECTED', 'APPROVED'].includes(selectedRegistration.status) && 'Thông tin xử lý'}
                    </p>
                    <div className="space-y-1 text-sm">
                      {selectedRegistration.processedBy && (
                        <p>Xử lý bởi: <span className="font-medium">{selectedRegistration.processedBy}</span></p>
                      )}
                      {selectedRegistration.processedAt && (
                        <p>Thời gian xử lý: <span className="font-medium">{formatDateTime(selectedRegistration.processedAt)}</span></p>
                      )}
                      {selectedRegistration.reason && (
                        <p className={`${selectedRegistration.status === 'CANCELLED' ? 'text-orange-900' : selectedRegistration.status === 'REJECTED' ? 'text-red-900' : 'text-gray-700'} italic`}>
                          "{selectedRegistration.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Ngày tạo</p>
                  <p className="font-medium">{formatDateTime(selectedRegistration.createdAt)}</p>
                </div>
              </div>
              <div className="border-t px-6 py-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRegistration(null);
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
