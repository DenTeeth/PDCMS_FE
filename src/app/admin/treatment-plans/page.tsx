'use client';

/**
 * Admin Treatment Plans Management Page
 * 
 * Features:
 * - List view with pagination
 * - Full filtering and search capabilities
 * - View treatment plan details
 * - Create treatment plan (if has permission)
 * - Auto-load all treatment plans when page loads (no patientCode required)
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
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

  // Get patientCode from URL query params (optional filter)
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
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

  // Load treatment plans - auto-load all plans when page loads
  useEffect(() => {
    if (!canView) return;

    const targetPatientCode = filters.patientCode || patientCode;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isMounted = true;

    const loadPlans = async () => {
      setLoading(true);
      try {
        // ✅ Use API 5.5: Get all treatment plans with RBAC and filters
        // This API automatically handles RBAC (Admin sees all, Doctor sees their own, etc.)
        const pageResponse = await TreatmentPlanService.getAllTreatmentPlansWithRBAC({
          page: currentPage,
          size: pageSize,
          sort: 'createdAt,desc',
          status: filters.status,
          patientCode: targetPatientCode || undefined, // Admin can filter by patientCode
          searchTerm: filters.searchTerm,
        });

        if (!abortController.signal.aborted && isMounted) {
          setPlans(pageResponse.content);
          setTotalPages(pageResponse.totalPages);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading treatment plans:', error);
        handleErrorRef.current(error);
        if (!abortController.signal.aborted && isMounted) {
          setPlans([]);
        }
      } finally {
        if (!abortController.signal.aborted && isMounted) {
          setLoading(false);
        }
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [canView, filters, patientCode, pageSize, currentPage]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(0);
    
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
  // ✅ Backend fix applied (2025-11-15): patientCode is now included in API 5.5 response
  const handleRowClick = useCallback((plan: TreatmentPlanSummaryDTO) => {
    if (!plan.planCode) {
      console.error('planCode missing in summary - this should not happen after backend fix');
      toast.error('Không thể xem chi tiết', {
        description: 'Mã lộ trình không có trong dữ liệu. Vui lòng thử lại.',
      });
      return;
    }

    if (!plan.patientCode) {
      console.error('patientCode missing in summary - this should not happen after backend fix');
      toast.error('Không thể xem chi tiết', {
        description: 'Mã bệnh nhân không có trong dữ liệu. Vui lòng thử lại.',
      });
      return;
    }

    // ✅ Simplified: Use patientCode directly from plan (always available after backend fix)
    router.push(`/admin/treatment-plans/${plan.planCode}?patientCode=${plan.patientCode}`);
  }, [router]);

  // Handle create treatment plan
  const [showCreateModal, setShowCreateModal] = useState(false);
  const handleCreatePlan = () => {
    // No need to check patientCode - can be selected in modal
    setShowCreateModal(true);
  };

  const handleCreatePlanSuccess = () => {
    setShowCreateModal(false);
    // Refresh plan list by resetting to page 0
    // This will trigger useEffect to reload plans
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

        {/* List - Always show, auto-load all plans */}
        <TreatmentPlanList
          plans={plans}
          loading={loading}
          onRowClick={handleRowClick}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showActions={true}
          patientCode={filters.patientCode || patientCode || undefined}
        />
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

