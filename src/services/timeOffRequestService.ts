/**
 * Time Off Request Service
 * Handles all API interactions for Time Off Requests
 * Based on Time_Off_Request.md specification
 */

import { apiClient } from '@/lib/api';
import {
  TimeOffRequest,
  TimeOffRequestDetail,
  TimeOffRequestListResponse,
  CreateTimeOffRequestDto,
  UpdateTimeOffStatusDto,
  ApproveTimeOffRequestDto,
  RejectTimeOffRequestDto,
  CancelTimeOffRequestDto,
  TimeOffStatus,
  TimeOffSlot
} from '@/types/timeOff';

export class TimeOffRequestService {
  private static readonly BASE_URL = '/time-off-requests';

  /**
   * Tạo yêu cầu nghỉ phép
   * 
   * Requires: CREATE_TIME_OFF permission
   * 
   * Possible errors:
   * - 400: Insufficient leave balance, Invalid date range, Invalid slot usage
   * - 403: Access Denied (missing CREATE_TIME_OFF permission)
   * - 404: Time off type not found
   */
  static async createTimeOffRequest(
    data: CreateTimeOffRequestDto
  ): Promise<TimeOffRequestDetail> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<TimeOffRequestDetail>(
      this.BASE_URL,
      data
    );
    return response.data;
  }

  /**
   * Lấy danh sách yêu cầu nghỉ phép
   * 
   * Requires: VIEW_TIME_OFF_ALL or VIEW_TIME_OFF_OWN permission
   * 
   * Query parameters:
   * - status: Filter by status (PENDING, APPROVED, REJECTED, CANCELLED)
   * - startDate: Filter by start date (YYYY-MM-DD)
   * - endDate: Filter by end date (YYYY-MM-DD)
   * - page: Page number (default: 0)
   * - size: Page size (default: 20)
   * - sort: Sort field (default: requestedAt,desc)
   * 
   * Possible errors:
   * - 403: Access Denied (missing VIEW permission)
   */
  static async getTimeOffRequests(params?: {
    status?: TimeOffStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<TimeOffRequestListResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffRequestListResponse>(
      this.BASE_URL,
      { params }
    );
    return response.data;
  }

  /**
   * Lấy chi tiết yêu cầu nghỉ phép
   * 
   * Requires: VIEW_TIME_OFF_ALL or VIEW_TIME_OFF_OWN (for own requests)
   * 
   * Possible errors:
   * - 403: Access Denied (trying to view other's request without VIEW_TIME_OFF_ALL)
   * - 404: Time off request not found
   */
  static async getTimeOffRequestById(
    requestId: string
  ): Promise<TimeOffRequestDetail> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffRequestDetail>(
      `${this.BASE_URL}/${requestId}`
    );
    return response.data;
  }

  /**
   * Cập nhật trạng thái yêu cầu nghỉ phép
   * 
   * Requires: APPROVE_TIME_OFF, REJECT_TIME_OFF, or CANCEL_TIME_OFF_PENDING permission
   * 
   * Possible errors:
   * - 400: Invalid status transition, Missing required reason
   * - 403: Access Denied (missing required permission)
   * - 404: Time off request not found
   */
  static async updateTimeOffStatus(
    requestId: string,
    data: UpdateTimeOffStatusDto
  ): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(
      `${this.BASE_URL}/${requestId}`,
      data
    );
    return response.data;
  }

  /**
   * Duyệt yêu cầu nghỉ phép
   * 
   * Requires: APPROVE_TIME_OFF permission
   * 
   * Possible errors:
   * - 400: Only PENDING requests can be approved
   * - 403: Access Denied (missing APPROVE_TIME_OFF permission)
   * - 404: Time off request not found
   */
  static async approveTimeOffRequest(
    requestId: string
  ): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(
      `${this.BASE_URL}/${requestId}`,
      { status: 'APPROVED' }
    );
    return response.data;
  }

  /**
   * Từ chối yêu cầu nghỉ phép
   * 
   * Requires: REJECT_TIME_OFF permission
   * 
   * Possible errors:
   * - 400: rejectedReason is required
   * - 403: Access Denied (missing REJECT_TIME_OFF permission)
   * - 404: Time off request not found
   */
  static async rejectTimeOffRequest(
    requestId: string,
    data: RejectTimeOffRequestDto
  ): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(
      `${this.BASE_URL}/${requestId}`,
      { status: 'REJECTED', reason: data.rejectedReason }
    );
    return response.data;
  }

  /**
   * Hủy yêu cầu nghỉ phép
   * 
   * Requires: CANCEL_TIME_OFF_OWN (for own requests) or CANCEL_TIME_OFF_PENDING (for any PENDING request)
   * 
   * Possible errors:
   * - 400: Only PENDING requests can be cancelled
   * - 403: Access Denied (missing CANCEL permission)
   * - 404: Time off request not found
   */
  static async cancelTimeOffRequest(
    requestId: string,
    data: CancelTimeOffRequestDto
  ): Promise<TimeOffRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffRequest>(
      `${this.BASE_URL}/${requestId}`,
      { status: 'CANCELLED', reason: data.cancellationReason }
    );
    return response.data;
  }
}

// Export singleton instance
export const timeOffRequestService = new TimeOffRequestService();