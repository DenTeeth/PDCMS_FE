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
   * @param roleId Role UUID
   * @returns Role details with permissions
   */
  async getRoleById(roleId: string): Promise<Role> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ data: Role }>(`/roles/${roleId}`);
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
}

// Export singleton instance
export const roleService = new RoleService();
