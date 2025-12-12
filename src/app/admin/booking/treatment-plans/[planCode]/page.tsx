'use client';

/**
 * Admin Treatment Plan Detail Page
 * 
 * Displays detailed treatment plan information including:
 * - Plan metadata (code, name, status, dates, financial info)
 * - Doctor and patient information
 * - Progress summary
 * - Phases with items and linked appointments
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { TreatmentPlanDetailResponse, PlanItemStatus, ItemDetailDTO } from '@/types/treatmentPlan';
import TreatmentPlanDetail from '@/components/treatment-plans/TreatmentPlanDetail';
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal';

export default function AdminTreatmentPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  const planCode = params?.planCode as string;
  const patientCode = searchParams.get('patientCode') || '';

  // State
  const [plan, setPlan] = useState<TreatmentPlanDetailResponse | null>(null);
  // Phase 5: Appointment booking from plan items
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [prefilledAppointmentData, setPrefilledAppointmentData] = useState<{
    patientCode?: string;
    serviceCodes?: string[];
    planItemIds?: number[];
  }>({});
  const [loading, setLoading] = useState(true);

  // Permissions
  const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_ALL') || false;

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Load treatment plan detail
  useEffect(() => {
    if (!planCode || !patientCode || !canView) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isMounted = true;

    const loadPlan = async () => {
      try {
        setLoading(true);

        // Backend fix applied: planCode is now included in summary DTO
        // No more workaround needed - planCode should always be available
        // If numeric, it's likely a legacy patientPlanId from old navigation
        // In that case, we should redirect to list page or show error

        const isNumeric = /^\d+$/.test(planCode);

        if (isNumeric) {
          // Legacy patientPlanId - should not happen if navigation uses planCode
          // Redirect to list page with helpful message
          console.warn('Received numeric planCode (likely patientPlanId). Redirecting to list page.');
          toast.error('Mã lộ trình không hợp lệ', {
            description: 'Vui lòng chọn lộ trình từ danh sách để xem chi tiết.',
          });
          router.push(`/admin/booking/treatment-plans?patientCode=${patientCode}`);
          return;
        }

        // planCode is actual planCode, use it directly
        const detail = await TreatmentPlanService.getTreatmentPlanDetail(
          patientCode,
          planCode
        );

        // Check if request was cancelled or component unmounted
        if (abortController.signal.aborted || !isMounted) return;

        setPlan(detail);
      } catch (error: any) {
        // Don't show error if request was cancelled
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading treatment plan:', error);

        // Check if 404 - plan not found
        if (error.response?.status === 404 || error.message === 'Plan not found') {
          toast.error('Lộ trình điều trị không tồn tại', {
            description: error.response?.data?.message || 'Không tìm thấy lộ trình điều trị',
          });
          router.push(`/admin/booking/treatment-plans?patientCode=${patientCode}`);
          return;
        }

        handleErrorRef.current(error);
      } finally {
        // Only update loading state if request wasn't cancelled and component is mounted
        if (!abortController.signal.aborted && isMounted) {
          setLoading(false);
        }
        // Clear abort controller reference
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    loadPlan();

    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [planCode, patientCode, canView, router]);

  // Handle view appointment
  const handleViewAppointment = (appointmentCode: string) => {
    router.push(`/admin/booking/appointments/${appointmentCode}`);
  };

  // Phase 5: Handle book appointment from item
  const handleBookAppointment = async (itemId: number) => {
    if (!plan) {
      toast.error('Không tìm thấy lộ trình điều trị');
      return;
    }

    // Find item in plan
    const item = plan.phases
      .flatMap(phase => phase.items)
      .find(i => i.itemId === itemId);

    if (!item) {
      toast.error('Không tìm thấy hạng mục');
      return;
    }

    // Validate item status
    if (item.status !== PlanItemStatus.READY_FOR_BOOKING) {
      toast.error('Hạng mục này chưa sẵn sàng để đặt lịch', {
        description: `Trạng thái hiện tại: ${item.status}. Chỉ có thể đặt lịch cho hạng mục ở trạng thái READY_FOR_BOOKING.`,
      });
      return;
    }

    // Validate plan approval status
    if (plan.approvalStatus !== 'APPROVED') {
      toast.error('Lộ trình chưa được duyệt', {
        description: 'Chỉ có thể đặt lịch cho lộ trình đã được duyệt (APPROVED).',
      });
      return;
    }

    const serviceCode = item.serviceCode;

    if (!serviceCode) {
      toast.error('Không tìm thấy mã dịch vụ');
      return;
    }

    // Set pre-filled data
    setPrefilledAppointmentData({
      patientCode: plan.patient.patientCode,
      planItemIds: [itemId],
    });

    setShowAppointmentModal(true);
  };

  const handleBookSelectedPlanItems = (items: ItemDetailDTO[]) => {
    if (!plan) {
      toast.error('Không tìm thấy lộ trình điều trị');
      return;
    }
    if (!items.length) {
      toast.error('Vui lòng chọn ít nhất một hạng mục READY_FOR_BOOKING');
      return;
    }

    setPrefilledAppointmentData({
      patientCode: plan.patient.patientCode,
      planItemIds: items.map((item) => item.itemId),
    });

    setShowAppointmentModal(true);
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem lộ trình điều trị." />;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Đang tải thông tin lộ trình điều trị...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy lộ trình điều trị</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/booking/treatment-plans')}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_ALL']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/booking/treatment-plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết lộ trình điều trị</h1>
              <p className="text-muted-foreground mt-1">
                Xem thông tin chi tiết và tiến độ điều trị
              </p>
            </div>
          </div>
        </div>

        {/* Plan Detail */}
        <TreatmentPlanDetail
          plan={plan}
          onViewAppointment={handleViewAppointment}
          onBookAppointment={handleBookAppointment}
          showActions={true}
          onBookPlanItems={handleBookSelectedPlanItems}
        />

        {/* Phase 5: Appointment Booking Modal */}
        <CreateAppointmentModal
          open={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setPrefilledAppointmentData({});
          }}
          onSuccess={() => {
            setShowAppointmentModal(false);
            setPrefilledAppointmentData({});
            // Refresh plan data to show updated item status (READY_FOR_BOOKING → SCHEDULED)
            // Note: This page doesn't have handlePlanUpdated, so we'll reload the page
            window.location.reload();
            toast.success('Đặt lịch thành công', {
              description: 'Lịch hẹn đã được tạo và liên kết với hạng mục. Trạng thái hạng mục đã được cập nhật.',
            });
          }}
          initialPatientCode={prefilledAppointmentData.patientCode}
          initialServiceCodes={prefilledAppointmentData.serviceCodes}
          initialPlanItemIds={prefilledAppointmentData.planItemIds}
        />
      </div>
    </ProtectedRoute>
  );
}

