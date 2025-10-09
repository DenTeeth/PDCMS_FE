/**
 * Employee Type Definitions
 * 
 * Based on API_DOCUMENTATION.md - Section 2: Employee Management APIs
 * Last updated: October 9, 2025
 */

/**
 * Employee Account Information (nested in Employee)
 */
export interface EmployeeAccount {
  accountId: string;
  username: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Specialization (for Doctors)
 */
export interface Specialization {
  specializationId: string;
  specializationCode: string;
  specializationName: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Permission
 */
export interface Permission {
  permissionId: string;
  resource: string;
  action: string;
  description: string;
}

/**
 * Role with permissions
 */
export interface Role {
  roleId: string;
  roleName: string; // API returns roleName, not name
  description: string;
  isActive: boolean;
  createdAt?: string;
  permissions?: Permission[];
}

/**
 * Employee entity returned from API
 */
export interface Employee {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  account: EmployeeAccount;
  specializations: Specialization[];
}

/**
 * Request payload for creating a new employee
 * Requires: username, password, email, roleId, firstName, lastName
 * Optional: phone, dateOfBirth, address, specializationIds
 */
export interface CreateEmployeeRequest {
  username: string;
  email: string;
  password: string;
  roleId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  specializationIds?: string[];
}

/**
 * Request payload for updating an existing employee (PATCH - partial update)
 * All fields are optional
 */
export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  specializationIds?: string[];
}

/**
 * Generic paginated API response
 */
export interface PaginatedResponse<T> {
  content: T[];
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
 * Query parameters for fetching employees
 */
export interface EmployeeQueryParams {
  page?: number;
  size?: number;
  sortBy?: 'employeeCode' | 'firstName' | 'lastName' | 'createdAt';
  sortDirection?: 'ASC' | 'DESC';
  search?: string;
  roleId?: string;
  isActive?: boolean;
}
