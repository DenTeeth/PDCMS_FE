'use client';

/**
 * Patient Treatment Plans List Page
 * 
 * Features:
 * - List view with pagination
 * - Filter by status
 * - View own treatment plan details only
 * - RBAC: VIEW_TREATMENT_PLAN_OWN permission
 * - Backend automatically filters by patient account from JWT token
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import {
  TreatmentPlanSummaryDTO,
  TreatmentPlanStatus,
} from '@/types/treatmentPlan';
import TreatmentPlanList from '@/components/treatment-plans/TreatmentPlanList';
import TreatmentPlanFilters, { TreatmentPlanFilters as FiltersType } from '@/components/treatment-plans/TreatmentPlanFilters';
import { getPatientCodeFromToken } from '@/lib/utils';

export default function PatientTreatmentPlansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [plans, setPlans] = useState<TreatmentPlanSummaryDTO[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Filter states (no patientCode filter for patient - they only see their own)
  const [filters, setFilters] = useState<FiltersType>({
    status: undefined,
    searchTerm: undefined,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Permissions
  const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_OWN') || false;

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Function to load treatment plans (extracted for reuse)
  const loadPlans = useCallback(async () => {
    if (!canView) return;

    // Get patientCode from JWT token if not already set
    let targetPatientCode = patientCode;
    if (!targetPatientCode && user?.token) {
      const code = getPatientCodeFromToken(user.token);
      if (code) {
        targetPatientCode = code;
        setPatientCode(code);
      }
    }

    if (!targetPatientCode) {
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

    try {
      setLoading(true);
      // Backend fix applied: Use pagination support
      const pageResponse = await TreatmentPlanService.getTreatmentPlans(
        targetPatientCode,
        currentPage,
        pageSize,
        'patientPlanId,desc' // Sort by plan ID (newest first)
      );

      // Check if request was cancelled or component unmounted
      if (abortController.signal.aborted || !isMounted) return;

      const plansWithCalculatedStatus = pageResponse.content;

      let filteredData = plansWithCalculatedStatus;
      // Apply status filter if any (client-side for now)
      if (filters.status) {
        filteredData = plansWithCalculatedStatus.filter((plan) => plan.status === filters.status);
      }

      setPlans(filteredData);
      // Use pagination metadata from backend
      setTotalPages(pageResponse.totalPages);
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
        return;
      }
      console.error('Error loading treatment plans:', error);
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
  }, [canView, patientCode, filters.status, currentPage, pageSize, user?.token, handleErrorRef]);

  // Load treatment plans
  useEffect(() => {
    loadPlans();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [loadPlans]);

  // Refetch when page becomes visible (user returns from detail page)
  // Also refetch when router pathname changes (Next.js App Router)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && canView) {
        // Delay to ensure navigation is complete and DB transaction is committed
        setTimeout(() => {
          loadPlans();
        }, 300);
      }
    };

    const handleFocus = () => {
      if (canView) {
        // Delay to ensure navigation is complete
        setTimeout(() => {
          loadPlans();
        }, 300);
      }
    };

    // Also listen to popstate (browser back/forward)
    const handlePopState = () => {
      if (canView) {
        setTimeout(() => {
          loadPlans();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loadPlans, canView]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page when filters change
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      status: undefined,
      searchTerm: undefined,
    });
    setCurrentPage(0);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle row click - navigate to detail page
  const handleRowClick = useCallback((plan: TreatmentPlanSummaryDTO) => {
    // Backend fix applied: planCode is now always available in summary
    if (!plan.planCode) {
      console.error('planCode missing in summary - this should not happen after backend fix');
      toast.error('Không thể xem chi tiết', {
        description: 'Mã lộ trình không có trong dữ liệu. Vui lòng thử lại.',
      });
      return;
    }

    // Use planCode directly (no workaround needed)
    router.push(`/patient/treatment-plans/${plan.planCode}`);
  }, [router]);

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

  //  Backend fix applied: Plans are already paginated from backend
  // No need for client-side pagination

  return (
    <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_OWN']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lộ trình điều trị của tôi</h1>
            <p className="text-muted-foreground mt-1">
              Xem và theo dõi tiến độ các lộ trình điều trị của bạn
            </p>
          </div>
        </div>

        {/* Filters */}
        <TreatmentPlanFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          canViewAll={false} // Patient can only see their own plans
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Đang tải lộ trình điều trị...</p>
            </div>
          </div>
        )}

        {/* Plans List */}
        {!loading && (
          <TreatmentPlanList
            plans={plans}
            loading={false}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
            showActions={false} // Read-only for patients
          />
        )}

        {/* Empty State */}
        {!loading && plans.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">
              {filters.status
                ? 'Không có lộ trình điều trị nào với trạng thái đã chọn.'
                : 'Bạn chưa có lộ trình điều trị nào.'}
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

