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

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { cn } from '@/lib/utils';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { appointmentService } from '@/services/appointmentService';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { clinicalRecordService } from '@/services/clinicalRecordService';
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
import {
  TreatmentPlanDetailResponse,
  TreatmentPlanSummaryDTO,
} from '@/types/treatmentPlan';
import { ClinicalRecordResponse } from '@/types/clinicalRecord';
import TreatmentPlanTimeline from '@/components/treatment-plans/TreatmentPlanTimeline';
import ClinicalRecordView from '@/components/clinical-records/ClinicalRecordView';
import ClinicalRecordForm from '@/components/clinical-records/ClinicalRecordForm';
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
  Menu,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

// TimePicker component for 15-minute intervals
interface TimePickerProps {
  value: string; // Format: "HH:mm" (e.g., "08:00")
  onChange: (time: string) => void;
  disabled?: boolean;
}

function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hour, setHour] = React.useState('08');
  const [minute, setMinute] = React.useState('00');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h || '08');
      setMinute(m || '00');
    }
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hours from 0 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  // Minutes: 00, 15, 30, 45
  const minutes = ['00', '15', '30', '45'];

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    onChange(`${hour}:${newMinute}`);
    setIsOpen(false);
  };

  const displayValue = value || '--:--';

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${disabled
          ? 'bg-muted cursor-not-allowed opacity-50'
          : 'bg-background hover:border-primary'
          }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{displayValue}</span>
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 p-3">
          <div className="flex gap-3">
            {/* Hour Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold mb-2 text-center">Hour</label>
              <div className="h-40 w-16 overflow-y-auto rounded-lg border">
                {hours.map((h) => (
                  <div
                    key={h}
                    className={`px-2 py-1.5 text-sm text-center cursor-pointer transition-all ${h === hour
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted'
                      }`}
                    onClick={() => handleHourChange(h)}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center text-xl font-bold text-muted-foreground">:</div>

            {/* Minute Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold mb-2 text-center">Min</label>
              <div className="h-40 w-16 overflow-y-auto rounded-lg border">
                {minutes.map((m) => (
                  <div
                    key={m}
                    className={`px-2 py-1.5 text-sm text-center cursor-pointer transition-all ${m === minute
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted'
                      }`}
                    onClick={() => handleMinuteChange(m)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [delayDate, setDelayDate] = useState<string>('');
  const [delayTime, setDelayTime] = useState<string>(''); // Format: "HH:mm"
  const [delayReason, setDelayReason] = useState<AppointmentReasonCode | ''>('');
  const [delayNotes, setDelayNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [delaying, setDelaying] = useState(false);

  // Treatment Plan state (lazy loading)
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanDetailResponse | null>(null);
  const [loadingTreatmentPlan, setLoadingTreatmentPlan] = useState(false);
  const [treatmentPlanError, setTreatmentPlanError] = useState<string | null>(null);
  const [hasTriedLoadingTreatmentPlan, setHasTriedLoadingTreatmentPlan] = useState(false); // Flag to prevent infinite API calls
  const [activeTab, setActiveTab] = useState<string>('details');

  // Clinical Record state (lazy loading)
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecordResponse | null>(null);
  const [loadingClinicalRecord, setLoadingClinicalRecord] = useState(false);
  const [clinicalRecordError, setClinicalRecordError] = useState<string | null>(null);
  const [hasTriedLoadingClinicalRecord, setHasTriedLoadingClinicalRecord] = useState(false);
  const [isEditingClinicalRecord, setIsEditingClinicalRecord] = useState(false);

  // Permissions
  const canViewAll = user?.permissions?.includes('VIEW_APPOINTMENT_ALL') || false;
  const canViewOwn = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canView = canViewAll || canViewOwn;
  const canUpdateStatus = user?.permissions?.includes('UPDATE_APPOINTMENT_STATUS') || false;
  const canDelay = user?.permissions?.includes('DELAY_APPOINTMENT') || false;
  // Employees do not have reschedule permission
  const canReschedule = false;
  // Clinical Record permissions
  const canWriteClinicalRecord = user?.permissions?.includes('WRITE_CLINICAL_RECORD') || false;

  // Note: BE now allows clinical record creation/editing for all appointment statuses
  // (Issue #37 fix - removed status restriction to allow retroactive creation)

  const actionItems = useMemo(() => {
    if (!appointment) {
      return [];
    }

    const items: {
      key: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      onSelect: () => void;
    }[] = [];

    const canShowUpdateStatus =
      canUpdateStatus && getValidNextStatuses(appointment.status).length > 0;
    const canShowDelay =
      canDelay &&
      (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN');

    if (canShowUpdateStatus) {
      items.push({
        key: 'update-status',
        label: 'Update Status',
        icon: Edit,
        onSelect: () => setShowStatusModal(true),
      });
    }

    if (canShowDelay) {
      items.push({
        key: 'delay',
        label: 'Delay Appointment',
        icon: Clock,
        onSelect: () => setShowDelayModal(true),
      });
    }

    return items;
  }, [appointment, canDelay, canUpdateStatus]);

  const renderActionMenu = () => {
    if (!actionItems.length) {
      return null;
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Menu className="h-4 w-4" />
            Actions
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-2 space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Appointment Actions
          </p>
          {actionItems.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => item.onSelect()}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    );
  };

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

  // Load treatment plan when Treatment Plan tab is activated (lazy loading)
  const loadTreatmentPlan = useCallback(async () => {
    if (!appointment?.patient?.patientCode) {
      setTreatmentPlanError('Không tìm thấy thông tin bệnh nhân');
      setHasTriedLoadingTreatmentPlan(true);
      return;
    }

    // Prevent multiple simultaneous calls
    if (loadingTreatmentPlan) {
      return;
    }

    setLoadingTreatmentPlan(true);
    setTreatmentPlanError(null);
    setHasTriedLoadingTreatmentPlan(true);

    try {
      // OPTIMIZATION: If BE provides linkedTreatmentPlanCode, use it directly (1 API call instead of N+1)
      // BE has fixed RBAC: primary doctor can now view linked plan even if not creator
      if (appointment.linkedTreatmentPlanCode) {
        try {
          const planDetail = await TreatmentPlanService.getTreatmentPlanDetail(
            appointment.patient.patientCode,
            appointment.linkedTreatmentPlanCode
          );
          setTreatmentPlan(planDetail);
          return;
        } catch (error: any) {
          // If 403, user doesn't have permission (BE RBAC check)
          if (error.response?.status === 403) {
            setTreatmentPlanError('Bạn không có quyền xem lộ trình điều trị này. Vui lòng liên hệ quản trị viên.');
            return;
          }
          // If 404, plan not found, fallback to old logic
          if (error.response?.status === 404) {
            console.warn('Linked plan not found, falling back to loop method');
          } else {
            throw error;
          }
        }
      }

      // FALLBACK: If linkedTreatmentPlanCode is not available, use old logic (loop through plans)
      // Check permissions
      const hasViewAll = user?.permissions?.includes('VIEW_TREATMENT_PLAN_ALL') || false;
      const hasViewOwn = user?.permissions?.includes('VIEW_TREATMENT_PLAN_OWN') || false;

      let plans: TreatmentPlanSummaryDTO[] = [];

      if (hasViewAll) {
        // Staff with VIEW_TREATMENT_PLAN_ALL: Use API 5.1 to get all plans for patient
        try {
          plans = await TreatmentPlanService.getAllTreatmentPlansForPatient(
            appointment.patient.patientCode
          );
        } catch (error: any) {
          // If 403, fallback to API 5.5
          if (error.response?.status === 403) {
            console.warn('API 5.1 returned 403, trying API 5.5 with patientCode filter');
            const pageResponse = await TreatmentPlanService.getAllTreatmentPlansWithRBAC({
              patientCode: appointment.patient.patientCode,
              page: 0,
              size: 100,
            });
            plans = pageResponse.content;
          } else {
            throw error;
          }
        }
      } else if (hasViewOwn) {
        // Doctor/Patient with VIEW_TREATMENT_PLAN_OWN: Use API 5.5 (auto-filtered by RBAC)
        // For doctors: BE now allows viewing plans linked to their appointments (even if not creator)
        // For patients: only shows their own plans
        const pageResponse = await TreatmentPlanService.getAllTreatmentPlansWithRBAC({
          patientCode: appointment.patient.patientCode,
          page: 0,
          size: 100,
        });
        plans = pageResponse.content;
      } else {
        setTreatmentPlanError('Bạn không có quyền xem lộ trình điều trị. Vui lòng liên hệ quản trị viên.');
        return;
      }

      // Step 2: Find the plan that has items linked to this appointment
      let foundPlan: TreatmentPlanDetailResponse | null = null;

      for (const planSummary of plans) {
        try {
          // Use API 5.2 to get plan detail
          // This also respects RBAC (VIEW_TREATMENT_PLAN_ALL or VIEW_TREATMENT_PLAN_OWN)
          // BE now allows primary doctor to view linked plan even if not creator
          const planDetail = await TreatmentPlanService.getTreatmentPlanDetail(
            appointment.patient.patientCode,
            planSummary.planCode
          );

          // Check if any item in this plan has this appointment linked
          const hasLinkedAppointment = planDetail.phases.some(phase =>
            phase.items.some(item =>
              item.linkedAppointments?.some(apt => apt.code === appointment.appointmentCode)
            )
          );

          if (hasLinkedAppointment) {
            foundPlan = planDetail;
            break;
          }
        } catch (error: any) {
          // If 403, skip this plan (user doesn't have permission to view it)
          if (error.response?.status === 403) {
            console.warn(`No permission to view plan ${planSummary.planCode}, skipping...`);
            continue;
          }
          console.warn(`Failed to load plan ${planSummary.planCode}:`, error);
          // Continue to next plan
        }
      }

      if (foundPlan) {
        setTreatmentPlan(foundPlan);
      } else {
        // Provide helpful error message based on permissions
        const patientName = appointment.patient?.fullName || 'bệnh nhân này';
        if (hasViewAll) {
          setTreatmentPlanError(`Không tìm thấy lộ trình điều trị nào của ${patientName} liên quan đến lịch hẹn này.`);
        } else if (hasViewOwn) {
          setTreatmentPlanError(`Không tìm thấy lộ trình điều trị nào của ${patientName} liên quan đến lịch hẹn này.`);
        } else {
          setTreatmentPlanError('Bạn không có quyền xem lộ trình điều trị. Vui lòng liên hệ quản trị viên để được cấp quyền VIEW_TREATMENT_PLAN_ALL hoặc VIEW_TREATMENT_PLAN_OWN.');
        }
      }
    } catch (error: any) {
      console.error('Error loading treatment plan:', error);
      if (error.response?.status === 403) {
        setTreatmentPlanError('Bạn không có quyền xem lộ trình điều trị. Vui lòng liên hệ quản trị viên để được cấp quyền VIEW_TREATMENT_PLAN_ALL.');
      } else {
        setTreatmentPlanError('Không thể tải lộ trình điều trị. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingTreatmentPlan(false);
    }
  }, [appointment?.patient?.patientCode, appointment?.linkedTreatmentPlanCode, appointment?.appointmentCode, user?.permissions]);

  // Load clinical record when Clinical Record tab is activated (lazy loading)
  const loadClinicalRecord = useCallback(async () => {
    if (!appointment?.appointmentId) {
      setClinicalRecordError('Không tìm thấy thông tin lịch hẹn');
      setHasTriedLoadingClinicalRecord(true);
      return;
    }

    // Prevent multiple simultaneous calls
    if (loadingClinicalRecord) {
      return;
    }

    setLoadingClinicalRecord(true);
    setClinicalRecordError(null);
    setHasTriedLoadingClinicalRecord(true);

    try {
      // BE now returns HTTP 200 with null instead of 404 when no record exists (Issue #37 fix)
      const record = await clinicalRecordService.getByAppointmentId(appointment.appointmentId);
      setClinicalRecord(record); // record can be null if no clinical record exists
      setIsEditingClinicalRecord(false);
      if (!record) {
        console.log('[CLINICAL RECORD] No record found for appointment, showing create form');
      }
    } catch (error: any) {
      // Only real errors (appointment not found, access denied, etc.)
      console.error('Error loading clinical record:', error);
      setClinicalRecordError(error.message || 'Không thể tải bệnh án');
      handleError(error);
    } finally {
      setLoadingClinicalRecord(false);
    }
  }, [appointment?.appointmentId, loadingClinicalRecord, handleError]);

  // Load clinical record when tab is activated
  useEffect(() => {
    if (activeTab === 'clinical-record' && appointment?.appointmentId && !hasTriedLoadingClinicalRecord) {
      loadClinicalRecord();
    }
  }, [activeTab, appointment?.appointmentId, hasTriedLoadingClinicalRecord, loadClinicalRecord]);

  // Load treatment plan when Treatment Plan tab is activated (lazy loading)
  useEffect(() => {
    // Only load if:
    // 1. Treatment Plan tab is active
    // 2. Appointment is loaded
    // 3. Treatment plan hasn't been loaded yet
    // 4. Not currently loading
    // 5. Haven't tried loading before (or if we want to allow retry, check hasTriedLoadingTreatmentPlan)
    if (
      activeTab === 'treatment-plan' &&
      appointment &&
      !treatmentPlan &&
      !loadingTreatmentPlan &&
      !hasTriedLoadingTreatmentPlan
    ) {
      loadTreatmentPlan();
    }
  }, [activeTab, appointment?.appointmentCode, treatmentPlan, loadingTreatmentPlan, hasTriedLoadingTreatmentPlan, loadTreatmentPlan]);

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
  function getValidNextStatuses(currentStatus: AppointmentStatus): AppointmentStatus[] {
    return APPOINTMENT_STATUS_TRANSITIONS[currentStatus] || [];
  }

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

      console.log('Updating appointment status:', {
        appointmentCode: appointment.appointmentCode,
        currentStatus: appointment.status,
        newStatus: selectedStatus,
      });

      // BE FIXED: updateAppointmentStatus now returns AppointmentDetailDTO
      const updated = await appointmentService.updateAppointmentStatus(appointment.appointmentCode, request);

      // FIX: Verify response has updated status
      if (!updated || !updated.status) {
        console.error('Invalid response from updateAppointmentStatus:', updated);
        toast.error('Failed to update status', {
          description: 'Response from server is invalid',
        });
        return;
      }

      // Verify status matches what we requested
      if (updated.status !== selectedStatus) {
        console.warn('Status mismatch:', {
          requested: selectedStatus,
          received: updated.status,
        });
        toast.warning('Status may not match expected value', {
          description: `Requested: ${selectedStatus}, Received: ${updated.status}`,
          duration: 5000,
        });
      }

      // Check if appointment might be linked to treatment plan items
      // (BE auto-updates plan items when appointment status changes)
      const isPlanRelated = updated.services && updated.services.length > 0;
      const statusChangesPlanItems = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(selectedStatus);

      if (isPlanRelated && statusChangesPlanItems) {
        toast.success('Status updated successfully', {
          description: `Appointment status changed to ${APPOINTMENT_STATUS_COLORS[selectedStatus].text}. Linked treatment plan items have been automatically updated.`,
          duration: 5000,
        });
      } else {
        toast.success('Status updated successfully', {
          description: `Appointment status changed to ${APPOINTMENT_STATUS_COLORS[selectedStatus].text}`,
        });
      }

      // FIX: Update appointment with response data (BE now returns DTO)
      setAppointment(updated);

      // FIX: Reset clinical record loading state when appointment status changes
      // This allows clinical record to be reloaded if user switches to that tab
      setHasTriedLoadingClinicalRecord(false);
      setClinicalRecord(null);
      setClinicalRecordError(null);

      // If currently on clinical record tab, reload it
      if (activeTab === 'clinical-record' && updated.appointmentId) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          loadClinicalRecord();
        }, 100);
      }

      // Double-check: Log after a short delay to see if state actually updated
      setTimeout(() => {
        console.log('State check after update (this is async, may not reflect current state)');
      }, 100);

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
    const [hours, minutes] = delayTime.split(':');
    const newStart = new Date(`${delayDate}T${hours}:${minutes}:00`);

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
      setDelayDate('');
      setDelayTime('');
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
          <div className="flex items-center gap-3">
            {/* FIX: Add key to force re-render when status changes */}
            {appointment && (
              <div key={`status-${appointment.status}-${appointment.appointmentCode}`}>
                {getStatusBadge(appointment.status)}
              </div>
            )}
            {renderActionMenu()}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/20 rounded-full h-auto p-1 w-full md:w-auto">
            <TabsTrigger
              value="details"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Appointment Details
            </TabsTrigger>
            <TabsTrigger
              value="patient"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </TabsTrigger>
            <TabsTrigger
              value="clinical-record"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              disabled={!appointment}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Clinical Record
            </TabsTrigger>
            <TabsTrigger
              value="treatment-plan"
              className="rounded-full px-4 py-2"
            >
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
                    <div key={`status-badge-${appointment.status}-${appointment.appointmentCode}`} className="mt-1">
                      {getStatusBadge(appointment.status)}
                    </div>
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
              <Card
                className={cn(
                  'p-6 md:col-span-2',
                  appointment.services.length === 0 && 'border-dashed bg-muted/30',
                )}
              >
                <h3 className="text-lg font-semibold mb-4">Services</h3>
                {appointment.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {appointment.services.map((service) => (
                      <Badge key={service.serviceCode} variant="outline" className="text-sm p-2">
                        {service.serviceName} ({service.serviceCode})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>No services assigned</p>
                    <p className="text-xs">
                      Services from treatment plan items will appear here once linked.
                    </p>
                  </div>
                )}
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

          {/* Clinical Record Tab */}
          <TabsContent value="clinical-record" className="space-y-4">
            {loadingClinicalRecord ? (
              <Card className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Đang tải bệnh án...</p>
                  </div>
                </div>
              </Card>
            ) : clinicalRecordError ? (
              <Card className="p-6">
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Lỗi khi tải bệnh án</h3>
                  <p className="text-muted-foreground mb-4">{clinicalRecordError}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHasTriedLoadingClinicalRecord(false);
                      setClinicalRecordError(null);
                      loadClinicalRecord();
                    }}
                  >
                    Thử lại
                  </Button>
                </div>
              </Card>
            ) : isEditingClinicalRecord || !clinicalRecord ? (
              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {clinicalRecord ? 'Chỉnh sửa bệnh án' : 'Tạo bệnh án mới'}
                  </h3>
                  <ClinicalRecordForm
                    appointmentId={appointment?.appointmentId || 0}
                    patientId={clinicalRecord?.patient.patientId}
                    existingRecord={clinicalRecord || undefined}
                    onSuccess={(record) => {
                      setClinicalRecord(record);
                      setIsEditingClinicalRecord(false);
                    }}
                    onCancel={() => {
                      if (clinicalRecord) {
                        setIsEditingClinicalRecord(false);
                      } else {
                        setActiveTab('details');
                      }
                    }}
                    readOnly={!canWriteClinicalRecord}
                  />
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <ClinicalRecordView
                  record={clinicalRecord}
                  onEdit={() => setIsEditingClinicalRecord(true)}
                  canEdit={canWriteClinicalRecord}
                />
              </div>
            )}
          </TabsContent>

          {/* Treatment Plan Tab */}
          <TabsContent value="treatment-plan" className="space-y-4">
            {loadingTreatmentPlan ? (
              <Card className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Đang tải lộ trình điều trị...</p>
                  </div>
                </div>
              </Card>
            ) : treatmentPlanError ? (
              <Card className="p-6">
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Không tìm thấy lộ trình điều trị</h3>
                  <p className="text-muted-foreground mb-4">{treatmentPlanError}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHasTriedLoadingTreatmentPlan(false);
                      setTreatmentPlanError(null);
                      loadTreatmentPlan();
                    }}
                  >
                    Thử lại
                  </Button>
                </div>
              </Card>
            ) : treatmentPlan ? (
              <div className="space-y-4">
                {/* Plan Header */}
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{treatmentPlan.planName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Mã lộ trình: <span className="font-mono">{treatmentPlan.planCode}</span>
                      </p>
                      {treatmentPlan.progressSummary && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Tiến độ: {treatmentPlan.progressSummary.completedItems}/{treatmentPlan.progressSummary.totalItems} hạng mục
                          </span>
                          <span className="text-muted-foreground">
                            Giai đoạn: {treatmentPlan.progressSummary.completedPhases}/{treatmentPlan.progressSummary.totalPhases}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/employee/treatment-plans/${treatmentPlan.planCode}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </Card>

                {/* Timeline */}
                <TreatmentPlanTimeline
                  plan={treatmentPlan}
                  onAppointmentClick={(appointmentCode) => {
                    router.push(`/employee/booking/appointments/${appointmentCode}`);
                  }}
                />
              </div>
            ) : (
              <Card className="p-6">
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Treatment Plan</h3>
                  <p className="text-muted-foreground mb-4">
                    Lịch hẹn này chưa được liên kết với lộ trình điều trị nào.
                  </p>
                </div>
              </Card>
            )}
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
              setDelayDate('');
              setDelayTime('');
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
              {/* New Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delayDate">
                    New Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="delayDate"
                    type="date"
                    value={delayDate}
                    onChange={(e) => setDelayDate(e.target.value)}
                    min={appointment ? new Date(appointment.appointmentStartTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="delayTime">
                    New Time <span className="text-red-500">*</span>
                  </Label>
                  <TimePicker value={delayTime} onChange={setDelayTime} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be after the current start time. Time slots are in 15-minute intervals.
              </p>

              {/* Reason Code */}
              <div>
                <Label htmlFor="delayReason">Reason Code (Optional)</Label>
                <Select
                  value={delayReason || '__NONE__'}
                  onValueChange={(value) => setDelayReason(value === '__NONE__' ? '' : (value as AppointmentReasonCode || ''))}
                >
                  <SelectTrigger id="delayReason" className="mt-1">
                    <SelectValue placeholder="Select reason (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">None</SelectItem>
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
                  !delayDate ||
                  !delayTime ||
                  (appointment && delayDate && delayTime ? (() => {
                    const [hours, minutes] = delayTime.split(':');
                    const newStart = new Date(`${delayDate}T${hours}:${minutes}:00`);
                    return newStart <= new Date(appointment.appointmentStartTime);
                  })() : false)
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
    </ProtectedRoute >
  );
}

