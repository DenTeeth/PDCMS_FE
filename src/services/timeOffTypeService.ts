/**
 * Time Off Type Management Service
 * Based on Time_Off_Type.md specification (BE-306)
 */

import { apiClient } from '@/lib/api';
import {
  TimeOffType,
  CreateTimeOffTypeDto,
  UpdateTimeOffTypeDto,
  TimeOffTypeListResponse,
} from '@/types/timeOffType';

export class TimeOffTypeService {
  private static readonly BASE_URL = '/time-off-types';

  /**
   * Lấy danh sách loại nghỉ phép
   */
  static async getTimeOffTypes(params?: {
    isActive?: boolean;
    requiresBalance?: boolean;
    isPaid?: boolean;
    page?: number;
    size?: number;
  }): Promise<TimeOffTypeListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params?.requiresBalance !== undefined) {
      queryParams.append('requiresBalance', params.requiresBalance.toString());
    }
    if (params?.isPaid !== undefined) {
      queryParams.append('isPaid', params.isPaid.toString());
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }

    const url = queryParams.toString() 
      ? `${this.BASE_URL}?${queryParams.toString()}`
      : this.BASE_URL;

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffTypeListResponse>(url);
    return response.data;
  }

  /**
   * Lấy chi tiết loại nghỉ phép
   */
  static async getTimeOffTypeById(typeId: string): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffType>(`${this.BASE_URL}/${typeId}`);
    return response.data;
  }

  /**
   * Tạo loại nghỉ phép mới
   */
  static async createTimeOffType(data: CreateTimeOffTypeDto): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<TimeOffType>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Cập nhật loại nghỉ phép
   */
  static async updateTimeOffType(
    typeId: string,
    data: UpdateTimeOffTypeDto
  ): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.put<TimeOffType>(`${this.BASE_URL}/${typeId}`, data);
    return response.data;
  }

  /**
   * Xóa (deactivate) loại nghỉ phép
   */
  static async deleteTimeOffType(typeId: string): Promise<{ message: string; typeId: string; isActive: boolean }> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.delete<{ message: string; typeId: string; isActive: boolean }>(
      `${this.BASE_URL}/${typeId}`
    );
    return response.data;
  }

  /**
   * Kích hoạt lại loại nghỉ phép
   */
  static async reactivateTimeOffType(typeId: string): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffType>(`${this.BASE_URL}/${typeId}/reactivate`);
    return response.data;
  }

  /**
   * Lấy danh sách loại nghỉ phép active (cho dropdown)
   */
  static async getActiveTimeOffTypes(): Promise<TimeOffType[]> {
    const response = await this.getTimeOffTypes({ isActive: true });
    return response.content;
  }
}

export default TimeOffTypeService;
