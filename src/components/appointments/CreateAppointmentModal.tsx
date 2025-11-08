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
import { appointmentService } from '@/services/appointmentService';
import { ServiceService } from '@/services/serviceService';
import { EmployeeService } from '@/services/employeeService';
import { patientService } from '@/services/patientService';
import { RoomService } from '@/services/roomService';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { specializationService } from '@/services/specializationService';
import { EmployeeShift, ShiftStatus } from '@/types/employeeShift';
import {
  CreateAppointmentRequest,
  AvailableTimesRequest,
  AvailableTimesResponse,
  TimeSlot,
} from '@/types/appointment';
import { Service } from '@/types/service';
import { Employee } from '@/types/employee';
import { Patient } from '@/types/patient';
import { Room } from '@/types/room';
import { Specialization } from '@/types/specialization';
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
        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
          disabled
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
                    className={`px-2 py-1.5 text-sm text-center cursor-pointer transition-all ${
                      h === hour
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
                    className={`px-2 py-1.5 text-sm text-center cursor-pointer transition-all ${
                      m === minute
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
}: CreateAppointmentModalProps) {
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

  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);

  // Search states
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);
  
  // Employee shifts for selected date
  const [allEmployeeShifts, setAllEmployeeShifts] = useState<Map<string, EmployeeShift[]>>(new Map());
  const [loadingShifts, setLoadingShifts] = useState(false);
  
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

  // Load initial data
  useEffect(() => {
    if (open) {
      loadInitialData();
      loadPatientsList();
      resetForm();
    }
  }, [open]);

  // Search patients with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (patientSearch.length >= 2) {
        searchPatients();
      } else {
        setPatientSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch]);

  // Step 2: Load all doctor shifts when entering Step 2 (load immediately, no need to wait for services)
  useEffect(() => {
    if (currentStep === 2 && employees.length > 0) {
      loadAllDoctorShiftsForStep2();
    }
  }, [currentStep, employees]);

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

  // Step 4: Load shifts for all eligible participants when date is selected (for filtering)
  useEffect(() => {
    if (currentStep === 4 && appointmentDate) {
      loadAllParticipantShifts();
    }
  }, [currentStep, appointmentDate, employees, employeeCode]);


  // Step 4: Load employee shifts for all doctors when date and services are selected
  useEffect(() => {
    if (currentStep === 4 && appointmentDate && serviceCodes.length > 0) {
      loadAllDoctorShifts();
    }
  }, [currentStep, appointmentDate, serviceCodes, employees]);

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
    setSelectedMonth(startOfMonth(new Date()));
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
      setServices(servicesResponse.content);

      // Load specializations
      const specializationsData = await specializationService.getAll();
      setSpecializations(specializationsData);

      // Load employees (all active employees - will filter by ROLE_DENTIST in Step 4)
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 100,
        isActive: true,
      });
      setEmployees(employeesResponse.content);

      // Load rooms (active only)
      const roomsData = await RoomService.getActiveRooms();
      setRooms(roomsData);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingData(false);
    }
  };

  // Load patients list (default list without search)
  const loadPatientsList = async () => {
    try {
      const results = await patientService.getPatients({
        page: 0,
        size: 50,
        isActive: true,
      });
      setPatientSearchResults(results.content);
    } catch (error: any) {
      console.error('Failed to load patients list:', error);
    }
  };

  const searchPatients = async () => {
    if (patientSearch.length < 2) return;

    setSearchingPatients(true);
    try {
      const results = await patientService.getPatients({
        page: 0,
        size: 20,
        search: patientSearch,
        isActive: true,
      });
      setPatientSearchResults(results.content);
    } catch (error: any) {
      console.error('Failed to search patients:', error);
      toast.error('Failed to search patients');
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setPatientCode(patient.patientCode);
    setSelectedPatientData(patient);
    setPatientSearch(patient.fullName);
    setPatientSearchResults([]);
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

      const shiftsMap = new Map<string, EmployeeShift[]>();

      // Load shifts for each doctor in parallel (from today to 3 months)
      await Promise.all(
        allDoctors.map(async (doctor) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(today);
          endDate.setMonth(endDate.getMonth() + 3);
          
          // Use format from date-fns to get local date string (YYYY-MM-DD)
          // This avoids timezone issues with toISOString()
          const startDateStr = format(today, 'yyyy-MM-dd');
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

  // Step 4: Load shifts for all compatible doctors (filtered by services)
  const loadAllDoctorShifts = async () => {
    if (!appointmentDate || serviceCodes.length === 0) return;

    setLoadingShifts(true);
    try {
      const compatibleDoctors = getCompatibleDoctors();
      const shiftsMap = new Map<string, EmployeeShift[]>();

      // Load shifts for each doctor in parallel
      await Promise.all(
        compatibleDoctors.map(async (doctor) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(today);
          endDate.setMonth(endDate.getMonth() + 3);
          
          // Use format from date-fns to get local date string (YYYY-MM-DD)
          // This avoids timezone issues with toISOString()
          const startDateStr = format(today, 'yyyy-MM-dd');
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
    return allDoctors.some((doctor) => {
      const shifts = getShiftsForDoctorAndDate(doctor.employeeCode, dateString);
      return shifts.length > 0;
    });
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
      return;
    }

    setLoadingAvailableSlots(true);
    try {
      const request: AvailableTimesRequest = {
        date: appointmentDate,
        employeeCode,
        serviceCodes,
        participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
      };

      const response = await appointmentService.findAvailableTimes(request);
      setAvailableSlots(response.availableSlots || []);
      
      // Auto-select first available slot if no time selected yet
      if (!appointmentStartTime && response.availableSlots.length > 0) {
        const firstSlot = response.availableSlots[0];
        setAppointmentStartTime(firstSlot.startTime);
        if (firstSlot.availableCompatibleRoomCodes.length > 0) {
          setRoomCode(firstSlot.availableCompatibleRoomCodes[0]);
        }
      }
    } catch (error: any) {
      console.error('Failed to load available slots:', error);
      toast.error('Failed to load available slots: ' + (error.response?.data?.message || error.message));
      setAvailableSlots([]);
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
      
      await Promise.all(
        eligibleParticipants.map(async (participant) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(today);
          endDate.setMonth(endDate.getMonth() + 3);
          
          // Use format from date-fns to get local date string (YYYY-MM-DD)
          // This avoids timezone issues with toISOString()
          const startDateStr = format(today, 'yyyy-MM-dd');
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

  // Step 3: Get services grouped by specialization
  const getServicesGroupedBySpecialization = useMemo(() => {
    const grouped = new Map<string | number, Service[]>();
    
    services.forEach((service) => {
      const specId = service.specializationId || 'none';
      if (!grouped.has(specId)) {
        grouped.set(specId, []);
      }
      grouped.get(specId)!.push(service);
    });

    return grouped;
  }, [services]);

  // Step 3: Get filtered services based on selected specialization filter
  const getFilteredServices = (): Service[] => {
    if (selectedSpecializationFilter === 'all') {
      return services;
    }
    
    const specId = parseInt(selectedSpecializationFilter, 10);
    return services.filter((service) => 
      service.specializationId === specId || (!service.specializationId && selectedSpecializationFilter === 'none')
    );
  };

  // Step 4: Get compatible doctors (ROLE_DENTIST + specialization match)
  const getCompatibleDoctors = (): Employee[] => {
    if (serviceCodes.length === 0) return [];

    // Get required specialization IDs from selected services
    const requiredSpecializationIds = new Set<number>();
    serviceCodes.forEach((code) => {
      const service = services.find((s) => s.serviceCode === code);
      if (service?.specializationId) {
        requiredSpecializationIds.add(service.specializationId);
      }
    });

    return employees.filter((employee) => {
      // Must be ROLE_DENTIST or ROLE_DOCTOR
      if (!employee.roleName.includes('DENTIST') && !employee.roleName.includes('DOCTOR')) {
        return false;
      }

      // Must have specializations
      if (!employee.specializations || employee.specializations.length === 0) {
        return false;
      }

      // If services require specialization, doctor must have at least one matching
      if (requiredSpecializationIds.size > 0) {
        const employeeSpecializationIds = employee.specializations.map((spec) => 
          parseInt(String(spec.specializationId), 10)
        );
        return Array.from(requiredSpecializationIds).some((reqId) =>
          employeeSpecializationIds.includes(reqId)
        );
      }

      return true;
    });
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
    if (slot.availableCompatibleRoomCodes.length > 0) {
      setRoomCode(slot.availableCompatibleRoomCodes[0]);
    }
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !patientCode) {
      toast.error('Please select a patient');
      return;
    }
    if (currentStep === 2 && !appointmentDate) {
      toast.error('Please select a date');
      return;
    }
    if (currentStep === 3) {
      if (serviceCodes.length === 0) {
        toast.error('Please select at least one service');
        return;
      }
    }
    if (currentStep === 4) {
      if (!employeeCode) {
        toast.error('Please select a doctor');
        return;
      }
      if (!appointmentStartTime) {
        toast.error('Please select a start time');
        return;
      }
      // Validate time is in 15-minute intervals
      const timeMatch = appointmentStartTime.match(/T(\d{2}):(\d{2}):/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[2], 10);
        if (minutes % 15 !== 0) {
          toast.error('Time must be in 15-minute intervals (e.g., 8:00, 8:15, 8:30, 8:45)');
          return;
        }
      }
      if (!roomCode) {
        toast.error('Please select a room');
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
    if (!patientCode || !employeeCode || !roomCode || serviceCodes.length === 0 || !appointmentStartTime) {
      toast.error('Please complete all required fields');
      return;
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

      const request: CreateAppointmentRequest = {
        patientCode,
        employeeCode,
        roomCode,
        serviceCodes,
        appointmentStartTime: formattedStartTime,
        participantCodes: participantCodes.length > 0 ? participantCodes : undefined,
        notes: notes.trim() || undefined,
      };

      await appointmentService.createAppointment(request);

      toast.success('Appointment created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create appointment:', error);
      toast.error('Failed to create appointment: ' + (error.response?.data?.message || error.message));
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 5: {getStepTitle(currentStep)}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step === currentStep
                          ? 'bg-primary text-primary-foreground scale-110'
                          : step < currentStep
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                    </div>
                    <div className={`text-xs mt-1 text-center max-w-[80px] ${
                      step === currentStep ? 'font-semibold text-primary' : 'text-muted-foreground'
                    }`}>
                      {getStepTitle(step as Step)}
                    </div>
                  </div>
                  {/* Hide connecting line between step 1 and 2, show for other steps */}
                  {step < 5 && step !== 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 mt-[-20px] ${
                        step < currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Select Patient */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="patientSearch">Search Patient</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patientSearch"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by name, phone, or code..."
                    className="pl-10"
                  />
                </div>
                {searchingPatients && (
                  <p className="text-sm text-muted-foreground mt-1">Searching...</p>
                )}
              </div>

              {/* Always show patients list */}
              <Card className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {patientSearchResults.length > 0 ? (
                    patientSearchResults.map((patient) => (
                      <div
                        key={patient.patientId}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          patientCode === patient.patientCode
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="font-medium">{patient.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {patient.patientCode} {patient.phone && `• ${patient.phone}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No patients found
                    </p>
                  )}
                </div>
              </Card>

              {selectedPatient && (
                <Card className="p-4 bg-primary/5 border-primary">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{selectedPatient.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedPatient.patientCode}
                      </div>
                    </div>
                  </div>
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
                    <Label htmlFor="appointmentDate">Select Preferred Date <span className="text-red-500">*</span></Label>
                    <Input
                      id="appointmentDate"
                      type="date"
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
                      Select the date you prefer for the appointment
                    </p>
                  </div>

                  {/* Calendar Grid View - Month View with Navigation */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="block">Calendar View</Label>
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
                        <span className="text-sm text-muted-foreground">Loading availability...</span>
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
                              
                              // Check if this date has any doctors with shifts (for Step 2 - all doctors)
                              const hasDoctors = hasDoctorsWithShifts(dateStr);
                              
                              dates.push(
                                <button
                                  key={dateStr}
                                  type="button"
                                  onClick={() => {
                                    if (!isPast && isCurrentMonth) {
                                      setAppointmentDate(dateStr);
                                      setEmployeeCode('');
                                      setAppointmentStartTime('');
                                      setRoomCode('');
                                    }
                                  }}
                                  disabled={isPast || !isCurrentMonth}
                                  className={`p-2 rounded text-center transition-all ${
                                    !isCurrentMonth
                                      ? 'bg-muted/20 opacity-30 cursor-not-allowed'
                                      : isPast
                                      ? 'bg-muted/30 opacity-50 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-primary text-primary-foreground font-semibold scale-105'
                                      : hasDoctors
                                      ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                      : 'bg-muted/50 hover:bg-muted border border-border'
                                  } ${isToday && !isPast && isCurrentMonth ? 'ring-2 ring-primary/30' : ''}`}
                                >
                                  <div className="text-xs font-medium">{currentDate.getDate()}</div>
                                  {hasDoctors && !isPast && isCurrentMonth && (
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
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-muted/50 border border-border"></div>
                            <span>No availability</span>
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
                            <span>Checking availability...</span>
                          </div>
                        </Card>
                      ) : (
                        <>
                          {/* Availability Summary - Always show, even without services */}
                          <Card className="p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-sm">Availability Summary</h4>
                            </div>
                            {loadingShifts ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading...</span>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Total Doctors:</span>
                                  <span className="font-semibold">{getAllDoctors().length}</span>
                                </div>
                                {appointmentDate ? (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Doctors with Shifts:</span>
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
                                            <span className="text-muted-foreground">Compatible Doctors:</span>
                                            <span className="font-semibold">{getCompatibleDoctors().length}</span>
                                          </div>
                                        </div>
                                        {selectedServices.length > 0 && (
                                          <div className="pt-2 border-t">
                                            <div className="text-xs text-muted-foreground mb-1">Selected Services:</div>
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
                                    Select a date to see availability for that date
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
                                  Doctors Available on {format(new Date(appointmentDate), 'MMM dd, yyyy')}
                                </h4>
                              </div>
                              {loadingShifts ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                  {(() => {
                                    const doctorsWithShifts = getDoctorsWithShiftsForDate(appointmentDate);
                                    if (doctorsWithShifts.length === 0) {
                                      return (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                          No doctors available on this date
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
                                                  {shift.workShift?.shiftName || 'Shift'}: {shift.workShift?.startTime} - {shift.workShift?.endTime}
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
                                    Limited availability on selected date
                                  </h4>
                                  <p className="text-xs text-yellow-700 mb-3">
                                    The selected date may have limited doctors or time slots. Consider these alternative dates:
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
                                        {format(new Date(date), 'MMM dd')}
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
                        <p className="text-sm">Select a date to see availability information</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Select Services (grouped by specialization) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Filter by Specialization</Label>
                <Select
                  value={selectedSpecializationFilter}
                  onValueChange={setSelectedSpecializationFilter}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    <SelectItem value="none">No Specialization</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec.specializationId} value={String(spec.specializationId)}>
                        {spec.specializationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Services (at least 1) <span className="text-red-500">*</span></Label>
                <Card className="p-4 mt-1 max-h-60 overflow-y-auto">
                  {loadingData ? (
                    <p className="text-sm text-muted-foreground">Loading services...</p>
                  ) : getFilteredServices().length === 0 ? (
                    <Card className="p-4 bg-red-50 border-red-200">
                      <p className="text-sm text-red-800">No services found for the selected filter.</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredServices().map((service) => {
                        const isSelected = serviceCodes.includes(service.serviceCode);
                        return (
                          <div key={service.serviceId} className="flex items-center space-x-2">
                            <Checkbox
                              id={`service-${service.serviceId}`}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleService(service.serviceCode)}
                            />
                            <Label
                              htmlFor={`service-${service.serviceId}`}
                              className={`text-sm font-normal cursor-pointer flex-1 ${
                                isSelected ? 'font-semibold' : ''
                              }`}
                            >
                              {service.serviceName} ({service.serviceCode})
                              <span className="text-muted-foreground ml-2">
                                • {service.defaultDurationMinutes} min • {service.price?.toLocaleString()} VND
                              </span>
                              {service.specializationName && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {service.specializationName}
                                </Badge>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedServices.map((service) => (
                    <Badge key={service.serviceId} variant="secondary">
                      {service.serviceName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Doctor + Time Slots (grouped by morning/afternoon/evening) + Participants */}
          {currentStep === 4 && appointmentDate && serviceCodes.length > 0 && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column: Doctor Selection & Time Slots */}
              <div className="space-y-4">
                {/* Doctor Selection */}
                <div>
                  <Label htmlFor="employeeCode">Select Doctor <span className="text-red-500">*</span></Label>
                  <Select
                    value={employeeCode}
                    onValueChange={(value) => {
                      setEmployeeCode(value);
                      setAppointmentStartTime('');
                      setRoomCode('');
                    }}
                    disabled={loadingData || loadingShifts}
                  >
                    <SelectTrigger id="employeeCode" className="mt-1">
                      <SelectValue placeholder={loadingData || loadingShifts ? 'Loading...' : 'Select a doctor'} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCompatibleDoctors()
                        .filter((employee) => {
                          // Only show doctors with shifts on the selected date
                          const shiftsForDate = getShiftsForDoctorAndDate(employee.employeeCode, appointmentDate);
                          return shiftsForDate.length > 0;
                        })
                        .map((employee) => {
                          return (
                            <SelectItem 
                              key={employee.employeeId} 
                              value={employee.employeeCode}
                            >
                              {employee.fullName} ({employee.employeeCode})
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only doctors with matching specializations and shifts on the selected date are shown.
                  </p>
                </div>

                {selectedEmployee && (
                  <Card className="p-4 bg-primary/5 border-primary">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{selectedEmployee.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedEmployee.employeeCode}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Available Time Slots (grouped by morning/afternoon/evening) */}
                {employeeCode && (
                  <div>
                    <Label>Select Time Slot <span className="text-red-500">*</span></Label>
                    {loadingAvailableSlots ? (
                      <Card className="p-4 mt-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading available slots...</span>
                        </div>
                      </Card>
                    ) : availableSlots.length > 0 ? (
                      <div className="space-y-3 mt-1">
                        {/* Morning Slots */}
                        {groupedSlots.morning.length > 0 && (
                          <Card className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sun className="h-4 w-4 text-yellow-600" />
                              <h4 className="font-semibold text-xs">Morning (6:00 - 12:00)</h4>
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
                                    className={`p-2 text-xs rounded border transition-colors relative ${
                                      !isAvailable
                                        ? 'bg-muted/30 opacity-50 cursor-not-allowed border-muted'
                                        : isSelected
                                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                        : 'bg-background hover:bg-primary/10 border-border'
                                    }`}
                                    title={!isAvailable ? 'Doctor or participant not available in this slot' : ''}
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
                              <h4 className="font-semibold text-xs">Afternoon (12:00 - 18:00)</h4>
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
                                    className={`p-2 text-xs rounded border transition-colors relative ${
                                      !isAvailable
                                        ? 'bg-muted/30 opacity-50 cursor-not-allowed border-muted'
                                        : isSelected
                                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                        : 'bg-background hover:bg-primary/10 border-border'
                                    }`}
                                    title={!isAvailable ? 'Doctor or participant not available in this slot' : ''}
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
                              <h4 className="font-semibold text-xs">Evening (18:00 - 22:00)</h4>
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
                                    className={`p-2 text-xs rounded border transition-colors relative ${
                                      !isAvailable
                                        ? 'bg-muted/30 opacity-50 cursor-not-allowed border-muted'
                                        : isSelected
                                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                        : 'bg-background hover:bg-primary/10 border-border'
                                    }`}
                                    title={!isAvailable ? 'Doctor or participant not available in this slot' : ''}
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
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>No available slots found for the selected date and services</span>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Room Selection */}
                {appointmentStartTime && (
                  <div>
                    <Label htmlFor="roomCode">Select Room <span className="text-red-500">*</span></Label>
                    <Select value={roomCode} onValueChange={setRoomCode}>
                      <SelectTrigger id="roomCode" className="mt-1">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const compatibleRoomCodes = selectedSlot?.availableCompatibleRoomCodes || [];
                          
                          return rooms
                            .filter((room) => {
                              if (!room.isActive) return false;
                              if (selectedSlot && compatibleRoomCodes.length > 0) {
                                return compatibleRoomCodes.includes(room.roomCode);
                              }
                              return true;
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
                        Only compatible rooms are shown for the selected time slot
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Participants */}
              <div className="space-y-4">
                {/* Participants Selection */}
                <div>
                  <Label>Select Participants (Optional)</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Only employees with STANDARD specialization (medical staff) can be selected as participants.
                  </p>
                  <Card className="p-4 mt-1 max-h-[50vh] overflow-y-auto">
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
                              ? 'No eligible participants with shifts found for the selected date. Only employees with STANDARD specialization (medical staff) who have shifts on this date can be selected.'
                              : 'No eligible participants found. Only employees with STANDARD specialization (medical staff) can be selected.'}
                          </div>
                        );
                      }

                      return eligibleParticipants.map((employee) => (
                        <div key={employee.employeeId} className="flex items-center space-x-2 py-2 border-b last:border-0">
                          <Checkbox
                            id={`participant-${employee.employeeId}`}
                            checked={participantCodes.includes(employee.employeeCode)}
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
                      <h4 className="font-semibold text-sm">Participant Shift Availability</h4>
                    </div>
                    {loadingParticipantShifts ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Loading shifts...</span>
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
                                        {shift.workShift?.shiftName || 'Shift'}
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
                                    ⚠️ No shifts scheduled for this date
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
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              {/* Summary */}
              <Card className="p-4 bg-muted">
                <h3 className="font-semibold mb-2">Appointment Summary</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Patient:</span> {selectedPatient?.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{' '}
                    {appointmentDate &&
                      format(new Date(appointmentDate), 'PPP')}
                  </div>
                  <div>
                    <span className="font-medium">Doctor:</span> {selectedEmployee?.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Services:</span>{' '}
                    {selectedServices.map((s) => s.serviceName).join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{' '}
                    {appointmentStartTime &&
                      format(new Date(appointmentStartTime), 'HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">Room:</span>{' '}
                    {rooms.find((r) => r.roomCode === roomCode)?.roomName || roomCode}
                  </div>
                  {participantCodes.length > 0 && (
                    <div>
                      <span className="font-medium">Participants:</span>{' '}
                      {participantCodes.map((code) => {
                        const participant = employees.find((e) => e.employeeCode === code);
                        return participant ? `${participant.fullName} (${getRoleLabel(participant.roleName)})` : code;
                      }).join(', ')}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Appointment
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getStepTitle(step: Step): string {
  switch (step) {
    case 1:
      return 'Select Patient';
    case 2:
      return 'Select Date';
    case 3:
      return 'Select Services';
    case 4:
      return 'Select Doctor, Time & Participants';
    case 5:
      return 'Review & Confirm';
    default:
      return '';
  }
}
