'use client';

/**
 * Patient Appointment Detail Page
 * 
 * Displays detailed appointment information (read-only):
 * - Patient information (read-only)
 * - Appointment details (code, status, time, duration, services)
 * - Doctor information
 * - Room information
 * - Participants (if any)
 * - Notes
 * - Placeholder tabs/links for medical history and treatment plans
 * 
 * NO Actions: Patients cannot update status, delay, reschedule, or cancel appointments
 * 
 * RBAC: Backend automatically filters by patientId from JWT token for VIEW_APPOINTMENT_OWN
 * - VIEW_APPOINTMENT_OWN: Can only view their own appointments
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { appointmentService } from '@/services/appointmentService';
import {
  AppointmentDetailDTO,
  AppointmentStatus,
  APPOINTMENT_STATUS_COLORS,
} from '@/types/appointment';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  UserCog,
  Building2,
  FileText,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  const appointmentCode = params?.appointmentCode as string;

  // State
  const [appointment, setAppointment] = useState<AppointmentDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Permissions
  // Patients only have VIEW_APPOINTMENT_OWN - backend automatically filters by patientId
  const canViewOwn = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canView = canViewOwn;

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Load appointment - only once on mount
  // NOTE: Backend automatically filters by patientId from JWT token for VIEW_APPOINTMENT_OWN
  useEffect(() => {
    if (!appointmentCode || !canView) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isMounted = true;

    const loadAppointment = async () => {
      try {
        setLoading(true);
        // Use P3.4 endpoint to get appointment detail
        // Backend will automatically apply RBAC filtering based on JWT token
        const detail = await appointmentService.getAppointmentDetail(appointmentCode);
        
        // Check if request was cancelled or component unmounted
        if (abortController.signal.aborted || !isMounted) return;
        
        setAppointment(detail);
      } catch (error: any) {
        // Don't show error if request was cancelled
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading appointment:', error);
        handleErrorRef.current(error);
      } finally {
        if (!abortController.signal.aborted && isMounted) {
          setLoading(false);
        }
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    loadAppointment();

    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [appointmentCode, canView]);

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusInfo = APPOINTMENT_STATUS_COLORS[status];
    return (
      <Badge
        style={{
          backgroundColor: statusInfo.bg,
          borderColor: statusInfo.border,
          color: 'white',
        }}
      >
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateTimeStr;
    }
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem lịch hẹn." />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/patient/appointments')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy lịch hẹn.</p>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredBaseRole="patient"
      requiredPermissions={['VIEW_APPOINTMENT_OWN']}
      requireAll={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/patient/appointments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi Tiết Lịch Hẹn</h1>
              <p className="text-gray-600 mt-1">Mã lịch hẹn: {appointment.appointmentCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(appointment.status)}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Chi Tiết
            </TabsTrigger>
            <TabsTrigger value="patient">
              <User className="h-4 w-4 mr-2" />
              Thông Tin Bệnh Nhân
            </TabsTrigger>
            <TabsTrigger value="medical-history" disabled>
              <Stethoscope className="h-4 w-4 mr-2" />
              Bệnh Án
            </TabsTrigger>
            <TabsTrigger value="treatment-plan" disabled>
              <ClipboardList className="h-4 w-4 mr-2" />
              Kế Hoạch Điều Trị
            </TabsTrigger>
          </TabsList>

          {/* Appointment Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thông Tin Lịch Hẹn
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mã Lịch Hẹn</label>
                    <p className="text-base font-semibold">{appointment.appointmentCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Trạng Thái</label>
                    <div className="mt-1">{getStatusBadge(appointment.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Thời Gian Bắt Đầu
                    </label>
                    <p className="text-base">{formatDateTime(appointment.appointmentStartTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thời Gian Kết Thúc</label>
                    <p className="text-base">{formatDateTime(appointment.appointmentEndTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thời Lượng Dự Kiến</label>
                    <p className="text-base">{appointment.expectedDurationMinutes} phút</p>
                  </div>
                  {appointment.actualStartTime && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Thời Gian Bắt Đầu Thực Tế</label>
                      <p className="text-base">{formatDateTime(appointment.actualStartTime)}</p>
                    </div>
                  )}
                  {appointment.actualEndTime && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Thời Gian Kết Thúc Thực Tế</label>
                      <p className="text-base">{formatDateTime(appointment.actualEndTime)}</p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ghi Chú</label>
                      <p className="text-base">{appointment.notes}</p>
                    </div>
                  )}
                  {appointment.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ngày Tạo</label>
                      <p className="text-base text-sm text-muted-foreground">{formatDateTime(appointment.createdAt)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Doctor & Room Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Bác Sĩ & Phòng
                </h3>
                <div className="space-y-4">
                  {appointment.doctor ? (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bác Sĩ</label>
                      <div className="mt-1">
                        <p className="text-base font-semibold">{appointment.doctor.fullName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.doctor.employeeCode}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bác Sĩ</label>
                      <p className="text-base text-muted-foreground">N/A</p>
                    </div>
                  )}
                  {appointment.room ? (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Phòng
                      </label>
                      <div className="mt-1">
                        <p className="text-base font-semibold">{appointment.room.roomName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.room.roomCode}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phòng</label>
                      <p className="text-base text-muted-foreground">N/A</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Services */}
              <Card className="p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Dịch Vụ</h3>
                <div className="flex flex-wrap gap-2">
                  {appointment.services.length > 0 ? (
                    appointment.services.map((service) => (
                      <Badge key={service.serviceCode} variant="outline" className="text-sm p-2">
                        {service.serviceName} ({service.serviceCode})
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Không có dịch vụ nào</p>
                  )}
                </div>
              </Card>

              {/* Participants */}
              {appointment.participants && appointment.participants.length > 0 && (
                <Card className="p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Người Tham Gia</h3>
                  <div className="space-y-2">
                    {appointment.participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{participant.fullName}</p>
                          <p className="text-sm text-muted-foreground">{participant.employeeCode}</p>
                        </div>
                        <Badge variant="secondary">{participant.role}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Patient Information Tab */}
          <TabsContent value="patient" className="space-y-4">
            {appointment.patient ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông Tin Bệnh Nhân
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mã Bệnh Nhân</label>
                    <p className="text-base font-semibold">{appointment.patient.patientCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Họ Tên</label>
                    <p className="text-base">{appointment.patient.fullName}</p>
                  </div>
                  {appointment.patient.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Số Điện Thoại</label>
                      <p className="text-base">{appointment.patient.phone}</p>
                    </div>
                  )}
                  {appointment.patient.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ngày Sinh</label>
                      <p className="text-base">{format(new Date(appointment.patient.dateOfBirth), 'dd/MM/yyyy')}</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground">Thông tin bệnh nhân không có sẵn</p>
              </Card>
            )}
          </TabsContent>

          {/* Medical History Tab (Placeholder) */}
          <TabsContent value="medical-history">
            <Card className="p-6">
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bệnh Án</h3>
                <p className="text-muted-foreground mb-4">
                  Tính năng này sẽ sớm có sẵn. Bệnh án sẽ được hiển thị ở đây.
                </p>
                <Button variant="outline" disabled>
                  Xem Bệnh Án
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Treatment Plan Tab (Placeholder) */}
          <TabsContent value="treatment-plan">
            <Card className="p-6">
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Kế Hoạch Điều Trị</h3>
                <p className="text-muted-foreground mb-4">
                  Tính năng này sẽ sớm có sẵn. Kế hoạch điều trị sẽ được hiển thị ở đây.
                </p>
                <Button variant="outline" disabled>
                  Xem Kế Hoạch Điều Trị
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}


