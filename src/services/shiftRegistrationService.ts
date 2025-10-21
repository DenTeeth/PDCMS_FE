/**
 * Shift Registration Service
 * 
 * Based on Part-time-registration.md - Complete API Implementation
 * Last updated: October 21, 2025
 */

import { apiClient } from '@/lib/api';
import {
  ShiftRegistration,
  CreateShiftRegistrationRequest,
  UpdateShiftRegistrationRequest,
  ReplaceShiftRegistrationRequest,
  ShiftRegistrationQueryParams,
  PaginatedShiftRegistrationResponse,
  ShiftRegistrationResponse,
  ShiftRegistrationListResponse
} from '@/types/shiftRegistration';

/**
 * Shift Registration Service Class
 * Handles all shift registration-related API operations
 */
class ShiftRegistrationService {
  private readonly endpoint = '/registrations';

  /**
   * Fetch all shift registrations with pagination and filters
   * @param params Query parameters (page, size, sortBy, sortDirection, employeeId, workShiftId, isActive)
   * @returns Paginated list of shift registrations
   */
  async getRegistrations(params: ShiftRegistrationQueryParams = {}): Promise<PaginatedShiftRegistrationResponse> {
    const {
      page = 0,
      size = 10,
      sortBy = 'effectiveFrom',
      sortDirection = 'DESC',
      ...filters
    } = params;

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(this.endpoint, {
      params: {
        page,
        size,
        sort: `${sortBy},${sortDirection.toLowerCase()}`,
        ...filters
      }
    });

    // Handle both response structures
    // Case 1: { statusCode, data: {...} }
    // Case 2: Direct pagination object
    if (response.data?.data) {
      return response.data.data;
    }
    
    // If BE returns direct pagination object
    return response.data;
  }

  /**
   * Fetch a single shift registration by ID
   * @param registrationId Unique registration ID (e.g., "REG-250120-001")
   * @returns Shift registration details
   */
  async getRegistrationById(registrationId: string): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<ShiftRegistrationResponse>(`${this.endpoint}/${registrationId}`);
    
    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as ShiftRegistration;
  }

  /**
   * Create a new shift registration
   * @param data Registration data
   * @returns Created shift registration
   */
  async createRegistration(data: CreateShiftRegistrationRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post<ShiftRegistrationResponse>(this.endpoint, data);
    
    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as ShiftRegistration;
  }

  /**
   * Partially update a shift registration (PATCH)
   * @param registrationId Registration ID to update
   * @param data Partial update data
   * @returns Updated shift registration
   */
  async updateRegistration(registrationId: string, data: UpdateShiftRegistrationRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.patch<ShiftRegistrationResponse>(`${this.endpoint}/${registrationId}`, data);
    
    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as ShiftRegistration;
  }

  /**
   * Fully replace a shift registration (PUT)
   * @param registrationId Registration ID to replace
   * @param data Complete replacement data
   * @returns Replaced shift registration
   */
  async replaceRegistration(registrationId: string, data: ReplaceShiftRegistrationRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.put<ShiftRegistrationResponse>(`${this.endpoint}/${registrationId}`, data);
    
    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as ShiftRegistration;
  }

  /**
   * Delete (soft delete) a shift registration
   * @param registrationId Registration ID to delete
   */
  async deleteRegistration(registrationId: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.delete(`${this.endpoint}/${registrationId}`);
  }

  /**
   * Get registrations for current user (employee)
   * Uses the same endpoint but with user's token, BE will filter by ownership
   * @param params Query parameters
   * @returns User's shift registrations
   */
  async getMyRegistrations(params: ShiftRegistrationQueryParams = {}): Promise<PaginatedShiftRegistrationResponse> {
    // Same as getRegistrations, but BE will filter based on user's permissions
    return this.getRegistrations(params);
  }

  /**
   * Reactivate a soft-deleted registration
   * @param registrationId Registration ID to reactivate
   * @returns Reactivated shift registration
   */
  async reactivateRegistration(registrationId: string): Promise<ShiftRegistration> {
    return this.updateRegistration(registrationId, { isActive: true });
  }
}

// Export singleton instance
export const shiftRegistrationService = new ShiftRegistrationService();
