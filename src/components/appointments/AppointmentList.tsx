'use client';

/**
 * Reusable Appointment List Component
 * Supports pagination, sorting, and filtering
 */

import { useMemo } from 'react';
import { OptimizedTable, OptimizedTableColumn } from '@/components/ui/optimized-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppointmentSummaryDTO, AppointmentStatus, APPOINTMENT_STATUS_COLORS } from '@/types/appointment';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentListProps {
  appointments: AppointmentSummaryDTO[];
  loading: boolean;
  onRowClick: (appointment: AppointmentSummaryDTO) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showActions?: boolean; // Show action buttons (default: true)
}

export default function AppointmentList({
  appointments,
  loading,
  onRowClick,
  currentPage,
  totalPages,
  onPageChange,
  showActions = true,
}: AppointmentListProps) {
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
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateTimeStr;
    }
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'HH:mm');
    } catch {
      return dateTimeStr;
    }
  };

  const columns: OptimizedTableColumn<AppointmentSummaryDTO>[] = useMemo(() => [
    {
      key: 'appointmentCode',
      header: 'Appointment Code',
      accessor: (appointment) => (
        <span className="font-medium">{appointment.appointmentCode}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      accessor: (appointment) => (
        appointment.patient ? (
          <div>
            <div className="font-medium">{appointment.patient.fullName}</div>
            <div className="text-sm text-muted-foreground">{appointment.patient.patientCode}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      accessor: (appointment) => (
        appointment.doctor ? (
          <div>
            <div className="font-medium">{appointment.doctor.fullName}</div>
            <div className="text-sm text-muted-foreground">{appointment.doctor.employeeCode}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
    {
      key: 'room',
      header: 'Room',
      accessor: (appointment) => (
        appointment.room ? (
          <div>
            <div className="font-medium">{appointment.room.roomCode}</div>
            <div className="text-sm text-muted-foreground">{appointment.room.roomName}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
    {
      key: 'startTime',
      header: 'Start Time',
      accessor: (appointment) => (
        <div>
          <div className="font-medium">{formatDateTime(appointment.appointmentStartTime)}</div>
        </div>
      ),
    },
    {
      key: 'endTime',
      header: 'End Time',
      accessor: (appointment) => (
        <div>
          <div className="text-sm">{formatTime(appointment.appointmentEndTime)}</div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      accessor: (appointment) => (
        <span>{appointment.expectedDurationMinutes} min</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (appointment) => getStatusBadge(appointment.status),
    },
    ...(showActions ? [{
      key: 'actions',
      header: 'Actions',
      accessor: (appointment) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(appointment);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    } as OptimizedTableColumn<AppointmentSummaryDTO>] : []),
  ], [onRowClick, showActions]);

  return (
    <div className="space-y-4">
      {/* Table */}
      <OptimizedTable
        data={appointments}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        emptyMessage="No appointments found"
      />

      {/* Pagination - Below table, centered */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium min-w-[100px] text-center">
            Page {currentPage + 1} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

