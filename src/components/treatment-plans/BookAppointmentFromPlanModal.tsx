'use client';

/**
 * Book Appointment From Treatment Plan Modal
 * 
 * Simplified appointment booking flow specifically for treatment plan items.
 * This modal is optimized for booking appointments directly from plan items with:
 * - Auto-filled patient, services, and doctor from plan
 * - Display of plan items being booked
 * - Simplified 3-step flow
 */

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { appointmentService } from '@/services/appointmentService';
import { EmployeeService } from '@/services/employeeService';
import { RoomService } from '@/services/roomService';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { ServiceService } from '@/services/serviceService';
import { invoiceService, InvoiceResponse, InvoicePaymentStatus } from '@/services/invoiceService';
import { useAuth } from '@/contexts/AuthContext';
import {
  CreateAppointmentRequest,
  AvailableTimesRequest,
  TimeSlot,
} from '@/types/appointment';
import { Employee } from '@/types/employee';
import { Room } from '@/types/room';
import { EmployeeShift } from '@/types/employeeShift';
import { TreatmentPlanDetailResponse, ItemDetailDTO } from '@/types/treatmentPlan';
import { Service } from '@/types/service';
import {
  User,
  UserCog,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  FileText,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { format, addDays, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';

interface BookAppointmentFromPlanModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: TreatmentPlanDetailResponse;
  planItemIds: number[]; // Item IDs to book
  initialDate?: string; // Pre-filled appointment date (YYYY-MM-DD)
  initialStartTime?: string; // Pre-filled appointment start time (ISO format)
  initialRoomCode?: string; // Pre-filled room code
}

type Step = 1 | 2 | 3;

export default function BookAppointmentFromPlanModal({
  open,
  onClose,
  onSuccess,
  plan,
  planItemIds,
  initialDate,
  initialStartTime,
  initialRoomCode,
}: BookAppointmentFromPlanModalProps) {
  const { user } = useAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  // Form data
  // Note: employeeCode is auto-filled from plan.doctor and cannot be changed
  // Only participants (assistants) can be selected
  const [roomCode, setRoomCode] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentStartTime, setAppointmentStartTime] = useState<string>('');
  const [participantCodes, setParticipantCodes] = useState<string[]>([]); // Multiple participants allowed
  const [notes, setNotes] = useState<string>('');

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [allEmployeeShifts, setAllEmployeeShifts] = useState<Map<string, EmployeeShift[]>>(new Map());
  const [servicesMap, setServicesMap] = useState<Map<string, Service>>(new Map());
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Payment validation state
  const [paymentStatusChecked, setPaymentStatusChecked] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<InvoiceResponse[]>([]);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // TEMPORARILY DISABLED: Auto-check payment status
  // TODO: Re-enable after BE fixes invoice creation issue
  /* DISABLED - Re-enable after BE fix
  // Auto-check payment status when entering step 3
  useEffect(() => {
    if (currentStep === 3 && !paymentStatusChecked && plan?.planId && plan?.patient?.patientId) {
      checkPaymentStatus();
    }
  }, [currentStep, plan?.planId, plan?.patient?.patientId]);
  */

  // Extract plan items being booked
  const planItems = useMemo(() => {
    const items = plan.phases
      .flatMap(phase => phase.items || [])
      .filter(item => planItemIds.includes(item.itemId));

    // Debug: Log plan items to check estimatedTimeMinutes
    console.log(' Plan Items for Booking (RAW):', items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      serviceCode: item.serviceCode,
      estimatedTimeMinutes: item.estimatedTimeMinutes,
    })));

    return items;
  }, [plan, planItemIds]);

  //  FE WORKAROUND: Enrich plan items with duration from service master data
  // This fixes BE bug where service/domain/DentalService.java maps to wrong column
  const enrichedPlanItems = useMemo(() => {
    return planItems.map(item => {
      // If item already has duration, use it
      if (item.estimatedTimeMinutes && item.estimatedTimeMinutes > 0) {
        return item;
      }

      // Otherwise, try to get duration from services map
      const service = servicesMap.get(item.serviceCode || '');
      const durationFromService = service?.defaultDurationMinutes || 0;

      if (durationFromService > 0) {
        console.log(` Enriched item ${item.itemId} with duration ${durationFromService} from service ${item.serviceCode}`);
      } else {
        console.warn(` Item ${item.itemId} (${item.serviceCode}) has NO duration in plan AND service not found`);
      }

      return {
        ...item,
        estimatedTimeMinutes: durationFromService || 0,
      };
    });
  }, [planItems, servicesMap]);

  // Extract service codes from plan items
  const serviceCodes = useMemo(() => {
    return planItems
      .map(item => item.serviceCode)
      .filter(code => !!code) as string[];
  }, [planItems]);

  // Calculate total estimated time (use enriched items)
  const totalEstimatedTime = useMemo(() => {
    const total = enrichedPlanItems.reduce((sum, item) => sum + (item.estimatedTimeMinutes || 0), 0);
    console.log('  Total Estimated Time:', total, 'minutes (from enriched items)');
    return total;
  }, [enrichedPlanItems]);

  //  FE WORKAROUND: Fetch services to get duration (fixes BE column mapping bug)
  useEffect(() => {
    const fetchServices = async () => {
      if (!open || serviceCodes.length === 0) return;

      setLoadingServices(true);
      try {
        // Fetch all services (booking API has correct defaultDurationMinutes)
        const response = await ServiceService.getServices({
          page: 0,
          size: 1000, // Get all to build map
          isActive: 'true', // ServiceFilters expects string
        });

        const services = response.content || [];
        const map = new Map<string, Service>();

        services.forEach(service => {
          if (service.serviceCode) {
            map.set(service.serviceCode, service);
          }
        });

        setServicesMap(map);
        console.log(` Loaded ${map.size} services for duration enrichment`);
      } catch (error) {
        console.error(' Failed to load services for duration enrichment:', error);
        toast.error('Không thể tải thông tin dịch vụ');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [open, serviceCodes]);

  // Initialize form data from plan
  useEffect(() => {
    if (open && plan) {
      // Doctor is fixed from plan - no need to set employeeCode state
      // Reset other fields
      setRoomCode('');
      setAppointmentDate('');
      setAppointmentStartTime('');
      setParticipantCodes([]);
      setNotes('');
      setCurrentStep(1);
      setSelectedMonth(startOfMonth(new Date()));
      
      // Reset payment status check
      setPaymentStatusChecked(false);
      setUnpaidInvoices([]);
      
      // TEMPORARILY DISABLED: Auto-check payment status
      // TODO: Re-enable after BE fixes invoice creation issue
      /* DISABLED - Re-enable after BE fix
      // Auto-check payment status when modal opens
      if (plan.planId && plan.patient?.patientId) {
        checkPaymentStatus();
      }
      */
    }
  }, [open, plan]);

  // Get doctor employee code from plan (fixed, cannot be changed)
  const employeeCode = plan?.doctor.employeeCode || '';

  // Load initial data
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Set initial values when modal opens with prefilled data
  useEffect(() => {
    if (open && (initialDate || initialStartTime || initialRoomCode)) {
      if (initialDate) {
        setAppointmentDate(initialDate);
        // Set selected month to the initial date
        const date = new Date(initialDate);
        setSelectedMonth(startOfMonth(date));
      }
      if (initialStartTime) {
        setAppointmentStartTime(initialStartTime);
      }
      if (initialRoomCode) {
        setRoomCode(initialRoomCode);
      }
      // Don't auto-skip to step 2 - let user see step 1 first
    }
  }, [open, initialDate, initialStartTime, initialRoomCode]);

  // Load employee shifts when entering step 2 if date is already selected
  useEffect(() => {
    if (currentStep === 2 && appointmentDate && plan?.doctor?.employeeCode && plan?.doctor?.employeeId) {
      // Load shifts for the selected doctor and date
      const loadShifts = async () => {
        try {
          setLoadingShifts(true);
          const date = new Date(appointmentDate);
          const firstDay = startOfMonth(date);
          const lastDay = endOfMonth(date);

          const shiftsResponse = await EmployeeShiftService.getShiftsByDateRange(
            format(firstDay, 'yyyy-MM-dd'),
            format(lastDay, 'yyyy-MM-dd'),
            plan.doctor.employeeId
          );

          // Update the allEmployeeShifts map with doctor's shifts
          setAllEmployeeShifts(prev => {
            const newMap = new Map(prev);
            newMap.set(plan.doctor.employeeCode, shiftsResponse);
            return newMap;
          });
        } catch (error: any) {
          console.error('Error loading doctor shifts:', error);
        } finally {
          setLoadingShifts(false);
        }
      };

      loadShifts();
    }
  }, [currentStep, appointmentDate, plan?.doctor?.employeeCode, plan?.doctor?.employeeId]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      //  FIX: Load ALL employees (doctors, assistants, nurses) - increase size to get all
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 1000, //  FIX: Increase size to ensure we get all employees including assistants/nurses
        isActive: true,
      });

      //  DEBUG: Log employees to see what we're getting
      console.log(' Loaded employees:', {
        total: employeesResponse.content.length,
        byRole: employeesResponse.content.reduce((acc: any, emp: any) => {
          const role = emp.roleName || 'UNKNOWN';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {}),
        assistants: employeesResponse.content.filter((e: any) =>
          e.roleName?.includes('ASSISTANT') || e.roleName?.includes('NURSE')
        ).length,
      });

      // Load all employees (doctors, assistants, nurses) - we need assistants/nurses for participants
      setEmployees(employeesResponse.content);

      // Load rooms - use room filtering API if service codes are available
      if (serviceCodes.length > 0) {
        try {
          const filteredRooms = await RoomService.getRoomsByServices(serviceCodes);
          setRooms(Array.isArray(filteredRooms) ? filteredRooms : []);
        } catch (error: any) {
          console.warn('Failed to load filtered rooms, falling back to all active rooms:', error);
          // Fallback to all active rooms if filtering fails
          const roomsData = await RoomService.getActiveRooms();
          setRooms(Array.isArray(roomsData) ? roomsData : []);
        }
      } else {
        // No services selected, show all active rooms
        const roomsData = await RoomService.getActiveRooms();
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      }

      // Note: No need to load services for participant filtering
      // Participants are filtered by role (ASSISTANT/NURSE) and shifts only
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      toast.error('Không thể tải dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingData(false);
    }
  };

  // Load shifts for plan doctor and participants for the selected month
  useEffect(() => {
    if (open && plan?.doctor.employeeCode) {
      loadAllShiftsForMonth();
    }
  }, [open, selectedMonth, plan?.doctor.employeeCode, employees]); //  FIX: Removed participantCode dependency - we load all participants' shifts now

  const loadAllShiftsForMonth = async () => {
    if (!plan?.doctor.employeeCode || employees.length === 0) return;

    setLoadingShifts(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');

      const shiftsMap = new Map<string, EmployeeShift[]>();

      // Load shifts for plan doctor
      const doctorEmployee = employees.find((e) => e.employeeCode === plan.doctor.employeeCode);
      if (doctorEmployee) {
        try {
          const doctorShifts = await EmployeeShiftService.getShifts({
            start_date: startDateStr,
            end_date: endDateStr,
            employee_id: parseInt(doctorEmployee.employeeId),
          });
          shiftsMap.set(plan.doctor.employeeCode, doctorShifts);
        } catch (error) {
          console.error(`Failed to load shifts for doctor ${plan.doctor.employeeCode}:`, error);
          shiftsMap.set(plan.doctor.employeeCode, []);
        }
      }

      //  FIX: Load shifts for ALL eligible participants (assistants/nurses/doctors)
      // This is needed to filter eligibleParticipants correctly
      // Only load for employees who could be participants (exclude plan doctor)
      const potentialParticipants = employees.filter((emp) => {
        // Exclude the plan's primary doctor
        if (emp.employeeCode === plan.doctor.employeeCode) {
          return false;
        }

        // Must be ASSISTANT, NURSE, DOCTOR, or DENTIST
        const isAssistant = emp.roleName?.includes('ASSISTANT') || emp.roleName?.includes('NURSE');
        const isDoctor = emp.roleName?.includes('DOCTOR') || emp.roleName?.includes('DENTIST');
        return isAssistant || isDoctor;
      });

      console.log(`� Loading shifts for ${potentialParticipants.length} potential participants...`);

      // Load shifts for all potential participants in parallel (limit to avoid too many requests)
      const shiftPromises = potentialParticipants.slice(0, 20).map(async (emp) => {
        try {
          const shifts = await EmployeeShiftService.getShifts({
            start_date: startDateStr,
            end_date: endDateStr,
            employee_id: parseInt(emp.employeeId),
          });
          shiftsMap.set(emp.employeeCode, shifts);
          return { code: emp.employeeCode, count: shifts.length };
        } catch (error) {
          console.error(`Failed to load shifts for ${emp.employeeCode}:`, error);
          shiftsMap.set(emp.employeeCode, []);
          return { code: emp.employeeCode, count: 0 };
        }
      });

      const results = await Promise.all(shiftPromises);
      const totalShifts = results.reduce((sum, r) => sum + r.count, 0);
      console.log(` Loaded shifts for ${results.length} participants (${totalShifts} total shifts)`);

      setAllEmployeeShifts(shiftsMap);
    } catch (error: any) {
      console.error('Failed to load shifts:', error);
      setAllEmployeeShifts(new Map());
    } finally {
      setLoadingShifts(false);
    }
  };

  // Get shifts for a specific employee and date
  const getShiftsForEmployeeAndDate = (employeeCode: string, dateString: string): EmployeeShift[] => {
    const shifts = allEmployeeShifts.get(employeeCode) || [];
    return shifts.filter((shift) => {
      const shiftDate = format(new Date(shift.workDate), 'yyyy-MM-dd');
      return shiftDate === dateString;
    });
  };

  // Check if doctor has shifts on a date
  const hasDoctorShift = (dateString: string): boolean => {
    if (!plan?.doctor.employeeCode) return false;
    const shifts = getShiftsForEmployeeAndDate(plan.doctor.employeeCode, dateString);
    return shifts.length > 0;
  };

  // Check if ALL selected participants have shifts on a date
  const hasAllParticipantsShift = (dateString: string): boolean => {
    if (participantCodes.length === 0) return true; // No participants selected
    
    return participantCodes.every(code => {
      const shifts = getShiftsForEmployeeAndDate(code, dateString);
      return shifts.length > 0;
    });
  };

  // Check if date has doctor and all participants available
  const isDateAvailable = (dateString: string): boolean => {
    if (!hasDoctorShift(dateString)) return false;
    // If participants selected, ALL must have shifts
    return hasAllParticipantsShift(dateString);
  };

  // Clear selected date if it becomes unavailable after participant selection changes
  useEffect(() => {
    if (appointmentDate && !isDateAvailable(appointmentDate)) {
      // Selected date is no longer available (participants don't have shifts)
      setAppointmentDate('');
      setAppointmentStartTime('');
      setRoomCode('');
      toast.info('Ngày đã chọn không còn khả dụng với các bác sĩ hỗ trợ đã chọn. Vui lòng chọn ngày khác.');
    }
  }, [participantCodes, appointmentDate, allEmployeeShifts]);

  // Load available time slots
  useEffect(() => {
    if (appointmentDate && plan?.doctor.employeeCode && serviceCodes.length > 0) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [appointmentDate, plan?.doctor.employeeCode, serviceCodes, participantCodes]);

  const loadAvailableSlots = async () => {
    if (!plan?.doctor.employeeCode) return;

    setLoadingAvailableSlots(true);
    try {
      const request: AvailableTimesRequest = {
        date: appointmentDate,
        employeeCode: plan.doctor.employeeCode, // Use plan doctor (fixed)
        serviceCodes,
        participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
      };

      const response = await appointmentService.findAvailableTimes(request);
      setAvailableSlots(response.availableSlots || []);
    } catch (error: any) {
      console.error('Failed to load available slots:', error);
      toast.error('Không thể tải các khung giờ trống: ' + (error.response?.data?.message || error.message));
      setAvailableSlots([]);
    } finally {
      setLoadingAvailableSlots(false);
    }
  };

  // Get compatible doctors (filter by service specializations)
  const getCompatibleDoctors = (): Employee[] => {
    if (serviceCodes.length === 0) return employees;

    // Get required specialization IDs from services
    // Note: We need to load services to get specializationId, but for now show all doctors
    // BE will validate specialization match
    return employees;
  };

  // Group slots by time of day
  const groupSlotsByTimeOfDay = (slots: TimeSlot[]): {
    morning: TimeSlot[];
    afternoon: TimeSlot[];
    evening: TimeSlot[];
  } => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    slots.forEach((slot) => {
      const timeStr = slot.startTime.includes('T') ? slot.startTime.split('T')[1] : '';
      const hour = timeStr ? parseInt(timeStr.split(':')[0]) : 0;

      if (hour >= 6 && hour < 12) {
        morning.push(slot);
      } else if (hour >= 12 && hour < 18) {
        afternoon.push(slot);
      } else if (hour >= 18 && hour < 24) {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  const groupedSlots = useMemo(() => groupSlotsByTimeOfDay(availableSlots), [availableSlots]);

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1: Check if items are valid
      if (planItems.length === 0) {
        toast.error('Không tìm thấy hạng mục để đặt lịch');
        return;
      }
      
      // TEMPORARILY DISABLED: Payment validation
      // TODO: Re-enable after BE fixes invoice creation issue
      /* DISABLED - Re-enable after BE fix
      // Check payment status before proceeding to step 2
      if (!paymentStatusChecked && plan?.planId && plan?.patient?.patientId) {
        const canProceed = await checkPaymentStatus();
        if (!canProceed) {
          const unpaidPhases = unpaidInvoices
            .filter(inv => inv.phaseNumber)
            .map(inv => `Giai đoạn ${inv.phaseNumber}`)
            .join(', ');
          
          const errorMessage = unpaidPhases
            ? `Vui lòng thanh toán hóa đơn cho ${unpaidPhases} trước khi đặt lịch.`
            : 'Vui lòng thanh toán hóa đơn trước khi đặt lịch.';
          
          toast.error('Chưa thanh toán hóa đơn', {
            description: errorMessage + ' Nếu bạn đã thanh toán, vui lòng liên hệ kỹ thuật viên để được hỗ trợ.',
            duration: 8000,
          });
          return;
        }
      }
      */
      
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2
      if (!appointmentDate) {
        toast.error('Vui lòng chọn ngày hẹn');
        return;
      }
      if (!plan?.doctor.employeeCode) {
        toast.error('Không tìm thấy bác sĩ phụ trách');
        return;
      }
      if (!appointmentStartTime) {
        toast.error('Vui lòng chọn khung giờ');
        return;
      }
      if (!roomCode) {
        toast.error('Vui lòng chọn phòng');
        return;
      }
      
      // TEMPORARILY DISABLED: Payment validation
      // TODO: Re-enable after BE fixes invoice creation issue
      /* DISABLED - Re-enable after BE fix
      // Re-check payment status before proceeding to step 3
      if (plan?.planId && plan?.patient?.patientId) {
        const canProceed = await checkPaymentStatus();
        if (!canProceed) {
          const unpaidPhases = unpaidInvoices
            .filter(inv => inv.phaseNumber)
            .map(inv => `Giai đoạn ${inv.phaseNumber}`)
            .join(', ');
          
          const errorMessage = unpaidPhases
            ? `Vui lòng thanh toán hóa đơn cho ${unpaidPhases} trước khi đặt lịch.`
            : 'Vui lòng thanh toán hóa đơn trước khi đặt lịch.';
          
          toast.error('Chưa thanh toán hóa đơn', {
            description: errorMessage + ' Nếu bạn đã thanh toán, vui lòng liên hệ kỹ thuật viên để được hỗ trợ.',
            duration: 8000,
          });
          return;
        }
      }
      */
      
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  // TEMPORARILY DISABLED: Payment validation
  // TODO: Re-enable after BE fixes invoice creation issue
  // Issue: BE creates invoice with wrong data (wrong doctor, wrong services, wrong price)
  // Reference: ISSUE_BE_INVOICE_WRONG_DATA_FOR_APPOINTMENT.md
  const checkPaymentStatus = async (): Promise<boolean> => {
    // Temporarily allow all bookings until BE fixes invoice issue
    return true;
    
    /* DISABLED - Re-enable after BE fix
    if (!plan?.planId || !plan?.patient?.patientId) {
      console.warn('Cannot check payment: missing planId or patientId');
      return true; // Allow booking if cannot check
    }

    setCheckingPayment(true);
    try {
      // Fetch all invoices for this treatment plan
      const allInvoices = await invoiceService.getInvoicesByPatient(plan.patient.patientId);
      const planInvoices = allInvoices.filter(
        (inv) => inv.invoiceType === 'TREATMENT_PLAN' && inv.treatmentPlanId === plan.planId
      );

      // Get phases of items being booked
      const phasesBeingBooked = new Set<number>();
      planItems.forEach(item => {
        const phase = plan.phases.find(p => p.items.some(i => i.itemId === item.itemId));
        if (phase) {
          phasesBeingBooked.add(phase.phaseNumber);
        }
      });

      // Check if any invoice for these phases is unpaid
      const unpaid = planInvoices.filter(inv => {
        // For PHASED payment: check invoice of the phase being booked
        if (inv.phaseNumber && phasesBeingBooked.has(inv.phaseNumber)) {
          return inv.paymentStatus === 'PENDING_PAYMENT' || inv.paymentStatus === 'PARTIAL_PAID';
        }
        // For FULL payment: check if any invoice is unpaid
        if (!inv.phaseNumber) {
          return inv.paymentStatus === 'PENDING_PAYMENT' || inv.paymentStatus === 'PARTIAL_PAID';
        }
        return false;
      });

      setUnpaidInvoices(unpaid);
      setPaymentStatusChecked(true);
      
      if (unpaid.length > 0) {
        return false; // Has unpaid invoices
      }
      return true; // All paid
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      // If error, allow booking (don't block due to technical issue)
      return true;
    } finally {
      setCheckingPayment(false);
    }
    */
  };

  const handleCreate = async () => {
    if (!appointmentDate || !plan?.doctor.employeeCode || !appointmentStartTime || !roomCode) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // TEMPORARILY DISABLED: Payment validation
    // TODO: Re-enable after BE fixes invoice creation issue
    // Issue: BE creates invoice with wrong data
    // Reference: ISSUE_BE_INVOICE_WRONG_DATA_FOR_APPOINTMENT.md
    /* DISABLED - Re-enable after BE fix
    // Check payment status before creating appointment
    const canProceed = await checkPaymentStatus();
    if (!canProceed) {
      // Show detailed error message
      const unpaidPhases = unpaidInvoices
        .filter(inv => inv.phaseNumber)
        .map(inv => `Giai đoạn ${inv.phaseNumber}`)
        .join(', ');
      
      const errorMessage = unpaidPhases
        ? `Vui lòng thanh toán hóa đơn cho ${unpaidPhases} trước khi đặt lịch.`
        : 'Vui lòng thanh toán hóa đơn trước khi đặt lịch.';
      
      toast.error('Chưa thanh toán hóa đơn', {
        description: errorMessage + ' Nếu bạn đã thanh toán, vui lòng liên hệ kỹ thuật viên để được hỗ trợ.',
        duration: 8000,
      });
      return;
    }
    */

    // Format start time
    let formattedStartTime = appointmentStartTime;
    if (formattedStartTime.includes('Z')) {
      formattedStartTime = formattedStartTime.replace('Z', '');
    }
    if (formattedStartTime.match(/[+-]\d{2}:\d{2}$/)) {
      formattedStartTime = formattedStartTime.replace(/[+-]\d{2}:\d{2}$/, '');
    }
    if (formattedStartTime.includes('.')) {
      formattedStartTime = formattedStartTime.split('.')[0];
    }
    if (formattedStartTime && !formattedStartTime.includes(':')) {
      formattedStartTime = `${formattedStartTime}T00:00:00`;
    } else if (formattedStartTime && formattedStartTime.match(/T\d{2}:\d{2}$/)) {
      formattedStartTime = formattedStartTime + ':00';
    }

    setLoading(true);
    try {
      const request: CreateAppointmentRequest = {
        patientCode: plan.patient.patientCode,
        employeeCode: plan.doctor.employeeCode, // Use plan doctor (fixed)
        roomCode,
        appointmentStartTime: formattedStartTime,
        patientPlanItemIds: planItemIds, // Send plan item IDs, BE extracts serviceCodes
        participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
        notes: notes.trim() || undefined,
      };

      await appointmentService.createAppointment(request);

      toast.success('Đặt lịch thành công!', {
        description: `Đã tạo lịch hẹn cho ${planItems.length} hạng mục từ lộ trình điều trị.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create appointment:', error);
      toast.error('Không thể tạo lịch hẹn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const selectedEmployee = employees.find((e) => e.employeeCode === plan?.doctor.employeeCode);
  const selectedRoom = Array.isArray(rooms) ? rooms.find((r) => r.roomCode === roomCode) : undefined;
  const selectedSlot = availableSlots.find((slot) => slot.startTime === appointmentStartTime);

  // Get eligible participants (similar to CreateAppointmentModal):
  // 1. Role is ASSISTANT or NURSE (or DOCTOR/DENTIST - doctors can also be assistants)
  // 2. NOT the plan's primary doctor (they're already the main doctor)
  // 3. Has shift on selected date (same as doctor)
  // 4. For DOCTOR/DENTIST participants: Must have required specializations for services
  const eligibleParticipants = useMemo(() => {
    if (!plan?.doctor.employeeCode) {
      return [];
    }

    // NOTE: We show all eligible participants first (by role and specialization)
    // Shift validation happens in calendar (isDateAvailable) when checking date availability

    // Get required specialization IDs from services
    const requiredSpecializationIds = new Set<number>();
    serviceCodes.forEach((code) => {
      const service = servicesMap.get(code);
      if (service?.specializationId) {
        requiredSpecializationIds.add(service.specializationId);
      }
    });

    console.log('📋 Required specializations for participants:', {
      serviceCodes,
      requiredSpecializationIds: Array.from(requiredSpecializationIds),
    });

    //  Filter employees:
    // 1. Exclude the plan's primary doctor
    // 2. Role is ASSISTANT or NURSE (or DOCTOR/DENTIST - doctors can also be assistants)
    // 3. For DOCTOR/DENTIST: Must have required specializations
    // NOTE: Shift validation is done in calendar when checking date availability
    const filtered = employees.filter((emp) => {
      //  FIX: Exclude the plan's primary doctor
      if (emp.employeeCode === plan.doctor.employeeCode) {
        return false;
      }

      // Must be ASSISTANT, NURSE, DOCTOR, or DENTIST
      const isAssistant = emp.roleName?.includes('ASSISTANT') || emp.roleName?.includes('NURSE');
      const isDoctor = emp.roleName?.includes('DOCTOR') || emp.roleName?.includes('DENTIST');
      if (!isAssistant && !isDoctor) return false;

      // For DOCTOR/DENTIST participants: Validate specializations
      if (isDoctor && !isAssistant) {
        // This is a doctor (not assistant/nurse), so must check specializations
        if (requiredSpecializationIds.size > 0) {
          const employeeSpecIds = emp.specializations?.map(s => s.specializationId) || [];
          
          // Must have at least one of the required specializations
          const hasRequiredSpec = Array.from(requiredSpecializationIds).some(
            requiredId => employeeSpecIds.includes(requiredId)
          );
          
          if (!hasRequiredSpec) {
            console.log(`⚠️ Doctor ${emp.fullName} excluded - missing required specialization`);
            return false;
          }
        }
      }

      return true;
    });

    //  DEBUG: Log eligible participants
    console.log('� Eligible participants:', {
      totalEmployees: employees.length,
      filtered: filtered.length,
      planDoctor: plan.doctor.employeeCode,
      participants: filtered.map((e: any) => ({
        code: e.employeeCode,
        name: e.fullName,
        role: e.roleName,
      })),
    });

    return filtered;
  }, [employees, plan?.doctor.employeeCode, serviceCodes, servicesMap]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Đặt lịch từ Lộ trình Điều trị</DialogTitle>
          <DialogDescription>
            Tạo lịch hẹn cho các hạng mục đã chọn từ lộ trình điều trị
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep >= step ? 'font-medium' : 'text-muted-foreground'
                    }`}
                >
                  {step === 1 && 'Xem lại hạng mục'}
                  {step === 2 && 'Chọn ngày & Bác sĩ'}
                  {step === 3 && 'Xác nhận'}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${currentStep > step ? 'bg-primary' : 'bg-muted'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Review Plan Items */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* TEMPORARILY DISABLED: Payment Status Warning */}
              {/* TODO: Re-enable after BE fixes invoice creation issue */}
              {false && paymentStatusChecked && unpaidInvoices.length > 0 && (
                <Alert variant="destructive" className="border-orange-500 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900 font-semibold">Chưa thanh toán hóa đơn</AlertTitle>
                  <AlertDescription className="text-orange-800 mt-2">
                    <div className="space-y-2">
                      <p>
                        Bạn cần thanh toán hóa đơn trước khi đặt lịch hẹn:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {unpaidInvoices.map((inv) => (
                          <li key={inv.invoiceId}>
                            {inv.phaseNumber 
                              ? `Giai đoạn ${inv.phaseNumber}: ${inv.invoiceCode} - ${formatCurrency(inv.remainingDebt)}`
                              : `Hóa đơn ${inv.invoiceCode}: ${formatCurrency(inv.remainingDebt)}`}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm">
                        Vui lòng thanh toán hóa đơn trong tab "Thanh toán" hoặc liên hệ kỹ thuật viên để được hỗ trợ.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-primary">Thông tin lộ trình điều trị</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mã lộ trình:</span>
                    <span className="ml-2 font-medium">{plan.planCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tên lộ trình:</span>
                    <span className="ml-2 font-medium">{plan.planName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bệnh nhân:</span>
                    <span className="ml-2 font-medium">{plan.patient.fullName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bác sĩ phụ trách:</span>
                    <span className="ml-2 font-medium">{plan.doctor.fullName}</span>
                  </div>
                </div>
              </Card>

              <div>
                <Label>Hạng mục sẽ được đặt lịch ({enrichedPlanItems.length})</Label>
                <Card className="p-4 mt-2 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {enrichedPlanItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span>Mã dịch vụ: {item.serviceCode || 'N/A'}</span>
                              <span className="ml-4">
                                Thời gian: {item.estimatedTimeMinutes || 0} phút
                              </span>
                              {item.price != null && item.price > 0 && (
                                <span className="ml-4">
                                  Giá: {item.price.toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap">{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  Tổng thời gian dự kiến:
                  <span className="font-medium">
                    {loadingServices ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Đang tính...
                      </span>
                    ) : totalEstimatedTime > 0 ? (
                      `${totalEstimatedTime} phút`
                    ) : (
                      <span className="text-orange-600">0 phút (chưa có dữ liệu)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Date, Time, Room & Participants */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* TEMPORARILY DISABLED: Payment Status Warning */}
              {/* TODO: Re-enable after BE fixes invoice creation issue */}
              {false && paymentStatusChecked && unpaidInvoices.length > 0 && (
                <Alert variant="destructive" className="border-orange-500 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900 font-semibold">Chưa thanh toán hóa đơn</AlertTitle>
                  <AlertDescription className="text-orange-800 mt-2">
                    <div className="space-y-2">
                      <p>
                        Bạn cần thanh toán hóa đơn trước khi đặt lịch hẹn:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {unpaidInvoices.map((inv) => (
                          <li key={inv.invoiceId}>
                            {inv.phaseNumber 
                              ? `Giai đoạn ${inv.phaseNumber}: ${inv.invoiceCode} - ${formatCurrency(inv.remainingDebt)}`
                              : `Hóa đơn ${inv.invoiceCode}: ${formatCurrency(inv.remainingDebt)}`}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm">
                        Vui lòng thanh toán hóa đơn trong tab "Thanh toán" hoặc liên hệ kỹ thuật viên để được hỗ trợ.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Doctor Info (Read-only, from plan) */}
              <Card className="p-4 bg-primary/5 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-primary">Bác sĩ phụ trách</h3>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{plan.doctor.fullName}</div>
                  <div className="text-muted-foreground">{plan.doctor.employeeCode}</div>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Bác sĩ phụ trách sẽ theo xuyên suốt quá trình điều trị của bệnh nhân
                  </p>
                </div>
              </Card>

              {/* Participants (Optional) - Multiple selection with table - MOVED UP */}
              <div>
                <Label>
                  Chọn bác sĩ hỗ trợ (Tùy chọn) 
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    - Có thể chọn nhiều người
                  </span>
                </Label>
                {eligibleParticipants.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {/* Available Participants Table - No Card wrapper */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              <th className="text-left p-2 font-medium">Chọn</th>
                              <th className="text-left p-2 font-medium">Họ tên</th>
                              <th className="text-left p-2 font-medium">Vai trò</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eligibleParticipants.map((participant) => {
                              const isSelected = participantCodes.includes(participant.employeeCode);
                              const isAssistantOrNurse = participant.roleName?.includes('ASSISTANT') || participant.roleName?.includes('NURSE');
                              
                              return (
                                <tr 
                                  key={participant.employeeId}
                                  className={`border-t hover:bg-muted/30 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-primary/5' : ''
                                  }`}
                                  onClick={() => {
                                    if (isSelected) {
                                      setParticipantCodes(participantCodes.filter(code => code !== participant.employeeCode));
                                    } else {
                                      setParticipantCodes([...participantCodes, participant.employeeCode]);
                                    }
                                  }}
                                >
                                  <td className="p-2">
                                    <Checkbox 
                                      checked={isSelected}
                                      onCheckedChange={() => {}}
                                      aria-label={`Chọn ${participant.fullName}`}
                                    />
                                  </td>
                                  <td className="p-2 font-medium">{participant.fullName}</td>
                                  <td className="p-2">
                                    <Badge variant={isAssistantOrNurse ? "secondary" : "default"} className="text-xs">
                                      {participant.roleName?.replace('ROLE_', '')}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Selected Count */}
                    <div className="text-xs text-muted-foreground">
                      Đã chọn: <strong>{participantCodes.length}</strong> / {eligibleParticipants.length} người
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-4 border rounded-lg border-muted bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Không có bác sĩ hỗ trợ khả dụng. Bạn có thể đặt lịch mà không cần thêm người hỗ trợ.
                    </p>
                  </div>
                )}
              </div>

              {/* Date Selection with Calendar View */}
              <div>
                <Label>
                  Chọn ngày hẹn <span className="text-red-500">*</span>
                </Label>
                <Card className="p-4 mt-2">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                    >
                      ←
                    </Button>
                    <span className="font-semibold text-sm">
                      {format(selectedMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                    >
                      →
                    </Button>
                  </div>

                  {/* Calendar Grid */}
                  {loadingShifts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Đang tải lịch làm việc...</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-7 gap-1">
                        {/* Weekday headers */}
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                          <div key={day} className="text-xs font-semibold text-center text-muted-foreground py-1">
                            {day}
                          </div>
                        ))}
                        {/* Calendar dates */}
                        {(() => {
                          const today = startOfDay(new Date());
                          const monthStart = startOfMonth(selectedMonth);
                          const monthEnd = endOfMonth(selectedMonth);
                          const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                          const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                          const dates: React.ReactElement[] = [];

                          let currentDate = new Date(calendarStart);

                          while (currentDate <= calendarEnd) {
                            const dateStr = format(currentDate, 'yyyy-MM-dd');
                            const isPast = currentDate < today;
                            const isSelected = appointmentDate === dateStr;
                            const isToday = isSameDay(currentDate, today);
                            const isCurrentMonth = isSameMonth(currentDate, selectedMonth);

                            const isAvailable = isDateAvailable(dateStr);

                            dates.push(
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => {
                                  if (!isPast && isCurrentMonth && isAvailable) {
                                    setAppointmentDate(dateStr);
                                    setAppointmentStartTime('');
                                    setRoomCode('');
                                  }
                                }}
                                disabled={isPast || !isCurrentMonth || !isAvailable}
                                className={`p-2 rounded text-center transition-all ${!isCurrentMonth
                                  ? 'bg-muted/20 opacity-30 cursor-not-allowed'
                                  : isPast
                                    ? 'bg-muted/30 opacity-50 cursor-not-allowed'
                                    : !isAvailable
                                      ? 'bg-red-50 opacity-50 cursor-not-allowed border border-red-200'
                                      : isSelected
                                        ? 'bg-primary text-primary-foreground font-semibold scale-105'
                                        : 'bg-green-50 hover:bg-green-100 border border-green-200'
                                  } ${isToday && !isPast && isCurrentMonth ? 'ring-2 ring-primary/30' : ''}`}
                              >
                                <div className="text-xs font-medium">{currentDate.getDate()}</div>
                                {isAvailable && !isPast && isCurrentMonth && (
                                  <div className="text-[8px] mt-0.5 text-green-600">●</div>
                                )}
                              </button>
                            );

                            currentDate = addDays(currentDate, 1);
                          }

                          return dates;
                        })()}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
                          <span>
                            {participantCodes.length > 0
                              ? 'Bác sĩ và tất cả hỗ trợ có ca'
                              : 'Bác sĩ có ca'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-red-50 border border-red-200"></div>
                          <span>
                            {participantCodes.length > 0
                              ? 'Thiếu ca làm'
                              : 'Bác sĩ không có ca'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* Time Slots */}
              {appointmentDate && plan?.doctor.employeeCode && (
                <div>
                  <Label>
                    Chọn khung giờ <span className="text-red-500">*</span>
                  </Label>
                  {loadingAvailableSlots ? (
                    <Card className="p-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang tải khung giờ trống...</span>
                      </div>
                    </Card>
                  ) : availableSlots.length === 0 ? (
                    <Card className="p-4 mt-2 bg-yellow-50 border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Không có khung giờ trống</p>
                          <p>Vui lòng chọn ngày hoặc bác sĩ khác.</p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {/* Morning Slots */}
                      {groupedSlots.morning.length > 0 && (
                        <Card className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sun className="h-4 w-4 text-yellow-600" />
                            <h4 className="font-semibold text-xs">Sáng (6:00 - 12:00)</h4>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {groupedSlots.morning.map((slot) => {
                              const slotTime = slot.startTime.includes('T')
                                ? slot.startTime.split('T')[1]?.slice(0, 5) || ''
                                : '';
                              const isSelected = slot.startTime === appointmentStartTime;
                              return (
                                <Button
                                  key={slot.startTime}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setAppointmentStartTime(slot.startTime);
                                    // Support both phase-level (availableRoomCodes) and plan-level (availableCompatibleRoomCodes) APIs
                                    const roomCodes = slot.availableRoomCodes || slot.availableCompatibleRoomCodes || [];
                                    if (roomCodes.length > 0) {
                                      setRoomCode(roomCodes[0]);
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  {slotTime}
                                </Button>
                              );
                            })}
                          </div>
                        </Card>
                      )}

                      {/* Afternoon Slots */}
                      {groupedSlots.afternoon.length > 0 && (
                        <Card className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sunset className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold text-xs">Chiều (12:00 - 18:00)</h4>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {groupedSlots.afternoon.map((slot) => {
                              const slotTime = slot.startTime.includes('T')
                                ? slot.startTime.split('T')[1]?.slice(0, 5) || ''
                                : '';
                              const isSelected = slot.startTime === appointmentStartTime;
                              return (
                                <Button
                                  key={slot.startTime}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setAppointmentStartTime(slot.startTime);
                                    // Support both phase-level (availableRoomCodes) and plan-level (availableCompatibleRoomCodes) APIs
                                    const roomCodes = slot.availableRoomCodes || slot.availableCompatibleRoomCodes || [];
                                    if (roomCodes.length > 0) {
                                      setRoomCode(roomCodes[0]);
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  {slotTime}
                                </Button>
                              );
                            })}
                          </div>
                        </Card>
                      )}

                      {/* Evening Slots */}
                      {groupedSlots.evening.length > 0 && (
                        <Card className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Moon className="h-4 w-4 text-blue-600" />
                            <h4 className="font-semibold text-xs">Tối (18:00 - 24:00)</h4>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {groupedSlots.evening.map((slot) => {
                              const slotTime = slot.startTime.includes('T')
                                ? slot.startTime.split('T')[1]?.slice(0, 5) || ''
                                : '';
                              const isSelected = slot.startTime === appointmentStartTime;
                              return (
                                <Button
                                  key={slot.startTime}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setAppointmentStartTime(slot.startTime);
                                    // Support both phase-level (availableRoomCodes) and plan-level (availableCompatibleRoomCodes) APIs
                                    const roomCodes = slot.availableRoomCodes || slot.availableCompatibleRoomCodes || [];
                                    if (roomCodes.length > 0) {
                                      setRoomCode(roomCodes[0]);
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  {slotTime}
                                </Button>
                              );
                            })}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Room Selection */}
              {appointmentStartTime && (
                <div>
                  <Label htmlFor="roomCode">
                    Chọn phòng <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={roomCode}
                    onValueChange={setRoomCode}
                    disabled={loadingData}
                  >
                    <SelectTrigger id="roomCode" className="mt-1">
                      <SelectValue placeholder={loadingData ? 'Đang tải...' : 'Chọn phòng'} />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {(selectedSlot?.availableRoomCodes || selectedSlot?.availableCompatibleRoomCodes || []).map((code) => {
                        const room = rooms.find((r) => r.roomCode === code);
                        return (
                          <SelectItem key={code} value={code}>
                            {room ? `${room.roomName} (${code})` : code}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedRoom && (
                    <Card className="p-3 mt-2 bg-primary/5 border-primary">
                      <div className="text-sm">
                        <div className="font-medium">{selectedRoom.roomName}</div>
                        <div className="text-muted-foreground">{selectedRoom.roomCode}</div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Ghi chú (Tùy chọn)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thêm ghi chú cho lịch hẹn..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* TEMPORARILY DISABLED: Payment Status Warning */}
              {/* TODO: Re-enable after BE fixes invoice creation issue */}
              {false && paymentStatusChecked && unpaidInvoices.length > 0 && (
                <Alert variant="destructive" className="border-orange-500 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900 font-semibold">Chưa thanh toán hóa đơn</AlertTitle>
                  <AlertDescription className="text-orange-800 mt-2">
                    <div className="space-y-2">
                      <p>
                        Bạn cần thanh toán hóa đơn trước khi đặt lịch hẹn:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {unpaidInvoices.map((inv) => (
                          <li key={inv.invoiceId}>
                            {inv.phaseNumber 
                              ? `Giai đoạn ${inv.phaseNumber}: ${inv.invoiceCode} - ${formatCurrency(inv.remainingDebt)}`
                              : `Hóa đơn ${inv.invoiceCode}: ${formatCurrency(inv.remainingDebt)}`}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm">
                        Vui lòng thanh toán hóa đơn trong tab "Thanh toán" hoặc liên hệ kỹ thuật viên để được hỗ trợ.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Card className="p-4 bg-primary/5 border-primary">
                <h3 className="font-semibold mb-4">Xác nhận thông tin lịch hẹn</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Bệnh nhân:</span>
                      <span className="ml-2 font-medium">{plan.patient.fullName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mã bệnh nhân:</span>
                      <span className="ml-2 font-medium">{plan.patient.patientCode}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bác sĩ:</span>
                      <span className="ml-2 font-medium">
                        {selectedEmployee?.fullName} ({selectedEmployee?.employeeCode})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phòng:</span>
                      <span className="ml-2 font-medium">
                        {selectedRoom?.roomName} ({selectedRoom?.roomCode})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ngày hẹn:</span>
                      <span className="ml-2 font-medium">
                        {appointmentDate && format(new Date(appointmentDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Giờ hẹn:</span>
                      <span className="ml-2 font-medium">
                        {appointmentStartTime &&
                          format(new Date(appointmentStartTime), 'HH:mm')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số hạng mục:</span>
                      <span className="ml-2 font-medium">{planItems.length}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">Thời gian dự kiến:</span>
                      <span className="ml-2 font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {totalEstimatedTime > 0 ? `${totalEstimatedTime} phút` : '0 phút (chưa có dữ liệu)'}
                      </span>
                    </div>
                  </div>
                  {participantCodes.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">Bác sĩ hỗ trợ:</span>
                      <div className="flex flex-wrap gap-2">
                        {participantCodes.map((code) => {
                          const participant = employees.find((e) => e.employeeCode === code);
                          return (
                            <Badge key={code} variant="secondary">
                              {participant?.fullName || code}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {notes && (
                    <div>
                      <span className="text-muted-foreground">Ghi chú:</span>
                      <p className="mt-1 text-sm">{notes}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">Hạng mục sẽ được đặt lịch:</h4>
                <div className="space-y-2">
                  {enrichedPlanItems.map((item) => (
                    <div key={item.itemId} className="text-sm p-2 border rounded">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-muted-foreground">
                        {item.serviceCode} • {item.estimatedTimeMinutes} phút
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious} disabled={loading}>
              Quay lại
            </Button>
          )}
          {currentStep < 3 ? (
            <Button 
              onClick={handleNext} 
              disabled={loading}
            >
              Tiếp theo
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Xác nhận đặt lịch'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

