/**
 * Employee Shift Types
 * Based on EMPLOYEE_SHIFT_API_TEST_GUIDE.md specification (BE-307)
 */

export enum ShiftSource {
  BATCH_JOB = 'BATCH_JOB',
  REGISTRATION_JOB = 'REGISTRATION_JOB',
  OT_APPROVAL = 'OT_APPROVAL',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_LEAVE = 'ON_LEAVE',
  ABSENT = 'ABSENT',
}

export interface WorkShift {
  workShiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  category: string;
}

export interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  employmentType: string;
}

// API Response interfaces (matches backend response)
export interface EmployeeShiftApiResponse {
  employee_shift_id: string;
  employee: {
    employee_id: number;
    full_name: string;
    position: string;
  };
  work_date: string;
  work_shift: {
    work_shift_id: string;
    shift_name: string;
    start_time: string;
    end_time: string;
  };
  source: string;
  status: string;
  is_overtime: boolean;
  created_by: number | null;
  source_ot_request_id: string | null;
  source_off_request_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend interface (converted from API response)
export interface EmployeeShift {
  employeeShiftId: string;
  employeeId: number;
  workShiftId: string;
  workDate: string;
  status: ShiftStatus;
  shiftType: ShiftSource;
  notes: string | null;
  employee?: Employee;
  workShift?: WorkShift;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeShiftDetail extends EmployeeShift {
  employee: Employee;
  workShift: WorkShift;
  createdBy?: number;
  isOvertime?: boolean;
  sourceOffRequestId?: string;
  sourceOtRequestId?: string;
}

export interface EmployeeShiftListResponse {
  content: EmployeeShift[];
  totalElements: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
}

// API Request/Response DTOs
export interface CreateShiftRequest {
  employee_id: number;
  work_date: string;
  work_shift_id: string;
  notes?: string;
}

export interface UpdateShiftRequest {
  status?: ShiftStatus;
  work_shift_id?: string;
  notes?: string;
}

export interface ShiftSummaryItem {
  work_date: string;
  total_shifts: number;
  status_breakdown: {
    [key in ShiftStatus]?: number;
  };
}

export type ShiftSummaryResponse = ShiftSummaryItem[];

// API Response wrapper
export interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  last: boolean;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
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
  [ShiftStatus.ON_LEAVE]: {
    label: 'Nghỉ phép',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  [ShiftStatus.ABSENT]: {
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
  [ShiftSource.MANUAL_ENTRY]: {
    label: 'Thủ công',
    color: 'warning',
  },
  [ShiftSource.OT_APPROVAL]: {
    label: 'Tăng ca',
    color: 'success',
  },
};

// Error codes from API
export enum ShiftErrorCode {
  FORBIDDEN = 'FORBIDDEN',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  SHIFT_NOT_FOUND = 'SHIFT_NOT_FOUND',
  RELATED_RESOURCE_NOT_FOUND = 'RELATED_RESOURCE_NOT_FOUND',
  HOLIDAY_CONFLICT = 'HOLIDAY_CONFLICT',
  SLOT_CONFLICT = 'SLOT_CONFLICT',
  SHIFT_FINALIZED = 'SHIFT_FINALIZED',
  INVALID_STATUS_TRANSITION = 'error.invalid.status.transition',
  CANNOT_CANCEL_BATCH = 'CANNOT_CANCEL_BATCH',
  CANNOT_CANCEL_COMPLETED = 'CANNOT_CANCEL_COMPLETED',
}
