/**
 * Holiday Service
 * Handles holiday-related API operations
 * Based on BE Holiday Management API Documentation
 * 
 * Reference: docs/message_from_BE/holiday/Holiday_Management_API_Test_Guide.md
 * 
 * Note: apiClient already has /api/v1 in baseURL, so we only use relative paths
 */

import { apiClient } from '@/lib/api';
import {
  HolidayDefinition,
  HolidayDate,
  HolidayCheckResponse,
  HolidayRangeResponse,
  CreateHolidayDateRequest,
  CreateHolidayDefinitionRequest,
  UpdateHolidayDefinitionRequest,
  UpdateHolidayDateRequest,
} from '@/types/holiday';

class HolidayService {

  /**
   * Check if a specific date is a holiday
   * GET /api/v1/holiday-dates/check/{date}
   * 
   * BE returns: { isHoliday: true/false }
   */
  async checkHoliday(date: string): Promise<HolidayCheckResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-dates/check/${date}`);
    
    return response.data?.data || response.data;
  }

  /**
   * Get all holidays in a date range
   * GET /api/v1/holiday-dates/by-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * 
   * BE returns: Array of HolidayDate
   */
  async getHolidaysInRange(startDate: string, endDate: string): Promise<HolidayDate[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-dates/by-range`, {
      params: { startDate, endDate },
    });
    
    const data = response.data?.data || response.data;
    // Convert to HolidayRangeResponse format for backward compatibility
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get all holiday definitions
   * GET /api/v1/holiday-definitions
   * Permission Required: VIEW_HOLIDAY
   */
  async getDefinitions(): Promise<HolidayDefinition[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-definitions`);
    
    return response.data?.data || response.data;
  }

  /**
   * Get holiday definitions by type
   * GET /api/v1/holiday-definitions/by-type/{holidayType}
   * 
   * @param holidayType 'NATIONAL' | 'COMPANY'
   */
  async getDefinitionsByType(holidayType: 'NATIONAL' | 'COMPANY'): Promise<HolidayDefinition[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-definitions/by-type/${holidayType}`);
    
    return response.data?.data || response.data;
  }

  /**
   * Get a specific holiday definition
   * GET /api/v1/holiday-definitions/{definitionId}
   */
  async getDefinition(definitionId: string): Promise<HolidayDefinition> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-definitions/${definitionId}`);
    
    return response.data?.data || response.data;
  }

  /**
   * Create a new holiday definition
   * POST /api/v1/holiday-definitions
   * Permission Required: MANAGE_HOLIDAY (BE consolidated permission for CREATE/UPDATE/DELETE)
   */
  async createDefinition(data: CreateHolidayDefinitionRequest): Promise<HolidayDefinition> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(`/holiday-definitions`, data);
    
    return response.data?.data || response.data;
  }

  /**
   * Update a holiday definition
   * PATCH /api/v1/holiday-definitions/{definitionId}
   * Permission Required: MANAGE_HOLIDAY (BE consolidated permission for CREATE/UPDATE/DELETE)
   */
  async updateDefinition(
    definitionId: string,
    data: UpdateHolidayDefinitionRequest
  ): Promise<HolidayDefinition> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.patch(`/holiday-definitions/${definitionId}`, data);
    
    return response.data?.data || response.data;
  }

  /**
   * Delete a holiday definition (Cascade Delete)
   * DELETE /api/v1/holiday-definitions/{definitionId}
   * Permission Required: MANAGE_HOLIDAY (BE consolidated permission for CREATE/UPDATE/DELETE)
   * 
   * Note: This will also delete all associated holiday dates
   */
  async deleteDefinition(definitionId: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.delete(`/holiday-definitions/${definitionId}`);
  }

  /**
   * Get all holiday dates
   * GET /api/v1/holiday-dates
   * Permission Required: VIEW_HOLIDAY
   */
  async getAllDates(): Promise<HolidayDate[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-dates`);
    
    return response.data?.data || response.data;
  }

  /**
   * Get all dates for a specific holiday definition
   * GET /api/v1/holiday-dates/by-definition/{definitionId}
   */
  async getDatesForDefinition(definitionId: string): Promise<HolidayDate[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`/holiday-dates/by-definition/${definitionId}`);
    
    return response.data?.data || response.data;
  }

  /**
   * Get a specific holiday date
   * GET /api/v1/holiday-dates/{holidayDate}/definition/{definitionId}
   */
  async getDate(holidayDate: string, definitionId: string): Promise<HolidayDate> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(
      `/holiday-dates/${holidayDate}/definition/${definitionId}`
    );
    
    return response.data?.data || response.data;
  }

  /**
   * Create a new holiday date
   * POST /api/v1/holiday-dates
   * Permission Required: MANAGE_HOLIDAY (BE consolidated permission for CREATE/UPDATE/DELETE)
   */
  async createDate(data: CreateHolidayDateRequest): Promise<HolidayDate> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(`/holiday-dates`, data);
    
    return response.data?.data || response.data;
  }

  /**
   * Update a holiday date
   * PATCH /api/v1/holiday-dates/{holidayDate}/definition/{definitionId}
   * Permission Required: MANAGE_HOLIDAY (BE consolidated permission for CREATE/UPDATE/DELETE)
   * 
   * Important: Must provide ALL fields (holidayDate, definitionId, description)
   */
  async updateDate(
    holidayDate: string,
    definitionId: string,
    data: UpdateHolidayDateRequest
  ): Promise<HolidayDate> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.patch(
      `/holiday-dates/${holidayDate}/definition/${definitionId}`,
      data
    );
    
    return response.data?.data || response.data;
  }

  /**
   * Delete a holiday date
   * DELETE /api/v1/holiday-dates/{holidayDate}/definition/{definitionId}
   * Permission Required: MANAGE_HOLIDAY (BE consolidated permission for CREATE/UPDATE/DELETE)
   */
  async deleteDate(holidayDate: string, definitionId: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.delete(
      `/holiday-dates/${holidayDate}/definition/${definitionId}`
    );
  }

  /**
   * Get all holidays for a specific year
   * Convenience method
   */
  async getHolidaysForYear(year: number): Promise<HolidayRangeResponse> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const dates = await this.getHolidaysInRange(startDate, endDate);
    
    // Convert to HolidayRangeResponse format
    return {
      holidays: dates.map(date => ({
        date: date.holidayDate,
        holidayName: date.holidayName || '',
        definitionId: date.definitionId,
      })),
    };
  }

  /**
   * Batch check if multiple dates are holidays
   * Client-side batching
   */
  async checkMultipleDates(dates: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // Batch API calls
    const checks = await Promise.all(
      dates.map(date => 
        this.checkHoliday(date)
          .then(res => ({ date, isHoliday: res.isHoliday }))
          .catch(() => ({ date, isHoliday: false }))
      )
    );
    
    checks.forEach(check => {
      results.set(check.date, check.isHoliday);
    });
    
    return results;
  }
}

// Export singleton instance
export const holidayService = new HolidayService();

