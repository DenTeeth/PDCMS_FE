/**
 * Work Slot Type Definitions
 * 
 * Based on Part-time-registration.md - Quota-based Part-Time Slot System
 * Last updated: January 2025
 */

/**
 * Part-Time Work Slot entity
 */
export interface PartTimeSlot {
  slotId: number;
  workShiftId: string;
  workShiftName: string;
  dayOfWeek: DayOfWeek;
  quota: number;
  registered: number;
  isActive: boolean;
  effectiveFrom: string; // ISO datetime string
}

/**
 * Available Slot for Employee Registration
 * Response from GET /api/v1/registrations/available-slots
 * 
 * Note: API response only includes: slotId, shiftName, dayOfWeek, remaining
 * workShiftId, quota, registered are optional (may not be in response)
 */
export interface AvailableSlot {
  slotId: number;
  shiftName: string;    // Note: shiftName (not workShiftName)
  dayOfWeek: DayOfWeek;
  remaining: number;    // Number of available spots
  workShiftId?: string; // Optional: ID of work shift (may not be in response)
  quota?: number;       // Optional: Total quota (may not be in response)
  registered?: number;  // Optional: Number of registrations (may not be in response)
}

/**
 * Day of Week enum
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
 * Request payload for creating a new work slot
 */
export interface CreateWorkSlotRequest {
  workShiftId: string;
  dayOfWeek: DayOfWeek;
  quota: number;
}

/**
 * Request payload for updating a work slot
 * Note: Both fields are optional (can update independently)
 */
export interface UpdateWorkSlotRequest {
  quota?: number;       // Optional: Can update quota only
  isActive?: boolean;   // Optional: Can update isActive only
}

/**
 * Query parameters for fetching work slots
 */
export interface WorkSlotQueryParams {
  page?: number;
  size?: number;
  sortBy?: 'slotId' | 'dayOfWeek' | 'quota' | 'registered';
  sortDirection?: 'ASC' | 'DESC';
  workShiftId?: string;
  dayOfWeek?: DayOfWeek;
  isActive?: boolean;
}

/**
 * Paginated response for work slots
 */
export interface PaginatedWorkSlotResponse {
  content: PartTimeSlot[];
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
 * API Response wrapper
 */
export interface WorkSlotResponse {
  statusCode: number;
  data: PartTimeSlot;
}

export interface WorkSlotListResponse {
  statusCode: number;
  data: PartTimeSlot[] | PaginatedWorkSlotResponse;
}

/**
 * Error codes for work slot operations
 */
export enum WorkSlotErrorCode {
  SLOT_ALREADY_EXISTS = 'SLOT_ALREADY_EXISTS',
  SLOT_NOT_FOUND = 'SLOT_NOT_FOUND',
  QUOTA_VIOLATION = 'QUOTA_VIOLATION',
  SLOT_IS_FULL = 'SLOT_IS_FULL'
}
