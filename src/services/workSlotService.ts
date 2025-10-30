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
  AvailableSlot
} from '@/types/workSlot';

/**
 * Work Slot Service Class
 * Handles all work slot-related API operations
 */
class WorkSlotService {
  private readonly endpoint = '/work-slots';

  /**
   * Fetch all work slots with pagination and filters
   * @param params Query parameters
   * @returns Paginated list of work slots
   */
  async getWorkSlots(params: WorkSlotQueryParams = {}): Promise<PaginatedWorkSlotResponse> {
    const {
      page = 0,
      size = 10,
      sortBy = 'slotId',
      sortDirection = 'ASC',
      ...filters
    } = params;

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(this.endpoint, {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
        ...filters
      }
    });

    // Handle both response structures
    if (response.data?.data) {
      return response.data.data;
    }
    
    return response.data;
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
   * @param data Work slot data
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
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to create work slot');
      }
    }
  }

  /**
   * Update a work slot
   * @param slotId Work slot ID to update
   * @param data Update data
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
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to update work slot');
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
        throw new Error('Failed to delete work slot');
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
}

// Export singleton instance
export const workSlotService = new WorkSlotService();
