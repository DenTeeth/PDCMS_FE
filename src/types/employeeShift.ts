/**
 * Employee Shift Types
 * Based on SHIFT_API.md specification (BE-307)
 */

export enum ShiftSource {
  BATCH_JOB = 'BATCH_JOB',
  REGISTRATION_JOB = 'REGISTRATION_JOB',
  MANUAL = 'MANUAL',
  OVERTIME = 'OVERTIME',
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface WorkShift {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
}

export interface EmployeeShift {
  shiftId: number;
  employeeId: number;
  employeeName: string;
  workDate: string;
  workShift: WorkShift;
  source: ShiftSource;
  registrationId: string | null;
  status: ShiftStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeShiftListResponse {
  content: EmployeeShift[];
  totalElements: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
}

// Status display configuration
export const SHIFT_STATUS_CONFIG = {
  [ShiftStatus.SCHEDULED]: {
    label: 'Đã lên lịch',
    color: 'info',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  [ShiftStatus.COMPLETED]: {
    label: 'Hoàn thành',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  [ShiftStatus.CANCELLED]: {
    label: 'Đã hủy',
    color: 'secondary',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  [ShiftStatus.NO_SHOW]: {
    label: 'Vắng mặt',
    color: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

// Source display configuration
export const SHIFT_SOURCE_CONFIG = {
  [ShiftSource.BATCH_JOB]: {
    label: 'Tự động (Full-time)',
    color: 'primary',
  },
  [ShiftSource.REGISTRATION_JOB]: {
    label: 'Đăng ký (Part-time)',
    color: 'info',
  },
  [ShiftSource.MANUAL]: {
    label: 'Thủ công',
    color: 'warning',
  },
  [ShiftSource.OVERTIME]: {
    label: 'Tăng ca',
    color: 'success',
  },
};
