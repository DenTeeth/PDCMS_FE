/**
 * Fixed Shift Registration Type Definitions
 * 
 * FE-303v2: Fixed Shift Registration API
 * For FULL_TIME and PART_TIME_FIXED employees
 * 
 * Base URL: /api/v1/fixed-registrations
 * Last updated: January 2025
 */

import { EmploymentType } from './employee';

/**
 * Fixed Shift Registration entity returned from API
 */
export interface FixedShiftRegistration {
  registrationId: number; // Number (not string like Part-Time Registration)
  employeeId: number;
  employeeName: string;
  workShiftId: string;
  workShiftName: string;
  daysOfWeek: number[]; // Array of numbers: 1=Monday, 7=Sunday
  effectiveFrom: string; // YYYY-MM-DD format
  effectiveTo: string | null; // YYYY-MM-DD format or null for unlimited
  isActive: boolean;
}

/**
 * Request payload for creating a new fixed shift registration
 */
export interface CreateFixedRegistrationRequest {
  employeeId: number;
  workShiftId: string;
  daysOfWeek: number[]; // Array of numbers 1-7 (Monday-Sunday)
  effectiveFrom: string; // YYYY-MM-DD format
  effectiveTo?: string | null; // Optional, null = unlimited
}

/**
 * Request payload for updating a fixed shift registration (PUT - all fields optional)
 */
export interface UpdateFixedRegistrationRequest {
  workShiftId?: string;
  daysOfWeek?: number[];
  effectiveFrom?: string;
  effectiveTo?: string | null; // Can set to null for unlimited
}

/**
 * Query parameters for fetching fixed shift registrations
 * Note: Response is direct array, not paginated
 */
export interface FixedRegistrationQueryParams {
  employeeId?: number; // Required for employees with VIEW_OWN permission
}

/**
 * API Response wrapper (if BE returns wrapped response)
 */
export interface FixedRegistrationResponse {
  statusCode?: number;
  data?: FixedShiftRegistration;
}

/**
 * Error codes for fixed registration operations
 */
export enum FixedRegistrationErrorCode {
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  WORK_SHIFT_NOT_FOUND = 'WORK_SHIFT_NOT_FOUND',
  FIXED_REGISTRATION_NOT_FOUND = 'FIXED_REGISTRATION_NOT_FOUND',
  INVALID_EMPLOYEE_TYPE = 'INVALID_EMPLOYEE_TYPE',
  DUPLICATE_FIXED_SHIFT_REGISTRATION = 'DUPLICATE_FIXED_SHIFT_REGISTRATION',
  EMPLOYEE_ID_REQUIRED = 'EMPLOYEE_ID_REQUIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}


