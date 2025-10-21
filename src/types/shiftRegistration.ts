/**
 * Shift Registration Type Definitions
 * 
 * Based on Part-time-registration.md - Complete API Implementation
 * Last updated: October 21, 2025
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
 * Shift Registration entity returned from API
 */
export interface ShiftRegistration {
  registrationId: string;
  employeeId: number;
  slotId: string;
  daysOfWeek: DayOfWeek[];
  effectiveFrom: string; // YYYY-MM-DD format
  effectiveTo?: string; // YYYY-MM-DD format, nullable
  isActive: boolean;
}

/**
 * Request payload for creating a new shift registration
 */
export interface CreateShiftRegistrationRequest {
  employeeId: number;
  workShiftId: string;
  daysOfWeek: DayOfWeek[];
  effectiveFrom: string; // YYYY-MM-DD format
  effectiveTo?: string; // YYYY-MM-DD format, optional
}

/**
 * Request payload for partial update (PATCH)
 */
export interface UpdateShiftRegistrationRequest {
  workShiftId?: string;
  daysOfWeek?: DayOfWeek[];
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
}

/**
 * Request payload for full replacement (PUT)
 */
export interface ReplaceShiftRegistrationRequest {
  workShiftId: string;
  daysOfWeek: DayOfWeek[];
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
  sortBy?: 'registrationId' | 'effectiveFrom' | 'employeeId';
  sortDirection?: 'ASC' | 'DESC';
  employeeId?: number;
  workShiftId?: string;
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
