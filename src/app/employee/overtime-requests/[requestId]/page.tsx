'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  faArrowLeft,
  faUser,
  faCalendarAlt,
  faClock,
  faFileText,
  faCheckCircle,
  faTimes,
  faBan,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { OvertimeService } from '@/services/overtimeService';
import {
  OvertimeRequestDetail,
  OvertimeStatus,
  OVERTIME_STATUS_CONFIG,
} from '@/types/overtime';
import { formatTimeToHHMM } from '@/lib/utils';

export default function EmployeeOvertimeRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<OvertimeRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      loadOvertimeRequest();
    }
  }, [requestId]);

  const loadOvertimeRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await OvertimeService.getOvertimeRequestById(requestId);
      setRequest(response);
    } catch (error) {
      console.error('Error loading overtime request:', error);
      setError('Không thể tải thông tin yêu cầu làm thêm giờ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: OvertimeStatus) => {
    return OVERTIME_STATUS_CONFIG[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
      icon: faEye,
    };
  };

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
      return dateTime;
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredBaseRole="employee">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !request) {
    return (
      <ProtectedRoute requiredBaseRole="employee">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi</h2>
            <p className="text-gray-600 mb-4">{error || 'Không tìm thấy yêu cầu làm thêm giờ'}</p>
            <Button onClick={() => router.back()}>
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const statusConfig = getStatusConfig(request.status);

  return (
    <ProtectedRoute requiredBaseRole="employee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Chi tiết yêu cầu làm thêm giờ
              </h1>
              <p className="text-gray-600">Request ID: {request.requestId}</p>
            </div>
          </div>
          <Badge className={statusConfig.color}>
            <FontAwesomeIcon icon={statusConfig.icon} className="mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Thông tin nhân viên
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Mã nhân viên</label>
                <p className="text-lg font-semibold">{request.employee.employeeCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tên nhân viên</label>
                <p className="text-lg font-semibold">{request.employee.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Người tạo yêu cầu</label>
                <p className="text-lg font-semibold">{request.requestedBy.fullName}</p>
                <p className="text-sm text-gray-500">({request.requestedBy.employeeCode})</p>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Thông tin làm việc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Ngày làm việc</label>
                <p className="text-lg font-semibold">{formatDate(request.workDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ca làm việc</label>
                <p className="text-lg font-semibold">{request.workShift.shiftName}</p>
                <p className="text-sm text-gray-500">
                  {formatTimeToHHMM(request.workShift.startTime)} - {formatTimeToHHMM(request.workShift.endTime)}
                </p>
                <p className="text-sm text-gray-500">
                  Thời lượng: {request.workShift.durationHours} giờ
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái hiện tại</label>
                <div className="mt-1">
                  <Badge className={statusConfig.color}>
                    <FontAwesomeIcon icon={statusConfig.icon} className="mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                <p className="text-lg font-semibold">{formatDateTime(request.createdAt)}</p>
              </div>
              {request.approvedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Người duyệt</label>
                  <p className="text-lg font-semibold">{request.approvedBy.fullName}</p>
                  <p className="text-sm text-gray-500">({request.approvedBy.employeeCode})</p>
                </div>
              )}
              {request.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày duyệt</label>
                  <p className="text-lg font-semibold">{formatDateTime(request.approvedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reason and Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faFileText} className="mr-2" />
                Lý do làm thêm giờ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{request.reason}</p>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-2" />
                Thông tin bổ sung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.rejectedReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Lý do từ chối</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{request.rejectedReason}</p>
                </div>
              )}
              {request.cancellationReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Lý do hủy</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{request.cancellationReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
