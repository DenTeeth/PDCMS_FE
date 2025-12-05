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
  slotId?: string | null; // null for full-day, workShiftId for half-day (e.g., "WS001")
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

// Embedded employee info from backend
export interface EmployeeInfo {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface TimeOffRequest {
  requestId: string;
  employee: EmployeeInfo; //  Nested object from API
  requestedBy: EmployeeInfo; //  Nested object from API
  timeOffTypeId: string; //  From API
  timeOffTypeName?: string; //  NOT in API - need to lookup from timeOffTypes
  startDate: string; //  From API
  endDate: string; //  From API
  workShiftId?: string | null; //  From API (e.g., "WKS_MORNING_01")
  workShiftName?: string | null; //  NOT in API - need to lookup from workShifts
  totalDays?: number; //  NOT in API - need to calculate
  reason: string | null; //  From API
  status: TimeOffStatus; //  From API
  requestedAt: string; //  From API
  approvedBy?: EmployeeInfo | null; //  From API (nested object)
  approvedAt?: string | null; //  From API
  rejectedReason?: string | null; //  From API
  cancellationReason?: string | null; //  From API
}

export interface TimeOffRequestDetail extends TimeOffRequest {
  // Additional fields for detailed view if needed
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

/**
 * Admin Time Off Type DTOs (P6.1)
 */
export interface CreateTimeOffTypeDto {
  typeCode: string;
  typeName: string;
  description: string;
  requiresBalance: boolean;
  defaultDaysPerYear: number | null;
  isPaid: boolean;
}

export interface UpdateTimeOffTypeDto {
  typeCode?: string;
  typeName?: string;
  description?: string;
  requiresBalance?: boolean;
  defaultDaysPerYear?: number | null;
  isPaid?: boolean;
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
  // P6.1 Admin API error codes
  DUPLICATE_TYPE_CODE = 'DUPLICATE_TYPE_CODE',
  TIMEOFF_TYPE_NOT_FOUND = 'TIMEOFF_TYPE_NOT_FOUND',
  TIMEOFF_TYPE_IN_USE = 'TIMEOFF_TYPE_IN_USE',
}
