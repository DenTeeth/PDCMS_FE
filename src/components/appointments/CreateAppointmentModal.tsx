'use client';

/**
 * Create Appointment Modal Component
 * 
 * Multi-step form for creating appointments (NEW ORDER):
 * 1. Select Patient
 * 2. Select Date (with suggestions if no doctors or few slots)
 * 3. Select Services (grouped by specialization)
 * 4. Select Doctor (ROLE_DENTIST + specialization match) + Time Slots (grouped by morning/afternoon/evening) + Participants (with role display)
 * 5. Review & Confirm
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { appointmentService } from '@/services/appointmentService';
import { ServiceService } from '@/services/serviceService';
import { EmployeeService } from '@/services/employeeService';
import { patientService } from '@/services/patientService';
import { RoomService } from '@/services/roomService';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { specializationService } from '@/services/specializationService';
import { ServiceCategoryService } from '@/services/serviceCategoryService';
import { ServiceCategory } from '@/types/serviceCategory';
import { TreatmentPlanService } from '@/services/treatmentPlanService';
import { EmployeeShift, ShiftStatus } from '@/types/employeeShift';
import { useHolidays } from '@/hooks/useHolidays';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService, CreateInvoiceRequest } from '@/services/invoiceService';
import {
  CreateAppointmentRequest,
  AvailableTimesRequest,
  AvailableTimesResponse,
  TimeSlot,
  ValidateConstraintsRequest,
  ValidateConstraintsResponse,
  ConstraintViolation,
  CONSTRAINT_TYPE_LABELS,
} from '@/types/appointment';
import { Service } from '@/types/service';
import { Employee } from '@/types/employee';
import { Patient } from '@/types/patient';
import { Room } from '@/types/room';
import { Specialization } from '@/types/specialization';
import {
  getBookingBlockReasonLabel,
  isTemporaryBlock
} from '@/types/patientBlockReason';
import {
  User,
  UserCog,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  ChevronDown,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { format, addDays, isAfter, isBefore, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';

interface CreateAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Phase 5: Pre-filled data from treatment plan items
  initialPatientCode?: string;
  initialServiceCodes?: string[];
  initialPlanItemIds?: number[];
}

type Step = 1 | 2 | 3 | 4 | 5;

// Custom Time Picker Component with 15-minute intervals
interface TimePickerProps {
  value: string; // Format: "HH:mm" (e.g., "08:00")
  onChange: (time: string) => void;
  disabled?: boolean;
}

function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h || '08');
      setMinute(m || '00');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hours from 8 to 21
  const hours = Array.from({ length: 14 }, (_, i) => (i + 8).toString().padStart(2, '0'));
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
              <label className="text-xs font-semibold mb-2 text-center">Giờ</label>
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
              <label className="text-xs font-semibold mb-2 text-center">Phút</label>
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

// Helper: Group slots by time of day (morning/afternoon/evening)
function groupSlotsByTimeOfDay(slots: TimeSlot[]): {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
} {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];

  slots.forEach((slot) => {
    const timeStr = slot.startTime.includes('T') ? slot.startTime.split('T')[1] : '';
    if (timeStr) {
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (hour >= 6 && hour < 12) {
        morning.push(slot);
      } else if (hour >= 12 && hour < 18) {
        afternoon.push(slot);
      } else if (hour >= 18 && hour < 22) {
        evening.push(slot);
      }
    }
  });

  return { morning, afternoon, evening };
}

// Helper: Get role label from roleName
function getRoleLabel(roleName: string): string {
  if (roleName.includes('DENTIST') || roleName.includes('DOCTOR')) {
    return 'Bác sĩ';
  } else if (roleName.includes('NURSE')) {
    return 'Y tá/Trợ lí';
  }
  return roleName;
}

export default function CreateAppointmentModal({
  open,
  onClose,
  onSuccess,
  initialPatientCode,
  initialServiceCodes,
  initialPlanItemIds,
}: CreateAppointmentModalProps) {
  const { user, hasPermission } = useAuth();
  const canCreateInvoice = hasPermission('CREATE_INVOICE');

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Form data
  const [patientCode, setPatientCode] = useState<string>('');
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [serviceCodes, setServiceCodes] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentStartTime, setAppointmentStartTime] = useState<string>('');
  const [participantCodes, setParticipantCodes] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  // Phase 5: Treatment plan item IDs (for linking appointments to plan items)
  const [planItemIds, setPlanItemIds] = useState<number[]>([]);
  // Phase 5: Service codes extracted from plan items (for doctor filtering)
  const [planItemServiceCodes, setPlanItemServiceCodes] = useState<string[]>([]);

  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);
  const [loadSlotsError, setLoadSlotsError] = useState<string>('');

  // Search states
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);

  // Employee shifts for selected date
  const [allEmployeeShifts, setAllEmployeeShifts] = useState<Map<string, EmployeeShift[]>>(new Map());
  const [loadingShifts, setLoadingShifts] = useState(false);

  // BE_4: Holiday highlighting
  const { holidays, isHoliday, getHolidayName } = useHolidays({
    year: new Date(appointmentDate || new Date()).getFullYear(),
    enabled: open && currentStep === 2, // Only fetch when calendar is visible
  });

  // Participant shifts
  const [participantShifts, setParticipantShifts] = useState<Map<string, EmployeeShift[]>>(new Map());
  const [loadingParticipantShifts, setLoadingParticipantShifts] = useState(false);

  // Step 2: Date suggestions
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);
  const [loadingDateSuggestions, setLoadingDateSuggestions] = useState(false);

  // Step 2: Month navigation for calendar
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  // Step 3: Selected specialization filter
  const [selectedSpecializationFilter, setSelectedSpecializationFilter] = useState<string>('all');
  // Step 3: Selected doctor for filtering services by specialization (optional)
  const [selectedDoctorForFilter, setSelectedDoctorForFilter] = useState<string>('all');
  // Step 3: Service search term
  const [serviceSearchTerm, setServiceSearchTerm] = useState<string>('');
  // Step 3: Service group filter (by specialization)
  const [serviceGroupFilter, setServiceGroupFilter] = useState<string>('all');
  // Step 3: Show/hide doctor dropdown (hide when doctor is selected, show when clicking on card)
  const [showDoctorDropdown, setShowDoctorDropdown] = useState<boolean>(true);
  // Step 3: Ref for doctor select trigger to programmatically open dropdown
  const doctorSelectTriggerRef = useRef<HTMLButtonElement>(null);

  // Current user's employee data (if employee)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // Get current user's specializations (if employee)
  const currentUserSpecializations = useMemo(() => {
    if (!currentEmployee || !currentEmployee.specializations) return [];
    return currentEmployee.specializations.map((spec: any) => {
      const specId = typeof spec === 'string' ? parseInt(spec, 10) : (typeof spec === 'object' ? parseInt(String(spec.specializationId || spec.id || spec), 10) : spec);
      return isNaN(specId) ? null : specId;
    }).filter((id: number | null): id is number => id !== null);
  }, [currentEmployee]);

  // Check if current user has any specializations
  const hasUserSpecializations = currentUserSpecializations.length > 0;

  // Load initial data
  useEffect(() => {
    if (open) {
      loadInitialData();
      resetForm();
    }
  }, [open]);

  // Phase 5: Pre-fill data from treatment plan items when modal opens
  // Load patients when modal opens
  useEffect(() => {
    if (open) {
      searchPatients();
    }
  }, [open]);

  useEffect(() => {
    if (open && (initialPatientCode || initialServiceCodes || initialPlanItemIds)) {
      // Pre-fill patient code
      if (initialPatientCode) {
        setPatientCode(initialPatientCode);
        // Load patient data
        loadPatientByCode(initialPatientCode);
      }

      // Pre-fill service codes
      if (initialServiceCodes && initialServiceCodes.length > 0) {
        setServiceCodes(initialServiceCodes);
        // Auto-advance to step 2 (date selection) if patient and services are pre-filled
        if (initialPatientCode) {
          setCurrentStep(2);
        }
      }

      // Pre-fill plan item IDs
      if (initialPlanItemIds && initialPlanItemIds.length > 0) {
        setPlanItemIds(initialPlanItemIds);
        // Phase 5: When booking from plan items, skip step 1 (patient) and step 3 (services)
        // Auto-advance to step 2 (date selection) if patient is also pre-filled
        if (initialPatientCode) {
          setCurrentStep(2);
        }
      }
    }
  }, [open, initialPatientCode, initialServiceCodes, initialPlanItemIds]);

  // Search patients with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchPatients();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch]);

  // Step 2: Load all doctor shifts when entering Step 2 or when month changes
  useEffect(() => {
    if (currentStep === 2 && employees.length > 0) {
      loadAllDoctorShiftsForStep2();
    }
  }, [currentStep, employees, selectedMonth]);

  // Step 2: Load date suggestions when date is selected
  useEffect(() => {
    if (appointmentDate && serviceCodes.length > 0) {
      loadDateSuggestions();
    } else {
      setSuggestedDates([]);
    }
  }, [appointmentDate, serviceCodes]);

  // Step 4: Load available slots when doctor, date, and services are selected
  useEffect(() => {
    if (employeeCode && appointmentDate && serviceCodes.length > 0) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [employeeCode, appointmentDate, serviceCodes, participantCodes]);

  // Step 4: Load shifts for all eligible participants when date is selected or month changes (for filtering)
  useEffect(() => {
    if (currentStep === 4 && appointmentDate) {
      loadAllParticipantShifts();
    }
  }, [currentStep, appointmentDate, employees, employeeCode, selectedMonth]);


  // Step 4: Load employee shifts for all doctors when date and services are selected or month changes
  useEffect(() => {
    if (currentStep === 4 && appointmentDate && serviceCodes.length > 0) {
      loadAllDoctorShifts();
    }
  }, [currentStep, appointmentDate, serviceCodes, employees, selectedMonth]);

  const resetForm = () => {
    setCurrentStep(1);
    setPatientCode('');
    setEmployeeCode('');
    setRoomCode('');
    setServiceCodes([]);
    setAppointmentDate('');
    setAppointmentStartTime('');
    setParticipantCodes([]);
    setNotes('');
    setPatientSearch('');
    setPatientSearchResults([]);
    setAvailableSlots([]);
    setSelectedPatientData(null);
    setAllEmployeeShifts(new Map());
    setSuggestedDates([]);
    setSelectedSpecializationFilter('all');
    setSelectedDoctorForFilter('all');
    setServiceSearchTerm('');
    setServiceGroupFilter('all');
    setShowDoctorDropdown(true);
    setSelectedMonth(startOfMonth(new Date()));
    // Phase 5: Reset plan item IDs
    setPlanItemIds([]);
  };

  // Phase 5: Load patient by code (for pre-filled data from treatment plan)
  const loadPatientByCode = async (code: string) => {
    try {
      const patient = await patientService.getPatientByCode(code);
      if (patient) {
        handleSelectPatient(patient);
      }
    } catch (error: any) {
      console.error('Failed to load patient by code:', error);
      // Don't show error toast - just log it
    }
  };


  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Load services (active only)
      const servicesResponse = await ServiceService.getServices({
        isActive: 'true',
        page: 0,
        size: 100,
      });
      // Ensure servicesResponse.content is an array
      setServices(Array.isArray(servicesResponse.content) ? servicesResponse.content : []);

      // Load specializations
      const specializationsData = await specializationService.getAll();
      setSpecializations(specializationsData);

      // Load categories
      const categoriesData = await ServiceCategoryService.getCategories();
      // Ensure categoriesData is an array before filtering
      const safeCategoriesData = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(safeCategoriesData.filter(cat => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder));

      // Load employees (all active employees - will filter by ROLE_DENTIST in Step 4)
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 100,
        isActive: true,
      });
      setEmployees(employeesResponse.content);

      // Load current employee data if user is employee
      if (user && user.employeeId) {
        const employeeId = user.employeeId;
        const foundEmployee = employeesResponse.content.find(emp => String(emp.employeeId) === String(employeeId));
        if (foundEmployee) {
          setCurrentEmployee(foundEmployee);
        }
      }

      // Load rooms - will be filtered by services later if serviceCodes are available
      // Initial load shows all active rooms
      const roomsData = await RoomService.getActiveRooms();
      setRooms(roomsData);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      toast.error('Không thể tải dữ liệu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingData(false);
    }
  };

  const searchPatients = async () => {
    setSearchingPatients(true);
    try {
      const results = await patientService.getPatients({
        page: 0,
        size: 50,
        search: patientSearch || undefined,
        isActive: true,
      });
      setPatientSearchResults(results.content);
    } catch (error: any) {
      console.error('Failed to search patients:', error);
      toast.error('Không thể tìm kiếm bệnh nhân');
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setPatientCode(patient.patientCode);
    setSelectedPatientData(patient);
    setPatientSearch('');
    setPatientSearchResults([]);
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  // Step 2: Load date suggestions - check if selected date has doctors or enough slots
  const loadDateSuggestions = async () => {
    if (!appointmentDate || serviceCodes.length === 0) return;

    setLoadingDateSuggestions(true);
    try {
      // Get all doctors with matching specializations
      const compatibleDoctors = getCompatibleDoctors();

      if (compatibleDoctors.length === 0) {
        // No doctors available - suggest nearby dates
        generateDateSuggestions();
        return;
      }

      // Check if any doctor has available slots on this date
      let hasAvailableSlots = false;
      for (const doctor of compatibleDoctors.slice(0, 3)) { // Check first 3 doctors
        try {
          const request: AvailableTimesRequest = {
            date: appointmentDate,
            employeeCode: doctor.employeeCode,
            serviceCodes,
          };
          const response = await appointmentService.findAvailableTimes(request);
          if (response.availableSlots && response.availableSlots.length > 0) {
            hasAvailableSlots = true;
            break;
          }
        } catch (error) {
          // Continue checking other doctors
        }
      }

      if (!hasAvailableSlots || compatibleDoctors.length < 2) {
        // Few slots or few doctors - suggest nearby dates
        generateDateSuggestions();
      } else {
        setSuggestedDates([]);
      }
    } catch (error: any) {
      console.error('Failed to load date suggestions:', error);
      generateDateSuggestions(); // Fallback to generating suggestions
    } finally {
      setLoadingDateSuggestions(false);
    }
  };

  // Generate date suggestions (next 7 days)
  const generateDateSuggestions = () => {
    const today = startOfDay(new Date());
    const suggestions: string[] = [];

    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i);
      // Use format from date-fns to get local date string (YYYY-MM-DD)
      // This avoids timezone issues with toISOString()
      const dateStr = format(date, 'yyyy-MM-dd');
      if (dateStr !== appointmentDate) {
        suggestions.push(dateStr);
      }
    }

    setSuggestedDates(suggestions);
  };

  // Step 2: Load shifts for all doctors (ROLE_DENTIST/ROLE_DOCTOR) - load immediately when entering Step 2
  const loadAllDoctorShiftsForStep2 = async () => {
    if (employees.length === 0) return;

    setLoadingShifts(true);
    try {
      // Get all doctors (ROLE_DENTIST or ROLE_DOCTOR) with specializations
      const allDoctors = employees.filter((employee) => {
        if (!employee.roleName.includes('DENTIST') && !employee.roleName.includes('DOCTOR')) {
          return false;
        }
        if (!employee.specializations || employee.specializations.length === 0) {
          return false;
        }
        return true;
      });

      console.log('📅 loadAllDoctorShiftsForStep2 - Starting:', {
        selectedMonth: format(selectedMonth, 'yyyy-MM'),
        totalDoctors: allDoctors.length,
        doctors: allDoctors.map(d => ({ code: d.employeeCode, id: d.employeeId, name: d.fullName })),
      });

      const shiftsMap = new Map<string, EmployeeShift[]>();

      // Load shifts for each doctor in parallel
      // Load shifts for the selected month and surrounding months (1 month before, 1 month after)
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const startDate = subMonths(monthStart, 1); // 1 month before
      const endDate = addMonths(monthEnd, 1); // 1 month after

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      console.log('📅 loadAllDoctorShiftsForStep2 - Date range:', {
        selectedMonth: format(selectedMonth, 'yyyy-MM'),
        monthStart: format(monthStart, 'yyyy-MM-dd'),
        monthEnd: format(monthEnd, 'yyyy-MM-dd'),
        startDate: startDateStr,
        endDate: endDateStr,
        rangeDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      });

      await Promise.all(
        allDoctors.map(async (doctor) => {
          const employeeId = parseInt(doctor.employeeId, 10);
          if (!isNaN(employeeId)) {
            try {
              console.log(`📅 Loading shifts for doctor ${doctor.employeeCode} (ID: ${employeeId}):`, {
                startDate: startDateStr,
                endDate: endDateStr,
                status: ShiftStatus.SCHEDULED,
              });

              const shifts = await EmployeeShiftService.getShifts({
                start_date: startDateStr,
                end_date: endDateStr,
                employee_id: employeeId,
                status: ShiftStatus.SCHEDULED,
              });

              console.log(`✅ Loaded shifts for doctor ${doctor.employeeCode}:`, {
                count: shifts.length,
                shifts: shifts.map(s => ({
                  date: s.workDate,
                  shiftName: s.workShift?.shiftName,
                  status: s.status,
                })),
              });

              shiftsMap.set(doctor.employeeCode, shifts);
            } catch (error) {
              console.error(`❌ Failed to load shifts for doctor ${doctor.employeeCode}:`, error);
              shiftsMap.set(doctor.employeeCode, []);
            }
          } else {
            console.warn(`⚠️ Invalid employeeId for doctor ${doctor.employeeCode}:`, doctor.employeeId);
            shiftsMap.set(doctor.employeeCode, []);
          }
        })
      );

      console.log('📅 loadAllDoctorShiftsForStep2 - Final result:', {
        totalDoctors: allDoctors.length,
        shiftsMapSize: shiftsMap.size,
        shiftsByDoctor: Array.from(shiftsMap.entries()).map(([code, shifts]) => ({
          doctorCode: code,
          shiftCount: shifts.length,
          dates: [...new Set(shifts.map(s => format(new Date(s.workDate), 'yyyy-MM-dd')))],
        })),
      });

      setAllEmployeeShifts(shiftsMap);
    } catch (error: any) {
      console.error('❌ Failed to load doctor shifts:', error);
      setAllEmployeeShifts(new Map());
    } finally {
      setLoadingShifts(false);
    }
  };

  // Step 4: Load shifts for all compatible doctors (filtered by services)
  const loadAllDoctorShifts = async () => {
    if (!appointmentDate || serviceCodes.length === 0) return;

    setLoadingShifts(true);
    try {
      const compatibleDoctors = getCompatibleDoctors();
      const shiftsMap = new Map<string, EmployeeShift[]>();

      // Load shifts for each doctor in parallel
      // Load shifts for the selected month and surrounding months (1 month before, 1 month after)
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const startDate = subMonths(monthStart, 1); // 1 month before
      const endDate = addMonths(monthEnd, 1); // 1 month after

      await Promise.all(
        compatibleDoctors.map(async (doctor) => {
          // Use format from date-fns to get local date string (YYYY-MM-DD)
          // This avoids timezone issues with toISOString()
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');

          const employeeId = parseInt(doctor.employeeId, 10);
          if (!isNaN(employeeId)) {
            try {
              const shifts = await EmployeeShiftService.getShifts({
                start_date: startDateStr,
                end_date: endDateStr,
                employee_id: employeeId,
                status: ShiftStatus.SCHEDULED,
              });
              shiftsMap.set(doctor.employeeCode, shifts);
            } catch (error) {
              console.error(`Failed to load shifts for doctor ${doctor.employeeCode}:`, error);
              shiftsMap.set(doctor.employeeCode, []);
            }
          }
        })
      );

      setAllEmployeeShifts(shiftsMap);
    } catch (error: any) {
      console.error('Failed to load doctor shifts:', error);
      setAllEmployeeShifts(new Map());
    } finally {
      setLoadingShifts(false);
    }
  };

  // Get shifts for a specific doctor and date
  const getShiftsForDoctorAndDate = (employeeCode: string, dateString: string): EmployeeShift[] => {
    const shifts = allEmployeeShifts.get(employeeCode) || [];
    return shifts.filter((shift) => {
      // Use format from date-fns to get local date string (YYYY-MM-DD)
      // This avoids timezone issues with toISOString()
      const shiftDate = format(new Date(shift.workDate), 'yyyy-MM-dd');
      return shiftDate === dateString;
    });
  };

  // Get all dates with shifts for any doctor (used in Step 2 - all doctors)
  const getDatesWithShifts = (): Set<string> => {
    const dates = new Set<string>();
    const today = startOfDay(new Date());

    allEmployeeShifts.forEach((shifts) => {
      shifts.forEach((shift) => {
        const shiftDate = startOfDay(new Date(shift.workDate));
        if (isAfter(shiftDate, today) || shiftDate.getTime() === today.getTime()) {
          // Use format from date-fns to get local date string (YYYY-MM-DD)
          // This avoids timezone issues with toISOString()
          const dateStr = format(shiftDate, 'yyyy-MM-dd');
          dates.add(dateStr);
        }
      });
    });

    return dates;
  };

  // Get all doctors (ROLE_DENTIST/ROLE_DOCTOR) for Step 2 (no service filtering)
  const getAllDoctors = (): Employee[] => {
    return employees.filter((employee) => {
      if (!employee.roleName.includes('DENTIST') && !employee.roleName.includes('DOCTOR')) {
        return false;
      }
      if (!employee.specializations || employee.specializations.length === 0) {
        return false;
      }
      return true;
    });
  };

  // Check if a date has any doctors with shifts (for Step 2 - all doctors)
  const hasDoctorsWithShifts = (dateString: string): boolean => {
    const allDoctors = getAllDoctors();
    const hasShifts = allDoctors.some((doctor) => {
      const shifts = getShiftsForDoctorAndDate(doctor.employeeCode, dateString);
      if (shifts.length > 0) {
        console.log(`✅ Date ${dateString} has shifts for doctor ${doctor.employeeCode}:`, {
          shiftCount: shifts.length,
          shifts: shifts.map(s => ({
            date: s.workDate,
            shiftName: s.workShift?.shiftName,
          })),
        });
      }
      return shifts.length > 0;
    });

    if (!hasShifts) {
      // Debug: Check if shifts exist in map but not matching date
      const allShiftsInMap = Array.from(allEmployeeShifts.entries()).flatMap(([code, shifts]) =>
        shifts.map(s => ({ doctorCode: code, date: format(new Date(s.workDate), 'yyyy-MM-dd'), shift: s }))
      );
      const shiftsForDate = allShiftsInMap.filter(s => s.date === dateString);
      if (shiftsForDate.length > 0) {
        console.warn(`⚠️ Date ${dateString} has ${shiftsForDate.length} shifts in map but hasDoctorsWithShifts returned false:`, {
          shifts: shiftsForDate,
        });
      }
    }

    return hasShifts;
  };

  // Get doctors with shifts for a specific date (for Step 2 - display doctor list)
  const getDoctorsWithShiftsForDate = (dateString: string): Employee[] => {
    const allDoctors = getAllDoctors();
    return allDoctors.filter((doctor) => {
      const shifts = getShiftsForDoctorAndDate(doctor.employeeCode, dateString);
      return shifts.length > 0;
    });
  };

  // Check if doctor is available in a specific time slot (for Step 4)
  const isDoctorAvailableInSlot = (doctorCode: string, slotStartTime: string): boolean => {
    if (!appointmentDate) return false;
    const shifts = getShiftsForDoctorAndDate(doctorCode, appointmentDate);
    if (shifts.length === 0) return false;

    const slotTime = new Date(slotStartTime);
    const slotHour = slotTime.getHours();
    const slotMinute = slotTime.getMinutes();

    return shifts.some((shift) => {
      if (!shift.workShift) return false;
      const [startHour, startMinute] = shift.workShift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.workShift.endTime.split(':').map(Number);

      const shiftStart = startHour * 60 + startMinute;
      const shiftEnd = endHour * 60 + endMinute;
      const slotTimeMinutes = slotHour * 60 + slotMinute;

      return slotTimeMinutes >= shiftStart && slotTimeMinutes < shiftEnd;
    });
  };

  // Check if participant is available in a specific time slot (for Step 4)
  const isParticipantAvailableInSlot = (participantCode: string, slotStartTime: string): boolean => {
    if (!appointmentDate) return false;
    const shifts = getParticipantShiftsForDate(participantCode, appointmentDate);
    if (shifts.length === 0) return false;

    const slotTime = new Date(slotStartTime);
    const slotHour = slotTime.getHours();
    const slotMinute = slotTime.getMinutes();

    return shifts.some((shift) => {
      if (!shift.workShift) return false;
      const [startHour, startMinute] = shift.workShift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.workShift.endTime.split(':').map(Number);

      const shiftStart = startHour * 60 + startMinute;
      const shiftEnd = endHour * 60 + endMinute;
      const slotTimeMinutes = slotHour * 60 + slotMinute;

      return slotTimeMinutes >= shiftStart && slotTimeMinutes < shiftEnd;
    });
  };

  // Load available slots using available-times API
  const loadAvailableSlots = async () => {
    if (!employeeCode || !appointmentDate || serviceCodes.length === 0) {
      console.log(' Missing required fields for loadAvailableSlots:', {
        employeeCode,
        appointmentDate,
        serviceCodes,
      });
      return;
    }

    setLoadingAvailableSlots(true);
    setLoadSlotsError(''); // Reset error message
    try {
      // Phase 5: Use serviceCodes if available, otherwise use planItemServiceCodes
      const codesToUse = serviceCodes.length > 0 ? serviceCodes : planItemServiceCodes;

      const request: AvailableTimesRequest = {
        date: appointmentDate,
        employeeCode,
        serviceCodes: codesToUse,
        participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
      };

      console.log(' Calling available-times API with request:', request);
      const response = await appointmentService.findAvailableTimes(request);
      console.log(' Available-times API response:', response);

      // Ensure availableSlots is always an array
      const slots = Array.isArray(response?.availableSlots) ? response.availableSlots : [];
      setAvailableSlots(slots);

      // Capture error message from API response (if any)
      if (response?.message) {
        setLoadSlotsError(response.message);
      } else if (slots.length === 0) {
        // Set a default message if no slots and no specific error message
        setLoadSlotsError('Không có lịch trống cho bác sĩ này vào ngày đã chọn.');
      } else {
        // Clear error if slots are found
        setLoadSlotsError('');
      }

      // IMPORTANT: Reset roomCode when reloading slots to prevent incompatibility
      setRoomCode('');
      setAppointmentStartTime('');

      // Auto-select first available slot if slots are found
      if (slots.length > 0) {
        const firstSlot = slots[0];
        console.log(' Auto-selecting first slot:', firstSlot);
        setAppointmentStartTime(firstSlot.startTime);
        if (Array.isArray(firstSlot.availableCompatibleRoomCodes) && firstSlot.availableCompatibleRoomCodes.length > 0) {
          setRoomCode(firstSlot.availableCompatibleRoomCodes[0]);
        }
      } else {
        console.warn(' No available slots found in response');
      }
    } catch (error: any) {
      console.error(' Failed to load available slots:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Extract error message from response
      let errorMsg = 'Không thể tải thông tin lịch trống. Vui lòng thử lại sau.';
      
      // Try to extract message from wrapped response
      if (error.response?.data) {
        const responseData = error.response.data;
        // Handle FormatRestResponse structure: { statusCode, message, data }
        if (responseData.message) {
          errorMsg = responseData.message;
        } else if (responseData.data?.message) {
          errorMsg = responseData.data.message;
        } else if (typeof responseData === 'string') {
          errorMsg = responseData;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setLoadSlotsError(errorMsg);
      setAvailableSlots([]);
      
      // Only show toast for actual errors, not for "no slots available" cases
      if (error.response?.status !== 404 && error.response?.status !== 200) {
        toast.error('Không thể tải thông tin lịch trống. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingAvailableSlots(false);
    }
  };

  // Load shifts for all eligible participants (for filtering in Step 4)
  const loadAllParticipantShifts = async () => {
    if (!appointmentDate || employees.length === 0) {
      return;
    }

    setLoadingParticipantShifts(true);
    try {
      // Get all eligible participants (STANDARD specialization, not the selected doctor)
      const eligibleParticipants = employees.filter((e) => {
        if (e.employeeCode === employeeCode) return false;

        const hasStandardSpecialization = e.specializations?.some(
          (spec) =>
            String(spec.specializationId) === '8' ||
            spec.specializationId === '8'
        );

        return hasStandardSpecialization;
      });

      const shiftsMap = new Map<string, EmployeeShift[]>();

      // Load shifts for the selected month and surrounding months (1 month before, 1 month after)
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const startDate = subMonths(monthStart, 1); // 1 month before
      const endDate = addMonths(monthEnd, 1); // 1 month after

      await Promise.all(
        eligibleParticipants.map(async (participant) => {
          // Use format from date-fns to get local date string (YYYY-MM-DD)
          // This avoids timezone issues with toISOString()
          const startDateStr = format(startDate, 'yyyy-MM-dd');
          const endDateStr = format(endDate, 'yyyy-MM-dd');

          const employeeId = parseInt(participant.employeeId, 10);
          if (!isNaN(employeeId)) {
            try {
              const shifts = await EmployeeShiftService.getShifts({
                start_date: startDateStr,
                end_date: endDateStr,
                employee_id: employeeId,
                status: ShiftStatus.SCHEDULED,
              });
              shiftsMap.set(participant.employeeCode, shifts);
            } catch (error) {
              console.error(`Failed to load shifts for participant ${participant.employeeCode}:`, error);
              shiftsMap.set(participant.employeeCode, []);
            }
          }
        })
      );

      setParticipantShifts(shiftsMap);
    } catch (error: any) {
      console.error('Failed to load participant shifts:', error);
      setParticipantShifts(new Map());
    } finally {
      setLoadingParticipantShifts(false);
    }
  };

  // Get shifts for a specific participant and date
  const getParticipantShiftsForDate = (participantCode: string, dateString: string): EmployeeShift[] => {
    const shifts = participantShifts.get(participantCode) || [];
    return shifts.filter((shift) => {
      // Use format from date-fns to get local date string (YYYY-MM-DD)
      // This avoids timezone issues with toISOString()
      const shiftDate = format(new Date(shift.workDate), 'yyyy-MM-dd');
      return shiftDate === dateString;
    });
  };

  // Step 3: Get services grouped by specialization (matching service list page)
  const getServicesGroupedBySpecialization = useMemo(() => {
    const grouped = new Map<string | number, { specialization?: Specialization; services: Service[] }>();

    // Ensure services is an array before iterating
    const safeServices = Array.isArray(services) ? services : [];
    
    // Group by specialization
    safeServices.forEach((service) => {
      const specId = service.specializationId || 'none';
      if (!grouped.has(specId)) {
        //  Fix: Compare both string and number versions of specializationId
        const specialization = specId !== 'none'
          ? specializations.find(s =>
            String(s.specializationId) === String(specId) ||
            (s.specializationId as any) === specId
          )
          : undefined;
        grouped.set(specId, { specialization, services: [] });
      }
      grouped.get(specId)!.services.push(service);
    });

    return grouped;
  }, [services, specializations]);

  // Step 3: Get filtered services based on selected specialization filter, doctor's specialization, search term, and group filter
  const getFilteredServices = (): Service[] => {
    // Ensure services is an array
    const safeServices = Array.isArray(services) ? services : [];
    let filtered = safeServices;

    // Filter by doctor's specialization if doctor is selected (employeeCode from step 3)
    if (employeeCode && employeeCode !== '') {
      const selectedDoctor = employees.find((e) => e.employeeCode === employeeCode);
      if (selectedDoctor && selectedDoctor.specializations && selectedDoctor.specializations.length > 0) {
        const doctorSpecializationIds = selectedDoctor.specializations.map((spec: any) => {
          const specId = typeof spec === 'string' ? parseInt(spec, 10) : (typeof spec === 'object' ? parseInt(String(spec.specializationId || spec.id || spec), 10) : spec);
          return isNaN(specId) ? null : specId;
        }).filter((id: number | null): id is number => id !== null);

        // Only show services that match doctor's specializations or services without specialization
        filtered = filtered.filter((service) => {
          if (!service.specializationId) {
            return true; // Show services without specialization
          }
          return doctorSpecializationIds.includes(service.specializationId);
        });
      }
    }

    // Apply service group filter (by specialization of selected doctor)
    if (serviceGroupFilter !== 'all') {
      const specId = parseInt(serviceGroupFilter, 10);
      filtered = filtered.filter((service) => service.specializationId === specId);
    }

    // Apply search term filter
    if (serviceSearchTerm.trim()) {
      const searchLower = serviceSearchTerm.toLowerCase().trim();
      filtered = filtered.filter((service) =>
        service.serviceName.toLowerCase().includes(searchLower) ||
        service.serviceCode.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Step 4: Get compatible doctors (ROLE_DENTIST + specialization match)
  const getCompatibleDoctors = (): Employee[] => {
    // Use serviceCodes if available (either from direct selection or extracted from plan items)
    const codesToUse = serviceCodes.length > 0 ? serviceCodes : planItemServiceCodes;

    if (codesToUse.length === 0) {
      // If booking from plan items but serviceCodes not loaded yet, show all doctors with specializations
      if (planItemIds.length > 0) {
        console.log(' getCompatibleDoctors - Booking from plan items, serviceCodes not loaded yet, showing all doctors');
        return employees.filter((employee) => {
          // Must be ROLE_DENTIST or ROLE_DOCTOR
          if (!employee.roleName.includes('DENTIST') && !employee.roleName.includes('DOCTOR')) {
            return false;
          }
          // Must have specializations
          if (!employee.specializations || employee.specializations.length === 0) {
            return false;
          }
          return true;
        });
      }
      return [];
    }

    // Get required specialization IDs from selected services
    const requiredSpecializationIds = new Set<number>();
    const servicesWithoutSpecialization: Service[] = [];

    codesToUse.forEach((code) => {
      const service = services.find((s) => s.serviceCode === code);
      if (service) {
        if (service.specializationId) {
          requiredSpecializationIds.add(service.specializationId);
        } else {
          servicesWithoutSpecialization.push(service);
        }
      }
    });

    // Log for debugging
    console.log(' getCompatibleDoctors - Debug Info:', {
      serviceCodes,
      requiredSpecializationIds: Array.from(requiredSpecializationIds),
      servicesWithoutSpecialization: servicesWithoutSpecialization.map(s => ({
        code: s.serviceCode,
        name: s.serviceName,
        categoryId: s.categoryId,
        categoryName: s.categoryName
      })),
      totalEmployees: employees.length
    });

    const compatibleDoctors = employees.filter((employee) => {
      // Must be ROLE_DENTIST or ROLE_DOCTOR
      if (!employee.roleName.includes('DENTIST') && !employee.roleName.includes('DOCTOR')) {
        return false;
      }

      // Must have specializations
      if (!employee.specializations || employee.specializations.length === 0) {
        return false;
      }

      const employeeSpecializationIds = employee.specializations.map((spec) =>
        parseInt(String(spec.specializationId), 10)
      ).filter(id => !isNaN(id));

      // If services require specialization, doctor must have at least one matching
      if (requiredSpecializationIds.size > 0) {
        const hasMatchingSpecialization = Array.from(requiredSpecializationIds).some((reqId) =>
          employeeSpecializationIds.includes(reqId)
        );

        // Log for debugging
        if (!hasMatchingSpecialization) {
          console.log(` Employee ${employee.employeeCode} (${employee.fullName}) filtered out:`, {
            employeeSpecializationIds,
            requiredSpecializationIds: Array.from(requiredSpecializationIds),
            roleName: employee.roleName
          });
        }

        return hasMatchingSpecialization;
      }

      // If no services require specialization (all selected services have no specializationId),
      // show all doctors with specializations (they can handle general services)
      console.log(` Employee ${employee.employeeCode} (${employee.fullName}) included (no specialization required):`, {
        employeeSpecializationIds,
        servicesWithoutSpecialization: servicesWithoutSpecialization.length
      });
      return true;
    });

    console.log(' getCompatibleDoctors - Result:', {
      totalCompatible: compatibleDoctors.length,
      compatibleDoctors: compatibleDoctors.map(d => ({
        code: d.employeeCode,
        name: d.fullName,
        specializations: d.specializations?.map(s => s.specializationId)
      }))
    });

    return compatibleDoctors;
  };

  const handleToggleService = (serviceCode: string) => {
    setServiceCodes((prev) =>
      prev.includes(serviceCode)
        ? prev.filter((code) => code !== serviceCode)
        : [...prev, serviceCode]
    );
  };

  const handleToggleParticipant = (employeeCode: string) => {
    setParticipantCodes((prev) =>
      prev.includes(employeeCode)
        ? prev.filter((code) => code !== employeeCode)
        : [...prev, employeeCode]
    );
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    setAppointmentStartTime(slot.startTime);
    // IMPORTANT: Always reset roomCode when changing slot to prevent selecting incompatible room
    setRoomCode('');
    // Auto-select first compatible room if available
    if (slot.availableCompatibleRoomCodes.length > 0) {
      setRoomCode(slot.availableCompatibleRoomCodes[0]);
    }
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !patientCode) {
      toast.error('Vui lòng chọn bệnh nhân');
      return;
    }
    if (currentStep === 2 && !appointmentDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }
    // Phase 5: Skip step 3 (services) if booking from plan items
    if (currentStep === 2 && planItemIds.length > 0) {
      // Skip to step 4 (doctor + time slots) when booking from plan items
      setCurrentStep(4);
      return;
    }
    // Step 3: Validate doctor and services selection
    if (currentStep === 3) {
      if (!employeeCode) {
        toast.error('Vui lòng chọn bác sĩ');
        return;
      }
      if (planItemIds.length === 0 && serviceCodes.length === 0) {
        toast.error('Vui lòng chọn ít nhất một dịch vụ');
        return;
      }
    }
    // Step 4: Validate time slot and room
    if (currentStep === 4) {
      if (!appointmentStartTime) {
        toast.error('Vui lòng chọn khung giờ');
        return;
      }
      // Validate time is in 15-minute intervals
      const timeMatch = appointmentStartTime.match(/T(\d{2}):(\d{2}):/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[2], 10);
        if (minutes % 15 !== 0) {
          toast.error('Thời gian phải là bội số của 15 phút (ví dụ: 8:00, 8:15, 8:30, 8:45)');
          return;
        }
      }
      if (!roomCode) {
        toast.error('Vui lòng chọn phòng');
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleCreate = async () => {
    // Phase 5: XOR validation - Need EITHER serviceCodes OR patientPlanItemIds
    const hasServices = serviceCodes.length > 0;
    const hasPlanItems = planItemIds.length > 0;

    if (!patientCode || !employeeCode || !roomCode || !appointmentStartTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Check if patient is booking blocked
    if (selectedPatientData?.isBookingBlocked) {
      const blockReason = getBookingBlockReasonLabel(selectedPatientData.bookingBlockReason);
      const isTemp = isTemporaryBlock(selectedPatientData.bookingBlockReason);
      toast.error(
        `Bệnh nhân ${selectedPatientData.fullName} đang bị ${isTemp ? 'tạm chặn' : 'blacklist'}: ${blockReason}. Không thể tạo lịch hẹn. Vui lòng liên hệ quản trị viên để unban.`,
        { duration: 6000 }
      );
      return;
    }

    // Validate: Must have either services or plan items (XOR)
    if (!hasServices && !hasPlanItems) {
      toast.error('Vui lòng chọn dịch vụ hoặc đặt lịch từ kế hoạch điều trị');
      return;
    }

    if (hasServices && hasPlanItems) {
      // This shouldn't happen in normal flow, but handle it
      toast.error('Không thể cung cấp cả dịch vụ và mục kế hoạch. Vui lòng sử dụng một phương thức.');
      return;
    }

    // CRITICAL VALIDATION: Ensure selected room is compatible with the time slot
    if (selectedSlot) {
      const compatibleRooms = selectedSlot.availableCompatibleRoomCodes || [];
      if (compatibleRooms.length > 0 && !compatibleRooms.includes(roomCode)) {
        toast.error(
          `Phòng ${roomCode} không hỗ trợ dịch vụ đã chọn. Vui lòng chọn phòng khác từ danh sách.`,
          { duration: 5000 }
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Ensure appointmentStartTime is in ISO_LOCAL_DATE_TIME format: YYYY-MM-DDTHH:mm:ss
      // Backend uses DateTimeFormatter.ISO_LOCAL_DATE_TIME which expects exactly this format
      let formattedStartTime = appointmentStartTime;

      // Remove timezone if present (Z or +HH:mm)
      if (formattedStartTime.includes('Z')) {
        formattedStartTime = formattedStartTime.replace('Z', '');
      }
      if (formattedStartTime.match(/[+-]\d{2}:\d{2}$/)) {
        formattedStartTime = formattedStartTime.replace(/[+-]\d{2}:\d{2}$/, '');
      }

      // Remove milliseconds if present (.SSS)
      if (formattedStartTime.includes('.')) {
        formattedStartTime = formattedStartTime.split('.')[0];
      }

      // Ensure format is YYYY-MM-DDTHH:mm:ss
      if (formattedStartTime && !formattedStartTime.includes(':')) {
        // If it's just a date, this shouldn't happen, but handle it
        formattedStartTime = `${formattedStartTime}T00:00:00`;
      } else if (formattedStartTime && formattedStartTime.match(/T\d{2}:\d{2}$/)) {
        // If format is YYYY-MM-DDTHH:mm, add :00 for seconds
        formattedStartTime = formattedStartTime + ':00';
      } else if (formattedStartTime && formattedStartTime.match(/T\d{2}:\d{2}:\d{2}$/)) {
        // Already has seconds, keep as is
        // No change needed
      }

      // Phase 5: XOR validation - BE requires EITHER serviceCodes OR patientPlanItemIds, not both
      // If booking from treatment plan (has planItemIds), BE will extract serviceCodes from items
      // So we should NOT send serviceCodes when planItemIds are provided
      let request: CreateAppointmentRequest;

      if (planItemIds.length > 0) {
        // Booking from treatment plan items - BE extracts serviceCodes from items
        request = {
          patientCode,
          employeeCode,
          roomCode,
          appointmentStartTime: formattedStartTime,
          participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
          notes: notes.trim() || undefined,
          patientPlanItemIds: planItemIds, // Only send planItemIds, BE extracts serviceCodes
        };
      } else {
        // Standalone booking - send serviceCodes
        request = {
          patientCode,
          employeeCode,
          roomCode,
          serviceCodes: serviceCodes, // Only send serviceCodes
          appointmentStartTime: formattedStartTime,
          participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
          notes: notes.trim() || undefined,
        };
      }

      const appointmentResponse = await appointmentService.createAppointment(request);
      
      console.log('✅ Appointment created successfully:', {
        appointmentCode: appointmentResponse?.appointmentCode,
        status: appointmentResponse?.status,
        fullResponse: appointmentResponse,
      });
      
      // Validate appointment response
      if (!appointmentResponse?.appointmentCode) {
        console.error('❌ Invalid appointment response: missing appointmentCode', appointmentResponse);
        toast.error('Tạo lịch hẹn thành công nhưng không thể lấy mã lịch hẹn. Vui lòng kiểm tra lại.');
        onSuccess();
        onClose();
        return;
      }

      toast.success('Đặt lịch hẹn thành công!');

      // Auto-create invoice after appointment is created (only if user has permission)
      if (canCreateInvoice) {
        try {
          console.log('💰 Starting auto-invoice creation...');
          
          // Get appointment detail to get appointmentId
          // Add a small delay to ensure backend has processed the appointment
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Retry logic: Try up to 3 times with increasing delay
          let appointmentDetail: any = null;
          let retries = 0;
          const maxRetries = 3;
          
          while (retries < maxRetries && !appointmentDetail) {
            try {
              console.log(`📋 Fetching appointment detail (attempt ${retries + 1}/${maxRetries})...`);
              appointmentDetail = await appointmentService.getAppointmentDetail(appointmentResponse.appointmentCode);
              console.log('✅ Got appointment detail:', {
                appointmentId: appointmentDetail?.appointmentId,
                appointmentCode: appointmentDetail?.appointmentCode,
              });
              break;
            } catch (error: any) {
              retries++;
              if (retries < maxRetries) {
                // Wait longer on each retry: 500ms, 1000ms, 1500ms
                await new Promise(resolve => setTimeout(resolve, 500 * retries));
                console.log(`⏳ Retrying getAppointmentDetail (attempt ${retries + 1}/${maxRetries})...`);
              } else {
                console.error('❌ Failed to get appointment detail after retries:', error);
                throw error;
              }
            }
          }
          
          if (!appointmentDetail?.appointmentId || !selectedPatientData?.patientId) {
            console.warn('⚠️ Cannot auto-create invoice: Missing appointmentId or patientId', {
              appointmentId: appointmentDetail?.appointmentId,
              patientId: selectedPatientData?.patientId,
              appointmentDetail: appointmentDetail,
            });
            onSuccess();
            onClose();
            return;
          }

          // Get service details with prices
          const selectedServicesWithPrices = services.filter(s => serviceCodes.includes(s.serviceCode));
          
          console.log('🔍 Services for invoice:', {
            serviceCodes,
            selectedServicesCount: selectedServicesWithPrices.length,
            services: selectedServicesWithPrices.map(s => ({
              serviceCode: s.serviceCode,
              serviceName: s.serviceName,
              price: s.price,
            })),
          });
          
          if (selectedServicesWithPrices.length === 0) {
            console.warn('⚠️ Cannot auto-create invoice: No services found', {
              serviceCodes,
              servicesAvailable: services.length,
            });
            onSuccess();
            onClose();
            return;
          }

          // Create invoice items from selected services
          const invoiceItems = selectedServicesWithPrices.map(service => ({
            serviceId: service.serviceId,
            serviceCode: service.serviceCode,
            serviceName: service.serviceName,
            quantity: 1,
            unitPrice: Number(service.price) || 0,
            notes: `Dịch vụ từ lịch hẹn ${appointmentResponse.appointmentCode}`,
          }));

          const invoiceRequest: CreateInvoiceRequest = {
            invoiceType: 'APPOINTMENT',
            patientId: Number(selectedPatientData.patientId),
            appointmentId: appointmentDetail.appointmentId,
            items: invoiceItems,
            notes: `Hóa đơn tự động tạo cho lịch hẹn ${appointmentResponse.appointmentCode}`,
          };

          console.log('📝 Creating invoice with request:', {
            invoiceType: invoiceRequest.invoiceType,
            patientId: invoiceRequest.patientId,
            appointmentId: invoiceRequest.appointmentId,
            itemsCount: invoiceRequest.items.length,
          });

          const createdInvoice = await invoiceService.createInvoice(invoiceRequest);
          
          console.log('✅ Auto-invoice created successfully:', {
            invoiceCode: createdInvoice.invoiceCode,
            invoiceId: createdInvoice.invoiceId,
            totalAmount: createdInvoice.totalAmount,
          });
          
          toast.success('Đã tự động tạo hóa đơn cho lịch hẹn!');
        } catch (invoiceError: any) {
          console.error('❌ Failed to auto-create invoice:', {
            error: invoiceError,
            message: invoiceError.message,
            response: invoiceError.response?.data,
            status: invoiceError.response?.status,
            appointmentCode: appointmentResponse.appointmentCode,
          });
          // Don't fail the appointment creation if invoice creation fails
          toast.warning('Lịch hẹn đã được tạo, nhưng không thể tự động tạo hóa đơn. Vui lòng tạo hóa đơn thủ công.');
        }
      } else {
        console.warn('User does not have CREATE_INVOICE permission, skipping auto-invoice creation');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create appointment:', error);

      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      const statusCode = error.response?.status;

      if (statusCode === 400) {
        // Bad Request - usually validation or business rule errors
        if (errorMessage.includes('Room') && errorMessage.includes('does not support')) {
          toast.error(
            'Phòng đã chọn không hỗ trợ dịch vụ này. Vui lòng chọn phòng khác.',
            { duration: 5000 }
          );
        } else if (errorMessage.toLowerCase().includes('không có phòng') || errorMessage.toLowerCase().includes('no room')) {
          toast.error(
            'Không có phòng phù hợp cho dịch vụ này. Vui lòng chọn ngày hoặc bác sĩ khác.',
            { duration: 5000 }
          );
        } else {
          toast.error(`Thông tin không hợp lệ: ${errorMessage}`, { duration: 5000 });
        }
      } else if (statusCode === 409) {
        // Conflict - slot taken, employee not qualified, etc.
        if (errorMessage.toLowerCase().includes('taken') || errorMessage.toLowerCase().includes('đã được đặt')) {
          toast.error(
            'Khung giờ này đã có người đặt. Vui lòng chọn khung giờ khác.',
            { duration: 5000 }
          );
        } else if (errorMessage.toLowerCase().includes('not qualified') || errorMessage.toLowerCase().includes('không đủ năng lực')) {
          toast.error(
            'Bác sĩ không có chuyên môn phù hợp với dịch vụ này. Vui lòng chọn bác sĩ khác.',
            { duration: 5000 }
          );
        } else {
          toast.error(
            `Xung đột lịch hẹn: ${errorMessage}`,
            { duration: 5000 }
          );
        }
      } else {
        toast.error('Không thể tạo lịch hẹn. Vui lòng thử lại sau.', { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const selectedPatient = selectedPatientData || patientSearchResults.find((p) => p.patientCode === patientCode);
  const selectedEmployee = employees.find((e) => e.employeeCode === employeeCode);
  const selectedServices = services.filter((s) => serviceCodes.includes(s.serviceCode));
  const selectedSlot = availableSlots.find((slot) => slot.startTime === appointmentStartTime);
  const groupedSlots = groupSlotsByTimeOfDay(availableSlots);

  // Get specializations of selected doctor for filter dropdown
  const selectedDoctorSpecializations = useMemo(() => {
    if (!selectedEmployee || !selectedEmployee.specializations) return [];
    return selectedEmployee.specializations;
  }, [selectedEmployee]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
          <DialogDescription>
            Bước {currentStep}/5: {getStepTitle(currentStep)}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6 px-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${step === currentStep
                      ? 'bg-[#8b5fbf] text-white scale-110 shadow-lg'
                      : step < currentStep
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {step < currentStep ? <CheckCircle className="h-6 w-6" /> : step}
                  </div>
                  <div className={`text-xs mt-2 text-center font-medium max-w-[90px] ${step === currentStep ? 'text-[#8b5fbf]' : step < currentStep ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                    {getStepTitle(step as Step)}
                  </div>
                </div>
                {index < 4 && (
                  <div className={`flex-1 h-1 mx-3 mb-8 rounded-full transition-all ${step < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-3">
          {/* Step 1: Select Patient */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="patientSearch">Tìm kiếm bệnh nhân <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patientSearch"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Tìm theo tên, số điện thoại, hoặc mã..."
                    className="pl-10"
                  />
                </div>
                {searchingPatients && (
                  <p className="text-sm text-muted-foreground mt-1">Đang tìm kiếm...</p>
                )}
              </div>

              {/* Show patients list */}
              {!patientCode && patientSearchResults.length > 0 && (
                <Card className="p-4">
                  <div className="space-y-2">
                    {patientSearchResults.map((patient) => (
                      <div
                        key={patient.patientId}
                        onClick={() => {
                          if (patient.isBookingBlocked) {
                            const blockReason = getBookingBlockReasonLabel(patient.bookingBlockReason);
                            const isTemp = isTemporaryBlock(patient.bookingBlockReason);
                            toast.error(
                              `Bệnh nhân ${patient.fullName} đang bị ${isTemp ? 'tạm chặn' : 'blacklist'}: ${blockReason}. Không thể tạo lịch hẹn.`
                            );
                            return;
                          }
                          handleSelectPatient(patient);
                        }}
                        className={`p-2 border rounded-lg transition-colors ${patient.isBookingBlocked
                          ? isTemporaryBlock(patient.bookingBlockReason)
                            ? 'border-orange-300 bg-orange-50 cursor-not-allowed opacity-60'
                            : 'border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                          : patientCode === patient.patientCode
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'hover:bg-muted cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" dangerouslySetInnerHTML={{ 
                              __html: highlightMatch(patient.fullName, patientSearch) 
                            }} />
                            {patient.phone && <span className="text-xs text-muted-foreground">• {patient.phone}</span>}
                          </div>
                          {patient.isBookingBlocked && (
                            <Badge
                              variant="destructive"
                              className={`text-xs ${isTemporaryBlock(patient.bookingBlockReason) ? 'bg-orange-600' : 'bg-red-600'}`}
                            >
                              {isTemporaryBlock(patient.bookingBlockReason) ? 'TẠM CHẶN' : 'BLACKLIST'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {patientSearch.length > 0 && patientSearchResults.length === 0 && !searchingPatients && (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Không tìm thấy bệnh nhân
                  </p>
                </Card>
              )}

              {selectedPatient && (
                <Card className={`p-3 border-2 ${selectedPatient.isBookingBlocked
                  ? isTemporaryBlock(selectedPatient.bookingBlockReason)
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-red-50 border-red-300'
                  : 'bg-primary/5 border-primary'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className={`h-4 w-4 ${selectedPatient.isBookingBlocked
                        ? isTemporaryBlock(selectedPatient.bookingBlockReason)
                          ? 'text-orange-600'
                          : 'text-red-600'
                        : 'text-primary'
                        }`} />
                      <span className="font-medium text-sm">{selectedPatient.fullName}</span>
                      {selectedPatient.phone && <span className="text-xs text-muted-foreground">• {selectedPatient.phone}</span>}
                    </div>
                    {selectedPatient.isBookingBlocked && (
                      <Badge
                        variant="destructive"
                        className={`text-xs ${isTemporaryBlock(selectedPatient.bookingBlockReason) ? 'bg-orange-600' : 'bg-red-600'}`}
                      >
                        {isTemporaryBlock(selectedPatient.bookingBlockReason) ? 'TẠM CHẶN' : 'BLACKLIST'}
                      </Badge>
                    )}
                  </div>
                  {selectedPatient.isBookingBlocked && (
                    <div className={`mt-2 p-2 border rounded-lg text-xs ${isTemporaryBlock(selectedPatient.bookingBlockReason)
                      ? 'bg-orange-100 border-orange-300 text-orange-800'
                      : 'bg-red-100 border-red-300 text-red-800'
                      }`}>
                      <strong>⚠️ Cảnh báo:</strong> Bệnh nhân đang bị {isTemporaryBlock(selectedPatient.bookingBlockReason) ? 'tạm chặn' : 'blacklist'}: {getBookingBlockReasonLabel(selectedPatient.bookingBlockReason)}. Không thể tạo lịch hẹn.
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Select Date (with calendar view and availability info) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Date Input & Calendar */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appointmentDate">Chọn ngày ưu tiên <span className="text-red-500">*</span></Label>
                    <DateInput
                      id="appointmentDate"
                      value={appointmentDate}
                      onChange={(e) => {
                        setAppointmentDate(e.target.value);
                        setEmployeeCode('');
                        setAppointmentStartTime('');
                        setRoomCode('');
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Chọn ngày bạn muốn đặt lịch hẹn
                    </p>
                  </div>

                  {/* Calendar Grid View - Month View with Navigation */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="block">Xem lịch</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                          disabled={loadingShifts}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-semibold min-w-[120px] text-center">
                          {format(selectedMonth, 'MMMM yyyy')}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                          disabled={loadingShifts}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {loadingShifts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Đang tải lịch trống...</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Weekday headers */}
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-xs font-semibold text-center text-muted-foreground py-1">
                              {day}
                            </div>
                          ))}
                          {/* Calendar dates - Month view */}
                          {(() => {
                            const today = startOfDay(new Date());
                            const monthStart = startOfMonth(selectedMonth);
                            const monthEnd = endOfMonth(selectedMonth);
                            const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                            const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                            const dates: React.ReactElement[] = [];

                            let currentDate = new Date(calendarStart);

                            while (currentDate <= calendarEnd) {
                              // Use format from date-fns to get local date string (YYYY-MM-DD)
                              // This avoids timezone issues with toISOString()
                              const dateStr = format(currentDate, 'yyyy-MM-dd');
                              const isPast = currentDate < today;
                              const isSelected = appointmentDate === dateStr;
                              const isToday = isSameDay(currentDate, today);
                              const isCurrentMonth = isSameMonth(currentDate, selectedMonth);

                              // BE_4: Check if date is holiday
                              const isHolidayDate = isHoliday(dateStr);
                              const holidayName = getHolidayName(dateStr);

                              // Check if this date has any doctors with shifts (for Step 2 - all doctors)
                              const hasDoctors = hasDoctorsWithShifts(dateStr);

                              dates.push(
                                <button
                                  key={dateStr}
                                  type="button"
                                  onClick={() => {
                                    if (!isPast && isCurrentMonth && !isHolidayDate) {
                                      setAppointmentDate(dateStr);
                                      setEmployeeCode('');
                                      setAppointmentStartTime('');
                                      setRoomCode('');
                                    }
                                  }}
                                  disabled={isPast || !isCurrentMonth || isHolidayDate}
                                  title={isHolidayDate ? `Ngày lễ: ${holidayName}` : undefined}
                                  className={`p-2 rounded text-center transition-all relative ${!isCurrentMonth
                                    ? 'bg-muted/20 opacity-30 cursor-not-allowed'
                                    : isPast
                                      ? 'bg-muted/30 opacity-50 cursor-not-allowed'
                                      : isHolidayDate
                                        ? 'bg-red-50 text-red-600 border border-red-300 cursor-not-allowed opacity-70'
                                        : isSelected
                                          ? 'bg-primary text-primary-foreground font-semibold scale-105'
                                          : hasDoctors
                                            ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                            : 'bg-muted/50 hover:bg-muted border border-border'
                                    } ${isToday && !isPast && isCurrentMonth && !isHolidayDate ? 'ring-2 ring-primary/30' : ''}`}
                                >
                                  <div className="text-xs font-medium">{currentDate.getDate()}</div>
                                  {hasDoctors && !isPast && isCurrentMonth && !isHolidayDate && (
                                    <div className="text-[8px] mt-0.5 text-green-600">●</div>
                                  )}
                                  {isHolidayDate && isCurrentMonth && (
                                    <div className="text-[8px] mt-0.5 text-red-600">●</div>
                                  )}
                                </button>
                              );

                              currentDate = addDays(currentDate, 1);
                            }

                            return dates;
                          })()}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
                            <span>Có sẵn</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-muted/50 border border-border"></div>
                            <span>Không sẵn</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-red-50 border border-red-300"></div>
                            <span>Ngày lễ</span>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </div>

                {/* Right: Availability Info & Suggestions */}
                <div className="space-y-4">
                  {appointmentDate ? (
                    <>
                      {loadingDateSuggestions ? (
                        <Card className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang kiểm tra lịch trống...</span>
                          </div>
                        </Card>
                      ) : (
                        <>
                          {/* Availability Summary - Always show, even without services */}
                          <Card className="p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-sm">Tổng quan lịch trống</h4>
                            </div>
                            {loadingShifts ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Đang tải...</span>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Tổng số bác sĩ:</span>
                                  <span className="font-semibold">{getAllDoctors().length}</span>
                                </div>
                                {appointmentDate ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Bác sĩ có ca làm:</span>
                                      <span className="font-semibold">
                                        {getAllDoctors().filter((doctor) => {
                                          const shifts = getShiftsForDoctorAndDate(doctor.employeeCode, appointmentDate);
                                          return shifts.length > 0;
                                        }).length}
                                      </span>
                                    </div>
                                    {serviceCodes.length > 0 && (
                                      <>
                                        <div className="pt-2 border-t">
                                          <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Bác sĩ phù hợp:</span>
                                            <span className="font-semibold">{getCompatibleDoctors().length}</span>
                                          </div>
                                        </div>
                                        {selectedServices.length > 0 && (
                                          <div className="pt-2 border-t">
                                            <div className="text-xs text-muted-foreground mb-1">Dịch vụ đã chọn:</div>
                                            <div className="flex flex-wrap gap-1">
                                              {selectedServices.map((service) => (
                                                <Badge key={service.serviceId} variant="outline" className="text-xs">
                                                  {service.serviceName}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Chọn ngày để xem thông tin lịch trống
                                  </p>
                                )}
                              </div>
                            )}
                          </Card>

                          {/* Doctors List for Selected Date */}
                          {appointmentDate && (
                            <Card className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <UserCog className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold text-sm">
                                  Bác sĩ có lịch ngày {format(new Date(appointmentDate), 'dd/MM/yyyy')}
                                </h4>
                              </div>
                              {loadingShifts ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Đang tải...</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {(() => {
                                    const doctorsWithShifts = getDoctorsWithShiftsForDate(appointmentDate);
                                    if (doctorsWithShifts.length === 0) {
                                      return (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                          Không có bác sĩ trực vào ngày này
                                        </p>
                                      );
                                    }
                                    return doctorsWithShifts.map((doctor) => {
                                      const shifts = getShiftsForDoctorAndDate(doctor.employeeCode, appointmentDate);
                                      return (
                                        <div key={doctor.employeeId} className="p-2 border rounded-lg bg-background">
                                          <div className="font-medium text-sm">{doctor.fullName}</div>
                                          <div className="text-xs text-muted-foreground mb-1">
                                            {doctor.employeeCode}
                                          </div>
                                          <div className="space-y-1">
                                            {shifts.map((shift) => (
                                              <div
                                                key={shift.employeeShiftId}
                                                className="flex items-center gap-2 text-xs text-muted-foreground"
                                              >
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                  {shift.workShift?.shiftName || 'Ca làm'}: {shift.workShift?.startTime} - {shift.workShift?.endTime}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </Card>
                          )}

                          {/* Suggestions */}
                          {suggestedDates.length > 0 && (
                            <Card className="p-4 bg-yellow-50 border-yellow-200">
                              <div className="flex items-start gap-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm text-yellow-800 mb-1">
                                    Lịch trống hạn chế vào ngày đã chọn
                                  </h4>
                                  <p className="text-xs text-yellow-700 mb-3">
                                    Ngày đã chọn có thể có ít bác sĩ hoặc khung giờ trống. Hãy xem xét các ngày thay thế:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {suggestedDates.slice(0, 5).map((date) => (
                                      <button
                                        key={date}
                                        type="button"
                                        onClick={() => {
                                          setAppointmentDate(date);
                                          setEmployeeCode('');
                                          setAppointmentStartTime('');
                                          setRoomCode('');
                                        }}
                                        className="px-3 py-1.5 text-xs border border-yellow-300 rounded-md bg-white hover:bg-yellow-100 transition-colors"
                                      >
                                        {format(new Date(date), 'dd/MM')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <Card className="p-8 bg-muted/50 border-dashed">
                      <div className="text-center text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chọn ngày để xem thông tin lịch trống</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Doctor & Services */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Doctor Selection */}
              <div>
                <Label>Chọn bác sĩ <span className="text-red-500">*</span></Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Chỉ hiển thị bác sĩ có lịch làm việc vào ngày {appointmentDate ? format(new Date(appointmentDate), 'dd/MM/yyyy') : ''}
                </p>
                {loadingShifts ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải danh sách bác sĩ...</span>
                  </div>
                ) : (
                  <>
                    {/* Doctor Selection */}
                    {!employeeCode ? (
                      /* No doctor selected - show dropdown */
                      <Select
                        value={employeeCode}
                        onValueChange={(value) => {
                          setEmployeeCode(value);
                          setServiceCodes([]);
                          setServiceSearchTerm('');
                          setServiceGroupFilter('all');
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn bác sĩ" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const doctorsWithShifts = getDoctorsWithShiftsForDate(appointmentDate);
                            if (doctorsWithShifts.length === 0) {
                              return (
                                <SelectItem value="no-doctors" disabled>
                                  Không có bác sĩ nào có lịch làm việc vào ngày này
                                </SelectItem>
                              );
                            }
                            return doctorsWithShifts.map((doctor) => {
                              const shifts = getShiftsForDoctorAndDate(doctor.employeeCode, appointmentDate);
                              const shiftTimes = shifts.map(s => `${s.workShift?.startTime?.slice(0, 5)} - ${s.workShift?.endTime?.slice(0, 5)}`).join(', ');
                              return (
                                <SelectItem key={doctor.employeeId} value={doctor.employeeCode}>
                                  {doctor.fullName} ({doctor.employeeCode}) - {shiftTimes}
                                </SelectItem>
                              );
                            });
                          })()}
                        </SelectContent>
                      </Select>
                    ) : (
                      /* Doctor selected - show compact card with change button */
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary rounded-xl">
                          <div className="p-1.5 rounded-full bg-primary text-white flex-shrink-0">
                            <UserCog className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{selectedEmployee?.fullName}</span>
                              <span className="text-xs text-muted-foreground">({selectedEmployee?.employeeCode})</span>
                            </div>
                            {selectedEmployee?.specializations && selectedEmployee.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedEmployee.specializations.slice(0, 3).map((s: any) => (
                                  <Badge key={s.specializationId} variant="secondary" className="text-xs py-0">
                                    {s.specializationName || s.name}
                                  </Badge>
                                ))}
                                {selectedEmployee.specializations.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{selectedEmployee.specializations.length - 3}</span>
                                )}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Ca làm: {getShiftsForDoctorAndDate(employeeCode, appointmentDate).map(s =>
                                `${s.workShift?.startTime?.slice(0, 5)} - ${s.workShift?.endTime?.slice(0, 5)}`
                              ).join(', ')}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                            setEmployeeCode('');
                            setServiceCodes([]);
                            setServiceSearchTerm('');
                            setServiceGroupFilter('all');
                          }}
                          className="text-xs flex-shrink-0"
                        >
                          Đổi bác sĩ
                        </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Services Section - Only show when doctor is selected */}
              {employeeCode && (
                <div>
                  <Label>Chọn dịch vụ (ít nhất 1) <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Chỉ hiển thị dịch vụ phù hợp với chuyên khoa của bác sĩ đã chọn
                  </p>

                  {/* Search + Filter Bar */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm dịch vụ..."
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={serviceGroupFilter} onValueChange={setServiceGroupFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Tất cả chuyên khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                        {selectedEmployee?.specializations?.map((spec: any) => (
                          <SelectItem key={spec.specializationId} value={String(spec.specializationId)}>
                            {spec.specializationName || spec.name || 'Chuyên khoa'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(serviceSearchTerm || serviceGroupFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setServiceSearchTerm('');
                          setServiceGroupFilter('all');
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Xóa filter
                      </Button>
                    )}
                  </div>

                  {/* Services List - NO SCROLL */}
                  <Card className="p-4">
                    {loadingData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Đang tải dịch vụ...</span>
                      </div>
                    ) : (() => {
                      const filteredServices = getFilteredServices();
                      if (filteredServices.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                              {serviceSearchTerm || serviceGroupFilter !== 'all'
                                ? 'Không tìm thấy dịch vụ phù hợp với bộ lọc.'
                                : 'Không có dịch vụ nào phù hợp với chuyên khoa của bác sĩ.'}
                            </p>
                          </div>
                        );
                      }

                      // Group filtered services by specialization for display
                      const groupedServices = new Map<string | number, { specialization?: Specialization; services: Service[] }>();
                      filteredServices.forEach((service) => {
                        const specId = service.specializationId || 'none';
                        if (!groupedServices.has(specId)) {
                          const specialization = specId !== 'none'
                            ? specializations.find(s =>
                              String(s.specializationId) === String(specId) ||
                              (s.specializationId as any) === specId
                            )
                            : undefined;
                          groupedServices.set(specId, { specialization, services: [] });
                        }
                        groupedServices.get(specId)!.services.push(service);
                      });

                      return (
                        <div className="space-y-4">
                          {Array.from(groupedServices.entries()).map(([key, group]) => (
                            <div key={key} className="space-y-2">
                              {/* Group Header */}
                              <div className="flex items-center gap-2 pb-2 border-b">
                                <h4 className="font-semibold text-sm text-primary">
                                  {group.specialization?.specializationName || 'Chưa phân loại chuyên khoa'}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {group.services.length} dịch vụ
                                </Badge>
                              </div>

                              {/* Table Layout */}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12 px-6 py-3">
                                      <Checkbox
                                        checked={group.services.every((s) => serviceCodes.includes(s.serviceCode))}
                                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            group.services.forEach((service) => {
                                              if (!serviceCodes.includes(service.serviceCode)) {
                                                handleToggleService(service.serviceCode);
                                              }
                                            });
                                          } else {
                                            group.services.forEach((service) => {
                                              if (serviceCodes.includes(service.serviceCode)) {
                                                handleToggleService(service.serviceCode);
                                              }
                                            });
                                          }
                                        }}
                                      />
                                    </TableHead>
                                    <TableHead className="px-6 py-3">Tên dịch vụ</TableHead>
                                    <TableHead className="px-6 py-3">Mã dịch vụ</TableHead>
                                    <TableHead className="px-6 py-3 text-right">Thời gian</TableHead>
                                    <TableHead className="px-6 py-3 text-right">Giá</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.services.map((service) => {
                                    const isSelected = serviceCodes.includes(service.serviceCode);
                                    return (
                                      <TableRow
                                        key={service.serviceId}
                                        className={`cursor-pointer ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                                        onClick={() => handleToggleService(service.serviceCode)}
                                      >
                                        <TableCell className="px-6 py-4">
                                          <Checkbox
                                            checked={isSelected}
                                            className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            onCheckedChange={() => handleToggleService(service.serviceCode)}
                                          />
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-medium">
                                          {service.serviceName}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground">
                                          {service.serviceCode}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                          {service.defaultDurationMinutes} phút
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right font-medium">
                                          {service.price?.toLocaleString('vi-VN')} VND
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </Card>

                  {/* Selected Services Summary */}
                  {serviceCodes.length > 0 && (
                    <Card className="p-3 mt-3 bg-primary/5 border-primary">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Đã chọn {serviceCodes.length} dịch vụ</span>
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          Tổng: {selectedServices.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString('vi-VN')} VND
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )
              }
            </div >
          )
          }

          {/* Step 4: Time Slots + Room + Participants (Doctor already selected in Step 3) */}
          {/* Phase 5: Show step 4 if either serviceCodes OR planItemIds are present */}
          {
            currentStep === 4 && appointmentDate && (serviceCodes.length > 0 || planItemIds.length > 0) && (
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column: Selected Doctor Info (read-only) & Time Slots */}
                <div className="space-y-4">
                  {/* Selected Doctor Info - Read Only */}
                  {selectedEmployee && (
                    <div>
                      <Label>Bác sĩ đã chọn</Label>
                      <Card className="p-4 mt-1 bg-primary/5 border-primary">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary text-white">
                            <UserCog className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{selectedEmployee.fullName}</div>
                            <div className="text-sm text-muted-foreground">{selectedEmployee.employeeCode}</div>
                            {selectedEmployee.specializations && selectedEmployee.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedEmployee.specializations.map((spec: any) => (
                                  <Badge key={spec.specializationId} variant="outline" className="text-xs">
                                    {spec.specializationName}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Available Time Slots (grouped by morning/afternoon/evening) */}
                  {employeeCode && (
                    <div>
                      <Label>Chọn khung giờ <span className="text-red-500">*</span></Label>
                      {loadingAvailableSlots ? (
                        <Card className="p-4 mt-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang tải khung giờ...</span>
                          </div>
                        </Card>
                      ) : availableSlots.length > 0 ? (
                        <div className="space-y-3 mt-1">
                          {/* Morning Slots */}
                          {groupedSlots.morning.length > 0 && (
                            <Card className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Sun className="h-4 w-4 text-yellow-600" />
                                <h4 className="font-semibold text-xs">Sáng (6:00 - 12:00)</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {groupedSlots.morning.map((slot) => {
                                  const slotTime = slot.startTime.includes('T')
                                    ? slot.startTime.split('T')[1]?.slice(0, 5) || ''
                                    : '';
                                  const isSelected = slot.startTime === appointmentStartTime;
                                  const isDoctorAvailable = employeeCode ? isDoctorAvailableInSlot(employeeCode, slot.startTime) : true;
                                  const areParticipantsAvailable = participantCodes.length > 0
                                    ? participantCodes.every((code) => isParticipantAvailableInSlot(code, slot.startTime))
                                    : true;
                                  const isAvailable = isDoctorAvailable && areParticipantsAvailable;

                                  return (
                                    <button
                                      key={slot.startTime}
                                      type="button"
                                      onClick={() => handleSelectTimeSlot(slot)}
                                      disabled={!isAvailable}
                                      className={`p-2 text-xs rounded border transition-colors relative ${!isAvailable
                                        ? 'bg-muted/30 opacity-50 cursor-not-allowed border-muted'
                                        : isSelected
                                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                          : 'bg-background hover:bg-primary/10 border-border'
                                        }`}
                                      title={!isAvailable ? 'Bác sĩ hoặc người tham gia không có lịch trong khung giờ này' : ''}
                                    >
                                      {slotTime}
                                      {!isAvailable && (
                                        <AlertCircle className="h-3 w-3 text-red-500 absolute top-0 right-0" />
                                      )}
                                    </button>
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
                              <div className="grid grid-cols-3 gap-1.5">
                                {groupedSlots.afternoon.map((slot) => {
                                  const slotTime = slot.startTime.includes('T')
                                    ? slot.startTime.split('T')[1]?.slice(0, 5) || ''
                                    : '';
                                  const isSelected = slot.startTime === appointmentStartTime;
                                  const isDoctorAvailable = employeeCode ? isDoctorAvailableInSlot(employeeCode, slot.startTime) : true;
                                  const areParticipantsAvailable = participantCodes.length > 0
                                    ? participantCodes.every((code) => isParticipantAvailableInSlot(code, slot.startTime))
                                    : true;
                                  const isAvailable = isDoctorAvailable && areParticipantsAvailable;

                                  return (
                                    <button
                                      key={slot.startTime}
                                      type="button"
                                      onClick={() => handleSelectTimeSlot(slot)}
                                      disabled={!isAvailable}
                                      className={`p-2 text-xs rounded border transition-colors relative ${!isAvailable
                                        ? 'bg-muted/30 opacity-50 cursor-not-allowed border-muted'
                                        : isSelected
                                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                          : 'bg-background hover:bg-primary/10 border-border'
                                        }`}
                                      title={!isAvailable ? 'Bác sĩ hoặc người tham gia không có lịch trong khung giờ này' : ''}
                                    >
                                      {slotTime}
                                      {!isAvailable && (
                                        <AlertCircle className="h-3 w-3 text-red-500 absolute top-0 right-0" />
                                      )}
                                    </button>
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
                                <h4 className="font-semibold text-xs">Tối (18:00 - 22:00)</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {groupedSlots.evening.map((slot) => {
                                  const slotTime = slot.startTime.includes('T')
                                    ? slot.startTime.split('T')[1]?.slice(0, 5) || ''
                                    : '';
                                  const isSelected = slot.startTime === appointmentStartTime;
                                  const isDoctorAvailable = employeeCode ? isDoctorAvailableInSlot(employeeCode, slot.startTime) : true;
                                  const areParticipantsAvailable = participantCodes.length > 0
                                    ? participantCodes.every((code) => isParticipantAvailableInSlot(code, slot.startTime))
                                    : true;
                                  const isAvailable = isDoctorAvailable && areParticipantsAvailable;

                                  return (
                                    <button
                                      key={slot.startTime}
                                      type="button"
                                      onClick={() => handleSelectTimeSlot(slot)}
                                      disabled={!isAvailable}
                                      className={`p-2 text-xs rounded border transition-colors relative ${!isAvailable
                                        ? 'bg-muted/30 opacity-50 cursor-not-allowed border-muted'
                                        : isSelected
                                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                          : 'bg-background hover:bg-primary/10 border-border'
                                        }`}
                                      title={!isAvailable ? 'Bác sĩ hoặc người tham gia không có lịch trong khung giờ này' : ''}
                                    >
                                      {slotTime}
                                      {!isAvailable && (
                                        <AlertCircle className="h-3 w-3 text-red-500 absolute top-0 right-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <Card className="p-4 mt-1 bg-red-50 border-red-200">
                          <div className="space-y-3">
                            {/* Main error title */}
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-red-700">
                                  Không tìm thấy khung giờ khả dụng
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                  Không có lịch trống cho bác sĩ này vào ngày {appointmentDate}
                                </p>
                              </div>
                            </div>

                            {/* Friendly suggestions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-blue-800 mb-2">
                                Gợi ý giải pháp:
                              </p>
                              <ul className="text-xs text-blue-700 space-y-1.5">
                                <li className="flex items-start gap-2">
                                  <span className="mt-0.5">•</span>
                                  <span>Thử chọn <strong>ngày khác</strong> (bác sĩ có thể chưa có lịch làm việc ngày này)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="mt-0.5">•</span>
                                  <span>Chọn <strong>bác sĩ khác</strong> cùng chuyên khoa</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="mt-0.5">•</span>
                                  <span>Liên hệ lễ tân để được tư vấn lịch hẹn phù hợp</span>
                                </li>
                              </ul>
                            </div>

                            {/* Technical details - collapsible for advanced users */}
                            {loadSlotsError && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                                  Chi tiết kỹ thuật (dành cho quản trị viên)
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <div className="bg-gray-50 border border-gray-200 p-2 rounded">
                                    <span className="font-semibold text-gray-700">Thông báo từ hệ thống:</span>
                                    <p className="text-gray-600 mt-1">{loadSlotsError}</p>
                                  </div>
                                  <div className="bg-amber-50 border border-amber-200 p-2 rounded">
                                    <p className="text-amber-800">
                                      ⚙ <strong>Yêu cầu cấu hình:</strong> Admin cần cấu hình ánh xạ phòng-dịch vụ tại trang quản lý phòng
                                    </p>
                                  </div>
                                </div>
                              </details>
                            )}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Room Selection */}
                  {appointmentStartTime && (
                    <div>
                      <Label htmlFor="roomCode">Chọn phòng <span className="text-red-500">*</span></Label>
                      <Select value={roomCode} onValueChange={setRoomCode}>
                        <SelectTrigger id="roomCode" className="mt-1">
                          <SelectValue placeholder="Chọn phòng" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {(() => {
                            const compatibleRoomCodes = selectedSlot?.availableCompatibleRoomCodes || [];

                            // CRITICAL FIX: Only show compatible rooms, never show all rooms
                            if (compatibleRoomCodes.length === 0) {
                              return (
                                <SelectItem value="" disabled>
                                  Không có phòng phù hợp cho khung giờ này
                                </SelectItem>
                              );
                            }

                            return rooms
                              .filter((room) => {
                                if (!room.isActive) return false;
                                // MUST be in compatible room list
                                return compatibleRoomCodes.includes(room.roomCode);
                              })
                              .map((room) => (
                                <SelectItem key={room.roomId} value={room.roomCode}>
                                  {room.roomCode} - {room.roomName}
                                </SelectItem>
                              ));
                          })()}
                        </SelectContent>
                      </Select>
                      {selectedSlot && selectedSlot.availableCompatibleRoomCodes.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Chỉ hiển thị các phòng phù hợp cho khung giờ đã chọn
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Participants */}
                <div className="space-y-4">
                  {/* Participants Selection */}
                  <div>
                    <Label>Chọn người tham gia (Tùy chọn)</Label>
                    <Card className="p-4 mt-1 max-h-[50vh] overflow-y-auto mt-2">
                      {(() => {
                        const eligibleParticipants = employees.filter((e) => {
                          if (e.employeeCode === employeeCode) return false;

                          const hasStandardSpecialization = e.specializations?.some(
                            (spec) =>
                              String(spec.specializationId) === '8' ||
                              spec.specializationId === '8'
                          );

                          if (!hasStandardSpecialization) return false;

                          // Only show participants with shifts on the selected date
                          if (appointmentDate) {
                            const shiftsForDate = getParticipantShiftsForDate(e.employeeCode, appointmentDate);
                            return shiftsForDate.length > 0;
                          }

                          return true;
                        });

                        if (eligibleParticipants.length === 0) {
                          return (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              {appointmentDate
                                ? 'Không tìm thấy người tham gia phù hợp có lịch làm việc vào ngày đã chọn.'
                                : 'Không tìm thấy người tham gia phù hợp.'}
                            </div>
                          );
                        }

                        return eligibleParticipants.map((employee) => (
                          <div key={employee.employeeId} className="flex items-center space-x-2 py-2 border-b last:border-0">
                            <Checkbox
                              id={`participant-${employee.employeeId}`}
                              checked={participantCodes.includes(employee.employeeCode)}
                              className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              onCheckedChange={() => handleToggleParticipant(employee.employeeCode)}
                            />
                            <Label
                              htmlFor={`participant-${employee.employeeId}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              <div className="font-medium">{employee.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {employee.employeeCode} • <Badge variant="outline" className="text-xs">
                                  {getRoleLabel(employee.roleName)}
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        ));
                      })()}
                    </Card>
                  </div>

                  {/* Participant Shifts Availability */}
                  {participantCodes.length > 0 && appointmentDate && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCog className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">Lịch làm việc người tham gia</h4>
                      </div>
                      {loadingParticipantShifts ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Đang tải lịch...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {participantCodes.map((participantCode) => {
                            const participant = employees.find((e) => e.employeeCode === participantCode);
                            const shiftsForDate = getParticipantShiftsForDate(participantCode, appointmentDate);

                            return (
                              <div key={participantCode} className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {participant?.fullName} ({participantCode})
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {getRoleLabel(participant?.roleName || '')}
                                </div>
                                {shiftsForDate.length > 0 ? (
                                  <div className="space-y-1">
                                    {shiftsForDate.map((shift) => (
                                      <div
                                        key={shift.employeeShiftId}
                                        className="flex items-center gap-2 text-xs bg-background p-2 rounded border"
                                      >
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium">
                                          {shift.workShift?.shiftName || 'Ca làm'}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {shift.workShift?.startTime} - {shift.workShift?.endTime}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-red-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>
                                      Không có ca làm việc vào ngày này
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            )
          }

          {/* Step 5: Review & Confirm */}
          {
            currentStep === 5 && (
              <div className="space-y-4">
                {/* Summary - On Top */}
                <Card className="p-4 bg-primary/5 border-primary">
                  <h3 className="font-bold text-lg mb-4 text-primary">Xác nhận thông tin lịch hẹn</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Bệnh nhân:</span>
                        <span className="font-semibold">{selectedPatient?.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Ngày:</span>
                        <span className="font-semibold">
                          {appointmentDate && format(new Date(appointmentDate), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Giờ:</span>
                        <span className="font-semibold">
                          {appointmentStartTime && format(new Date(appointmentStartTime), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Bác sĩ:</span>
                        <span className="font-semibold">{selectedEmployee?.fullName}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm text-muted-foreground mt-0.5">Phòng:</span>
                        <span className="font-semibold">
                          {rooms.find((r) => r.roomCode === roomCode)?.roomName || roomCode}
                        </span>
                      </div>
                      {participantCodes.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-muted-foreground mt-0.5">Người tham gia:</span>
                          <span className="font-semibold">
                            {participantCodes.map((code) => {
                              const participant = employees.find((e) => e.employeeCode === code);
                              return participant ? participant.fullName : code;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">Dịch vụ:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map((s) => (
                        <Badge key={s.serviceId} variant="secondary" className="text-sm">
                          {s.serviceName}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm text-muted-foreground">Tổng tiền: </span>
                      <span className="font-bold text-lg text-primary">
                        {selectedServices.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Notes - At Bottom */}
                <div>
                  <Label htmlFor="notes">Ghi chú (Tùy chọn)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thêm ghi chú bổ sung..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )
          }
        </div >

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          )}
          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={loading}>
              Tiếp theo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tạo lịch hẹn
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent >
    </Dialog >
  );
} function getStepTitle(step: Step): string {
  switch (step) {
    case 1:
      return 'Chọn bệnh nhân';
    case 2:
      return 'Chọn ngày';
    case 3:
      return 'Chọn bác sĩ & dịch vụ';
    case 4:
      return 'Chọn thời gian';
    case 5:
      return 'Xác nhận';
    default:
      return '';
  }
}


