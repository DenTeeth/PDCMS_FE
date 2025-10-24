/**
 * Time Off Request Management Service
 * Based on Time_Off_Request.md specification (BE-305)
 */

import { apiClient } from '@/lib/api';
import {
  TimeOffRequest,
  CreateTimeOffRequestDto,
  RejectTimeOffRequestDto,
  CancelTimeOffRequestDto,
  TimeOffRequestListResponse,
  EmployeeLeaveBalance,
} from '@/types/timeOffRequest';

export class TimeOffRequestService {
  private static readonly BASE_URL = '/time-off-requests';

  /**
   * Tạo yêu cầu nghỉ phép
   */
  static async createTimeOffRequest(data: CreateTimeOffRequestDto): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<TimeOffRequest>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Lấy danh sách yêu cầu nghỉ phép
   */
  static async getTimeOffRequests(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    employeeId?: number;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<TimeOffRequestListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) {
      queryParams.append('status', params.status);
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
    const response = await axios.get<TimeOffRequestListResponse>(url);
    return response.data;
  }

  /**
   * Lấy chi tiết yêu cầu nghỉ phép
   */
  static async getTimeOffRequestById(requestId: string): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffRequest>(`${this.BASE_URL}/${requestId}`);
    return response.data;
  }

  /**
   * Duyệt yêu cầu nghỉ phép
   */
  static async approveTimeOffRequest(requestId: string): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(`${this.BASE_URL}/${requestId}/approve`);
    return response.data;
  }

  /**
   * Từ chối yêu cầu nghỉ phép
   */
  static async rejectTimeOffRequest(
    requestId: string,
    data: RejectTimeOffRequestDto
  ): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(
      `${this.BASE_URL}/${requestId}/reject`,
      data
    );
    return response.data;
  }

  /**
   * Hủy yêu cầu nghỉ phép
   */
  static async cancelTimeOffRequest(
    requestId: string,
    data: CancelTimeOffRequestDto
  ): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(
      `${this.BASE_URL}/${requestId}/cancel`,
      data
    );
    return response.data;
  }

  /**
   * Lấy số dư nghỉ phép của nhân viên
   */
  static async getLeaveBalance(params: {
    employeeId: number;
    year: number;
  }): Promise<EmployeeLeaveBalance> {
    const queryParams = new URLSearchParams();
    queryParams.append('employeeId', params.employeeId.toString());
    queryParams.append('year', params.year.toString());

    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<EmployeeLeaveBalance>(
      `/leave-balances?${queryParams.toString()}`
    );
    return response.data;
  }
}

export default TimeOffRequestService;
