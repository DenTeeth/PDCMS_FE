/**
 * Role & Permission Service
 * 
 * Based on API_DOCUMENTATION.md - Section 4: Role & Permission APIs
 * Last updated: October 9, 2025
 */

import { apiClient } from '@/lib/api';
import { Role, Permission, Specialization } from '@/types/employee';

/**
 * Role Service Class
 * Handles role, permission, and specialization API operations
 */
class RoleService {
  /**
   * Fetch all roles with permissions
   * @returns Array of roles
   */
  async getRoles(): Promise<Role[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/roles');
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const data = extractApiResponse<Role[]>(response);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch roles that can be assigned to employees (excludes ROLE_PATIENT)
   * @returns Array of employee-assignable roles
   */
  async getEmployeeAssignableRoles(): Promise<Role[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/roles/employee-assignable');
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const data = extractApiResponse<Role[]>(response);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetch role by ID
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @returns Role details
   */
  async getRoleById(roleId: string): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/roles/${roleId}`);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<Role>(response);
  }

  /**
   * Fetch permissions for a specific role
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @returns Array of permissions for the role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/roles/${roleId}/permissions`);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const result = extractApiResponse<Permission[]>(response);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Fetch all permissions
   * @returns Array of permissions
   */
  async getPermissions(): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/permissions');
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const result = extractApiResponse<Permission[]>(response);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Fetch all specializations (for doctor roles)
   * @returns Array of specializations
   */
  async getSpecializations(): Promise<Specialization[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/specializations');
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const result = extractApiResponse<Specialization[]>(response);
    return Array.isArray(result) ? result : [];
  }

  /**
   * Fetch specialization by ID
   * @param specializationId Specialization UUID
   * @returns Specialization details
   */
  async getSpecializationById(specializationId: string): Promise<Specialization> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/specializations/${specializationId}`);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<Specialization>(response);
  }

  /**
   * Create a new role
   * @param data Role creation data (roleId, roleName, description, baseRoleId, requiresSpecialization)
   * @returns Created role
   */
  async createRole(data: { roleId: string; roleName: string; description: string; baseRoleId: number; requiresSpecialization: boolean }): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post('/roles', data);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<Role>(response);
  }

  /**
   * Update role by ID
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @param data Update data (roleName, description)
   * @returns Updated role
   */
  async updateRole(roleId: string, data: { roleName: string; description: string }): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.put(`/roles/${roleId}`, data);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<Role>(response);
  }

  /**
   * Assign permissions to role
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @param permissionIds Array of permission IDs to assign
   * @returns Success response
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.post(`/roles/${roleId}/permissions`, permissionIds);
  }

  /**
   * Delete role by ID (soft delete - marks as inactive)
   * @param roleId Role ID (e.g., "ROLE_CUSTOM")
   * @returns Success message
   */
  async deleteRole(roleId: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.delete(`/roles/${roleId}`);
    
    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<{ message: string }>(response);
  }
}

// Export singleton instance
export const roleService = new RoleService();
