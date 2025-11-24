'use client';

/**
 * Patient Treatment Plan Detail Page
 * 
 * Displays detailed treatment plan information for patient (read-only):
 * - Plan metadata (code, name, status, dates, financial info)
 * - Doctor and patient information
 * - Progress summary
 * - Phases with items and linked appointments
 * 
 * RBAC: VIEW_TREATMENT_PLAN_OWN permission
 * Backend automatically verifies patient owns the plan
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { TreatmentPlanDetailResponse } from '@/types/treatmentPlan';
import TreatmentPlanDetail from '@/components/treatment-plans/TreatmentPlanDetail';
import { getPatientCodeFromToken } from '@/lib/utils';

export default function PatientTreatmentPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  const planCode = params?.planCode as string;
  
  // Get patientCode from JWT token
  const [patientCode, setPatientCode] = useState<string>(() => {
    if (user?.token) {
      const code = getPatientCodeFromToken(user.token);
      return code || '';
    }
    return '';
  });

  // Update patientCode when user token changes
  useEffect(() => {
    if (user?.token) {
      const code = getPatientCodeFromToken(user.token);
      if (code) {
        setPatientCode(code);
      }
    }
  }, [user?.token]);

  // State
  const [plan, setPlan] = useState<TreatmentPlanDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Permissions
  const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_OWN') || false;

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Load treatment plan detail
  useEffect(() => {
    if (!planCode || !canView) return;

    // Get patientCode from JWT token if not already set
    if (!patientCode && user?.token) {
      const code = getPatientCodeFromToken(user.token);
      if (code) {
        setPatientCode(code);
        return; // Will retry on next render
      }
    }

    if (!patientCode) {
      console.warn('Patient code not found in JWT token');
      toast.error('Không tìm thấy mã bệnh nhân. Vui lòng đăng nhập lại.');
      return;
    }

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
        
        // ✅ Backend fix applied: planCode is now included in summary DTO
        // No more workaround needed
        const isNumeric = /^\d+$/.test(planCode);
        
        if (isNumeric) {
          // Legacy patientPlanId - redirect to list page
          console.warn('⚠️ Received numeric planCode (likely patientPlanId). Redirecting to list page.');
          toast.error('Mã lộ trình không hợp lệ', {
            description: 'Vui lòng chọn lộ trình từ danh sách để xem chi tiết.',
          });
          router.push('/patient/treatment-plans');
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
        if (error.response?.status === 404 || error.message?.includes('Plan not found')) {
          toast.error('Lộ trình điều trị không tồn tại', {
            description: error.response?.data?.message || 'Không tìm thấy lộ trình điều trị',
          });
          router.push('/patient/treatment-plans');
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

  // Handle view appointment (read-only for patients)
  const handleViewAppointment = (appointmentCode: string) => {
    router.push(`/patient/appointments/${appointmentCode}`);
  };

  // Handle book appointment from item (not available for patients in this phase)
  const handleBookAppointment = (itemId: number) => {
    toast.info('Vui lòng liên hệ phòng khám để đặt lịch hẹn');
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem lộ trình điều trị." />;
  }

  if (!patientCode) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy mã bệnh nhân. Vui lòng đăng nhập lại.</p>
        </div>
      </div>
    );
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
            onClick={() => router.push('/patient/treatment-plans')}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_OWN']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/patient/treatment-plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết Lộ trình Điều trị</h1>
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
          showActions={false} // Read-only for patients
        />
      </div>
    </ProtectedRoute>
  );
}

