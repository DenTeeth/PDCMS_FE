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
class EmployeeService {
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
      ...filters
    } = params;

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ data: PaginatedResponse<Employee> }>(`${this.endpoint}/admin/all`, {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
        ...filters
      }
    });

    // API returns: { statusCode, message, data: { content, pageable, ... } }
    return response.data.data;
  }

  /**
   * Fetch a single employee by code
   * @param employeeCode Unique employee code (e.g., "EMP002")
   * @returns Employee details
   */
  async getEmployeeByCode(employeeCode: string): Promise<Employee> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ data: Employee }>(`${this.endpoint}/admin/${employeeCode}`);
    return response.data.data;
  }

  /**
   * Create a new employee (auto-creates account)
   * @param data Employee creation data (username, password, email, roleId, firstName, lastName, etc.)
   * @returns Created employee with account and specializations
   */
  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post<{ data: Employee }>(this.endpoint, data);
    return response.data.data;
  }

  /**
   * Update an existing employee (PATCH - partial update)
   * @param employeeCode Employee code to update
   * @param data Updated employee data (only fields to change)
   * @returns Updated employee
   */
  async updateEmployee(employeeCode: string, data: UpdateEmployeeRequest): Promise<Employee> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.patch<{ data: Employee }>(`${this.endpoint}/${employeeCode}`, data);
    return response.data.data;
  }

  /**
   * Delete an employee (soft delete - marks as inactive)
   * @param employeeCode Employee code to delete
   * @returns Success message
   */
  async deleteEmployee(employeeCode: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.delete<{ data?: any; message: string }>(`${this.endpoint}/${employeeCode}`);
    return { message: response.data.message };
  }
}

// Export singleton instance
export const employeeService = new EmployeeService();
