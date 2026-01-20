/**
 * Work Slot Type Definitions
 * 
 * Based on Part-time-registration.md - Quota-based Part-Time Slot System
 * Last updated: January 2025
 */

/**
 * Part-Time Work Slot entity
 * dayOfWeek can be single day (e.g., "MONDAY") or comma-separated (e.g., "MONDAY,TUESDAY,THURSDAY")
 */
export interface PartTimeSlot {
  slotId: number;
  workShiftId: string;
  workShiftName: string;
  dayOfWeek: string;  // Changed from DayOfWeek enum to string to support comma-separated values
  quota: number;
  registered: number;
  isActive: boolean;
  effectiveFrom: string; // ISO date string (YYYY-MM-DD)
  effectiveTo: string;   // ISO date string (YYYY-MM-DD)
}

/**
 * Available Slot for Employee Registration
 * Response from GET /api/v1/registrations/part-time-flex/available-slots
 * 
 * dayOfWeek can be single day or comma-separated values
 */
export interface AvailableSlot {
  slotId: number;
  shiftName: string;
  dayOfWeek: string;  // Changed to string to support comma-separated days
  totalDatesAvailable: number;
  totalDatesEmpty: number;
  totalDatesFull: number;
  effectiveFrom: string;
  effectiveTo: string;
  quota: number;
  availabilitySummary: string;
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
  // Can be single day like "MONDAY" or comma-separated days like "MONDAY,TUESDAY"
  dayOfWeek: string;
  quota: number;
  effectiveFrom: string; // ISO date string (YYYY-MM-DD)
  effectiveTo: string;   // ISO date string (YYYY-MM-DD)
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
  // Optional filter; accepts DayOfWeek or comma-separated string of days
  dayOfWeek?: string | DayOfWeek;
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

/**
 * Registered Employee Information
 * Part of PartTimeSlotDetailResponse
 */
export interface RegisteredEmployeeInfo {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  effectiveFrom: string; // ISO date string
  effectiveTo: string;    // ISO date string
}

/**
 * Part-Time Slot Detail Response
 * Response from GET /api/v1/work-slots/{slotId}
 * Includes slot information and list of registered employees
 */
export interface PartTimeSlotDetailResponse {
  slotId: number;
  workShiftId: string;
  workShiftName: string;
  dayOfWeek: string; // DayOfWeek enum value as string
  quota: number;
  registered: number; // Count of active registrations
  isActive: boolean;
  registeredEmployees: RegisteredEmployeeInfo[];
}

/**
 * Monthly Availability Information
 * Part of SlotDetailsResponse
 * 
 * Updated based on Frontend Integration Guide (Issue #1)
 * - totalDatesAvailable: Dates with NO approved registrations (registered == 0)
 * - totalDatesPartial: Dates with some approved registrations but not full (0 < registered < quota)
 * - totalDatesFull: Dates at maximum capacity (registered >= quota)
 */
export interface MonthlyAvailability {
  month: string; // Format: "YYYY-MM"
  monthName?: string; // Format: "Month YYYY" (e.g., "November 2025") - optional for backward compatibility
  totalWorkingDays: number; // Total working days in this month for this day of week
  totalDatesAvailable: number; // Dates completely empty (registered == 0)
  totalDatesPartial: number; // Dates with some slots available (0 < registered < quota)
  totalDatesFull: number; // Dates at full capacity (registered >= quota)
  status: 'AVAILABLE' | 'FULL'; // AVAILABLE if has space, FULL if all dates full
}

/**
 * Slot Details Response
 * Response from GET /api/v1/registrations/part-time-flex/slots/{slotId}/details
 * Provides detailed availability information by month
 */
export interface SlotDetailsResponse {
  slotId: number;
  shiftName: string;
  dayOfWeek: string;
  quota: number;
  effectiveFrom: string; // ISO date string (YYYY-MM-DD)
  effectiveTo: string;   // ISO date string (YYYY-MM-DD)
  overallRemaining: number;
  registered: number; // ✨ NEW: Total number of registered employees (calculated as totalRequired - overallRemaining)
  availabilityByMonth: MonthlyAvailability[];
}
