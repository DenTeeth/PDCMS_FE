/**
 * Time Off Request Types
 * Based on Time_Off_Request.md API specification
 */

export enum TimeOffStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum TimeOffSlot {
  MORNING = 'SLOT_MORNING',
  AFTERNOON = 'SLOT_AFTERNOON'
}

export const TIME_OFF_STATUS_CONFIG = {
  [TimeOffStatus.PENDING]: {
    label: 'Chờ duyệt',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  [TimeOffStatus.APPROVED]: {
    label: 'Đã duyệt',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  [TimeOffStatus.REJECTED]: {
    label: 'Từ chối',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  [TimeOffStatus.CANCELLED]: {
    label: 'Đã hủy',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  }
};

export const TIME_OFF_SLOT_CONFIG = {
  [TimeOffSlot.MORNING]: {
    label: 'Ca sáng',
    time: '07:00-12:00'
  },
  [TimeOffSlot.AFTERNOON]: {
    label: 'Ca chiều',
    time: '13:00-18:00'
  }
};

/**
 * Time Off Request DTOs
 */
export interface CreateTimeOffRequestDto {
  employeeId?: number; // Optional for self-requests (inferred from JWT)
  timeOffTypeId: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  slotId?: TimeOffSlot | null; // null for full-day, SLOT_* for half-day
  reason: string;
}

export interface UpdateTimeOffStatusDto {
  status: TimeOffStatus;
  rejectedReason?: string;
  cancellationReason?: string;
}

export interface ApproveTimeOffRequestDto {
  // Empty body for approval
}

export interface RejectTimeOffRequestDto {
  rejectedReason: string;
}

export interface CancelTimeOffRequestDto {
  cancellationReason: string;
}

/**
 * Time Off Request Response Types
 */
export interface TimeOffRequest {
  requestId: string;
  employeeId: number;
  employeeName: string;
  timeOffTypeId: string;
  timeOffTypeName: string;
  startDate: string;
  endDate: string;
  slotId?: TimeOffSlot | null;
  slotName?: string | null;
  totalDays: number;
  reason: string;
  status: TimeOffStatus;
  requestedBy: number;
  requestedByName: string;
  requestedAt: string;
  approvedBy?: number | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  cancellationReason?: string | null;
}

export interface TimeOffRequestDetail extends TimeOffRequest {
  // Additional fields for detailed view
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

/**
 * Time Off Type Types
 */
export interface TimeOffType {
  typeId: string;
  typeName: string;
  typeCode: string;
  description: string | null;
  requiresApproval: boolean;
  requiresBalance: boolean;
  defaultDaysPerYear: number | null;
  isPaid: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}


export interface TimeOffTypeListResponse {
  content: TimeOffType[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}


/**
 * Error Response Types
 */
export interface TimeOffErrorResponse {
  status: number;
  message: string;
  timestamp: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export enum TimeOffErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_SLOT_USAGE = 'INVALID_SLOT_USAGE',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  MISSING_REJECTION_REASON = 'MISSING_REJECTION_REASON',
  TYPE_NOT_FOUND = 'TYPE_NOT_FOUND',
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  DUPLICATE_TYPE_CODE = 'DUPLICATE_TYPE_CODE',
  TYPE_IN_USE = 'TYPE_IN_USE'
}
