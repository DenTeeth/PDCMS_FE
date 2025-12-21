/**
 * Auto-Schedule Configuration Modal
 * 
 * Allows user to configure auto-schedule parameters:
 * - Preferred doctor (employeeCode)
 * - Preferred room (roomCode)
 * - Preferred time slots (MORNING, AFTERNOON, EVENING)
 * - Look ahead days (default: 90)
 * - Force schedule (skip spacing rules)
 * 
 * Issue: ISSUE_BE_AUTO_SCHEDULE_TREATMENT_PLANS_WITH_HOLIDAYS
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AutoScheduleRequest } from '@/types/treatmentPlan';
import { EmployeeService } from '@/services/employeeService';
import { RoomService } from '@/services/roomService';
import { Employee } from '@/types/employee';
import { Room } from '@/types/room';
import { Loader2, Calendar, Clock, User, Building } from 'lucide-react';
import { toast } from 'sonner';

interface AutoScheduleConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: AutoScheduleRequest) => void;
  defaultDoctorCode?: string; // Doctor from treatment plan
  isLoading?: boolean;
}

export default function AutoScheduleConfigModal({
  open,
  onClose,
  onConfirm,
  defaultDoctorCode,
  isLoading = false,
}: AutoScheduleConfigModalProps) {
  const [loadingData, setLoadingData] = useState(false);
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Form state
  const [employeeCode, setEmployeeCode] = useState<string>(defaultDoctorCode || '__none__');
  const [roomCode, setRoomCode] = useState<string>('__none__');
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<('MORNING' | 'AFTERNOON' | 'EVENING')[]>([]);
  const [lookAheadDays, setLookAheadDays] = useState<number>(90);
  const [forceSchedule, setForceSchedule] = useState(false);

  // Load doctors and rooms when modal opens
  useEffect(() => {
    if (open) {
      loadInitialData();
      // Reset form to defaults
      setEmployeeCode(defaultDoctorCode || '__none__');
      setRoomCode('__none__');
      setPreferredTimeSlots([]);
      setLookAheadDays(90);
      setForceSchedule(false);
    }
  }, [open, defaultDoctorCode]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Load doctors (ROLE_DENTIST only)
      const employeeService = new EmployeeService();
      const employeesResponse = await employeeService.getEmployees({
        page: 0,
        size: 100,
        isActive: true,
      });

      const dentists = employeesResponse.content.filter(
        (emp) =>
          emp.roleName?.toUpperCase() === 'ROLE_DENTIST' ||
          emp.roleName?.toUpperCase().includes('DENTIST')
      );
      setDoctors(dentists);

      // Load rooms
      const roomsData = await RoomService.getActiveRooms();
      setRooms(roomsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleTimeSlotToggle = (slot: 'MORNING' | 'AFTERNOON' | 'EVENING') => {
    setPreferredTimeSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  const handleConfirm = () => {
    const config: AutoScheduleRequest = {
      employeeCode: employeeCode && employeeCode !== '__none__' ? employeeCode : undefined,
      roomCode: roomCode && roomCode !== '__none__' ? roomCode : undefined,
      preferredTimeSlots: preferredTimeSlots.length > 0 ? preferredTimeSlots : undefined,
      lookAheadDays: lookAheadDays > 0 ? lookAheadDays : undefined,
      forceSchedule: forceSchedule || undefined,
    };

    onConfirm(config);
  };

  const timeSlotLabels = {
    MORNING: 'Sáng (8h-12h)',
    AFTERNOON: 'Chiều (13h-17h)',
    EVENING: 'Tối (17h-20h)',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cấu hình tự động xếp lịch
          </DialogTitle>
          <DialogDescription>
            Cấu hình các tham số để hệ thống tự động đề xuất lịch hẹn cho lộ trình điều trị.
            Tất cả các trường đều tùy chọn - hệ thống sẽ tự động đề xuất nếu không chỉ định.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Preferred Doctor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Bác sĩ ưu tiên (tùy chọn)
              </Label>
              <Select value={employeeCode || '__none__'} onValueChange={setEmployeeCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn bác sĩ (để trống để hệ thống tự đề xuất)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Không chỉ định (tự động)</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.employeeCode} value={doctor.employeeCode}>
                      {doctor.fullName} ({doctor.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nếu không chọn, hệ thống sẽ đề xuất bác sĩ có sẵn
              </p>
            </div>

            {/* Preferred Room */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Phòng khám ưu tiên (tùy chọn)
              </Label>
              <Select value={roomCode || '__none__'} onValueChange={setRoomCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng (để trống để hệ thống tự đề xuất)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Không chỉ định (tự động)</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.roomCode} value={room.roomCode}>
                      {room.roomName} ({room.roomCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Nếu không chọn, hệ thống sẽ đề xuất phòng có sẵn
              </p>
            </div>

            {/* Preferred Time Slots */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Khung giờ ưu tiên (tùy chọn)
              </Label>
              <div className="space-y-2">
                {(['MORNING', 'AFTERNOON', 'EVENING'] as const).map((slot) => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={`time-slot-${slot}`}
                      checked={preferredTimeSlots.includes(slot)}
                      onCheckedChange={() => handleTimeSlotToggle(slot)}
                    />
                    <label
                      htmlFor={`time-slot-${slot}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {timeSlotLabels[slot]}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Nếu không chọn, hệ thống sẽ đề xuất tất cả khung giờ có sẵn
              </p>
            </div>

            {/* Look Ahead Days */}
            <div className="space-y-2">
              <Label htmlFor="lookAheadDays">Số ngày tìm kiếm tối đa</Label>
              <Input
                id="lookAheadDays"
                type="number"
                min={1}
                max={90}
                value={lookAheadDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 90) {
                    setLookAheadDays(value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Số ngày tối đa để tìm slot trống (1-90 ngày, mặc định: 90)
              </p>
            </div>

            {/* Force Schedule */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forceSchedule"
                  checked={forceSchedule}
                  onCheckedChange={(checked) => setForceSchedule(checked === true)}
                />
                <label
                  htmlFor="forceSchedule"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Bỏ qua quy tắc giãn cách (chỉ dùng cho trường hợp khẩn cấp)
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Nếu bật, hệ thống sẽ bỏ qua spacing rules và daily limits. Chỉ dùng khi thực sự cần thiết.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || loadingData}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo gợi ý...
              </>
            ) : (
              'Tạo gợi ý lịch hẹn'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

