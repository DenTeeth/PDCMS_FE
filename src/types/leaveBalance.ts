/**
 * Leave Balance Management Types
 * Based on BE P6.1/P6.2 specification
 */

// ==================== Leave Balance ====================

export interface LeaveBalance {
  balance_id: string;
  employee_id: number;
  time_off_type_id: string;
  type_name: string;
  type_code: string;
  cycle_year: number;
  total_days_allowed: number;
  days_taken: number;
  days_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLeaveBalancesResponse {
  employee_id: number;
  employee_name: string;
  cycle_year: number;
  balances: LeaveBalance[];
}

// ==================== Manual Adjustment ====================

export interface AdjustBalanceRequest {
  employee_id: number;
  time_off_type_id: string;
  cycle_year: number;
  change_amount: number; // Positive = add, Negative = subtract
  notes: string;
}

export interface AdjustBalanceResponse {
  balance_id: string;
  employee_id: number;
  time_off_type_id: string;
  cycle_year: number;
  total_days_allowed: number;
  days_taken: number;
  days_remaining: number;
  message: string;
}

// ==================== Annual Reset ====================

export interface AnnualResetRequest {
  cycle_year: number;
  apply_to_type_id: string;
  default_allowance: number;
}

export interface AnnualResetResponse {
  message: string;
  cycle_year: number;
  apply_to_type_id: string;
  default_allowance: number;
  employees_affected: number;
}

// ==================== Error Codes ====================

export type LeaveBalanceErrorCode =
  | 'INVALID_BALANCE'           // 400 - Balance would be negative
  | 'INVALID_YEAR'              // 400 - Invalid cycle year
  | 'RELATED_RESOURCE_NOT_FOUND' // 404 - Employee or Type not found
  | 'JOB_ALREADY_RUN'           // 409 - Annual reset already run for this year
  | 'FORBIDDEN';                 // 403 - No permission

// ==================== UI State ====================

export interface BalanceViewerState {
  selectedEmployeeId: number | null;
  selectedYear: number;
  balances: LeaveBalance[];
  loading: boolean;
  error: string | null;
}

export interface AdjustmentFormData {
  timeOffTypeId: string;
  cycleYear: number;
  changeAmount: number | null;
  notes: string;
}

export interface AnnualResetFormData {
  cycleYear: number;
  applyToTypeId: string;
  defaultAllowance: number | null;
}
