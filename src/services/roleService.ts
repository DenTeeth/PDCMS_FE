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
    
    // BE có thể trả về wrapped hoặc trực tiếp
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Fetch role by ID
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @returns Role details
   */
  async getRoleById(roleId: string): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/roles/${roleId}`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Fetch permissions for a specific role
   * @param roleId Role ID (e.g., "ROLE_ADMIN")
   * @returns Array of permissions for the role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/roles/${roleId}/permissions`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Fetch all permissions
   * @returns Array of permissions
   */
  async getPermissions(): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/permissions');
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Fetch all specializations (for doctor roles)
   * @returns Array of specializations
   */
  async getSpecializations(): Promise<Specialization[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/specializations');
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Fetch specialization by ID
   * @param specializationId Specialization UUID
   * @returns Specialization details
   */
  async getSpecializationById(specializationId: string): Promise<Specialization> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/specializations/${specializationId}`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Create a new role
   * @param data Role creation data (roleId, roleName, description)
   * @returns Created role
   */
  async createRole(data: { roleId: string; roleName: string; description: string }): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post('/roles', data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
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
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
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
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }
}

// Export singleton instance
export const roleService = new RoleService();
