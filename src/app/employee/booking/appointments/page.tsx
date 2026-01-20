'use client';


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { Plus, Calendar, List } from 'lucide-react';
import { appointmentService } from '@/services/appointmentService';
import {
  AppointmentSummaryDTO,
  AppointmentFilterCriteria,
} from '@/types/appointment';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import AppointmentList from '@/components/appointments/AppointmentList';
import AppointmentFilters from '@/components/appointments/AppointmentFilters';
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal';

type ViewMode = 'list' | 'calendar';

export default function EmployeeAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter & Search states
  const [filters, setFilters] = useState<Partial<AppointmentFilterCriteria>>({
    page: 0,
    size: 10,
    sortBy: 'appointmentId', // Sort by appointment ID (newest first)
    sortDirection: 'DESC', 
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Permissions
  const canViewAll = user?.permissions?.includes('VIEW_APPOINTMENT_ALL') || false;
  const canViewOwn = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canView = canViewAll || canViewOwn;
  const canCreate = user?.permissions?.includes('CREATE_APPOINTMENT') || false;

  // Request cancellation refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Load appointments - trigger directly when filters or page change
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

    const loadAppointments = async () => {
      setLoading(true);
      try {
        const criteria: AppointmentFilterCriteria = {
          ...filters,
          page: currentPage,
          size: pageSize,
          sortBy: filters.sortBy || 'appointmentId', // Sort by appointment ID (newest first)
          sortDirection: filters.sortDirection || 'DESC', // Default to DESC - newest first
        };

        // RBAC: Backend automatically filters by employeeId from JWT token for VIEW_APPOINTMENT_OWN
        if (canViewOwn && !canViewAll) {
          // Remove any entity filters that require VIEW_APPOINTMENT_ALL
          delete criteria.employeeCode;
          delete criteria.patientCode;
          delete criteria.patientName;
          delete criteria.patientPhone;
        }

        const response = await appointmentService.getAppointmentsPage(criteria);

        // Only update if request wasn't cancelled and component is still mounted
        if (!abortController.signal.aborted && isMounted) {
          setAppointments(response.content);
          setTotalElements(response.totalElements);
          setTotalPages(response.totalPages);
        }
      } catch (error: any) {
        // Don't show error if request was cancelled or component unmounted
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading appointments:', error);
        handleErrorRef.current(error);
        // Only clear data if it's a real error (not cancellation)
        if (!abortController.signal.aborted && isMounted) {
          setAppointments([]);
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
    };

    loadAppointments();

    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [canView, filters, currentPage, pageSize, canViewOwn, canViewAll]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<AppointmentFilterCriteria>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(0); // Reset to first page when filters change
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 0,
      size: 10,
      sortBy: 'appointmentId', // Sort by appointment ID (newest first)
      sortDirection: 'DESC', // ✅ Newest appointments first
    });
    setCurrentPage(0);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle appointment click (navigate to detail page)
  const handleAppointmentClick = useCallback((appointment: AppointmentSummaryDTO) => {
    router.push(`/employee/booking/appointments/${appointment.appointmentCode}`);
  }, [router]);

  // Handle create appointment
  const handleCreateAppointment = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  // Handle create appointment success
  const handleCreateSuccess = useCallback(() => {
    // Reload appointments after creating - trigger by updating filters
    setFilters((prev) => ({ ...prev }));
    setShowCreateModal(false);
  }, []);

  // Permission checks
  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem lịch hẹn." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch Hẹn</h1>
          <p className="text-gray-600 mt-1">Quản lý lịch hẹn của bạn</p>
          </div>
        {canCreate && (
          <Button onClick={handleCreateAppointment}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch hẹn mới
          </Button>
        )}
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="mr-2 h-4 w-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Lịch
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4 mt-6">
          <AppointmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            canViewAll={canViewAll} // Hide entity filters if VIEW_APPOINTMENT_OWN
          />
          <AppointmentList
            appointments={appointments}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowClick={handleAppointmentClick}
          />
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4 mt-6">
          <AppointmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            canViewAll={canViewAll} // Hide entity filters if VIEW_APPOINTMENT_OWN
          />
          <AppointmentCalendar
            onEventClick={handleAppointmentClick}
            filters={filters}
            loading={loading}
            canViewAll={canViewAll} // Pass canViewAll to handle RBAC filtering
          />
        </TabsContent>
      </Tabs>

      {/* Create Appointment Modal */}
      {canCreate && (
      <CreateAppointmentModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
