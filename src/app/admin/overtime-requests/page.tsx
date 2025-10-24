'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faPlus,
  faEye,
  faCheck,
  faTimes,
  faBan,
  faCalendarAlt,
  faUser,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Select from '@/components/ui/select';

import { OvertimeService } from '@/services/overtimeService';
import { employeeService } from '@/services/employeeService';
import { workShiftService } from '@/services/workShiftService';
import { validateOvertimeForm, showOvertimeError } from '@/utils/overtimeErrorHandler';
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
  employeeId: number;
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
  const [statusAction, setStatusAction] = useState<'approve' | 'reject' | 'cancel'>('approve');
  const [statusReason, setStatusReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | 'ALL'>('ALL');

  const [formData, setFormData] = useState<OvertimeRequestFormData>({
    employeeId: 0,
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

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({
        page: 0,
        size: 100,
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

      console.log('Admin creating overtime request:', formData);
      await OvertimeService.createOvertimeRequest(formData);
      setShowCreateForm(false);
      setFormData({
        employeeId: 0,
        workDate: '',
        workShiftId: '',
        reason: '',
      });
      loadOvertimeRequests();
      alert('Tạo yêu cầu làm thêm giờ thành công!');
    } catch (error: any) {
      console.error('Error creating overtime request:', error);
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

  const filteredRequests = overtimeRequests.filter((request) => {
    const matchesSearch = 
      request.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canApprove = user?.permissions?.includes('APPROVE_OT');
  const canReject = user?.permissions?.includes('REJECT_OT');
  const canCancel = user?.permissions?.includes('CANCEL_OT_PENDING');
  const canCreate = user?.permissions?.includes('CREATE_OT') || user?.permissions?.includes('CREATE_OVERTIME');

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
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Tạo yêu cầu
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <Input
                id="search"
                placeholder="Tìm theo mã yêu cầu hoặc tên nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select
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
        </CardContent>
      </Card>

      {/* Overtime Requests List */}
      <div className="grid gap-4">
        {filteredRequests.map((request) => {
          const statusConfig = OVERTIME_STATUS_CONFIG[request.status];
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
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                        <span>{request.employeeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        <span>{format(new Date(request.workDate), 'dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                        <span>{request.workShiftName}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mt-3">{request.reason}</p>
                    
                    {request.rejectedReason && (
                      <p className="text-red-600 mt-2">
                        <strong>Lý do từ chối:</strong> {request.rejectedReason}
                      </p>
                    )}
                    
                    {request.cancellationReason && (
                      <p className="text-gray-600 mt-2">
                        <strong>Lý do hủy:</strong> {request.cancellationReason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/overtime-requests/${request.requestId}`)}
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-1" />
                      Chi tiết
                    </Button>
                    
                    {request.status === OvertimeStatus.PENDING && (
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
                        
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-600 hover:bg-gray-50"
                            onClick={() => openStatusModal(request, 'cancel')}
                          >
                            <FontAwesomeIcon icon={faBan} className="mr-1" />
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
            <p className="text-gray-500">Không có yêu cầu làm thêm giờ nào.</p>
          </CardContent>
        </Card>
      )}

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
                  <Label htmlFor="employeeId">Nhân viên</Label>
                  <Select
                    label="Chọn nhân viên"
                    value={formData.employeeId.toString()}
                    onChange={(value) => setFormData({ ...formData, employeeId: parseInt(value) })}
                    options={employees.map((employee) => ({
                      value: employee.employeeId.toString(),
                      label: `${employee.fullName} (${employee.employeeCode})`,
                    }))}
                    placeholder={employees.length === 0 ? "Đang tải danh sách nhân viên..." : "Chọn nhân viên"}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="workDate">Ngày làm việc</Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={formData.workDate}
                    onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="workShiftId">Ca làm việc</Label>
                  <Select
                    label="Chọn ca làm việc"
                    value={formData.workShiftId}
                    onChange={(value) => setFormData({ ...formData, workShiftId: value })}
                    placeholder={workShifts.length === 0 ? "Đang tải danh sách ca làm việc..." : "Chọn ca làm việc"}
                    options={workShifts.map((shift) => ({
                      value: shift.workShiftId,
                      label: `${shift.shiftName} (${shift.startTime} - ${shift.endTime})`,
                    }))}
                    required
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
                  <Button type="submit" className="flex-1">
                    Tạo yêu cầu
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

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                      {statusAction === 'reject' ? 'Lý do từ chối' : 'Lý do hủy'} *
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
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={statusAction !== 'approve' && !statusReason.trim()}
                    className="flex-1"
                  >
                    {statusAction === 'approve' && 'Duyệt'}
                    {statusAction === 'reject' && 'Từ chối'}
                    {statusAction === 'cancel' && 'Hủy'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1"
                  >
                    Hủy
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
