'use client';

/**
 * Admin Treatment Plans Management Page
 * 
 * Features:
 * - List view with pagination
 * - Full filtering and search capabilities
 * - View treatment plan details
 * - Create treatment plan (if has permission)
 * 
 * Similar structure to appointments page
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Plus, List } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import {
  TreatmentPlanSummaryDTO,
  TreatmentPlanStatus,
} from '@/types/treatmentPlan';
import TreatmentPlanList from '@/components/treatment-plans/TreatmentPlanList';
import TreatmentPlanFilters, { TreatmentPlanFilters as FiltersType } from '@/components/treatment-plans/TreatmentPlanFilters';
import CreateCustomPlanModal from '@/components/treatment-plans/CreateCustomPlanModal';

export default function AdminTreatmentPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // Get patientCode from URL query params
  const patientCodeFromUrl = searchParams.get('patientCode') || '';

  // State
  const [plans, setPlans] = useState<TreatmentPlanSummaryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientCode, setPatientCode] = useState(patientCodeFromUrl);

  // Filter states
  const [filters, setFilters] = useState<FiltersType>({
    patientCode: patientCodeFromUrl || undefined,
    status: undefined,
    searchTerm: undefined,
  });

  // Pagination states (for future pagination support)
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Permissions
  const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_ALL') || false;
  const canCreate = user?.permissions?.includes('CREATE_TREATMENT_PLAN') || false;

  // Request cancellation để tránh race condition
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Sync patientCode from URL
  useEffect(() => {
    const urlPatientCode = searchParams.get('patientCode') || '';
    if (urlPatientCode !== patientCode) {
      setPatientCode(urlPatientCode);
      setFilters((prev) => ({
        ...prev,
        patientCode: urlPatientCode || undefined,
      }));
    }
  }, [searchParams, patientCode]);

  // Function to load treatment plans (extracted for reuse)
  const loadPlans = useCallback(async () => {
    if (!canView) return;

    // Need patientCode to load plans
    const targetPatientCode = filters.patientCode || patientCode;
    if (!targetPatientCode) {
      setPlans([]);
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
      // ✅ Backend fix applied: Use pagination support
      const pageResponse = await TreatmentPlanService.getTreatmentPlans(
        targetPatientCode,
        currentPage,
        pageSize,
        'createdAt,desc'
      );

      // Only update if request wasn't cancelled and component is still mounted
      if (!abortController.signal.aborted && isMounted) {
        let filteredData = pageResponse.content;
        
        // Apply status filter if set (client-side filter for now)
        // TODO: Move status filter to backend query params if supported
        if (filters.status) {
          filteredData = pageResponse.content.filter((plan) => plan.status === filters.status);
        }

        setPlans(filteredData);
        // Use pagination metadata from backend
        setTotalPages(pageResponse.totalPages);
      }
    } catch (error: any) {
      // Don't show error if request was cancelled or component unmounted
      if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
        return;
      }
      console.error('Error loading treatment plans:', error);
      handleErrorRef.current(error);
      // Only clear data if it's a real error (not cancellation)
      if (!abortController.signal.aborted && isMounted) {
        setPlans([]);
      }
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
  }, [canView, filters, patientCode, pageSize, currentPage, handleErrorRef]);

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

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(0); // Reset to first page when filters change
    
    // Update URL if patientCode changes
    if (newFilters.patientCode !== undefined) {
      const params = new URLSearchParams(searchParams.toString());
      if (newFilters.patientCode) {
        params.set('patientCode', newFilters.patientCode);
      } else {
        params.delete('patientCode');
      }
      router.push(`?${params.toString()}`, { scroll: false });
      setPatientCode(newFilters.patientCode || '');
    }
  }, [router, searchParams]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      patientCode: undefined,
      status: undefined,
      searchTerm: undefined,
    });
    setCurrentPage(0);
    // Clear URL param
    const params = new URLSearchParams(searchParams.toString());
    params.delete('patientCode');
    router.push(`?${params.toString()}`, { scroll: false });
    setPatientCode('');
  }, [router, searchParams]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle row click - navigate to detail page
  // ✅ Backend fix applied (2025-11-15): patientCode is now included in API 5.1 response
  const handleRowClick = useCallback((plan: TreatmentPlanSummaryDTO) => {
    if (!plan.planCode) {
      console.error('planCode missing in summary - this should not happen after backend fix');
      toast.error('Không thể xem chi tiết', {
        description: 'Mã lộ trình không có trong dữ liệu. Vui lòng thử lại.',
      });
      return;
    }

    // ✅ Simplified: Use patientCode from plan (always available after backend fix)
    // Fallback to filter/URL patientCode for backward compatibility
    const targetPatientCode = plan.patientCode || filters.patientCode || patientCode;
    
    if (!targetPatientCode) {
      toast.error('Không thể xem chi tiết', {
        description: 'Mã bệnh nhân không có trong dữ liệu. Vui lòng thử lại.',
      });
      return;
    }

    router.push(`/admin/booking/treatment-plans/${plan.planCode}?patientCode=${targetPatientCode}`);
  }, [router, filters.patientCode, patientCode]);

  // Handle create treatment plan
  const [showCreateModal, setShowCreateModal] = useState(false);
  const handleCreatePlan = () => {
    // No need to check patientCode - can be selected in modal
    setShowCreateModal(true);
  };

  const handleCreatePlanSuccess = () => {
    setShowCreateModal(false);
    // Refresh plan list by updating currentPage to trigger useEffect
    // This will reload plans automatically
    setCurrentPage(0);
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem danh sách lộ trình điều trị." />;
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_ALL']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Lộ trình Điều trị</h1>
            <p className="text-muted-foreground mt-2">
              Xem và quản lý các lộ trình điều trị của bệnh nhân
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Lộ trình Mới
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <TreatmentPlanFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          canViewAll={true} // Admin always has VIEW_TREATMENT_PLAN_ALL
        />

        {/* List */}
        {filters.patientCode || patientCode ? (
          <TreatmentPlanList
            plans={plans}
            loading={loading}
            onRowClick={handleRowClick}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showActions={true}
            patientCode={filters.patientCode || patientCode}
          />
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">
              Vui lòng nhập mã bệnh nhân để xem lộ trình điều trị
            </p>
          </div>
        )}
      </div>

      {/* Create Custom Plan Modal */}
      {showCreateModal && (
        <CreateCustomPlanModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          patientCode={filters.patientCode || patientCode}
          onSuccess={handleCreatePlanSuccess}
        />
      )}
    </ProtectedRoute>
  );
}

