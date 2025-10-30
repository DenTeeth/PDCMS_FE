/**
 * Shift Registration Type Definitions
 * 
 * Based on Part-time-registration.md - Quota-based Part-Time Slot System
 * Last updated: January 2025
 */

/**
 * Day of Week enum for shift registrations
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY', 
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

/**
 * Shift Registration entity returned from API (New Quota-based System)
 */
export interface ShiftRegistration {
  registrationId: string; // Format: REG{YYYYMMDD}_{employeeId}_{slotId}
  employeeId: number;
  employeeName: string;
  partTimeSlotId: number; // Changed from slotId to partTimeSlotId
  shiftName: string;
  dayOfWeek: DayOfWeek; // Single day instead of array
  effectiveFrom: string; // YYYY-MM-DD format
  effectiveTo: string; // YYYY-MM-DD format (calculated: effectiveFrom + 3 months)
  isActive: boolean; // Changed from 'active' to 'isActive'
}

/**
 * Request payload for creating a new shift registration (New Quota-based System)
 */
export interface CreateShiftRegistrationRequest {
  partTimeSlotId: number; // Changed from workShiftId + daysOfWeek to partTimeSlotId
  effectiveFrom: string; // YYYY-MM-DD format
  // effectiveTo is calculated automatically (effectiveFrom + 3 months)
  // employeeId is determined from JWT token
}

/**
 * Request payload for partial update (PATCH) - Admin only
 */
export interface UpdateShiftRegistrationRequest {
  effectiveTo?: string; // Admin can update effectiveTo
  isActive?: boolean;
}

/**
 * Request payload for updating effectiveTo (Admin only)
 */
export interface UpdateEffectiveToRequest {
  effectiveTo: string; // YYYY-MM-DD format
}

/**
 * Request payload for full replacement (PUT) - Deprecated in new system
 */
export interface ReplaceShiftRegistrationRequest {
  partTimeSlotId: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

/**
 * Query parameters for fetching shift registrations
 */
export interface ShiftRegistrationQueryParams {
  page?: number;
  size?: number;
  sortBy?: 'registrationId' | 'effectiveFrom' | 'employeeId' | 'partTimeSlotId';
  sortDirection?: 'ASC' | 'DESC';
  employeeId?: number; // Admin can filter by employeeId
  isActive?: boolean;
}

/**
 * Paginated response for shift registrations
 */
export interface PaginatedShiftRegistrationResponse {
  content: ShiftRegistration[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

/**
 * API Response wrapper (if BE returns wrapped response)
 */
export interface ShiftRegistrationResponse {
  statusCode: number;
  data: ShiftRegistration;
}

export interface ShiftRegistrationListResponse {
  statusCode: number;
  data: ShiftRegistration[] | PaginatedShiftRegistrationResponse;
}

/**
 * Extended shift registration with employee and work shift details
 * For display purposes in admin interface
 */
export interface ShiftRegistrationWithDetails extends ShiftRegistration {
  employee?: {
    employeeCode: string;
    fullName: string;
    roleName: string;
  };
  workShift?: {
    shiftName: string;
    startTime: string;
    endTime: string;
    category: string;
  };
}

/**
 * Error codes for registration operations
 */
export enum RegistrationErrorCode {
  REGISTRATION_CONFLICT = 'REGISTRATION_CONFLICT',
  REGISTRATION_NOT_FOUND = 'REGISTRATION_NOT_FOUND',
  SLOT_IS_FULL = 'SLOT_IS_FULL',
  SLOT_NOT_FOUND = 'SLOT_NOT_FOUND'
}
