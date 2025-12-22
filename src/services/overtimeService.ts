/**
 * Overtime Request Management Service
 * Based on Overtime_API.md specification
 */

import { apiClient } from '@/lib/api';
import {
  OvertimeRequest,
  OvertimeRequestDetail,
  CreateOvertimeRequestDto,
  UpdateOvertimeStatusDto,
  OvertimeRequestListResponse,
  OvertimeStatus,
} from '@/types/overtime';

export class OvertimeService {
  private static readonly BASE_URL = '/overtime-requests';

  /**
   * Tạo yêu cầu làm thêm giờ
   * 
   * Possible errors:
   * - 400: Validation errors (missing fields, past date)
   * - 403: FORBIDDEN - Insufficient permissions (CREATE_OVERTIME)
   * - 404: RELATED_RESOURCE_NOT_FOUND - Employee or work shift not found
   * - 409: DUPLICATE_OT_REQUEST - Duplicate request for same employee/date/shift
   */
  static async createOvertimeRequest(
    data: CreateOvertimeRequestDto
  ): Promise<OvertimeRequestDetail> {
    const axios = apiClient.getAxiosInstance();

    if (process.env.NODE_ENV === 'development') {
      console.log(' OvertimeService.createOvertimeRequest called with:', {
        url: this.BASE_URL,
        data: data,
        hasEmployeeId: data.employeeId !== undefined,
        employeeId: data.employeeId
      });
    }

    try {
      const response = await axios.post<OvertimeRequestDetail>(
        this.BASE_URL,
        data
      );
      if (process.env.NODE_ENV === 'development') {
        console.log(' OvertimeService.createOvertimeRequest success:', response.data);
      }
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(' OvertimeService.createOvertimeRequest error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.response?.data?.code,
          message: error.response?.data?.message,
        });
      }
      throw error;
    }
  }

  /**
   * Lấy danh sách yêu cầu làm thêm giờ
   * 
   * Possible errors:
   * - 403: FORBIDDEN - Insufficient permissions (VIEW_OVERTIME_ALL, VIEW_OVERTIME_OWN)
   * 
   * Note: VIEW_OVERTIME_ALL sees all requests, VIEW_OVERTIME_OWN sees only own requests
   */
  static async getOvertimeRequests(
    params?: {
      page?: number;
      size?: number;
      sort?: string;
    }
  ): Promise<OvertimeRequestListResponse> {
    const queryParams = new URLSearchParams();

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
    const response = await axios.get<OvertimeRequestListResponse>(url);
    return response.data;
  }

  /**
   * Lấy chi tiết yêu cầu làm thêm giờ
   * 
   * Possible errors:
   * - 403: FORBIDDEN - Insufficient permissions (VIEW_OVERTIME_ALL, VIEW_OVERTIME_OWN)
   * - 404: OT_REQUEST_NOT_FOUND - Request not found or not accessible
   */
  static async getOvertimeRequestById(
    requestId: string
  ): Promise<OvertimeRequestDetail> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<OvertimeRequestDetail>(
      `${this.BASE_URL}/${requestId}`
    );
    return response.data;
  }

  /**
   * Cập nhật trạng thái yêu cầu làm thêm giờ
   * 
   * Possible errors:
   * - 400: Validation errors (missing reason for REJECT/CANCEL)
   * - 403: FORBIDDEN - Insufficient permissions (APPROVE_OVERTIME, REJECT_OVERTIME, CANCEL_OVERTIME_OWN, CANCEL_OVERTIME_PENDING)
   * - 404: OT_REQUEST_NOT_FOUND - Request not found
   * - 409: INVALID_STATE_TRANSITION - Cannot update non-PENDING request
   */
  static async updateOvertimeStatus(
    requestId: string,
    data: UpdateOvertimeStatusDto
  ): Promise<OvertimeRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<OvertimeRequest>(
      `${this.BASE_URL}/${requestId}`,
      data
    );
    return response.data;
  }

  /**
   * Duyệt yêu cầu làm thêm giờ
   * 
   * Requires: APPROVE_OVERTIME permission
   * Note: Automatically creates employee_shifts record with is_overtime = true
   */
  static async approveOvertimeRequest(
    requestId: string
  ): Promise<OvertimeRequest> {
    return this.updateOvertimeStatus(requestId, {
      status: OvertimeStatus.APPROVED,
    });
  }

  /**
   * Từ chối yêu cầu làm thêm giờ
   * 
   * Requires: REJECT_OVERTIME permission
   * Note: Reason is required for rejection
   */
  static async rejectOvertimeRequest(
    requestId: string,
    reason: string
  ): Promise<OvertimeRequest> {
    return this.updateOvertimeStatus(requestId, {
      status: OvertimeStatus.REJECTED,
      reason,
    });
  }

  /**
   * Hủy yêu cầu làm thêm giờ
   * 
   * Requires: CANCEL_OVERTIME_OWN (own requests) or CANCEL_OVERTIME_PENDING (any pending request)
   * Note: Reason is required for cancellation
   */
  static async cancelOvertimeRequest(
    requestId: string,
    reason: string
  ): Promise<OvertimeRequest> {
    return this.updateOvertimeStatus(requestId, {
      status: OvertimeStatus.CANCELLED,
      reason,
    });
  }
}

export default OvertimeService;
