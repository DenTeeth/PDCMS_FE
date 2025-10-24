/**
 * Shift Renewal Request Types
 * Based on SHIFT_API.md specification (BE-307)
 */

export enum ShiftRenewalStatus {
  PENDING_ACTION = 'PENDING_ACTION',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export enum RenewalAction {
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
}

export interface WorkShiftInfo {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
}

export interface RegistrationDetails {
  registrationId: string;
  effectiveFrom: string;
  effectiveTo: string;
  registeredDays: string[];
  workShifts: WorkShiftInfo[];
}

export interface ShiftRenewalRequest {
  renewalId: string;
  expiringRegistrationId: string;
  employeeId: number;
  employeeName: string;
  status: ShiftRenewalStatus;
  expiresAt: string;
  confirmedAt: string | null;
  message: string;
  registrationDetails: RegistrationDetails;
  daysUntilExpiry?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RespondRenewalDto {
  action: RenewalAction;
}

export interface ShiftRenewalListResponse {
  renewals: ShiftRenewalRequest[];
  totalPending: number;
  message?: string;
}

// Status display configuration
export const SHIFT_RENEWAL_STATUS_CONFIG = {
  [ShiftRenewalStatus.PENDING_ACTION]: {
    label: 'Chờ phản hồi',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  [ShiftRenewalStatus.CONFIRMED]: {
    label: 'Đã xác nhận',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  [ShiftRenewalStatus.DECLINED]: {
    label: 'Từ chối',
    color: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  [ShiftRenewalStatus.EXPIRED]: {
    label: 'Hết hạn',
    color: 'secondary',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
};
