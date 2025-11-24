'use client';

/**
 * Employee Treatment Plans Management Page
 * 
 * Features:
 * - List view with pagination
 * - Full filtering and search capabilities (can search by patientCode)
 * - View treatment plan details
 * - Similar to admin page but for employee role
 * 
 * RBAC: VIEW_TREATMENT_PLAN_ALL or VIEW_TREATMENT_PLAN_OWN permission
 * - Employee với VIEW_TREATMENT_PLAN_OWN: Chỉ thấy plans của mình
 * - Employee với VIEW_TREATMENT_PLAN_ALL: Vẫn chỉ thấy plans của mình (backend enforce)
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Plus, List, Loader2 } from 'lucide-react';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import {
  TreatmentPlanSummaryDTO,
  TreatmentPlanStatus,
} from '@/types/treatmentPlan';
import TreatmentPlanList from '@/components/treatment-plans/TreatmentPlanList';
import TreatmentPlanFilters, { TreatmentPlanFilters as FiltersType } from '@/components/treatment-plans/TreatmentPlanFilters';
import CreateCustomPlanModal from '@/components/treatment-plans/CreateCustomPlanModal';

export default function EmployeeTreatmentPlansPage() {
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Permissions
  // ✅ Backend fix (2025-11-15): Backend now checks role BEFORE permission
  // Employee will always be filtered by createdBy, even if they have VIEW_TREATMENT_PLAN_ALL
  const canView = user?.permissions?.includes('VIEW_TREATMENT_PLAN_ALL') || 
                  user?.permissions?.includes('VIEW_TREATMENT_PLAN_OWN') || false;
  const canCreate = user?.permissions?.includes('CREATE_TREATMENT_PLAN') || false;

  // Request cancellation ref
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

  // Load treatment plans
  useEffect(() => {
    if (!canView) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isMounted = true;

    const loadPlans = async () => {
      try {
        setLoading(true);
        // ✅ Use API 5.5: Get all treatment plans with RBAC and filters
        // ✅ Backend fix (2025-11-15): Backend now checks role BEFORE permission
        // - Employee: Always filtered by createdBy (regardless of permission)
        // - Patient: Always filtered by patient
        // - Admin: Can see all plans, can use doctorEmployeeCode/patientCode filters
        // No workaround needed - backend enforces RBAC correctly
        const pageResponse = await TreatmentPlanService.getAllTreatmentPlansWithRBAC({
          page: currentPage,
          size: pageSize,
          sort: 'createdAt,desc',
          status: filters.status,
          patientCode: filters.patientCode || undefined, // Optional filter by patientCode (Admin only)
          searchTerm: filters.searchTerm,
        });

        // Check if request was cancelled or component unmounted
        if (abortController.signal.aborted || !isMounted) return;

        setPlans(pageResponse.content);
        // Use pagination metadata from backend
        setTotalPages(pageResponse.totalPages);
      } catch (error: any) {
        // Don't show error if request was cancelled
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading treatment plans:', error);
        
        // Enhanced error logging for 500 errors
        if (error.response?.status === 500) {
          const errorMessage = error.response?.data?.message || error.message || '';
          console.error('❌ [500 Error] Details:', {
            status: error.response?.status,
            message: errorMessage,
            data: error.response?.data,
            // Check if it's related to account_id extraction
            isAccountIdError: /account_id|accountId|Unable to extract/.test(errorMessage),
          });
          
          // If it's an account_id extraction error, show specific message
          if (/account_id|accountId|Unable to extract/.test(errorMessage)) {
            toast.error('Lỗi xác thực', {
              description: 'Không thể xác định tài khoản từ token. Vui lòng đăng nhập lại.',
              duration: 5000,
            });
            // Optionally redirect to login
            // router.push('/login');
            return;
          }
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

    loadPlans();

    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [canView, filters.patientCode, filters.status, filters.searchTerm, currentPage, pageSize]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(0);
    
    // Update URL if patientCode changes
    if (newFilters.patientCode && newFilters.patientCode !== patientCode) {
      router.push(`/employee/treatment-plans?patientCode=${newFilters.patientCode}`);
    } else if (!newFilters.patientCode && patientCode) {
      router.push('/employee/treatment-plans');
    }
  }, [router, patientCode]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      patientCode: undefined,
      status: undefined,
      searchTerm: undefined,
    });
    setCurrentPage(0);
    router.push('/employee/treatment-plans');
  }, [router]);

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

    router.push(`/employee/treatment-plans/${plan.planCode}?patientCode=${targetPatientCode}`);
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
    return <UnauthorizedMessage message="Bạn không có quyền xem lộ trình điều trị." />;
  }

  // ✅ Backend fix applied: Plans are already paginated from backend
  // No need for client-side pagination

  return (
    <ProtectedRoute requiredPermissions={['VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_OWN']} requireAll={false}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lộ trình Điều trị</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý và theo dõi lộ trình điều trị của bệnh nhân
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleCreatePlan}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Lộ trình Mới
            </Button>
          )}
        </div>

        {/* Filters */}
        <TreatmentPlanFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          canViewAll={true} // Employee can view all plans
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
            showActions={true}
          />
        )}

        {/* Empty State */}
        {!loading && plans.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground">
              {filters.patientCode || filters.status || filters.searchTerm
                ? 'Không có lộ trình điều trị nào với bộ lọc đã chọn.'
                : 'Bạn chưa có lộ trình điều trị nào cho các bệnh nhân của mình.'}
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
