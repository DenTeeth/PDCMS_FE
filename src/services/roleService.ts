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
    const response = await axiosInstance.get<{ statusCode: number; message: string; data: Role[] }>('/roles');
    return response.data.data; // data is directly an array of roles
  }

  /**
   * Fetch role by ID
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @returns Role details
   */
  async getRoleById(roleId: string): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ statusCode: number; message: string; data: Role }>(`/roles/${roleId}`);
    return response.data.data;
  }

  /**
   * Fetch permissions for a specific role
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @returns Array of permissions for the role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ statusCode: number; message: string; data: Permission[] }>(`/roles/${roleId}/permissions`);
    return response.data.data;
  }

  /**
   * Fetch all permissions
   * @returns Array of permissions
   */
  async getPermissions(): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ data: Permission[] }>('/permissions');
    return response.data.data;
  }

  /**
   * Fetch all specializations (for doctor roles)
   * @returns Array of specializations
   */
  async getSpecializations(): Promise<Specialization[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ data: Specialization[] }>('/specializations');
    return response.data.data;
  }

  /**
   * Fetch specialization by ID
   * @param specializationId Specialization UUID
   * @returns Specialization details
   */
  async getSpecializationById(specializationId: string): Promise<Specialization> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ data: Specialization }>(`/specializations/${specializationId}`);
    return response.data.data;
  }

  /**
   * Create a new role
   * @param data Role creation data (roleId, roleName, description)
   * @returns Created role
   */
  async createRole(data: { roleId: string; roleName: string; description: string }): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post<{ statusCode: number; message: string; data: Role }>('/roles', data);
    return response.data.data;
  }

  /**
   * Update role by ID
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @param data Update data (roleName, description)
   * @returns Updated role
   */
  async updateRole(roleId: string, data: { roleName: string; description: string }): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.put<{ statusCode: number; message: string; data: Role }>(`/roles/${roleId}`, data);
    return response.data.data;
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
}

// Export singleton instance
export const roleService = new RoleService();
