/**
 * Work Slot Service
 * 
 * Based on Part-time-registration.md - Quota-based Part-Time Slot System
 * Last updated: January 2025
 */

import { apiClient } from '@/lib/api';
import {
  PartTimeSlot,
  CreateWorkSlotRequest,
  UpdateWorkSlotRequest,
  WorkSlotQueryParams,
  PaginatedWorkSlotResponse,
  WorkSlotResponse,
  AvailableSlot,
  PartTimeSlotDetailResponse
} from '@/types/workSlot';

/**
 * Work Slot Service Class
 * Handles all work slot-related API operations
 */
class WorkSlotService {
  private readonly endpoint = '/work-slots';

  /**
   * Fetch all work slots
   * According to API spec: Returns array directly (NOT paginated)
   * @param params Query parameters (optional, API may not support all filters)
   * @returns Array of work slots
   */
  async getWorkSlots(params: WorkSlotQueryParams = {}): Promise<PartTimeSlot[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(this.endpoint, {
      params: params // API spec doesn't mention pagination params
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

    // Case 3: Paginated response (backward compatibility)
    if (response.data?.content && Array.isArray(response.data.content)) {
      return response.data.content;
    }

    // Fallback: return empty array
    return [];
  }

  /**
   * Fetch a single work slot by ID
   * @param slotId Work slot ID
   * @returns Work slot details
   */
  async getWorkSlotById(slotId: number): Promise<PartTimeSlot> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<WorkSlotResponse>(`${this.endpoint}/${slotId}`);

    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as PartTimeSlot;
  }

  /**
   * Create a new work slot
   * @param data Work slot data (workShiftId, dayOfWeek, quota)
   * @returns Created work slot
   */
  async createWorkSlot(data: CreateWorkSlotRequest): Promise<PartTimeSlot> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.post<WorkSlotResponse>(this.endpoint, data);

      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as PartTimeSlot;
    } catch (error: any) {
      // Handle specific error codes from BE
      if (error.response?.data?.errorCode === 'SLOT_ALREADY_EXISTS') {
        const message = error.response.data.message || 'Suất này đã tồn tại.';
        const customError = new Error(message);
        (customError as any).errorCode = 'SLOT_ALREADY_EXISTS';
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.errorCode) {
        const errorCode = error.response.data.errorCode;
        const message = error.response.data.message || error.response.data.detail || 'Failed to create work slot';
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
        throw new Error('Không thể tạo slot làm việc');
      }
    }
  }

  /**
   * Update a work slot
   * Note: Both quota and isActive are optional (can update independently)
   * Important: quota cannot be less than registered (409 QUOTA_VIOLATION)
   * @param slotId Work slot ID to update
   * @param data Update data (quota and isActive are optional)
   * @returns Updated work slot
   */
  async updateWorkSlot(slotId: number, data: UpdateWorkSlotRequest): Promise<PartTimeSlot> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      const response = await axiosInstance.put<WorkSlotResponse>(`${this.endpoint}/${slotId}`, data);

      if (response.data?.data) {
        return response.data.data;
      }
      return response.data as unknown as PartTimeSlot;
    } catch (error: any) {
      // Handle specific error codes from BE
      if (error.response?.data?.errorCode === 'QUOTA_VIOLATION') {
        const message = error.response.data.message || 'Không thể giảm quota. Đã có nhân viên đăng ký suất này.';
        const customError = new Error(message);
        (customError as any).errorCode = 'QUOTA_VIOLATION';
        (customError as any).status = error.response.status;
        throw customError;
      } else if (error.response?.data?.errorCode) {
        const errorCode = error.response.data.errorCode;
        const message = error.response.data.message || error.response.data.detail || 'Failed to update work slot';
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
        throw new Error('Không thể cập nhật slot làm việc');
      }
    }
  }

  /**
   * Delete (soft delete) a work slot
   * @param slotId Work slot ID to delete
   */
  async deleteWorkSlot(slotId: number): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();

    try {
      await axiosInstance.delete(`${this.endpoint}/${slotId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Không thể xóa slot làm việc');
      }
    }
  }

  /**
   * Get available slots for employee registration
   * @returns List of available slots with remaining quota
   */
  async getAvailableSlots(): Promise<AvailableSlot[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get('/registrations/available-slots');

    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }

    return response.data;
  }

  /**
   * Get slot daily availability for a specific date range
   * API: GET /work-slots/{slotId}/availability?from=2025-01-01&to=2025-01-31
   * @param slotId Work slot ID
   * @param fromDate Start date (YYYY-MM-DD)
   * @param toDate End date (YYYY-MM-DD)
   * @returns Daily availability data
   */
  async getSlotDailyAvailability(slotId: number, fromDate: string, toDate: string): Promise<any> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/${slotId}/availability`, {
      params: {
        from: fromDate,
        to: toDate
      }
    });

    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }

    return response.data;
  }

  /**
   * Get slot detail with list of registered employees
   * Response includes slot information and list of employees who claimed it
   * @param slotId Work slot ID
   * @returns Slot detail with registered employees
   */
  async getSlotDetail(slotId: number): Promise<PartTimeSlotDetailResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ statusCode: number; data: PartTimeSlotDetailResponse }>(`${this.endpoint}/${slotId}`);

    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }

    return response.data as unknown as PartTimeSlotDetailResponse;
  }
}

// Export singleton instance
export const workSlotService = new WorkSlotService();
