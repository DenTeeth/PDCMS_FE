/**
 * Permission Service
 * 
 * Handles permission-related API operations
 * Last updated: October 9, 2025
 */

import { apiClient } from '@/lib/api';
import { Permission } from '@/types/admin';

/**
 * Permission Service Class
 * Handles permission API operations
 */
class PermissionService {
  /**
   * Fetch all permissions
   * @returns Array of permissions with role associations
   */
  async getPermissions(): Promise<Permission[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ statusCode: number; message: string; data: Permission[] }>('/permissions');
    return response.data.data;
  }
}

export const permissionService = new PermissionService();
