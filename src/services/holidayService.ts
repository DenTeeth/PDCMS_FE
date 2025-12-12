/**
 * Holiday Service
 * Handles holiday-related API operations
 * Based on BE_4: Treatment Plan Auto-Scheduling
 */

import { apiClient } from '@/lib/api';
import {
  HolidayDefinition,
  HolidayDate,
  HolidayCheckResponse,
  HolidayRangeResponse,
  NextWorkingDayResponse,
  CreateHolidayDateRequest,
  CreateHolidayDefinitionRequest,
  UpdateHolidayDefinitionRequest,
} from '@/types/holiday';

class HolidayService {
  private readonly endpoint = '/holidays';

  /**
   * Check if a specific date is a holiday
   * GET /api/holidays/check?date=YYYY-MM-DD
   */
  async checkHoliday(date: string): Promise<HolidayCheckResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/check`, {
      params: { date },
    });
    
    return response.data?.data || response.data;
  }

  /**
   * Get all holidays in a date range
   * GET /api/holidays/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  async getHolidaysInRange(startDate: string, endDate: string): Promise<HolidayRangeResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/range`, {
      params: { startDate, endDate },
    });
    
    return response.data?.data || response.data;
  }

  /**
   * Get next working day after a given date
   * GET /api/holidays/next-working-day?date=YYYY-MM-DD
   */
  async getNextWorkingDay(date: string): Promise<NextWorkingDayResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/next-working-day`, {
      params: { date },
    });
    
    return response.data?.data || response.data;
  }

  /**
   * Get all holiday definitions
   * GET /api/holidays/definitions
   */
  async getDefinitions(): Promise<HolidayDefinition[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/definitions`);
    
    return response.data?.data || response.data;
  }

  /**
   * Get a specific holiday definition
   * GET /api/holidays/definitions/{definitionId}
   */
  async getDefinition(definitionId: string): Promise<HolidayDefinition> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/definitions/${definitionId}`);
    
    return response.data?.data || response.data;
  }

  /**
   * Create a new holiday definition
   * POST /api/holidays/definitions
   */
  async createDefinition(data: CreateHolidayDefinitionRequest): Promise<HolidayDefinition> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(`${this.endpoint}/definitions`, data);
    
    return response.data?.data || response.data;
  }

  /**
   * Update a holiday definition
   * PUT /api/holidays/definitions/{definitionId}
   */
  async updateDefinition(
    definitionId: string,
    data: UpdateHolidayDefinitionRequest
  ): Promise<HolidayDefinition> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.put(`${this.endpoint}/definitions/${definitionId}`, data);
    
    return response.data?.data || response.data;
  }

  /**
   * Delete a holiday definition
   * DELETE /api/holidays/definitions/{definitionId}
   */
  async deleteDefinition(definitionId: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.delete(`${this.endpoint}/definitions/${definitionId}`);
  }

  /**
   * Get all dates for a specific holiday definition
   * GET /api/holidays/definitions/{definitionId}/dates
   */
  async getDatesForDefinition(definitionId: string): Promise<HolidayDate[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/definitions/${definitionId}/dates`);
    
    return response.data?.data || response.data;
  }

  /**
   * Create a new holiday date
   * POST /api/holidays/dates
   */
  async createDate(data: CreateHolidayDateRequest): Promise<HolidayDate> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(`${this.endpoint}/dates`, data);
    
    return response.data?.data || response.data;
  }

  /**
   * Delete a holiday date
   * DELETE /api/holidays/dates/{definitionId}/{date}
   */
  async deleteDate(definitionId: string, date: string): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    await axiosInstance.delete(`${this.endpoint}/dates/${definitionId}/${date}`);
  }

  /**
   * Get all holidays for a specific year
   * Convenience method
   */
  async getHolidaysForYear(year: number): Promise<HolidayRangeResponse> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return this.getHolidaysInRange(startDate, endDate);
  }

  /**
   * Batch check if multiple dates are holidays
   * Client-side batching
   */
  async checkMultipleDates(dates: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // Batch API calls
    const checks = await Promise.all(
      dates.map(date => this.checkHoliday(date).catch(() => ({ date, isHoliday: false } as HolidayCheckResponse)))
    );
    
    checks.forEach(check => {
      results.set(check.date, check.isHoliday);
    });
    
    return results;
  }
}

// Export singleton instance
export const holidayService = new HolidayService();

