/**
 * Overtime Request Management Types
 * Based on Overtime_API.md specification
 */

export enum OvertimeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface OvertimeRequest {
  requestId: string;
  employeeId: number;
  employeeName: string;
  workDate: string;
  workShiftId: string;
  workShiftName: string;
  status: OvertimeStatus;
  reason: string;
  requestedBy: number;
  requestedByName: string;
  createdAt: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  cancellationReason?: string;
}

// Detailed response types for GET /overtime-requests/{requestId}
export interface EmployeeInfo {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface WorkShiftInfo {
  workShiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

export interface OvertimeRequestDetail {
  requestId: string;
  employee: EmployeeInfo;
  requestedBy: EmployeeInfo;
  workDate: string;
  workShift: WorkShiftInfo;
  reason: string;
  status: OvertimeStatus;
  approvedBy?: EmployeeInfo;
  approvedAt?: string;
  rejectedReason?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface CreateOvertimeRequestDto {
  employeeId?: number; // Optional - backend sẽ tự lấy từ JWT nếu không có
  workDate: string;
  workShiftId: string;
  reason: string;
}

export interface UpdateOvertimeStatusDto {
  status: OvertimeStatus;
  reason?: string;
}

export interface OvertimeRequestListResponse {
  content: OvertimeRequest[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Error response types based on API documentation
export interface OvertimeErrorResponse {
  code: string;
  message: string;
}

export enum OvertimeErrorCode {
  OT_REQUEST_NOT_FOUND = 'OT_REQUEST_NOT_FOUND',
  RELATED_RESOURCE_NOT_FOUND = 'RELATED_RESOURCE_NOT_FOUND',
  DUPLICATE_OT_REQUEST = 'DUPLICATE_OT_REQUEST',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  FORBIDDEN = 'FORBIDDEN',
}

export interface WorkShift {
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
}

// Available work shifts from API documentation
export const AVAILABLE_WORK_SHIFTS: WorkShift[] = [
  {
    shiftId: 'WKS_MORNING_01',
    name: 'Ca sáng 1',
    startTime: '07:00',
    endTime: '11:00',
  },
  {
    shiftId: 'WKS_AFTERNOON_01',
    name: 'Ca chiều 1',
    startTime: '13:00',
    endTime: '17:00',
  },
  {
    shiftId: 'WKS_MORNING_02',
    name: 'Ca sáng 2',
    startTime: '08:00',
    endTime: '12:00',
  },
  {
    shiftId: 'WKS_AFTERNOON_02',
    name: 'Ca chiều 2',
    startTime: '14:00',
    endTime: '18:00',
  },
];

// Status display configuration
export const OVERTIME_STATUS_CONFIG = {
  [OvertimeStatus.PENDING]: {
    label: 'Chờ duyệt',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  [OvertimeStatus.APPROVED]: {
    label: 'Đã duyệt',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  [OvertimeStatus.REJECTED]: {
    label: 'Từ chối',
    color: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  [OvertimeStatus.CANCELLED]: {
    label: 'Đã hủy',
    color: 'secondary',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
};
