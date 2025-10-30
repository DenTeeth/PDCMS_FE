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
 */
export interface AvailableSlot {
  slotId: number;
  shiftName: string;
  dayOfWeek: DayOfWeek;
  remaining: number;
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
 */
export interface UpdateWorkSlotRequest {
  quota: number;
  isActive: boolean;
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
