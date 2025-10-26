/**
 * Time Off Type Service
 * Handles all API interactions for Time Off Types
 * Based on Time_Off_Type.md specification - READ ONLY
 */

import { apiClient } from '@/lib/api';
import {
  TimeOffType,
  TimeOffTypeListResponse,
} from '@/types/timeOff';

export class TimeOffTypeService {
  private static readonly BASE_URL = '/time-off-types';

  /**
   * Lấy danh sách loại nghỉ phép
   * 
   * Requires: VIEW_TIME_OFF_TYPE permission
   * 
   * Query parameters:
   * - isActive: Filter by active status (true/false)
   * - requiresBalance: Filter by balance requirement (true/false)
   * - isPaid: Filter by payment status (true/false)
   * - page: Page number (default: 0)
   * - size: Page size (default: 20)
   * 
   * Possible errors:
   * - 403: Access Denied (missing VIEW_TIME_OFF_TYPE permission)
   */
  static async getTimeOffTypes(params?: {
    isActive?: boolean;
    requiresBalance?: boolean;
    isPaid?: boolean;
    page?: number;
    size?: number;
  }): Promise<TimeOffTypeListResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffTypeListResponse>(
      this.BASE_URL,
      { params }
    );
    return response.data;
  }

  /**
   * Lấy danh sách loại nghỉ phép cho dropdown (chỉ active types)
   * 
   * Requires: VIEW_TIME_OFF_TYPE permission
   */
  static async getActiveTimeOffTypes(): Promise<TimeOffType[]> {
    const response = await this.getTimeOffTypes({
      isActive: true,
      size: 100 // Get all active types
    });
    return response.content;
  }

  /**
   * Lấy danh sách loại nghỉ phép yêu cầu balance
   * 
   * Requires: VIEW_TIME_OFF_TYPE permission
   */
  static async getBalanceRequiredTypes(): Promise<TimeOffType[]> {
    const response = await this.getTimeOffTypes({
      isActive: true,
      requiresBalance: true,
      size: 100
    });
    return response.content;
  }
}

// Export singleton instance
export const timeOffTypeService = new TimeOffTypeService();