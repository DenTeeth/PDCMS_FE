'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentDetailDTO, DelayAppointmentRequest } from '@/types/appointment';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DelayAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentDetailDTO | null;
  onSuccess?: () => void;
}

// Reason codes for delaying appointment
const DELAY_REASON_CODES = [
  { value: 'PATIENT_REQUEST', label: 'Bệnh nhân yêu cầu hoãn' },
  { value: 'DOCTOR_EMERGENCY', label: 'Bác sĩ có việc đột xuất' },
  { value: 'EQUIPMENT_ISSUE', label: 'Vấn đề thiết bị' },
  { value: 'CLINIC_EMERGENCY', label: 'Phòng khám có tình huống khẩn cấp' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export default function DelayAppointmentModal({
  open,
  onClose,
  appointment,
  onSuccess,
}: DelayAppointmentModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reasonCode, setReasonCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && appointment) {
      // Set default date to original appointment date
      try {
        const originalDate = appointment.appointmentDate
          ? new Date(appointment.appointmentDate)
          : new Date();
        // Validate date is valid
        if (!isNaN(originalDate.getTime())) {
          setSelectedDate(originalDate);
        } else {
          setSelectedDate(new Date());
        }
      } catch (error) {
        console.error('Failed to parse appointment date:', error);
        setSelectedDate(new Date());
      }
      setSelectedTime(appointment.startTime || '');
      setReasonCode('');
      setNotes('');
    } else {
      setSelectedDate(undefined);
      setSelectedTime('');
      setReasonCode('');
      setNotes('');
    }
  }, [open, appointment]);

  // Generate time slots (15-minute intervals)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 7; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Validate time is in 15-minute intervals
  const isValidTimeInterval = (time: string): boolean => {
    const [, minuteStr] = time.split(':');
    const minute = parseInt(minuteStr, 10);
    return minute % 15 === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!appointment) {
      toast.error('Không tìm thấy thông tin lịch hẹn');
      return;
    }

    // Validation
    if (!selectedDate) {
      toast.error('Vui lòng chọn ngày mới');
      return;
    }

    if (!selectedTime) {
      toast.error('Vui lòng chọn giờ mới');
      return;
    }

    if (!isValidTimeInterval(selectedTime)) {
      toast.error('Giờ phải chia hết cho 15 phút (ví dụ: 8:00, 8:15, 8:30, 8:45)');
      return;
    }

    if (!reasonCode) {
      toast.error('Vui lòng chọn lý do hoãn lịch');
      return;
    }

    try {
      setIsSubmitting(true);

      // Format new start time: YYYY-MM-DDTHH:MM:SS
      const newStartTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`;

      const request: DelayAppointmentRequest = {
        newStartTime,
        reasonCode,
        notes: notes.trim() || undefined,
      };

      console.log('🔄 Delaying appointment:', {
        appointmentCode: appointment.appointmentCode,
        request,
      });

      await appointmentService.delayAppointment(appointment.appointmentCode, request);

      toast.success('Hoãn lịch hẹn thành công', {
        description: selectedDate && !isNaN(selectedDate.getTime())
          ? `Lịch hẹn đã được hoãn đến ${format(selectedDate, 'dd/MM/yyyy')} lúc ${selectedTime}`
          : `Lịch hẹn đã được hoãn đến ${selectedTime}`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('❌ Failed to delay appointment:', error);

      // Handle 409 Conflict errors with detailed Vietnamese messages
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || '';

        // Detect specific conflict types and show user-friendly Vietnamese messages
        if (errorMessage.includes('Cannot delay appointment in status')) {
          // Extract current status from error message
          const statusMatch = errorMessage.match(/in status (\w+)/);
          const currentStatus = statusMatch ? statusMatch[1] : 'unknown';

          const statusMessages: Record<string, string> = {
            'CANCELLED': 'Không thể hoãn lịch hẹn đã bị huỷ',
            'COMPLETED': 'Không thể hoãn lịch hẹn đã hoàn thành',
            'IN_PROGRESS': 'Không thể hoãn lịch hẹn đang thực hiện',
            'NO_SHOW': 'Không thể hoãn lịch hẹn bệnh nhân không đến',
          };

          const vietnameseMessage = statusMessages[currentStatus] ||
            'Không thể hoãn lịch hẹn ở trạng thái hiện tại';

          toast.error(vietnameseMessage, {
            description: 'Chỉ có thể hoãn lịch hẹn đang chờ hoặc đã check-in',
          });
        } else if (errorMessage.includes('EMPLOYEE_SLOT_TAKEN') || errorMessage.includes('employee') || errorMessage.includes('doctor')) {
          toast.error('Bác sĩ đã có lịch hẹn khác vào thời gian này', {
            description: 'Vui lòng chọn thời gian khác hoặc liên hệ quản lý để điều chỉnh lịch',
          });
        } else if (errorMessage.includes('ROOM_SLOT_TAKEN') || errorMessage.includes('room') || errorMessage.includes('phòng')) {
          toast.error('Phòng khám đã được đặt vào thời gian này', {
            description: 'Vui lòng chọn thời gian khác hoặc chọn phòng khác',
          });
        } else if (errorMessage.includes('INVALID_STATE_TRANSITION')) {
          toast.error('Không thể chuyển trạng thái lịch hẹn', {
            description: 'Trạng thái hiện tại không cho phép hoãn lịch hẹn',
          });
        } else {
          // Generic 409 error
          toast.error('Xung đột khi hoãn lịch hẹn', {
            description: errorMessage || 'Vui lòng kiểm tra lại thông tin và thử lại',
          });
        }
      } else {
        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'Vui lòng thử lại sau';
        toast.error('Hoãn lịch hẹn thất bại', {
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-[#8b5fbf]" />
            Hoãn Lịch Hẹn
          </DialogTitle>
          <DialogDescription>
            Thay đổi thời gian lịch hẹn cho bệnh nhân <strong>{appointment.patient?.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Appointment Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Thông tin lịch hẹn hiện tại:</h3>
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-600">Ngày:</span>
                <span className="font-medium">
                  {appointment.appointmentDate ? (() => {
                    try {
                      const date = new Date(appointment.appointmentDate);
                      return !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : 'N/A';
                    } catch {
                      return 'N/A';
                    }
                  })() : 'N/A'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Giờ:</span>
                <span className="font-medium">{appointment.startTime} - {appointment.endTime}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Bác sĩ:</span>
                <span className="font-medium">{appointment.employee?.fullName || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Phòng:</span>
                <span className="font-medium">{appointment.room?.roomName || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Warning notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Lưu ý:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Chỉ có thể hoãn lịch hẹn đang chờ hoặc đã check-in</li>
                <li>Thời gian mới phải chia hết cho 15 phút</li>
                <li>Kiểm tra lịch bác sĩ và phòng khám trước khi hoãn</li>
              </ul>
            </div>
          </div>

          {/* New Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-date" className="text-sm font-semibold">
              Ngày mới <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 h-4 w-4" />
                  {selectedDate && !isNaN(selectedDate.getTime()) ? format(selectedDate, 'dd/MM/yyyy') : 'Chọn ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-time" className="text-sm font-semibold">
              Giờ mới <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn giờ" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Giờ phải chia hết cho 15 phút (ví dụ: 8:00, 8:15, 8:30, 8:45)
            </p>
          </div>

          {/* Reason Code Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason-code" className="text-sm font-semibold">
              Lý do hoãn lịch <span className="text-red-500">*</span>
            </Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn lý do" />
              </SelectTrigger>
              <SelectContent>
                {DELAY_REASON_CODES.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">
              Ghi chú (không bắt buộc)
            </Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú thêm về lý do hoãn lịch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hoãn lịch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
