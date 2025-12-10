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
 * 
 * Issue #39: BE automatically re-links treatment plan items when rescheduling
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Clock,
  UserCog,
  Building2,
  Loader2,
  Calendar,
  AlertCircle,
  Info,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  Stethoscope,
  MapPin,
} from 'lucide-react';
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
        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${disabled
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
                    className={`px-3 py-1 text-sm rounded hover:bg-accent ${hour === h ? 'bg-primary text-primary-foreground' : ''
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
                    className={`px-3 py-1 text-sm rounded hover:bg-accent ${minute === m ? 'bg-primary text-primary-foreground' : ''
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

      // Pre-fill services (convert service codes to IDs)
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
      toast.error('Không tìm thấy lịch hẹn');
      return;
    }

    // Validation
    if (!newEmployeeCode) {
      toast.error('Vui lòng chọn bác sĩ');
      return;
    }

    if (!newRoomCode) {
      toast.error('Vui lòng chọn phòng');
      return;
    }

    if (!newDate || !newTime) {
      toast.error('Vui lòng chọn ngày và giờ');
      return;
    }

    // Validate time is in 15-minute intervals
    const [hour, minute] = newTime.split(':');
    const minuteNum = parseInt(minute, 10);
    if (minuteNum % 15 !== 0) {
      toast.error('Giờ phải là bội số của 15 phút (ví dụ: 8:00, 8:15, 8:30, 8:45)');
      return;
    }

    if (!reasonCode) {
      toast.error('Vui lòng chọn lý do đổi lịch');
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

      toast.success('Đổi lịch hẹn thành công');
      onSuccess(response.cancelledAppointment, response.newAppointment);
      onClose();
    } catch (error: any) {
      console.error('Failed to reschedule appointment:', error);

      // Extract error message from backend response
      const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định';

      toast.error('Không thể đổi lịch hẹn', {
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

  // Check if form is valid
  const isFormValid =
    newEmployeeCode &&
    newRoomCode &&
    newDate &&
    newTime &&
    reasonCode;

  // Get eligible participants (employees with STANDARD specialization, excluding selected doctor)
  const eligibleParticipants = employees.filter((e) => {
    if (e.employeeCode === newEmployeeCode) return false;
    const hasStandardSpecialization = e.specializations?.some(
      (spec) =>
        String(spec.specializationId) === '8' ||
        spec.specializationId === '8'
    );
    return hasStandardSpecialization;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Đổi lịch hẹn
          </DialogTitle>
          <DialogDescription>
            Mã lịch hẹn: <span className="font-mono font-medium">{appointment.appointmentCode}</span>
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Thông tin hiện tại</TabsTrigger>
                <TabsTrigger value="new">Thông tin mới</TabsTrigger>
                <TabsTrigger value="reason">Lý do đổi lịch</TabsTrigger>
              </TabsList>

              {/* Tab 1: Current Appointment Info */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Thông tin lịch hẹn hiện tại
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ngày & Giờ</Label>
                        <p className="font-medium">
                          {format(new Date(appointment.appointmentStartTime), 'PPP p')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Bác sĩ</Label>
                        <p className="font-medium">{appointment.doctor?.fullName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Phòng</Label>
                        <p className="font-medium">{appointment.room?.roomName || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Dịch vụ</Label>
                        <div className="flex flex-wrap gap-1">
                          {appointment.services.map((s) => (
                            <Badge key={s.serviceCode} variant="outline" className="text-xs">
                              {s.serviceName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Treatment Plan Info - Issue #39: BE auto re-links plan items */}
                    {appointment.linkedTreatmentPlanCode && (
                      <>
                        <Separator />
                        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-primary text-sm">
                              Lộ trình điều trị: {appointment.linkedTreatmentPlanCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Lịch hẹn này được liên kết với lộ trình điều trị. Khi đổi lịch, các hạng mục sẽ được tự động liên kết lại với lịch hẹn mới.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: New Appointment Details */}
              <TabsContent value="new" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Doctor */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Bác sĩ mới <span className="text-destructive">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={newEmployeeCode}
                        onValueChange={(value) => setNewEmployeeCode(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn bác sĩ" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.employeeCode} value={employee.employeeCode}>
                              <div className="flex items-center gap-2">
                                <span>{employee.fullName}</span>
                                <span className="text-muted-foreground text-xs">
                                  ({employee.employeeCode})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* New Room */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Phòng mới <span className="text-destructive">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={newRoomCode} onValueChange={(value) => setNewRoomCode(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phòng" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.roomCode} value={room.roomCode}>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{room.roomName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                {/* Date and Time */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ngày & Giờ mới <span className="text-destructive">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newDate">Ngày</Label>
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
                        <Label htmlFor="newTime">Giờ</Label>
                        <TimePicker value={newTime} onChange={setNewTime} />
                      </div>
                    </div>

                    {/* Doctor Shift Availability */}
                    {newEmployeeCode && newDate && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm">Lịch làm việc của bác sĩ</h4>
                        </div>
                        {loadingShifts ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Đang tải...</span>
                          </div>
                        ) : (
                          <>
                            {getShiftsForDate(newDate, doctorShifts).length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">
                                  Ca làm việc của {selectedEmployee?.fullName} vào{' '}
                                  {format(new Date(newDate), 'PPP')}:
                                </div>
                                {getShiftsForDate(newDate, doctorShifts).map((shift) => (
                                  <div
                                    key={shift.employeeShiftId}
                                    className="flex items-center gap-2 text-sm bg-background p-2 rounded border"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span className="font-medium">
                                      {shift.workShift?.shiftName || 'Ca làm việc'}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {shift.workShift?.startTime} - {shift.workShift?.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-amber-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                  Không có ca làm việc cho {selectedEmployee?.fullName} vào{' '}
                                  {format(new Date(newDate), 'PPP')}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Services (Optional) */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Dịch vụ (Tùy chọn)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Để trống để giữ nguyên dịch vụ hiện tại
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {services.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Không có dịch vụ nào
                        </p>
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
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {service.serviceName}
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({service.serviceCode})
                              </span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {newServiceIds.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Dịch vụ hiện tại sẽ được giữ nguyên
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Participants (Optional) */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Người tham gia (Tùy chọn)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Chỉ nhân viên y tế (STANDARD specialization) mới có thể được chọn
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {eligibleParticipants.length === 0 ? (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                          Không có người tham gia phù hợp
                        </div>
                      ) : (
                        eligibleParticipants.map((employee) => (
                          <div key={employee.employeeCode} className="flex items-center space-x-2">
                            <Checkbox
                              id={`participant-${employee.employeeCode}`}
                              checked={newParticipantCodes.includes(employee.employeeCode)}
                              onCheckedChange={() => handleToggleParticipant(employee.employeeCode)}
                            />
                            <label
                              htmlFor={`participant-${employee.employeeCode}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {employee.fullName}
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({employee.employeeCode})
                              </span>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Reason */}
              <TabsContent value="reason" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Lý do đổi lịch <span className="text-destructive">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="reasonCode">Mã lý do</Label>
                      <Select
                        value={reasonCode}
                        onValueChange={(value) => setReasonCode(value as AppointmentReasonCode)}
                      >
                        <SelectTrigger id="reasonCode" className="mt-1">
                          <SelectValue placeholder="Chọn lý do đổi lịch" />
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
                        <Label htmlFor="cancelNotes">Ghi chú bổ sung</Label>
                        <Textarea
                          id="cancelNotes"
                          value={cancelNotes}
                          onChange={(e) => setCancelNotes(e.target.value)}
                          placeholder="Nhập ghi chú về lý do đổi lịch..."
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs >
          </div >
        )
        }

        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={loading || loadingData || !isFormValid}
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Xác nhận đổi lịch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent >
    </Dialog >
  );
}
