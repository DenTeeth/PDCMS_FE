/**
 * Shift Registration Service
 * 
 * Based on Part-time-registration.md - Quota-based Part-Time Slot System
 * Last updated: January 2025
 */

import { apiClient } from '@/lib/api';
import {
  ShiftRegistration,
  CreateShiftRegistrationRequest,
  UpdateShiftRegistrationRequest,
  UpdateEffectiveToRequest,
  ShiftRegistrationQueryParams,
  PaginatedShiftRegistrationResponse,
  ShiftRegistrationResponse,
  ShiftRegistrationListResponse,
  RegistrationErrorCode
} from '@/types/shiftRegistration';
import { AvailableSlot, SlotDetailsResponse } from '@/types/workSlot';

/**
 * Shift Registration Service Class
 * Handles all shift registration-related API operations
 */
class ShiftRegistrationService {
  private readonly endpoint = '/registrations';

  /**
   * Fetch all shift registrations
   * According to API spec: Can return array OR paginated response
   * - Employee view (VIEW_OWN): Returns array directly
   * - Admin view (UPDATE_REGISTRATIONS_ALL): May return array or paginated
   * @param params Query parameters (page, size, sortBy, sortDirection, employeeId, isActive)
   * @param type Registration type filter ('part-time-flex' | 'all')
   * @returns Array of registrations OR paginated response
   */
  async getRegistrations(
    params: ShiftRegistrationQueryParams = {},
    type: 'part-time-flex' | 'all' = 'part-time-flex'
  ): Promise<ShiftRegistration[] | PaginatedShiftRegistrationResponse> {
    const {
      page = 0,
      size = 10,
      sortBy = 'effectiveFrom',
      sortDirection = 'DESC',
      ...filters
    } = params;

    // Use different endpoints based on type
    const endpoint = type === 'part-time-flex'
      ? '/registrations/part-time-flex'
      : this.endpoint;

    console.log(`📡 [getRegistrations] Fetching ${type} registrations from ${endpoint}...`);

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(endpoint, {
      params: {
        page,
        size,
        sort: `${sortBy},${sortDirection.toLowerCase()}`,
        ...filters
      }
    });

    // Handle both response structures
    // Case 1: Direct array response (Employee view, Admin view)
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Case 2: Wrapped array response { statusCode, data: [...] }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // Case 3: Paginated response { content: [...], totalPages, ... }
    if (response.data?.content && Array.isArray(response.data.content)) {
      return response.data;
    }

    // Case 4: Wrapped paginated response { statusCode, data: { content: [...] } }
    if (response.data?.data?.content && Array.isArray(response.data.data.content)) {
      return response.data.data;
    }

    // Fallback: return empty array
    return [];
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
   * Create a new shift registration (Employee claims a slot)
   * API: POST /registrations/part-time-flex
   * @param data Registration data (partTimeSlotId, effectiveFrom)
   * @returns Created shift registration
   */
  async createRegistration(data: CreateShiftRegistrationRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.post<ShiftRegistrationResponse>('/registrations/part-time-flex', data);

      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as ShiftRegistration;
    } catch (error: any) {
      // Handle specific error codes
      if (error.response?.data?.errorCode === RegistrationErrorCode.INVALID_EMPLOYEE_TYPE) {
        const message = error.response.data.message || 'Chỉ nhân viên PART_TIME_FLEX mới có thể đăng ký ca linh hoạt.';
        const customError = new Error(message);
        (customError as any).errorCode = RegistrationErrorCode.INVALID_EMPLOYEE_TYPE;
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.errorCode === RegistrationErrorCode.SLOT_IS_FULL) {
        const message = error.response.data.message || 'Suất này đã đủ người đăng ký.';
        const customError = new Error(message);
        (customError as any).errorCode = RegistrationErrorCode.SLOT_IS_FULL;
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.errorCode === RegistrationErrorCode.REGISTRATION_CONFLICT) {
        const message = error.response.data.message || 'Bạn đã đăng ký suất này rồi hoặc có ca làm việc trùng giờ.';
        const customError = new Error(message);
        (customError as any).errorCode = RegistrationErrorCode.REGISTRATION_CONFLICT;
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.errorCode === RegistrationErrorCode.WORK_SLOT_NOT_FOUND) {
        const message = error.response.data.message || 'Suất này đã bị đóng hoặc không tồn tại.';
        const customError = new Error(message);
        (customError as any).errorCode = RegistrationErrorCode.WORK_SLOT_NOT_FOUND;
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.errorCode) {
        const errorCode = error.response.data.errorCode;
        const message = error.response.data.message || error.response.data.detail || 'Failed to create shift registration';
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
        throw new Error('Failed to create shift registration');
      }
    }
  }

  /**
   * Partially update a shift registration (PATCH) - Admin only
   * @param registrationId Registration ID to update
   * @param data Partial update data
   * @returns Updated shift registration
   */
  async updateRegistration(registrationId: string, data: UpdateShiftRegistrationRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.patch<ShiftRegistrationResponse>(`${this.endpoint}/${registrationId}`, data);

      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as ShiftRegistration;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to update shift registration');
      }
    }
  }

  /**
   * Update effectiveTo date (Admin only)
   * @param registrationId Registration ID to update
   * @param data EffectiveTo update data
   * @returns Updated shift registration
   */
  async updateEffectiveTo(registrationId: string, data: UpdateEffectiveToRequest): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.patch<ShiftRegistrationResponse>(`${this.endpoint}/${registrationId}/effective-to`, data);

      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as ShiftRegistration;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to update effective date');
      }
    }
  }

  /**
   * Get available slots for employee registration
   * API: GET /registrations/part-time-flex/available-slots
   * @returns List of available slots with remaining quota
   */
  async getAvailableSlots(): Promise<AvailableSlot[]> {
    console.log('🌐 [shiftRegistrationService.getAvailableSlots] Making API call to /registrations/part-time-flex/available-slots...');
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.get('/registrations/part-time-flex/available-slots');

      console.log('📥 [shiftRegistrationService.getAvailableSlots] API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A'
      });

      // Handle both response structures
      let slots: AvailableSlot[] = [];

      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('✅ [shiftRegistrationService.getAvailableSlots] Found wrapped array response.data.data');
        slots = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ [shiftRegistrationService.getAvailableSlots] Found direct array response.data');
        slots = response.data;
      } else {
        console.warn('⚠️ [shiftRegistrationService.getAvailableSlots] Unexpected response structure:', response.data);
        slots = [];
      }

      console.log('📊 [shiftRegistrationService.getAvailableSlots] Returning slots:', {
        count: slots.length,
        slots: slots
      });

      return slots;
    } catch (error: any) {
      console.error('❌ [shiftRegistrationService.getAvailableSlots] API Error:', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get detailed slot information with monthly availability
   * API: GET /registrations/part-time-flex/slots/{slotId}/details
   * @param slotId Part-time slot ID
   * @returns Detailed slot information including availability by month
   */
  async getSlotDetails(slotId: number): Promise<SlotDetailsResponse> {
    console.log(`🌐 [shiftRegistrationService.getSlotDetails] Making API call to /registrations/part-time-flex/slots/${slotId}/details...`);
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.get(`/registrations/part-time-flex/slots/${slotId}/details`);

      console.log('📥 [shiftRegistrationService.getSlotDetails] API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      // Handle both response structures
      if (response.data?.data) {
        console.log('✅ [shiftRegistrationService.getSlotDetails] Found wrapped response.data.data');
        return response.data.data;
      }

      console.log('✅ [shiftRegistrationService.getSlotDetails] Using direct response.data');
      return response.data;
    } catch (error: any) {
      console.error('❌ [shiftRegistrationService.getSlotDetails] API Error:', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Delete (soft delete) a shift registration
   * @param registrationId Registration ID to delete
   */
  async deleteRegistration(registrationId: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      await axiosInstance.delete(`${this.endpoint}/${registrationId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to delete shift registration');
      }
    }
  }

  /**
   * Get registrations for current user (employee)
   * Uses different endpoints based on registration type:
   * - Part-time-flex: GET /registrations/part-time-flex
   * - General (all types): GET /registrations
   * 
   * According to API spec: Returns array directly (NOT paginated) for employee view
   * @param params Query parameters
   * @param type Registration type filter ('part-time-flex' | 'all')
   * @returns User's shift registrations (array OR paginated)
   */
  async getMyRegistrations(
    params: ShiftRegistrationQueryParams = {},
    type: 'part-time-flex' | 'all' = 'all'
  ): Promise<ShiftRegistration[] | PaginatedShiftRegistrationResponse> {
    const {
      page = 0,
      size = 10,
      sortBy = 'effectiveFrom',
      sortDirection = 'DESC',
      ...filters
    } = params;

    const axiosInstance = apiClient.getAxiosInstance();

    // Use different endpoints based on type
    const endpoint = type === 'part-time-flex'
      ? '/registrations/part-time-flex'
      : this.endpoint;

    console.log(`📡 [getMyRegistrations] Fetching ${type} registrations from ${endpoint}...`);

    try {
      const response = await axiosInstance.get(endpoint, {
        params: {
          page,
          size,
          sort: `${sortBy},${sortDirection.toLowerCase()}`,
          ...filters
        }
      });

      console.log('📥 [getMyRegistrations] Response:', {
        endpoint,
        status: response.status,
        dataType: Array.isArray(response.data) ? 'array' : 'object',
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A'
      });

      // Handle both response structures
      // Case 1: Direct array response (Employee view, Admin view)
      if (Array.isArray(response.data)) {
        return response.data;
      }

      // Case 2: Wrapped array response { statusCode, data: [...] }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      // Case 3: Paginated response { content: [...], totalPages, ... }
      if (response.data?.content && Array.isArray(response.data.content)) {
        return response.data;
      }

      // Case 4: Wrapped paginated response { statusCode, data: { content: [...] } }
      if (response.data?.data?.content && Array.isArray(response.data.data.content)) {
        return response.data.data;
      }

      // Fallback: return empty array
      console.warn('⚠️ [getMyRegistrations] Unexpected response structure, returning empty array');
      return [];
    } catch (error: any) {
      console.error('❌ [getMyRegistrations] Error:', {
        endpoint,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Reactivate a soft-deleted registration (Admin only)
   * @param registrationId Registration ID to reactivate
   * @returns Reactivated shift registration
   */
  async reactivateRegistration(registrationId: string): Promise<ShiftRegistration> {
    return this.updateRegistration(registrationId, { isActive: true });
  }

  /**
   * Update registration status (APPROVED/REJECTED) - Admin only
   * API: PATCH /admin/registrations/part-time-flex/{id}/status
   * @param registrationId Registration ID to update
   * @param status New status (APPROVED or REJECTED)
   * @returns Updated shift registration
   */
  async updateRegistrationStatus(
    registrationId: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      // Build payload based on status
      let payload: any = { status };
      if (status === 'REJECTED' && reason) {
        payload.reason = reason;
      }

      console.log('🔄 Updating registration status:', {
        registrationId,
        payload,
        url: `/admin/registrations/part-time-flex/${registrationId}/status`
      });

      const response = await axiosInstance.patch<ShiftRegistrationResponse>(
        `/admin/registrations/part-time-flex/${registrationId}/status`,
        payload
      );

      console.log('✅ Registration status updated:', response.data);

      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as ShiftRegistration;
    } catch (error: any) {
      console.error('❌ Update registration status error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to update registration status');
      }
    }
  }
}

// Export singleton instance
export const shiftRegistrationService = new ShiftRegistrationService();
