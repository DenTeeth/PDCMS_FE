/**
 * Time Off Request Management Types
 * Based on Time_Off_Request.md specification (BE-305)
 */

export enum TimeOffStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface TimeOffRequest {
  requestId: string;
  employeeId: number;
  employeeName: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  startDate: string;
  endDate: string;
  slotId: string | null;
  slotName: string | null;
  totalDays: number;
  reason: string;
  status: TimeOffStatus;
  requestedBy: number;
  requestedByName: string;
  requestedAt: string;
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  cancellationReason: string | null;
}

export interface CreateTimeOffRequestDto {
  employeeId: number;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  slotId: string | null;
  reason: string;
}

export interface RejectTimeOffRequestDto {
  rejectedReason: string;
}

export interface CancelTimeOffRequestDto {
  cancellationReason: string;
}

export interface TimeOffRequestListResponse {
  content: TimeOffRequest[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

export interface LeaveBalance {
  timeOffTypeId: string;
  timeOffTypeName: string;
  totalAllotted: number;
  used: number;
  remaining: number;
}

export interface EmployeeLeaveBalance {
  employeeId: number;
  employeeName: string;
  year: number;
  balances: LeaveBalance[];
}

// Available slots for half-day time off
export const AVAILABLE_SLOTS = [
  {
    slotId: 'SLOT_MORNING',
    slotName: 'Ca sáng',
    time: '07:00-12:00',
  },
  {
    slotId: 'SLOT_AFTERNOON',
    slotName: 'Ca chiều',
    time: '13:00-18:00',
  },
] as const;

// Status display configuration
export const TIME_OFF_STATUS_CONFIG = {
  [TimeOffStatus.PENDING]: {
    label: 'Chờ duyệt',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  [TimeOffStatus.APPROVED]: {
    label: 'Đã duyệt',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  [TimeOffStatus.REJECTED]: {
    label: 'Từ chối',
    color: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  [TimeOffStatus.CANCELLED]: {
    label: 'Đã hủy',
    color: 'secondary',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
};
