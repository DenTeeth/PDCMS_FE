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

    console.log(` [getRegistrations] Fetching ${type} registrations from ${endpoint}...`);

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(endpoint, {
      params: {
        page,
        size,
        sort: `${sortBy},${sortDirection.toLowerCase()}`,
        ...filters
      }
    });

    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    const data = extractApiResponse<any>(response);
    
    // Handle array response
    if (Array.isArray(data)) {
      return data;
    }
    
    // Handle paginated response
    if (data?.content && Array.isArray(data.content)) {
      return data;
    }
    
    // Fallback: return empty array
    return [];
  }

  /**
   * Fetch a single shift registration by ID
   * GET /api/v1/registrations/part-time-flex/{registrationId}
   * 
   * Security:
   * - Employee can only view own registrations (403 if not owner)
   * - Admin can view all registrations
   * 
   * @param registrationId Registration ID (numeric, e.g., "4")
   * @returns Shift registration details with employeeName field
   */
  async getRegistrationById(registrationId: string): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<ShiftRegistration>(
      `${this.endpoint}/part-time-flex/${registrationId}`
    );

    // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<ShiftRegistration>(response);
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

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      return extractApiResponse<ShiftRegistration>(response);
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
        throw new Error('Không thể tạo đăng ký ca làm việc');
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

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      return extractApiResponse<ShiftRegistration>(response);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Không thể cập nhật đăng ký ca làm việc');
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

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      return extractApiResponse<ShiftRegistration>(response);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Không thể cập nhật ngày hiệu lực');
      }
    }
  }

  /**
   * Get available slots for employee registration
   * API: GET /registrations/part-time-flex/available-slots
   * @param month Optional month filter in format YYYY-MM (e.g., "2025-12")
   * @returns List of available slots with remaining quota
   */
  async getAvailableSlots(month?: string): Promise<AvailableSlot[]> {
    const monthParam = month ? `?month=${month}` : '';
    console.log(`� [shiftRegistrationService.getAvailableSlots] Making API call to /registrations/part-time-flex/available-slots${monthParam}...`);
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const params = month ? { month } : {};
      const response = await axiosInstance.get('/registrations/part-time-flex/available-slots', { params });

      console.log('� [shiftRegistrationService.getAvailableSlots] API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A'
      });

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      const data = extractApiResponse<any>(response);
      let slots: AvailableSlot[] = [];

      if (Array.isArray(data)) {
        console.log(' [shiftRegistrationService.getAvailableSlots] Found array response');
        slots = data;
      } else {
        console.warn(' [shiftRegistrationService.getAvailableSlots] Unexpected response structure:', response.data);
        slots = [];
      }

      console.log('� [shiftRegistrationService.getAvailableSlots] Returning slots:', {
        count: slots.length,
        slots: slots
      });

      return slots;
    } catch (error: any) {
      console.error(' [shiftRegistrationService.getAvailableSlots] API Error:', {
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
    console.log(`� [shiftRegistrationService.getSlotDetails] Making API call to /registrations/part-time-flex/slots/${slotId}/details...`);
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.get(`/registrations/part-time-flex/slots/${slotId}/details`);

      console.log('� [shiftRegistrationService.getSlotDetails] API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      const responseData = extractApiResponse<SlotDetailsResponse>(response);
      
      console.log(' [shiftRegistrationService.getSlotDetails] Using unwrapped response');
      return responseData;
    } catch (error: any) {
      console.error(' [shiftRegistrationService.getSlotDetails] API Error:', {
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
   * Delete (cancel) a shift registration
   * DELETE /api/v1/registrations/part-time-flex/{registrationId}
   * 
   * What happens:
   * - Sets status = "CANCELLED"
   * - Sets isActive = false
   * - Sets effectiveTo = today
   * 
   * Security:
   * - Employee can only cancel PENDING status (409 if not PENDING)
   * - Admin can cancel any status
   * 
   * @param registrationId Registration ID to delete
   * @returns Updated registration with CANCELLED status
   */
  async deleteRegistration(registrationId: string): Promise<ShiftRegistration> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.delete<ShiftRegistration>(
        `${this.endpoint}/part-time-flex/${registrationId}`
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with original error for proper error handling in component
      throw error;
    }
  }

  /**
   * Get registrations for current user (employee)
   * 
   *  UPDATED: Backend now supports pagination!
   * API: GET /registrations/part-time-flex?page=0&size=10&sort=effectiveFrom,desc
   * 
   * @param params Query parameters (page, size, sortBy, sortDirection)
   * @param type Registration type filter (ignored for now, always uses part-time-flex)
   * @returns Paginated shift registrations
   */
  async getMyRegistrations(
    params: ShiftRegistrationQueryParams = {},
    type: 'part-time-flex' | 'all' = 'all'
  ): Promise<PaginatedShiftRegistrationResponse> {
    const {
      page = 0,
      size = 10,
      sortBy = 'effectiveFrom',
      sortDirection = 'DESC',
      ...filters
    } = params;

    const axiosInstance = apiClient.getAxiosInstance();

    //  UPDATED: Backend now has /part-time-flex endpoint with pagination
    const endpoint = `${this.endpoint}/part-time-flex`;

    console.log(` [getMyRegistrations] Fetching registrations from ${endpoint}...`);

    try {
      const response = await axiosInstance.get<PaginatedShiftRegistrationResponse>(endpoint, {
        params: {
          page,
          size,
          sort: `${sortBy},${sortDirection.toLowerCase()}`,
          ...filters
        }
      });

      console.log(' [getMyRegistrations] Success:', {
        endpoint,
        status: response.status,
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages,
        currentPage: response.data.pageable?.pageNumber ?? page,
        itemsInPage: response.data.content?.length ?? 0
      });

      // Backend now ALWAYS returns Spring Data Page object
      return response.data;

    } catch (error: any) {
      console.error(' [getMyRegistrations] Error:', {
        endpoint,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Return empty paginated response on error
      return {
        content: [],
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: { sorted: false, unsorted: true },
          offset: 0,
          paged: true,
          unpaged: false
        },
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true,
        size: size,
        number: page,
        numberOfElements: 0,
        empty: true
      };
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

      console.log(' Updating registration status:', {
        registrationId,
        payload,
        url: `/admin/registrations/part-time-flex/${registrationId}/status`
      });

      const response = await axiosInstance.patch<ShiftRegistrationResponse>(
        `/admin/registrations/part-time-flex/${registrationId}/status`,
        payload
      );

      console.log(' Registration status updated:', response.data);

      // Use helper to unwrap FormatRestResponse wrapper: { statusCode, message, data: T }
      const { extractApiResponse } = await import('@/utils/apiResponse');
      return extractApiResponse<ShiftRegistration>(response);
    } catch (error: any) {
      console.error(' Update registration status error:', {
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
        throw new Error('Không thể cập nhật trạng thái đăng ký');
      }
    }
  }
}

// Export singleton instance
export const shiftRegistrationService = new ShiftRegistrationService();
