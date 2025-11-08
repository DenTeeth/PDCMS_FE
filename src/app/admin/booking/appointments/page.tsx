'use client';

/**
 * Admin Appointment Management Page
 * 
 * Features:
 * - List view with pagination (for statistics)
 * - Calendar view (for visual scheduling)
 * - Full filtering and search capabilities
 * - Create appointment functionality
 * - View appointment details
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Plus, Calendar, List } from 'lucide-react';
import { appointmentService } from '@/services/appointmentService';
import {
  AppointmentSummaryDTO,
  AppointmentFilterCriteria,
  DatePreset,
  AppointmentStatus,
} from '@/types/appointment';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import AppointmentList from '@/components/appointments/AppointmentList';
import AppointmentFilters from '@/components/appointments/AppointmentFilters';
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal';

type ViewMode = 'list' | 'calendar';

export default function AdminAppointmentsPage() {
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
    sortBy: 'appointmentStartTime',
    sortDirection: 'ASC',
  });

  // Search state - handled by AppointmentFilters component

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Permissions
  const canView = user?.permissions?.includes('VIEW_APPOINTMENT_ALL') || false;
  const canCreate = user?.permissions?.includes('CREATE_APPOINTMENT') || false;

  // Request cancellation để tránh race condition
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
      // Stale-while-revalidate: Keep old data visible while loading
      setLoading(true);
      try {
        const criteria: AppointmentFilterCriteria = {
          ...filters,
          page: currentPage,
          size: pageSize,
          sortBy: filters.sortBy || 'appointmentStartTime',
          sortDirection: filters.sortDirection || 'ASC',
        };

        // Search filters are already in filters object from AppointmentFilters component

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
  }, [canView, filters, currentPage, pageSize]); // Direct dependencies - trigger when these change

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
      sortBy: 'appointmentStartTime',
      sortDirection: 'ASC',
    });
    setCurrentPage(0);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle row click - navigate to detail page
  const handleRowClick = useCallback((appointment: AppointmentSummaryDTO) => {
    router.push(`/admin/booking/appointments/${appointment.appointmentCode}`);
  }, [router]);

  // Handle calendar event click - navigate to detail page
  const handleCalendarEventClick = useCallback((appointment: AppointmentSummaryDTO) => {
    router.push(`/admin/booking/appointments/${appointment.appointmentCode}`);
  }, [router]);

  // Handle create appointment
  const handleCreateAppointment = () => {
    setShowCreateModal(true);
  };

  // Handle create appointment success
  const handleCreateSuccess = () => {
    // Reload appointments after creating - trigger by updating filters
    setFilters((prev) => ({ ...prev }));
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem danh sách appointments." />;
  }

  return (
    <ProtectedRoute requiredPermissions={['VIEW_APPOINTMENT_ALL']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointment Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage patient appointments with calendar and list views
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={handleCreateAppointment}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            )}
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="mt-6 space-y-4">
            {/* Filters */}
            <AppointmentFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              canViewAll={true} // Admin always has VIEW_APPOINTMENT_ALL
            />

            {/* Sort Controls */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
              <div className="min-w-[200px]">
                <label className="text-sm font-medium">Sort By</label>
                <select
                  value={filters.sortBy || 'appointmentStartTime'}
                  onChange={(e) => handleFiltersChange({ sortBy: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mt-1"
                >
                  <option value="appointmentStartTime">Start Time</option>
                  <option value="appointmentCode">Appointment Code</option>
                  <option value="patientCode">Patient Code</option>
                  <option value="employeeCode">Doctor Code</option>
                  <option value="roomCode">Room Code</option>
                </select>
              </div>
              <div className="min-w-[150px]">
                <label className="text-sm font-medium">Direction</label>
                <select
                  value={filters.sortDirection || 'ASC'}
                  onChange={(e) => handleFiltersChange({ sortDirection: e.target.value as 'ASC' | 'DESC' })}
                  className="w-full px-4 py-2 border rounded-lg mt-1"
                >
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>
              </div>
            </div>

            {/* List */}
            <AppointmentList
              appointments={appointments}
              loading={loading}
              onRowClick={handleRowClick}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showActions={true}
            />
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-6">
            <AppointmentCalendar
              onEventClick={handleCalendarEventClick}
              filters={filters}
              loading={loading}
              canViewAll={true} // Admin always has VIEW_APPOINTMENT_ALL
            />
          </TabsContent>
        </Tabs>

        {/* Create Appointment Modal */}
        <CreateAppointmentModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </ProtectedRoute>
  );
}

