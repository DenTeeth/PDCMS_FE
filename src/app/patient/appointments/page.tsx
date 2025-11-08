'use client';

/**
 * Patient Appointment List Page
 * Requires: VIEW_APPOINTMENT_OWN permission
 * 
 * Features:
 * - Calendar view (Day/Week/Month) with color-coded appointments
 * - List view with pagination
 * - Search and filter functionality (read-only)
 * - View appointment details (read-only)
 * - RBAC: Backend automatically filters by patientId from JWT token
 * - NO create/edit/reschedule/cancel actions (read-only view)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { Calendar, List } from 'lucide-react';
import { appointmentService } from '@/services/appointmentService';
import {
  AppointmentSummaryDTO,
  AppointmentFilterCriteria,
} from '@/types/appointment';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';
import AppointmentList from '@/components/appointments/AppointmentList';
import AppointmentFilters from '@/components/appointments/AppointmentFilters';
import { Card, CardContent } from '@/components/ui/card';

type ViewMode = 'list' | 'calendar';

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  // State
  const [appointments, setAppointments] = useState<AppointmentSummaryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filter & Search states
  const [filters, setFilters] = useState<Partial<AppointmentFilterCriteria>>({
    page: 0,
    size: 10,
    sortBy: 'appointmentStartTime',
    sortDirection: 'ASC',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Permissions
  // Patients only have VIEW_APPOINTMENT_OWN - backend automatically filters by patientId
  const canViewOwn = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canView = canViewOwn;

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
          sortBy: filters.sortBy || 'appointmentStartTime',
          sortDirection: filters.sortDirection || 'ASC',
        };

        // Patients with VIEW_APPOINTMENT_OWN: Backend automatically filters by patientId from JWT token
        // Remove any entity filters that patients shouldn't use
        delete criteria.employeeCode;
        delete criteria.patientCode;
        delete criteria.patientName;
        delete criteria.patientPhone;

        const response = await appointmentService.getAppointmentsPage(criteria);

        if (!abortController.signal.aborted && isMounted) {
          setAppointments(response.content);
          setTotalElements(response.totalElements);
          setTotalPages(response.totalPages);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading appointments:', error);
        handleErrorRef.current(error);
        if (!abortController.signal.aborted && isMounted) {
          setAppointments([]);
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

    loadAppointments();

    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [canView, filters, currentPage, pageSize]);

  const handleFiltersChange = useCallback((newFilters: Partial<AppointmentFilterCriteria>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 0,
      size: 10,
      sortBy: 'appointmentStartTime',
      sortDirection: 'ASC',
    });
    setCurrentPage(0);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleAppointmentClick = useCallback((appointment: AppointmentSummaryDTO) => {
    router.push(`/patient/appointments/${appointment.appointmentCode}`);
  }, [router]);

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem lịch hẹn." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch Hẹn Của Tôi</h1>
          <p className="text-gray-600 mt-1">Xem và quản lý lịch hẹn của bạn</p>
        </div>
      </div>

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

        <TabsContent value="list" className="space-y-4 mt-6">
          <AppointmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            canViewAll={false} // Patients only have VIEW_APPOINTMENT_OWN
          />
          <AppointmentList
            appointments={appointments}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowClick={handleAppointmentClick}
            showActions={false} // Read-only: no action buttons
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-6">
          <AppointmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            canViewAll={false} // Patients only have VIEW_APPOINTMENT_OWN
          />
          <AppointmentCalendar
            onEventClick={handleAppointmentClick}
            filters={filters}
            loading={loading}
            canViewAll={false} // Patients only have VIEW_APPOINTMENT_OWN
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
