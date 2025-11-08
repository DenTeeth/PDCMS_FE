'use client';

/**
 * Reschedule Appointment Modal Component
 * 
 * Allows rescheduling an appointment by:
 * - Selecting new doctor (required)
 * - Selecting new date and time (required)
 * - Selecting new room (required)
 * - Optionally changing services (if not provided, reuses old appointment's services)
 * - Optionally changing participants
 * - Selecting reason code (required)
 * - Optional cancellation notes
 */

import React, { useState, useEffect } from 'react';
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
import { RoomService } from '@/services/roomService';
import { EmployeeShiftService } from '@/services/employeeShiftService';
import { EmployeeShift, ShiftStatus } from '@/types/employeeShift';
import {
  AppointmentDetailDTO,
  RescheduleAppointmentRequest,
  AppointmentReasonCode,
  APPOINTMENT_REASON_CODE_LABELS,
} from '@/types/appointment';
import { Service } from '@/types/service';
import { Employee } from '@/types/employee';
import { Room } from '@/types/room';
import { Clock, UserCog, Building2, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RescheduleAppointmentModalProps {
  open: boolean;
  appointment: AppointmentDetailDTO | null;
  onClose: () => void;
  onSuccess: (cancelledAppointment: AppointmentDetailDTO, newAppointment: AppointmentDetailDTO) => void;
}

// Custom Time Picker Component with 15-minute intervals
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
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 p-3">
          <div className="flex gap-3">
            {/* Hour Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold mb-2 text-center">Hour</label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`px-3 py-1 text-sm rounded hover:bg-accent ${
                      hour === h ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => handleHourChange(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold mb-2 text-center">Minute</label>
              <div className="flex flex-col gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`px-3 py-1 text-sm rounded hover:bg-accent ${
                      minute === m ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => handleMinuteChange(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RescheduleAppointmentModal({
  open,
  appointment,
  onClose,
  onSuccess,
}: RescheduleAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Form data
  const [newEmployeeCode, setNewEmployeeCode] = useState<string>('');
  const [newRoomCode, setNewRoomCode] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [newServiceIds, setNewServiceIds] = useState<number[]>([]);
  const [newParticipantCodes, setNewParticipantCodes] = useState<string[]>([]);
  const [reasonCode, setReasonCode] = useState<AppointmentReasonCode | ''>('');
  const [cancelNotes, setCancelNotes] = useState<string>('');

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Shift states
  const [doctorShifts, setDoctorShifts] = useState<EmployeeShift[]>([]);
  const [participantShifts, setParticipantShifts] = useState<Map<string, EmployeeShift[]>>(new Map());
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Load initial data
  useEffect(() => {
    if (open && appointment) {
      loadInitialData();
      resetForm();
    }
  }, [open, appointment]);

  const resetForm = () => {
    if (appointment) {
      // Pre-fill with current appointment values
      setNewEmployeeCode(appointment.doctor?.employeeCode || '');
      setNewRoomCode(appointment.room?.roomCode || '');
      
      // Pre-fill date and time from current appointment
      const currentStartTime = new Date(appointment.appointmentStartTime);
      setNewDate(currentStartTime.toISOString().split('T')[0]);
      setNewTime(
        `${currentStartTime.getHours().toString().padStart(2, '0')}:${currentStartTime
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      );
      
      // Pre-fill services (convert service codes to IDs - we'll need to fetch service IDs)
      // Pre-fill participants
      setNewParticipantCodes(
        appointment.participants?.map((p) => p.employeeCode) || []
      );
      
      setReasonCode('');
      setCancelNotes('');
    } else {
      setNewEmployeeCode('');
      setNewRoomCode('');
      setNewDate('');
      setNewTime('');
      setNewServiceIds([]);
      setNewParticipantCodes([]);
      setReasonCode('');
      setCancelNotes('');
    }
    
    // Clear shifts
    setDoctorShifts([]);
    setParticipantShifts(new Map());
  };

  // Load doctor shifts when doctor and date are selected
  useEffect(() => {
    if (newEmployeeCode && newDate) {
      const selectedEmployee = employees.find((e) => e.employeeCode === newEmployeeCode);
      if (selectedEmployee) {
        // Load shifts for the month of selected date
        const targetDate = new Date(newDate);
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        const startDateStr = startOfMonth.toISOString().split('T')[0];
        const endDateStr = endOfMonth.toISOString().split('T')[0];
        
        // Convert employeeId from string to number
        const employeeId = parseInt(selectedEmployee.employeeId, 10);
        if (!isNaN(employeeId)) {
          loadDoctorShiftsForMonth(startDateStr, endDateStr, employeeId);
        }
      } else {
        setDoctorShifts([]);
      }
    } else {
      setDoctorShifts([]);
    }
  }, [newEmployeeCode, newDate, employees]);

  // Load participant shifts when participants are selected
  useEffect(() => {
    if (newParticipantCodes.length > 0 && newDate) {
      // Load shifts for all participants
      newParticipantCodes.forEach((participantCode) => {
        const participant = employees.find((e) => e.employeeCode === participantCode);
        if (participant) {
          const targetDate = new Date(newDate);
          const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          
          const startDateStr = startOfMonth.toISOString().split('T')[0];
          const endDateStr = endOfMonth.toISOString().split('T')[0];
          
          // Convert employeeId from string to number
          const employeeId = parseInt(participant.employeeId, 10);
          if (!isNaN(employeeId)) {
            loadParticipantShiftsForMonth(startDateStr, endDateStr, employeeId, participantCode);
          }
        }
      });
    } else {
      setParticipantShifts(new Map());
    }
  }, [newParticipantCodes, newDate, employees]);

  const loadDoctorShiftsForMonth = async (startDate: string, endDate: string, employeeId: number) => {
    setLoadingShifts(true);
    try {
      const shifts = await EmployeeShiftService.getShifts({
        start_date: startDate,
        end_date: endDate,
        employee_id: employeeId,
        status: ShiftStatus.SCHEDULED,
      });
      setDoctorShifts(shifts);
    } catch (error: any) {
      console.error('Failed to load doctor shifts:', error);
      // Don't show error toast, just log it
      setDoctorShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  const loadParticipantShiftsForMonth = async (
    startDate: string,
    endDate: string,
    employeeId: number,
    employeeCode: string
  ) => {
    try {
      const shifts = await EmployeeShiftService.getShifts({
        start_date: startDate,
        end_date: endDate,
        employee_id: employeeId,
        status: ShiftStatus.SCHEDULED,
      });
      setParticipantShifts((prev) => {
        const newMap = new Map(prev);
        newMap.set(employeeCode, shifts);
        return newMap;
      });
    } catch (error: any) {
      console.error(`Failed to load shifts for participant ${employeeCode}:`, error);
      // Don't show error toast, just log it
      setParticipantShifts((prev) => {
        const newMap = new Map(prev);
        newMap.set(employeeCode, []);
        return newMap;
      });
    }
  };

  // Get shifts for a specific date
  const getShiftsForDate = (dateString: string, shifts: EmployeeShift[]): EmployeeShift[] => {
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.workDate).toISOString().split('T')[0];
      return shiftDate === dateString;
    });
  };

  // Get all dates with shifts in the current month
  const getDatesWithShifts = (shifts: EmployeeShift[]): Set<string> => {
    const dates = new Set<string>();
    shifts.forEach((shift) => {
      const shiftDate = new Date(shift.workDate).toISOString().split('T')[0];
      dates.add(shiftDate);
    });
    return dates;
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

      // Load employees (active doctors only)
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 100,
        isActive: true,
        // Note: employeeType filter is not used here as we need to filter by role/specialization instead
        // We'll filter employees to only include those with specializations (doctors)
      });
      // Filter to only include doctors with at least one specialization
      const doctorsWithSpecializations = employeesResponse.content.filter(
        (employee) => employee.specializations && employee.specializations.length > 0
      );
      setEmployees(doctorsWithSpecializations);

      // Load rooms (active only)
      const roomsData = await RoomService.getActiveRooms();
      setRooms(roomsData);

      // Pre-fill service IDs from current appointment services
      if (appointment && appointment.services.length > 0) {
        // Map service codes to service IDs
        const serviceCodes = appointment.services.map((s) => s.serviceCode);
        const matchedServices = servicesResponse.content.filter((s) =>
          serviceCodes.includes(s.serviceCode)
        );
        setNewServiceIds(matchedServices.map((s) => s.serviceId));
      }
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleService = (serviceId: number) => {
    setNewServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleToggleParticipant = (employeeCode: string) => {
    setNewParticipantCodes((prev) =>
      prev.includes(employeeCode)
        ? prev.filter((code) => code !== employeeCode)
        : [...prev, employeeCode]
    );
  };

  const handleReschedule = async () => {
    if (!appointment) {
      toast.error('Appointment not found');
      return;
    }

    // Validation
    if (!newEmployeeCode) {
      toast.error('Please select a doctor');
      return;
    }

    if (!newRoomCode) {
      toast.error('Please select a room');
      return;
    }

    if (!newDate || !newTime) {
      toast.error('Please select date and time');
      return;
    }

    // Validate time is in 15-minute intervals
    const [hour, minute] = newTime.split(':');
    const minuteNum = parseInt(minute, 10);
    if (minuteNum % 15 !== 0) {
      toast.error('Time must be in 15-minute intervals (e.g., 8:00, 8:15, 8:30, 8:45)');
      return;
    }

    if (!reasonCode) {
      toast.error('Please select a reason code');
      return;
    }

    // Build newStartTime: ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    const newStartTime = `${newDate}T${newTime}:00`;

    setLoading(true);
    try {
      // Build request body - only include optional fields if they have values
      const request: RescheduleAppointmentRequest = {
        newStartTime,
        newEmployeeCode,
        newRoomCode,
        reasonCode,
        // Only include newParticipantCodes if array is not empty
        ...(newParticipantCodes.length > 0 && { newParticipantCodes }),
        // Only include newServiceIds if array is not empty (if not provided, reuses old appointment's services)
        ...(newServiceIds.length > 0 && { newServiceIds }),
        // Only include cancelNotes if provided
        ...(cancelNotes.trim() && { cancelNotes: cancelNotes.trim() }),
      };

      const response = await appointmentService.rescheduleAppointment(
        appointment.appointmentCode,
        request
      );

      toast.success('Appointment rescheduled successfully');
      onSuccess(response.cancelledAppointment, response.newAppointment);
      onClose();
    } catch (error: any) {
      console.error('Failed to reschedule appointment:', error);
      
      // Extract error message from backend response
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      
      toast.error('Failed to reschedule appointment', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return null;
  }

  const selectedEmployee = employees.find((e) => e.employeeCode === newEmployeeCode);
  const selectedRoom = rooms.find((r) => r.roomCode === newRoomCode);

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Reschedule appointment {appointment.appointmentCode}. This will cancel the current
            appointment and create a new one.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Appointment Info */}
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Current Appointment</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Date & Time:</span>{' '}
                  {format(new Date(appointment.appointmentStartTime), 'PPP p')}
                </p>
                <p>
                  <span className="font-medium">Doctor:</span> {appointment.doctor?.fullName}
                </p>
                <p>
                  <span className="font-medium">Room:</span> {appointment.room?.roomName}
                </p>
                <p>
                  <span className="font-medium">Services:</span>{' '}
                  {appointment.services.map((s) => s.serviceName).join(', ')}
                </p>
              </div>
            </Card>

            {/* New Doctor */}
            <div>
              <Label htmlFor="newEmployeeCode">
                New Doctor <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newEmployeeCode}
                onValueChange={(value) => setNewEmployeeCode(value)}
              >
                <SelectTrigger id="newEmployeeCode" className="mt-1">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.employeeCode} value={employee.employeeCode}>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        <span>{employee.fullName}</span>
                        <span className="text-muted-foreground">({employee.employeeCode})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Room */}
            <div>
              <Label htmlFor="newRoomCode">
                New Room <span className="text-destructive">*</span>
              </Label>
              <Select value={newRoomCode} onValueChange={(value) => setNewRoomCode(value)}>
                <SelectTrigger id="newRoomCode" className="mt-1">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.roomCode} value={room.roomCode}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{room.roomName}</span>
                        <span className="text-muted-foreground">({room.roomCode})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Date and Time */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newDate">
                    New Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newDate"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={minDate}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newTime">
                    New Time <span className="text-destructive">*</span>
                  </Label>
                  <TimePicker value={newTime} onChange={setNewTime} />
                </div>
              </div>
              
              {/* Doctor Shift Availability */}
              {newEmployeeCode && newDate && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Doctor Shift Availability</h4>
                  </div>
                  {loadingShifts ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Loading shifts...</span>
                    </div>
                  ) : (
                    <>
                      {getShiftsForDate(newDate, doctorShifts).length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Shifts for {selectedEmployee?.fullName} on{' '}
                            {format(new Date(newDate), 'PPP')}:
                          </div>
                          {getShiftsForDate(newDate, doctorShifts).map((shift) => (
                            <div
                              key={shift.employeeShiftId}
                              className="flex items-center gap-2 text-sm bg-background p-2 rounded border"
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
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            ⚠️ No shifts scheduled for {selectedEmployee?.fullName} on{' '}
                            {format(new Date(newDate), 'PPP')}
                          </span>
                        </div>
                      )}
                      {/* Show all dates with shifts in the month */}
                      {getDatesWithShifts(doctorShifts).size > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Dates with shifts this month:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(getDatesWithShifts(doctorShifts))
                              .sort()
                              .slice(0, 10)
                              .map((date) => (
                                <Badge
                                  key={date}
                                  variant="outline"
                                  className={`text-xs ${
                                    date === newDate ? 'bg-primary text-primary-foreground' : ''
                                  }`}
                                >
                                  {format(new Date(date), 'MMM dd')}
                                </Badge>
                              ))}
                            {getDatesWithShifts(doctorShifts).size > 10 && (
                              <Badge variant="outline" className="text-xs">
                                +{getDatesWithShifts(doctorShifts).size - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )}

              {/* Participant Shifts Availability */}
              {newParticipantCodes.length > 0 && newDate && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-sm">Participant Shift Availability</h4>
                  </div>
                  <div className="space-y-3">
                    {newParticipantCodes.map((participantCode) => {
                      const participant = employees.find((e) => e.employeeCode === participantCode);
                      const shifts = participantShifts.get(participantCode) || [];
                      const shiftsForDate = getShiftsForDate(newDate, shifts);

                      return (
                        <div key={participantCode} className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            {participant?.fullName} ({participantCode}) -{' '}
                            {participant?.roleName.includes('DENTIST') || participant?.roleName.includes('DOCTOR')
                              ? 'Bác sĩ'
                              : participant?.roleName.includes('NURSE')
                              ? 'Y tá/Trợ lí'
                              : participant?.roleName || ''}
                            :
                          </div>
                          {shiftsForDate.length > 0 ? (
                            <div className="space-y-1">
                              {shiftsForDate.map((shift) => (
                                <div
                                  key={shift.employeeShiftId}
                                  className="flex items-center gap-2 text-sm bg-background p-2 rounded border"
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
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>
                                ⚠️ No shifts scheduled for {participant?.fullName} on{' '}
                                {format(new Date(newDate), 'PPP')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* Services (Optional - if not selected, reuses old appointment's services) */}
            <div>
              <Label>Services (Optional - leave empty to reuse current services)</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services available</p>
                ) : (
                  services.map((service) => (
                    <div key={service.serviceId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.serviceId}`}
                        checked={newServiceIds.includes(service.serviceId)}
                        onCheckedChange={() => handleToggleService(service.serviceId)}
                      />
                      <label
                        htmlFor={`service-${service.serviceId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service.serviceName}
                        <span className="text-muted-foreground ml-2">
                          ({service.serviceCode})
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>
              {newServiceIds.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current appointment services will be reused
                </p>
              )}
            </div>

            {/* Participants (Optional) */}
            <div>
              <Label>Participants (Optional)</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Only employees with STANDARD specialization (medical staff) can be selected as participants.
              </p>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {(() => {
                  // Filter to only show employees with STANDARD specialization (ID 8)
                  // Participants must have STANDARD specialization (ID 8) - medical staff only
                  // Admin/Receptionist without STANDARD cannot be participants
                  const eligibleParticipants = employees.filter((e) => {
                    // Exclude selected doctor
                    if (e.employeeCode === newEmployeeCode) return false;
                    
                    // Check if employee has STANDARD specialization (ID 8)
                    // specializationId is string in FE type, but BE uses integer 8
                    // Check both string and number formats for safety
                    const hasStandardSpecialization = e.specializations?.some(
                      (spec) => 
                        String(spec.specializationId) === '8' || 
                        spec.specializationId === '8'
                    );
                    
                    return hasStandardSpecialization;
                  });

                  if (eligibleParticipants.length === 0) {
                    return (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No eligible participants found. Only employees with STANDARD specialization (medical staff) can be selected.
                      </div>
                    );
                  }

                  return eligibleParticipants.map((employee) => (
                    <div key={employee.employeeCode} className="flex items-center space-x-2">
                      <Checkbox
                        id={`participant-${employee.employeeCode}`}
                        checked={newParticipantCodes.includes(employee.employeeCode)}
                        onCheckedChange={() => handleToggleParticipant(employee.employeeCode)}
                      />
                      <label
                        htmlFor={`participant-${employee.employeeCode}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {employee.fullName}
                        <span className="text-muted-foreground ml-2">
                          ({employee.employeeCode})
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {employee.roleName.includes('DENTIST') || employee.roleName.includes('DOCTOR')
                            ? 'Bác sĩ'
                            : employee.roleName.includes('NURSE')
                            ? 'Y tá/Trợ lí'
                            : employee.roleName}
                        </Badge>
                      </label>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Reason Code (Required) */}
            <div>
              <Label htmlFor="reasonCode">
                Reason Code <span className="text-destructive">*</span>
              </Label>
              <Select
                value={reasonCode}
                onValueChange={(value) => setReasonCode(value as AppointmentReasonCode)}
              >
                <SelectTrigger id="reasonCode" className="mt-1">
                  <SelectValue placeholder="Select reason code" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_REASON_CODE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cancel Notes - Only show when "Lý do khác" (OTHER) is selected */}
            {reasonCode === AppointmentReasonCode.OTHER && (
              <div>
                <Label htmlFor="cancelNotes">Cancellation Notes</Label>
                <Textarea
                  id="cancelNotes"
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Enter notes for cancellation..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReschedule} disabled={loading || loadingData}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              'Reschedule Appointment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

