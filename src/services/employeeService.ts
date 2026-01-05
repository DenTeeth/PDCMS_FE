/**
 * Employee Service
 * 
 * Based on API_DOCUMENTATION.md - Section 2: Employee Management APIs
 * Last updated: October 9, 2025
 */

import { apiClient } from '@/lib/api';
import { 
  Employee, 
  CreateEmployeeRequest, 
  UpdateEmployeeRequest,
  PaginatedResponse,
  EmployeeQueryParams 
} from '@/types/employee';

/**
 * Employee Service Class
 * Handles all employee-related API operations
 */
export class EmployeeService {
  private readonly endpoint = '/employees';

  /**
   * Fetch all employees with pagination and filters
   * @param params Query parameters (page, size, sortBy, sortDirection, search, roleId, isActive)
   * @returns Paginated list of employees
   */
  async getEmployees(params: EmployeeQueryParams = {}): Promise<PaginatedResponse<Employee>> {
    const {
      page = 0,
      size = 12,
      sortBy = 'employeeCode',
      sortDirection = 'ASC',
      employeeType,
      ...filters
    } = params;

    // Map employeeType to employmentType for backend compatibility
    const queryParams: any = {
      page,
      size,
      sortBy,
      sortDirection,
    };
    
    // Only include filters that have actual values (not null/undefined)
    // This ensures that when isActive is not set, it won't be sent to BE
    // BE will then return all employees (both active and inactive)
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== null && value !== undefined) {
        queryParams[key] = value;
      }
    });
    
    if (employeeType) {
      queryParams.employmentType = employeeType; // Backend expects employmentType
    }

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}`, {
      params: queryParams
    });

    // BE có thể trả về trực tiếp hoặc wrapped trong { data }
    if (response.data?.data) {
      return response.data.data;
    }
    
    // Nếu BE trả về trực tiếp pagination object
    return response.data;
  }

  /**
   * Fetch a single employee by code
   * @param employeeCode Unique employee code (e.g., "EMP002")
   * @returns Employee details
   */
  async getEmployeeByCode(employeeCode: string): Promise<Employee> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/admin/${employeeCode}`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Create a new employee (auto-creates account)
   * @param data Employee creation data (username, password, email, roleId, firstName, lastName, etc.)
   * @returns Created employee with account and specializations
   */
  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    // Map employeeType to employmentType for backend compatibility
    const payload = {
      ...data,
      employmentType: data.employeeType, // Backend expects employmentType
    };
    delete (payload as any).employeeType; // Remove frontend field
    
    const response = await axiosInstance.post(this.endpoint, payload);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Update an existing employee (PATCH - partial update)
   * @param employeeCode Employee code to update
   * @param data Updated employee data (only fields to change)
   * @returns Updated employee
   */
  async updateEmployee(employeeCode: string, data: UpdateEmployeeRequest): Promise<Employee> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    // Map employeeType to employmentType for backend compatibility if present
    const payload = { ...data };
    if (data.employeeType) {
      (payload as any).employmentType = data.employeeType;
      delete (payload as any).employeeType;
    }
    
    const response = await axiosInstance.patch(`${this.endpoint}/${employeeCode}`, payload);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Delete an employee (soft delete - marks as inactive)
   * @param employeeCode Employee code to delete
   * @returns Success message
   */
  async deleteEmployee(employeeCode: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.delete(`${this.endpoint}/${employeeCode}`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();
