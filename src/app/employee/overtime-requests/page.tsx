'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faPlus,
  faEye,
  faBan,
  faCalendarAlt,
  faClock,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CustomSelect from '@/components/ui/custom-select';

import { OvertimeService } from '@/services/overtimeService';
import { workShiftService } from '@/services/workShiftService';
import { validateOvertimeForm, showOvertimeError } from '@/utils/overtimeErrorHandler';
import { toast } from 'sonner';
import {
  OvertimeRequest,
  OvertimeStatus,
  OVERTIME_STATUS_CONFIG,
} from '@/types/overtime';
import { WorkShift } from '@/types/workShift';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeToHHMM } from '@/lib/utils';

interface OvertimeRequestFormData {
  employeeId: number;
  workDate: string;
  workShiftId: string;
  reason: string;
}

export default function EmployeeOvertimeRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | 'ALL'>('ALL');

  // Modal states for manager functions
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [formData, setFormData] = useState<OvertimeRequestFormData>({
    employeeId: Number(user?.employeeId) || 0,
    workDate: '',
    workShiftId: '',
    reason: '',
  });

  // Check if user already has PENDING or APPROVED overtime for selected date
  const hasExistingOvertimeForDate = (date: string): boolean => {
    if (!date || !user?.employeeId) return false;
    return overtimeRequests.some(
      req => req.workDate === date &&
        req.employeeId === Number(user.employeeId) &&
        (req.status === 'PENDING' || req.status === 'APPROVED')
    );
  };

  const canSubmitOvertime = !hasExistingOvertimeForDate(formData.workDate);

  // Update formData when user changes
  useEffect(() => {
    if (user?.employeeId) {
      setFormData(prev => ({
        ...prev,
        employeeId: Number(user.employeeId)
      }));
    }
  }, [user?.employeeId]);

  // Load overtime requests
  useEffect(() => {
    loadOvertimeRequests();
    loadWorkShifts();
  }, []);

  const loadOvertimeRequests = async () => {
    try {
      setLoading(true);
      const response = await OvertimeService.getOvertimeRequests({
        page: 0,
        size: 50,
        sort: 'createdAt,desc',
      });
      setOvertimeRequests(response.content);
    } catch (error) {
      console.error('Error loading overtime requests:', error);
    } finally {
      setLoading(false);
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
      // Employee tạo cho chính mình - KHÔNG gửi employeeId (backend tự lấy từ JWT)
      const requestData: any = {
        workDate: formData.workDate,
        workShiftId: formData.workShiftId,
        reason: formData.reason
        //  KHÔNG gửi employeeId - backend tự động lấy từ JWT token
      };

      // Validate form data (không cần employeeId)
      const validationError = validateOvertimeForm(requestData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(' Employee creating overtime request (self):', {
          requestData,
          user: {
            employeeId: user?.employeeId,
            username: user?.username,
          }
        });
      }

      // Show loading toast
      const loadingToast = toast.loading('Đang tạo yêu cầu làm thêm giờ...');

      const response = await OvertimeService.createOvertimeRequest(requestData);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Success notification
      toast.success('Tạo yêu cầu làm thêm giờ thành công!', {
        description: `Mã yêu cầu: ${response.requestId} - Trạng thái: ${response.status}`,
        duration: 5000,
      });

      setShowCreateForm(false);
      setFormData({
        employeeId: 0,
        workDate: '',
        workShiftId: '',
        reason: '',
      });
      loadOvertimeRequests();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating overtime request:', error);
      }
      showOvertimeError(error);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;

    try {
      if (!cancelReason.trim()) {
        toast.error('Vui lòng nhập lý do hủy');
        return;
      }

      const loadingToast = toast.loading('Đang hủy yêu cầu...');

      await OvertimeService.cancelOvertimeRequest(selectedRequest.requestId, cancelReason);

      toast.dismiss(loadingToast);
      toast.success('Hủy yêu cầu thành công!');

      setShowCancelModal(false);
      setCancelReason('');
      setSelectedRequest(null);
      loadOvertimeRequests();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error cancelling request:', error);
      }
      showOvertimeError(error);
    }
  };

  const openCancelModal = (request: OvertimeRequest) => {
    setSelectedRequest(request);
    setCancelReason('');
    setShowCancelModal(true);
  };



  const filteredRequests = overtimeRequests.filter((request) => {
    const matchesSearch =
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const canCreate = user?.permissions?.includes('CREATE_OT') || user?.permissions?.includes('CREATE_OVERTIME');
  const canCancelOwn = user?.permissions?.includes('CANCEL_OT_OWN') || user?.permissions?.includes('CANCEL_OVERTIME_OWN');

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
          <h1 className="text-3xl font-bold text-gray-900">Yêu Cầu Làm Thêm Giờ</h1>
          <p className="text-gray-600 mt-2">Xem và tạo yêu cầu làm thêm giờ của bạn</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#8b5fbf] hover:bg-[#7a4fb0]"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Tạo yêu cầu
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Tìm kiếm</Label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
              />
              <Input
                id="search"
                placeholder="Tìm theo mã yêu cầu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <CustomSelect
              label="Trạng thái"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as OvertimeStatus | 'ALL')}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                { value: OvertimeStatus.PENDING, label: 'Chờ duyệt' },
                { value: OvertimeStatus.APPROVED, label: 'Đã duyệt' },
                { value: OvertimeStatus.REJECTED, label: 'Từ chối' },
                { value: OvertimeStatus.CANCELLED, label: 'Đã hủy' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Overtime Requests Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách yêu cầu làm thêm giờ</h3>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mã yêu cầu</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày làm việc</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ca làm việc</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const statusConfig = OVERTIME_STATUS_CONFIG[request.status];
                  return (
                    <tr key={request.requestId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{request.requestId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                          <span>{format(new Date(request.workDate), 'dd/MM/yyyy', { locale: vi })}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                          <span>{request.workShiftName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employee/overtime-requests/${request.requestId}`)}
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            Chi tiết
                          </Button>

                          {request.status === OvertimeStatus.PENDING && canCancelOwn && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-600 border-gray-600 hover:bg-gray-50"
                              onClick={() => openCancelModal(request)}
                            >
                              <FontAwesomeIcon icon={faBan} className="mr-1" />
                              Hủy
                            </Button>
                          )}
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
            <p className="text-gray-500">Bạn chưa có yêu cầu làm thêm giờ nào.</p>
            {canCreate && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-[#8b5fbf] hover:bg-[#7a4fb0]"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Tạo yêu cầu đầu tiên
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Tạo yêu cầu làm thêm giờ</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOvertimeRequest} className="space-y-4">
                <div>
                  <Label htmlFor="workDate">Ngày làm việc</Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {formData.workDate && hasExistingOvertimeForDate(formData.workDate) && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                         Bạn đã có đơn overtime cho ngày này rồi!
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Chỉ được gửi 1 đơn overtime cho mỗi ngày. Vui lòng kiểm tra danh sách đơn hiện tại.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <CustomSelect
                    label="Ca làm việc"
                    value={formData.workShiftId}
                    onChange={(value) => setFormData({ ...formData, workShiftId: value })}
                    placeholder={workShifts.length === 0 ? "Đang tải danh sách ca làm việc..." : "Chọn ca làm việc"}
                    options={workShifts.map((shift) => ({
                      value: shift.workShiftId,
                      label: `${shift.shiftName} (${formatTimeToHHMM(shift.startTime)} - ${formatTimeToHHMM(shift.endTime)})`,
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Lý do</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Nhập lý do làm thêm giờ..."
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!canSubmitOvertime || !formData.workDate || !formData.workShiftId || !formData.reason}
                  >
                    {!canSubmitOvertime ? 'Đã có đơn cho ngày này' : 'Tạo yêu cầu'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Hủy yêu cầu làm thêm giờ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Yêu cầu: <strong>{selectedRequest.requestId}</strong>
                </p>

                <div>
                  <Label htmlFor="cancelReason">Lý do <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do yêu cầu..."
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCancelRequest}
                    disabled={!cancelReason.trim()}
                    className="flex-1"
                  >
                    Hủy yêu cầu
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1"
                  >
                    Đóng
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
