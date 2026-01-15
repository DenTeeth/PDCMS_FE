'use client';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { patientService } from '@/services/patientService';
import { getRoleDisplayName } from '@/utils/roleFormatter';
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
import { Patient } from '@/types/patient';
import TreatmentPlanTimeline from '@/components/treatment-plans/TreatmentPlanTimeline';
import ClinicalRecordView from '@/components/clinical-records/ClinicalRecordView';
import ClinicalRecordForm from '@/components/clinical-records/ClinicalRecordForm';
import PatientImageFolderView from '@/components/clinical-records/PatientImageFolderView';
import PaymentTab from '@/components/appointments/PaymentTab';

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
  CreditCard,
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

  // Hours from 8 to 22 (8:00 AM to 10:00 PM - giờ làm việc)
  // 22h = 10:00 PM là kết thúc giờ làm
  const hours = Array.from({ length: 15 }, (_, i) => (i + 8).toString().padStart(2, '0')); // 8-22
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

  // Patient detail state
  const [patientDetail, setPatientDetail] = useState<Patient | null>(null);
  const [loadingPatientDetail, setLoadingPatientDetail] = useState(false);

  // Permissions - ✅ Updated to use new BE permissions
  const canViewAll = user?.permissions?.includes('VIEW_APPOINTMENT_ALL') || false;
  const canViewOwn = user?.permissions?.includes('VIEW_APPOINTMENT_OWN') || false;
  const canView = canViewAll || canViewOwn;
  const canUpdateStatus = user?.permissions?.includes('UPDATE_APPOINTMENT_STATUS') || false;
  const canDelay = user?.permissions?.includes('MANAGE_APPOINTMENT') || false; // ✅ BE: MANAGE_APPOINTMENT covers delay/cancel
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

    // Remove update status from action menu - it's now integrated in the status badge
    // BE Update 2025-12-18: NO_SHOW appointments can now be delayed
    const canShowDelay =
      canDelay &&
      (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN' || appointment.status === 'NO_SHOW');

    // Employee only has Delay (no Reschedule)
    if (canShowDelay) {
      items.push({
        key: 'delay',
        label: 'Hoãn lịch',
        icon: Clock,
        onSelect: () => setShowDelayModal(true),
      });
    }

    return items;
  }, [appointment, canDelay]);

  const renderActionMenu = () => {
    if (!actionItems.length) {
      return null;
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-2 space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Hành động
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

  // Load patient detail when appointment is loaded
  useEffect(() => {
    if (!appointment?.patient?.patientCode) {
      setPatientDetail(null);
      return;
    }

    const loadPatientDetail = async () => {
      try {
        setLoadingPatientDetail(true);
        const patient = await patientService.getPatientByCode(appointment.patient!.patientCode);
        setPatientDetail(patient);
      } catch (error: any) {
        console.error('Error loading patient detail:', error);
        // Don't show error - patient info from appointment is enough
        setPatientDetail(null);
      } finally {
        setLoadingPatientDetail(false);
      }
    };

    loadPatientDetail();
  }, [appointment?.patient?.patientCode]);

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
      toast.error('Chuyển đổi trạng thái không hợp lệ', {
        description: `Không thể thay đổi trạng thái từ ${APPOINTMENT_STATUS_COLORS[appointment.status].text} sang ${APPOINTMENT_STATUS_COLORS[selectedStatus].text}`,
      });
      return;
    }

    // Validate: Require reasonCode and notes for CANCELLED and CANCELLED_LATE status
    if (selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') {
      if (!statusUpdateReason) {
        toast.error('Lý do hủy bắt buộc', {
          description: 'Vui lòng chọn lý do hủy lịch hẹn',
        });
        return;
      }
      if (!statusUpdateNotes || !statusUpdateNotes.trim()) {
        toast.error('Ghi chú bắt buộc', {
          description: 'Vui lòng nhập ghi chú về lý do hủy',
        });
        return;
      }
    }

    try {
      setUpdating(true);

      const request: UpdateAppointmentStatusRequest = {
        status: selectedStatus,
        reasonCode: (selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') ? (statusUpdateReason as AppointmentReasonCode) : undefined,
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
        console.error('Invalid response from updateAppointmentStatus:', {
          response: updated,
          type: typeof updated,
          keys: updated ? Object.keys(updated) : 'null/undefined',
          appointmentCode: appointment.appointmentCode,
          requestedStatus: selectedStatus,
        });
        toast.error('Cập nhật trạng thái thất bại', {
          description: 'Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại sau.',
        });
        return;
      }

      // Verify status matches what we requested
      if (updated.status !== selectedStatus) {
        console.warn('Status mismatch:', {
          requested: selectedStatus,
          received: updated.status,
        });
        toast.warning('Trạng thái có thể không khớp với giá trị mong đợi', {
          description: `Yêu cầu: ${selectedStatus}, Nhận được: ${updated.status}`,
          duration: 5000,
        });
      }

      // Check if appointment might be linked to treatment plan items
      // (BE auto-updates plan items when appointment status changes)
      const isPlanRelated = updated.services && updated.services.length > 0;
      const statusChangesPlanItems = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELLED_LATE'].includes(selectedStatus);

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

      // If status changed to COMPLETED, check materials deduction
      if (selectedStatus === 'COMPLETED' && updated.appointmentId) {
        // Wait for BE to process materials deduction (1-2 seconds)
        setTimeout(async () => {
          try {
            // Reload clinical record to get updated procedures
            if (updated.appointmentId) {
              const record = await clinicalRecordService.getByAppointmentId(updated.appointmentId);
              if (record && record.procedures && record.procedures.length > 0) {
                // Check if any procedure has materials that should be deducted
                let allDeducted = true;
                let hasProcedures = false;
                
                for (const procedure of record.procedures) {
                  hasProcedures = true;
                  try {
                    const materials = await clinicalRecordService.getProcedureMaterials(procedure.procedureId);
                    if (!materials.materialsDeducted) {
                      allDeducted = false;
                      break;
                    }
                  } catch (error) {
                    // If can't load materials, skip this procedure
                    console.warn('Could not check materials for procedure:', procedure.procedureId);
                  }
                }
                
                if (hasProcedures) {
                  if (allDeducted) {
                    toast.success('Vật tư đã được trừ khỏi kho', {
                      description: 'Tất cả vật tư đã được tự động trừ khỏi kho theo BOM của dịch vụ',
                      duration: 5000,
                    });
                  } else {
                    toast.warning('Một số vật tư chưa được trừ khỏi kho', {
                      description: 'Có thể do thiếu hàng trong kho. Vui lòng kiểm tra và xử lý thủ công nếu cần.',
                      duration: 7000,
                    });
                  }
                }
              }
            }
            
            // Reload clinical record in UI if on that tab
            if (activeTab === 'clinical-record') {
              loadClinicalRecord();
            }
          } catch (error) {
            console.error('Error checking materials deduction:', error);
            // Don't show error to user, just log it
          }
        }, 2000); // Wait 2 seconds for BE to process
      } else {
        // If currently on clinical record tab, reload it
        if (activeTab === 'clinical-record' && updated.appointmentId) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            loadClinicalRecord();
          }, 100);
        }
      }

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
    // Validate: delayDate and delayTime are required
    if (!delayDate || !delayTime || !appointment) {
      toast.error('Vui lòng chọn ngày và giờ mới', {
        description: 'Ngày và giờ mới là bắt buộc',
      });
      return;
    }

    // Build delayNewStartTime from delayDate and delayTime (ISO 8601 format: YYYY-MM-DDTHH:mm:ss)
    const [hours, minutes] = delayTime.split(':');
    const delayNewStartTime = `${delayDate}T${hours}:${minutes}:00`;

    // Validate: Only SCHEDULED or CHECKED_IN can be delayed
    if (appointment.status !== 'SCHEDULED' && appointment.status !== 'CHECKED_IN') {
      toast.error('Không thể dời lịch hẹn', {
        description: 'Chỉ có thể dời các lịch hẹn đã lên lịch hoặc đã check-in',
      });
      return;
    }

    // Validate: New start time must be after original
    const originalStart = new Date(appointment.appointmentStartTime);
    const newStart = new Date(delayNewStartTime);

    if (newStart <= originalStart) {
      toast.error('Thời gian không hợp lệ', {
        description: 'Giờ bắt đầu mới phải sau giờ bắt đầu ban đầu',
      });
      return;
    }

    // Validate: reasonCode is required (BE requires NOT NULL)
    if (!delayReason) {
      toast.error('Lý do dời lịch bắt buộc', {
        description: 'Vui lòng chọn lý do dời lịch hẹn',
      });
      return;
    }

    try {
      setDelaying(true);

      const request: DelayAppointmentRequest = {
        newStartTime: delayNewStartTime, // ISO 8601 format
        reasonCode: delayReason as AppointmentReasonCode, // Required (BE requires NOT NULL)
        notes: delayNotes || null,
      };

      const updated = await appointmentService.delayAppointment(appointment.appointmentCode, request);

      toast.success('Dời lịch hẹn thành công', {
        description: `Giờ bắt đầu mới: ${formatDateTime(delayNewStartTime)}`,
      });

      // Update appointment with new data
      setAppointment(updated);

      // Reset form
      setShowDelayModal(false);
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
              <h2 className="text-xl font-semibold mb-2">Không tìm thấy lịch hẹn</h2>
              <p className="text-muted-foreground mb-4">
                Không thể tìm thấy lịch hẹn với mã: {appointmentCode}
              </p>
              <Button onClick={() => router.push('/employee/appointments')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại lịch hẹn
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
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết lịch hẹn</h1>
              <p className="text-muted-foreground mt-1">
                Code: {appointment.appointmentCode}
              </p>
            </div>
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
              Chi tiết lịch hẹn
            </TabsTrigger>
            <TabsTrigger
              value="patient"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 mr-2" />
              Thông tin bệnh nhân
            </TabsTrigger>
            <TabsTrigger
              value="clinical-record"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              disabled={!appointment}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Bệnh án
            </TabsTrigger>
            <TabsTrigger
              value="treatment-plan"
              className="rounded-full px-4 py-2"
              disabled={!appointment?.linkedTreatmentPlanCode && hasTriedLoadingTreatmentPlan && !treatmentPlan}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Lộ trình điều trị
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="rounded-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Thanh toán
            </TabsTrigger>
          </TabsList>

          {/* Appointment Details Tab */}
          <TabsContent value="details">
            <section className="bg-card rounded-lg border p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                {/* Appointment Info */}
                <div className="pr-6 border-r border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Thông tin lịch hẹn
                    </h3>
                    {renderActionMenu()}
                  </div>
                  <div className="space-y-4">
                    {/* Appointment Code và Status cùng dòng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Mã lịch hẹn</label>
                        <p className="text-base font-semibold mt-1">{appointment.appointmentCode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                        <div key={`status-badge-${appointment.status}-${appointment.appointmentCode}`} className="mt-1 flex items-center">
                          {canUpdateStatus && getValidNextStatuses(appointment.status).length > 0 ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="cursor-pointer hover:opacity-80 transition-opacity">
                                  {getStatusBadge(appointment.status)}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-56 p-2">
                                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  Thay đổi trạng thái
                                </p>
                                <div className="space-y-1">
                                  {getValidNextStatuses(appointment.status).map((status) => {
                                    const color = APPOINTMENT_STATUS_COLORS[status];
                                    return (
                                      <Button
                                        key={status}
                                        variant="ghost"
                                        className="w-full justify-start gap-2 text-sm h-auto py-2"
                                        onClick={() => {
                                          setSelectedStatus(status);
                                          // Reset form fields
                                          setStatusUpdateReason('');
                                          setStatusUpdateNotes('');
                                          // Show modal
                                          setShowStatusModal(true);
                                        }}
                                      >
                                        <div
                                          className="w-3 h-3 rounded-sm shrink-0"
                                          style={{ backgroundColor: color.bg, borderColor: color.border, borderWidth: 1 }}
                                        />
                                        <span>{color.text}</span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            getStatusBadge(appointment.status)
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expected Duration và Created At cùng dòng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Thời lượng dự kiến</label>
                        <p className="text-base mt-1">{appointment.expectedDurationMinutes} phút</p>
                      </div>
                      {appointment.createdAt && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Ngày tạo</label>
                          <p className="text-base mt-1">{formatDateTime(appointment.createdAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* Start Time và End Time cùng dòng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Giờ bắt đầu
                        </label>
                        <p className="text-base mt-1">{formatDateTime(appointment.appointmentStartTime)}</p>
                        {appointment.actualStartTime && (
                          <>
                            <label className="text-sm font-medium text-muted-foreground mt-2 block">Giờ bắt đầu thực tế</label>
                            <p className="text-base mt-1">{formatDateTime(appointment.actualStartTime)}</p>
                          </>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Giờ kết thúc
                        </label>
                        <p className="text-base mt-1">{formatDateTime(appointment.appointmentEndTime)}</p>
                        {appointment.actualEndTime && (
                          <>
                            <label className="text-sm font-medium text-muted-foreground mt-2 block">Giờ kết thúc thực tế</label>
                            <p className="text-base mt-1">{formatDateTime(appointment.actualEndTime)}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notes để riêng vì có thể dài */}
                    {appointment.notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ghi chú</label>
                        <p className="text-base mt-1">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor & Room Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Bác sĩ & Phòng
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {appointment.doctor ? (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Bác sĩ
                          </label>
                          <div className="mt-1">
                            <p className="text-base font-semibold">{appointment.doctor.fullName}</p>
                            <p className="text-sm text-muted-foreground">{appointment.doctor.employeeCode}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Bác sĩ
                          </label>
                          <p className="text-base text-muted-foreground mt-1">N/A</p>
                        </div>
                      )}
                      {appointment.room ? (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Phòng
                          </label>
                          <div className="mt-1">
                            <p className="text-base font-semibold">{appointment.room.roomName}</p>
                            <p className="text-sm text-muted-foreground">{appointment.room.roomCode}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Phòng
                          </label>
                          <p className="text-base text-muted-foreground mt-1">N/A</p>
                        </div>
                      )}
                    </div>

                    {/* Participants */}
                    {appointment.participants && appointment.participants.length > 0 && (
                      <div className="pt-4 border-t">
                        <label className="text-sm font-medium text-muted-foreground mb-3 block">Người tham gia</label>
                        <div className="space-y-1.5">
                          {appointment.participants.map((participant, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{participant.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{participant.employeeCode}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">{getRoleDisplayName(participant.role)}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dịch vụ
                </h3>
                {appointment.services.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên dịch vụ</TableHead>
                        <TableHead>Mã dịch vụ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointment.services.map((service) => (
                        <TableRow key={service.serviceCode}>
                          <TableCell className="font-medium">{service.serviceName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{service.serviceCode}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Chưa có dịch vụ nào được gán</p>
                    <p className="text-xs">
                      Các dịch vụ từ hạng mục lộ trình điều trị sẽ hiển thị ở đây sau khi được liên kết.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* Patient Information Tab */}
          <TabsContent value="patient">
            {appointment.patient ? (
              <section className="bg-card rounded-lg border p-6 space-y-6">
                <div className="pb-6 border-b">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin bệnh nhân
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mã bệnh nhân</label>
                      <p className="text-base font-semibold">{appointment.patient.patientCode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                      <p className="text-base">{appointment.patient.fullName}</p>
                    </div>
                    {appointment.patient.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                        <p className="text-base">{appointment.patient.phone}</p>
                      </div>
                    )}
                    {patientDetail?.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-base">{patientDetail.email}</p>
                      </div>
                    )}
                    {appointment.patient.dateOfBirth && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                        <p className="text-base">{format(new Date(appointment.patient.dateOfBirth), 'dd MMM yyyy')}</p>
                      </div>
                    )}
                    {patientDetail?.gender && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                        <p className="text-base">
                          {patientDetail.gender === 'MALE' ? 'Nam' : patientDetail.gender === 'FEMALE' ? 'Nữ' : patientDetail.gender}
                        </p>
                      </div>
                    )}
                    {patientDetail?.address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Địa chỉ</label>
                        <p className="text-base">{patientDetail.address}</p>
                      </div>
                    )}
                    {patientDetail?.emergencyContactName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Người liên hệ khẩn cấp</label>
                        <p className="text-base">{patientDetail.emergencyContactName}</p>
                        {patientDetail.emergencyContactRelationship && (
                          <p className="text-sm text-muted-foreground">Mối quan hệ: {patientDetail.emergencyContactRelationship}</p>
                        )}
                        {patientDetail.emergencyContactPhone && (
                          <p className="text-sm text-muted-foreground mt-1">{patientDetail.emergencyContactPhone}</p>
                        )}
                      </div>
                    )}
                    {(patientDetail?.allergies || patientDetail?.medicalHistory) && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        {patientDetail?.allergies && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              Dị ứng
                              <span className="text-red-500">*</span>
                            </label>
                            <p className="text-base">{patientDetail.allergies}</p>
                          </div>
                        )}
                        {patientDetail?.medicalHistory && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              Tiền sử bệnh
                              <span className="text-red-500">*</span>
                            </label>
                            <p className="text-base whitespace-pre-wrap">{patientDetail.medicalHistory}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Images Folder View */}
                {appointment.patient && (
                  <div>
                    <PatientImageFolderView
                      patientCode={appointment.patient.patientCode}
                    />
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-card rounded-lg border p-6">
                <p className="text-muted-foreground">Thông tin bệnh nhân không khả dụng</p>
              </section>
            )}
          </TabsContent>

          {/* Clinical Record Tab */}
          <TabsContent value="clinical-record">
            {loadingClinicalRecord ? (
              <section className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Đang tải bệnh án...</p>
                  </div>
                </div>
              </section>
            ) : clinicalRecordError ? (
              <section className="bg-card rounded-lg border p-6">
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
              </section>
            ) : isEditingClinicalRecord || !clinicalRecord ? (
              <section className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {clinicalRecord ? 'Chỉnh sửa bệnh án' : 'Tạo bệnh án mới'}
                </h3>
                <ClinicalRecordForm
                  appointmentId={appointment?.appointmentId || 0}
                  patientId={clinicalRecord?.patient?.patientId || appointment?.patient?.patientId}
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
              </section>
            ) : clinicalRecord ? (
              <ClinicalRecordView
                record={clinicalRecord}
                onEdit={() => setIsEditingClinicalRecord(true)}
                canEdit={canWriteClinicalRecord}
                appointmentStatus={appointment?.status}
              />
            ) : null}
          </TabsContent>

          {/* Treatment Plan Tab */}
          <TabsContent value="treatment-plan">
            {loadingTreatmentPlan ? (
              <section className="bg-card rounded-lg border p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Đang tải lộ trình điều trị...</p>
                  </div>
                </div>
              </section>
            ) : treatmentPlanError ? (
              <section className="bg-card rounded-lg border p-6">
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
              </section>
            ) : treatmentPlan ? (
              <section className="bg-card rounded-lg border p-6 space-y-6">
                {/* Plan Header */}
                <div className="pb-6 border-b">
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
                </div>

                {/* Timeline */}
                <TreatmentPlanTimeline
                  plan={treatmentPlan}
                  onAppointmentClick={(appointmentCode) => {
                    router.push(`/employee/booking/appointments/${appointmentCode}`);
                  }}
                />
              </section>
            ) : (
              <section className="bg-card rounded-lg border p-6">
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Lộ trình điều trị</h3>
                  <p className="text-muted-foreground mb-4">
                    Lịch hẹn này chưa được liên kết với lộ trình điều trị nào.
                  </p>
                </div>
              </section>
            )}
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            {appointment ? (
              <PaymentTab
                appointmentId={appointment.appointmentId || 0}
                appointmentCode={appointment.appointmentCode}
                patientCode={appointment.patient?.patientCode}
                patientId={appointment.patient?.patientId}
                treatmentPlanId={undefined} // AppointmentDetailDTO doesn't have treatmentPlanId
                treatmentPlanCode={appointment.linkedTreatmentPlanCode || undefined}
                appointmentServices={appointment.services || []}
              />
            ) : (
              <section className="bg-card rounded-lg border p-6">
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Đang tải thông tin lịch hẹn...</p>
                </div>
              </section>
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
              <DialogTitle>
                {selectedStatus === 'CANCELLED' ? 'Hủy Lịch Hẹn' : selectedStatus === 'CANCELLED_LATE' ? 'Hủy Muộn Lịch Hẹn' : 'Cập Nhật Trạng Thái'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Reason Code - Required for CANCELLED and CANCELLED_LATE */}
              {(selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') && (
                <div className="space-y-1">
                  <Label htmlFor="reasonCode">
                    Lý do hủy <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={statusUpdateReason || ''}
                    onValueChange={(value) => setStatusUpdateReason(value as AppointmentReasonCode)}
                  >
                    <SelectTrigger id="reasonCode">
                      <SelectValue placeholder="Chọn lý do hủy" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPOINTMENT_REASON_CODE_LABELS).map(([code, label]) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vui lòng chọn lý do hủy lịch hẹn
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="statusNotes">
                  Ghi chú {(selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') ? '(Bắt buộc)' : '(Tùy chọn)'}
                </Label>
                <Textarea
                  id="statusNotes"
                  value={statusUpdateNotes}
                  onChange={(e) => setStatusUpdateNotes(e.target.value)}
                  placeholder={(selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') ? 'Nhập ghi chú về lý do hủy...' : 'Thêm ghi chú (nếu có)...'}
                  className="resize-none"
                  rows={(selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') ? 4 : 3}
                />
                {(selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedStatus === 'CANCELLED_LATE' 
                      ? 'Lịch hẹn bị hủy trong vòng 24 giờ trước giờ hẹn sẽ ảnh hưởng đến số lần không đến liên tiếp của bệnh nhân.'
                      : 'Vui lòng cung cấp thông tin chi tiết về lý do hủy'}
                  </p>
                )}
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
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={
                  updating ||
                  !selectedStatus ||
                  selectedStatus === appointment.status ||
                  ((selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') && (!statusUpdateReason || !statusUpdateNotes.trim())) ||
                  (selectedStatus && !getValidNextStatuses(appointment.status).includes(selectedStatus))
                }
                variant={(selectedStatus === 'CANCELLED' || selectedStatus === 'CANCELLED_LATE') ? 'destructive' : 'default'}
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedStatus === 'CANCELLED' ? 'Xác nhận hủy' : selectedStatus === 'CANCELLED_LATE' ? 'Xác nhận hủy muộn' : 'Cập nhật trạng thái'}
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
              setDelayDate('');
              setDelayTime('');
              setDelayReason('');
              setDelayNotes('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dời lịch hẹn</DialogTitle>
              <DialogDescription>
                Dời lịch hẹn này sang thời gian muộn hơn. Giờ bắt đầu hiện tại: <span className="font-semibold">{formatDateTime(appointment.appointmentStartTime)}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* New Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delayDate">
                    Ngày mới <span className="text-red-500">*</span>
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
                    Giờ mới <span className="text-red-500">*</span>
                  </Label>
                  <TimePicker value={delayTime} onChange={setDelayTime} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Phải sau giờ bắt đầu hiện tại. Khung giờ được chia theo khoảng 15 phút.
              </p>

              {/* Reason Code - Required */}
              <div className="space-y-1">
                <Label htmlFor="delayReason">Mã lý do <span className="text-red-500">*</span></Label>
                <Select
                  value={delayReason || ''}
                  onValueChange={(value) => setDelayReason(value as AppointmentReasonCode || '')}
                >
                  <SelectTrigger id="delayReason">
                    <SelectValue placeholder="Chọn lý do (bắt buộc)" />
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

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="delayNotes">Ghi chú (Tùy chọn)</Label>
                <Textarea
                  id="delayNotes"
                  value={delayNotes}
                  onChange={(e) => setDelayNotes(e.target.value)}
                  placeholder="Thêm ghi chú bổ sung..."
                  className="resize-none"
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
                Hủy
              </Button>
              <Button
                onClick={handleDelay}
                disabled={
                  delaying ||
                  !delayDate ||
                  !delayTime ||
                  !delayReason || // reasonCode is required
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
                    Đang dời...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Dời lịch hẹn
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

