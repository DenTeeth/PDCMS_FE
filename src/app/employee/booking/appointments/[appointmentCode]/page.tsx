'use client';

/**
 * Employee Appointment Detail Page
 * 
 * Displays detailed appointment information including:
 * - Patient information
 * - Appointment details (code, status, time, duration, services)
 * - Doctor information
 * - Room information
 * - Participants (if any)
 * - Notes
 * - Placeholder tabs/links for medical history and treatment plans
 * - Actions (if permitted): Update status, Delay, Reschedule
 * 
 * RBAC: Backend automatically filters by employeeId from JWT token for VIEW_APPOINTMENT_OWN
 * - VIEW_APPOINTMENT_OWN: Can only view appointments where user is primary doctor OR participant
 * - VIEW_APPOINTMENT_ALL: Can view all appointments (same as admin)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import UnauthorizedMessage from '@/components/auth/UnauthorizedMessage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { appointmentService } from '@/services/appointmentService';
import {
  AppointmentDetailDTO,
  AppointmentStatus,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_TRANSITIONS,
  UpdateAppointmentStatusRequest,
  DelayAppointmentRequest,
  AppointmentReasonCode,
  APPOINTMENT_REASON_CODE_LABELS,
} from '@/types/appointment';
// Employees do not have reschedule functionality
// import RescheduleAppointmentModal from '@/components/appointments/RescheduleAppointmentModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  UserCog,
  Building2,
  FileText,
  Stethoscope,
  ClipboardList,
  Edit,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { is403Error, handleError } = useApiErrorHandler();

  const appointmentCode = params?.appointmentCode as string;

  // State
  const [appointment, setAppointment] = useState<AppointmentDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | null>(null);
  const [statusUpdateReason, setStatusUpdateReason] = useState<AppointmentReasonCode | ''>('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState<string>('');
  const [delayNewStartTime, setDelayNewStartTime] = useState<string>('');
  const [delayReason, setDelayReason] = useState<AppointmentReasonCode | ''>('');
  const [delayNotes, setDelayNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [delaying, setDelaying] = useState(false);

  // Permissions
  const canViewAll = user?.permissions?.includes('VIEW_APPOINTMENT_ALL') || false;
  const canViewOwn = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canView = canViewAll || canViewOwn;
  const canUpdateStatus = user?.permissions?.includes('UPDATE_APPOINTMENT_STATUS') || false;
  const canDelay = user?.permissions?.includes('DELAY_APPOINTMENT') || false;
  // Employees do not have reschedule permission
  const canReschedule = false;

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);
  // Stable ref for handleError to prevent loop
  const handleErrorRef = useRef(handleError);

  // Update handleError ref when it changes
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  // Load appointment - only once on mount, optimized to minimize API calls
  // NOTE: Backend automatically filters by employeeId from JWT token for VIEW_APPOINTMENT_OWN
  // Backend's AppointmentDetailService will check if user is primary doctor OR participant
  useEffect(() => {
    if (!appointmentCode || !canView) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isMounted = true; // Flag to prevent state updates if component unmounts

    const loadAppointment = async () => {
      try {
        setLoading(true);
        // Use P3.4 endpoint to get appointment detail
        // Backend will automatically apply RBAC filtering based on JWT token
        const detail = await appointmentService.getAppointmentDetail(appointmentCode);
        
        // Check if request was cancelled or component unmounted
        if (abortController.signal.aborted || !isMounted) return;
        
        setAppointment(detail);
      } catch (error: any) {
        // Don't show error if request was cancelled
        if (error.name === 'AbortError' || abortController.signal.aborted || !isMounted) {
          return;
        }
        console.error('Error loading appointment:', error);
        
        // Check if 404 - appointment not found or not authorized
        if (error.response?.status === 404) {
          toast.error('Appointment not found', {
            description: `Could not find appointment with code: ${appointmentCode}. You may not have permission to view this appointment.`,
          });
          setTimeout(() => {
            if (isMounted && !abortController.signal.aborted) {
              router.push('/employee/appointments');
            }
          }, 2000);
        } else if (error.response?.status === 403) {
          toast.error('Access denied', {
            description: 'You do not have permission to view this appointment.',
          });
          setTimeout(() => {
            if (isMounted && !abortController.signal.aborted) {
              router.push('/employee/appointments');
            }
          }, 2000);
        } else {
          handleErrorRef.current(error);
        }
      } finally {
        // Only update loading state if request wasn't cancelled and component is mounted
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false);
        }
        // Clear abort controller reference
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    loadAppointment();

    // Cleanup function to prevent state updates after unmount and cancel request
    return () => {
      isMounted = false;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [appointmentCode, canView, router]); // Removed handleError from dependencies to prevent loop

  // Get status badge
  const getStatusBadge = (status: AppointmentStatus) => {
    const statusInfo = APPOINTMENT_STATUS_COLORS[status];
    return (
      <Badge
        style={{
          backgroundColor: statusInfo.bg,
          borderColor: statusInfo.border,
          color: 'white',
          padding: '0.5rem 1rem',
        }}
        className="text-sm font-medium"
      >
        {statusInfo.text}
      </Badge>
    );
  };

  // Format date time
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'dd MMM yyyy, HH:mm');
    } catch {
      return dateTimeStr;
    }
  };

  // Format time
  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'HH:mm');
    } catch {
      return dateTimeStr;
    }
  };

  // Get valid next statuses for current appointment
  const getValidNextStatuses = (currentStatus: AppointmentStatus): AppointmentStatus[] => {
    return APPOINTMENT_STATUS_TRANSITIONS[currentStatus] || [];
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedStatus || !appointment) return;

    // Validate: Check if status transition is valid
    const validNextStatuses = getValidNextStatuses(appointment.status);
    if (!validNextStatuses.includes(selectedStatus)) {
      toast.error('Invalid status transition', {
        description: `Cannot change status from ${APPOINTMENT_STATUS_COLORS[appointment.status].text} to ${APPOINTMENT_STATUS_COLORS[selectedStatus].text}`,
      });
      return;
    }

    // Validate: Require reasonCode for CANCELLED status
    if (selectedStatus === 'CANCELLED' && !statusUpdateReason) {
      toast.error('Reason required', {
        description: 'Please select a reason for cancellation',
      });
      return;
    }

    try {
      setUpdating(true);
      
      const request: UpdateAppointmentStatusRequest = {
        status: selectedStatus,
        reasonCode: selectedStatus === 'CANCELLED' ? (statusUpdateReason as AppointmentReasonCode) : undefined,
        notes: statusUpdateNotes || null,
      };

      const updated = await appointmentService.updateAppointmentStatus(appointment.appointmentCode, request);
      
      toast.success('Status updated successfully', {
        description: `Appointment status changed to ${APPOINTMENT_STATUS_COLORS[selectedStatus].text}`,
      });
      
      // Update appointment with new data
      setAppointment(updated);
      
      // Reset form
      setShowStatusModal(false);
      setSelectedStatus(null);
      setStatusUpdateReason('');
      setStatusUpdateNotes('');
    } catch (error: any) {
      console.error('Error updating status:', error);
      handleError(error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle delay appointment
  const handleDelay = async () => {
    if (!delayNewStartTime || !appointment) return;

    // Validate: Only SCHEDULED or CHECKED_IN can be delayed
    if (appointment.status !== 'SCHEDULED' && appointment.status !== 'CHECKED_IN') {
      toast.error('Cannot delay appointment', {
        description: 'Only scheduled or checked-in appointments can be delayed',
      });
      return;
    }

    // Validate: New start time must be after original
    const originalStart = new Date(appointment.appointmentStartTime);
    const newStart = new Date(delayNewStartTime);
    
    if (newStart <= originalStart) {
      toast.error('Invalid time', {
        description: 'New start time must be after the original start time',
      });
      return;
    }

    try {
      setDelaying(true);
      
      const request: DelayAppointmentRequest = {
        newStartTime: delayNewStartTime, // ISO 8601 format
        reasonCode: delayReason ? (delayReason as AppointmentReasonCode) : undefined,
        notes: delayNotes || null,
      };

      const updated = await appointmentService.delayAppointment(appointment.appointmentCode, request);
      
      toast.success('Appointment delayed successfully', {
        description: `New start time: ${formatDateTime(delayNewStartTime)}`,
      });
      
      // Update appointment with new data
      setAppointment(updated);
      
      // Reset form
      setShowDelayModal(false);
      setDelayNewStartTime('');
      setDelayReason('');
      setDelayNotes('');
    } catch (error: any) {
      console.error('Error delaying appointment:', error);
      handleError(error);
    } finally {
      setDelaying(false);
    }
  };

  if (is403Error) {
    return <UnauthorizedMessage message="Bạn không có quyền truy cập trang này." />;
  }

  if (!canView) {
    return <UnauthorizedMessage message="Bạn không có quyền xem appointment details." />;
  }

  if (loading) {
    return (
      <ProtectedRoute
        requiredBaseRole="employee"
        requiredPermissions={['VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_OWN']}
        requireAll={false}
      >
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!appointment) {
    return (
      <ProtectedRoute
        requiredBaseRole="employee"
        requiredPermissions={['VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_OWN']}
        requireAll={false}
      >
        <div className="container mx-auto p-6">
          <Card className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Appointment Not Found</h2>
              <p className="text-muted-foreground mb-4">
                Could not find appointment with code: {appointmentCode}
              </p>
              <Button onClick={() => router.push('/employee/appointments')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appointments
              </Button>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      requiredBaseRole="employee"
      requiredPermissions={['VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_OWN']}
      requireAll={false}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/employee/appointments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Appointment Details</h1>
              <p className="text-muted-foreground mt-1">
                Code: {appointment.appointmentCode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(appointment.status)}
            {canUpdateStatus && getValidNextStatuses(appointment.status).length > 0 && (
              <Button variant="outline" onClick={() => setShowStatusModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            )}
            {canDelay && (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
              <Button variant="outline" onClick={() => setShowDelayModal(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Delay Appointment
              </Button>
            )}
            {canReschedule && (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
              <Button variant="outline" onClick={() => setShowRescheduleModal(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Reschedule Appointment
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Appointment Details
            </TabsTrigger>
            <TabsTrigger value="patient">
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </TabsTrigger>
            <TabsTrigger value="medical-history" disabled>
              <Stethoscope className="h-4 w-4 mr-2" />
              Medical History
            </TabsTrigger>
            <TabsTrigger value="treatment-plan" disabled>
              <ClipboardList className="h-4 w-4 mr-2" />
              Treatment Plan
            </TabsTrigger>
          </TabsList>

          {/* Appointment Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointment Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Appointment Code</label>
                    <p className="text-base font-semibold">{appointment.appointmentCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(appointment.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </label>
                    <p className="text-base">{formatDateTime(appointment.appointmentStartTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Time</label>
                    <p className="text-base">{formatDateTime(appointment.appointmentEndTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expected Duration</label>
                    <p className="text-base">{appointment.expectedDurationMinutes} minutes</p>
                  </div>
                  {appointment.actualStartTime && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Actual Start Time</label>
                      <p className="text-base">{formatDateTime(appointment.actualStartTime)}</p>
                    </div>
                  )}
                  {appointment.actualEndTime && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Actual End Time</label>
                      <p className="text-base">{formatDateTime(appointment.actualEndTime)}</p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-base">{appointment.notes}</p>
                    </div>
                  )}
                  {appointment.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created At</label>
                      <p className="text-base text-sm text-muted-foreground">{formatDateTime(appointment.createdAt)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Doctor & Room Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Doctor & Room
                </h3>
                <div className="space-y-4">
                  {appointment.doctor ? (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Doctor</label>
                      <div className="mt-1">
                        <p className="text-base font-semibold">{appointment.doctor.fullName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.doctor.employeeCode}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Doctor</label>
                      <p className="text-base text-muted-foreground">N/A</p>
                    </div>
                  )}
                  {appointment.room ? (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Room
                      </label>
                      <div className="mt-1">
                        <p className="text-base font-semibold">{appointment.room.roomName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.room.roomCode}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Room</label>
                      <p className="text-base text-muted-foreground">N/A</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Services */}
              <Card className="p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {appointment.services.length > 0 ? (
                    appointment.services.map((service) => (
                      <Badge key={service.serviceCode} variant="outline" className="text-sm p-2">
                        {service.serviceName} ({service.serviceCode})
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No services assigned</p>
                  )}
                </div>
              </Card>

              {/* Participants */}
              {appointment.participants && appointment.participants.length > 0 && (
                <Card className="p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Participants</h3>
                  <div className="space-y-2">
                    {appointment.participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{participant.fullName}</p>
                          <p className="text-sm text-muted-foreground">{participant.employeeCode}</p>
                        </div>
                        <Badge variant="secondary">{participant.role}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Patient Information Tab */}
          <TabsContent value="patient" className="space-y-4">
            {appointment.patient ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Patient Code</label>
                    <p className="text-base font-semibold">{appointment.patient.patientCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base">{appointment.patient.fullName}</p>
                  </div>
                  {appointment.patient.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-base">{appointment.patient.phone}</p>
                    </div>
                  )}
                  {appointment.patient.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-base">{format(new Date(appointment.patient.dateOfBirth), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground">Patient information not available</p>
              </Card>
            )}
          </TabsContent>

          {/* Medical History Tab (Placeholder) */}
          <TabsContent value="medical-history">
            <Card className="p-6">
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Medical History</h3>
                <p className="text-muted-foreground mb-4">
                  This feature will be available soon. Medical history will be displayed here.
                </p>
                <Button variant="outline" disabled>
                  View Medical History
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Treatment Plan Tab (Placeholder) */}
          <TabsContent value="treatment-plan">
            <Card className="p-6">
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Treatment Plan</h3>
                <p className="text-muted-foreground mb-4">
                  This feature will be available soon. Treatment plan will be displayed here.
                </p>
                <Button variant="outline" disabled>
                  View Treatment Plan
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Update Modal */}
        <Dialog 
          open={showStatusModal} 
          onOpenChange={(open) => {
            setShowStatusModal(open);
            if (!open) {
              // Reset form when closing
              setSelectedStatus(null);
              setStatusUpdateReason('');
              setStatusUpdateNotes('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Appointment Status</DialogTitle>
              <DialogDescription>
                Current status: <span className="font-semibold">{APPOINTMENT_STATUS_COLORS[appointment.status].text}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Status Selection - Only show valid next statuses */}
              <div>
                <Label>New Status</Label>
                <div className="mt-2 space-y-2">
                  {appointment && getValidNextStatuses(appointment.status).map((status) => {
                    const color = APPOINTMENT_STATUS_COLORS[status];
                    return (
                      <Button
                        key={status}
                        variant={selectedStatus === status ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedStatus(status)}
                      >
                        <div
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: color.bg, borderColor: color.border, borderWidth: 1 }}
                        />
                        {color.text}
                      </Button>
                    );
                  })}
                  {appointment && getValidNextStatuses(appointment.status).length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      No valid status transitions available. This appointment is in a terminal state.
                    </p>
                  )}
                </div>
              </div>

              {/* Reason Code - Required for CANCELLED */}
              {selectedStatus === 'CANCELLED' && (
                <div>
                  <Label htmlFor="reasonCode">Reason Code <span className="text-red-500">*</span></Label>
                  <Select
                    value={statusUpdateReason || ''}
                    onValueChange={(value) => setStatusUpdateReason(value as AppointmentReasonCode)}
                  >
                    <SelectTrigger id="reasonCode" className="mt-1">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPOINTMENT_REASON_CODE_LABELS).map(([code, label]) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="statusNotes">Notes (Optional)</Label>
                <Textarea
                  id="statusNotes"
                  value={statusUpdateNotes}
                  onChange={(e) => setStatusUpdateNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus(null);
                  setStatusUpdateReason('');
                  setStatusUpdateNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={
                  updating || 
                  !selectedStatus || 
                  selectedStatus === appointment.status || 
                  (selectedStatus === 'CANCELLED' && !statusUpdateReason) ||
                  (selectedStatus && !getValidNextStatuses(appointment.status).includes(selectedStatus))
                }
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delay Appointment Modal */}
        <Dialog 
          open={showDelayModal} 
          onOpenChange={(open) => {
            setShowDelayModal(open);
            if (!open) {
              // Reset form when closing
              setDelayNewStartTime('');
              setDelayReason('');
              setDelayNotes('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delay Appointment</DialogTitle>
              <DialogDescription>
                Move this appointment to a later time. Current start time: <span className="font-semibold">{formatDateTime(appointment.appointmentStartTime)}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* New Start Time */}
              <div>
                <Label htmlFor="newStartTime">New Start Time <span className="text-red-500">*</span></Label>
                <Input
                  id="newStartTime"
                  type="datetime-local"
                  value={delayNewStartTime ? new Date(delayNewStartTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    // Convert datetime-local format to ISO 8601
                    const localDateTime = e.target.value;
                    if (localDateTime) {
                      // Convert to ISO 8601 format
                      const date = new Date(localDateTime);
                      const isoString = date.toISOString();
                      setDelayNewStartTime(isoString);
                    } else {
                      setDelayNewStartTime('');
                    }
                  }}
                  className="mt-1"
                  min={appointment ? new Date(appointment.appointmentStartTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be after the current start time
                </p>
              </div>

              {/* Reason Code */}
              <div>
                <Label htmlFor="delayReason">Reason Code (Optional)</Label>
                <Select
                  value={delayReason || ''}
                  onValueChange={(value) => setDelayReason(value as AppointmentReasonCode || '')}
                >
                  <SelectTrigger id="delayReason" className="mt-1">
                    <SelectValue placeholder="Select reason (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {Object.entries(APPOINTMENT_REASON_CODE_LABELS).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="delayNotes">Notes (Optional)</Label>
                <Textarea
                  id="delayNotes"
                  value={delayNotes}
                  onChange={(e) => setDelayNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDelayModal(false);
                }}
                disabled={delaying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelay}
                disabled={
                  delaying || 
                  !delayNewStartTime ||
                  (appointment && new Date(delayNewStartTime) <= new Date(appointment.appointmentStartTime))
                }
              >
                {delaying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Delaying...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Delay Appointment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Employees do not have reschedule functionality */}
        {/* Reschedule Appointment Modal */}
        {/* <RescheduleAppointmentModal
          open={showRescheduleModal}
          appointment={appointment}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={(cancelledAppointment, newAppointment) => {
            // Show success message
            toast.success('Appointment rescheduled successfully', {
              description: `Old appointment cancelled. New appointment code: ${newAppointment.appointmentCode}`,
            });
            
            // Update appointment with new appointment details
            setAppointment(newAppointment);
            
            // Close modal
            setShowRescheduleModal(false);
          }}
        /> */}
      </div>
    </ProtectedRoute>
  );
}

