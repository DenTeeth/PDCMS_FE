/**
 * Employee Shift Service
 * Based on SHIFT_API.md specification (BE-307)
 */

import { apiClient } from '@/lib/api';
import {
  EmployeeShift,
  EmployeeShiftListResponse,
  ShiftSource,
  ShiftStatus,
} from '@/types/employeeShift';

export class EmployeeShiftService {
  private static readonly BASE_URL = '/employee-shifts';

  /**
   * Lấy danh sách ca làm việc (cho admin - xem tất cả)
   */
  static async getEmployeeShifts(params?: {
    workDate?: string;
    startDate?: string;
    endDate?: string;
    employeeId?: number;
    source?: ShiftSource;
    status?: ShiftStatus;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<EmployeeShiftListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.workDate) {
      queryParams.append('workDate', params.workDate);
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params?.employeeId) {
      queryParams.append('employeeId', params.employeeId.toString());
    }
    if (params?.source) {
      queryParams.append('source', params.source);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    if (params?.sort) {
      queryParams.append('sort', params.sort);
    }

    const url = queryParams.toString() 
      ? `${this.BASE_URL}?${queryParams.toString()}`
      : this.BASE_URL;

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<EmployeeShiftListResponse>(url);
    return response.data;
  }

  /**
   * Lấy ca làm việc của chính mình (cho employee)
   */
  static async getMyShifts(params?: {
    startDate?: string;
    endDate?: string;
    status?: ShiftStatus;
    page?: number;
    size?: number;
  }): Promise<EmployeeShiftListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }

    const url = queryParams.toString() 
      ? `${this.BASE_URL}/my-shifts?${queryParams.toString()}`
      : `${this.BASE_URL}/my-shifts`;

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<EmployeeShiftListResponse>(url);
    return response.data;
  }

  /**
   * Lấy ca làm việc theo ngày cụ thể
   */
  static async getShiftsByDate(date: string): Promise<EmployeeShift[]> {
    const response = await this.getEmployeeShifts({ workDate: date });
    return response.content;
  }

  /**
   * Lấy ca làm việc theo khoảng thời gian
   */
  static async getShiftsByDateRange(
    startDate: string,
    endDate: string,
    employeeId?: number
  ): Promise<EmployeeShift[]> {
    const response = await this.getEmployeeShifts({
      startDate,
      endDate,
      employeeId,
    });
    return response.content;
  }
}

export default EmployeeShiftService;
