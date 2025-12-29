/**
 * Fixed Shift Registration Service
 * 
 * FE-303v2: Fixed Shift Registration API
 * For FULL_TIME and PART_TIME_FIXED employees
 * 
 * Base URL: /api/v1/fixed-registrations
 * Last updated: January 2025
 */

import { apiClient } from '@/lib/api';
import {
  FixedShiftRegistration,
  CreateFixedRegistrationRequest,
  UpdateFixedRegistrationRequest,
  FixedRegistrationQueryParams,
  FixedRegistrationResponse,
  FixedRegistrationErrorCode
} from '@/types/fixedRegistration';

/**
 * Fixed Shift Registration Service Class
 * Handles all fixed shift registration-related API operations
 */
class FixedRegistrationService {
  private readonly endpoint = '/fixed-registrations';

  /**
   * Fetch all fixed shift registrations
   * Response: Direct array (not paginated)
   * @param params Query parameters (employeeId is optional for admins, required for employees with VIEW_OWN)
   * @returns Array of fixed shift registrations
   */
  async getRegistrations(params?: FixedRegistrationQueryParams): Promise<FixedShiftRegistration[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(this.endpoint, {
      params: params
    });

    // Handle both response structures
    // Case 1: Direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Case 2: Wrapped response { statusCode, data: [...] }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Case 3: Single object wrapped
    if (response.data?.data && !Array.isArray(response.data.data)) {
      return [response.data.data];
    }
    
    // Fallback: return empty array
    return [];
  }

  /**
   * Fetch a single fixed shift registration by ID
   * @param registrationId Registration ID (number)
   * @returns Fixed shift registration details
   */
  async getRegistrationById(registrationId: number): Promise<FixedShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<FixedRegistrationResponse>(`${this.endpoint}/${registrationId}`);
    
    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as FixedShiftRegistration;
  }

  /**
   * Create a new fixed shift registration
   * @param data Registration data (camelCase format)
   * @returns Created fixed shift registration
   */
  async createRegistration(data: CreateFixedRegistrationRequest): Promise<FixedShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.post<FixedRegistrationResponse>(this.endpoint, data);
      
      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as FixedShiftRegistration;
    } catch (error: any) {
      // Re-throw with more specific error message
      if (error.response?.data?.errorCode) {
        const errorCode = error.response.data.errorCode;
        const message = error.response.data.message || error.response.data.detail || 'Failed to create fixed shift registration';
        const customError = new Error(message);
        (customError as any).errorCode = errorCode;
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Không thể tạo đăng ký ca cố định');
      }
    }
  }

  /**
   * Update a fixed shift registration (PATCH - all fields optional)
   * @param registrationId Registration ID to update
   * @param data Partial update data (all fields optional)
   * @returns Updated fixed shift registration
   */
  async updateRegistration(registrationId: number, data: UpdateFixedRegistrationRequest): Promise<FixedShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.patch<FixedRegistrationResponse>(`${this.endpoint}/${registrationId}`, data);
      
      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as FixedShiftRegistration;
    } catch (error: any) {
      if (error.response?.data?.errorCode) {
        const errorCode = error.response.data.errorCode;
        const message = error.response.data.message || error.response.data.detail || 'Failed to update fixed shift registration';
        const customError = new Error(message);
        (customError as any).errorCode = errorCode;
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.message) {
        const message = error.response.data.message || 'Failed to update fixed shift registration';
        throw new Error(message);
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail || 'Failed to update fixed shift registration';
        throw new Error(detail);
      } else if (error.response?.data?.error) {
        const errorMsg = error.response.data.error || 'Failed to update fixed shift registration';
        throw new Error(errorMsg);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Không thể cập nhật đăng ký ca cố định');
      }
    }
  }

  /**
   * Delete (soft delete) a fixed shift registration
   * @param registrationId Registration ID to delete
   * @returns void (204 No Content)
   */
  async deleteRegistration(registrationId: number): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      await axiosInstance.delete(`${this.endpoint}/${registrationId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Không thể xóa đăng ký ca cố định');
      }
    }
  }
}

// Export singleton instance
export const fixedRegistrationService = new FixedRegistrationService();


