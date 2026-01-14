/**
 * Time Off Type Service
 * Handles all API interactions for Time Off Types
 * Based on Time_Off_Type.md specification + P6.1 Admin API
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse } from '@/utils/apiResponse';
import {
  TimeOffType,
  TimeOffTypeListResponse,
  CreateTimeOffTypeDto,
  UpdateTimeOffTypeDto,
} from '@/types/timeOff';

export class TimeOffTypeService {
  private static readonly BASE_URL = '/time-off-types';
  private static readonly ADMIN_BASE_URL = '/admin/time-off-types';

  /**
   * ============================================
   * EMPLOYEE APIs (Read-only for creating requests)
   * ============================================
   */

  /**
   * Lấy danh sách loại nghỉ phép (Employee view - chỉ active)
   * 
   * Requires: VIEW_LEAVE_TYPE permission
   * 
   * Query parameters:
   * - isActive: Filter by active status (true/false)
   * - requiresApproval: Filter by approval requirement (true/false)
   * - isPaid: Filter by payment status (true/false)
   * - page: Page number (default: 0)
   * - size: Page size (default: 20)
   * 
   * Possible errors:
   * - 403: Access Denied (missing VIEW_LEAVE_TYPE permission)
   */
  static async getTimeOffTypes(params?: {
    isActive?: boolean;
    requiresApproval?: boolean;
    isPaid?: boolean;
    page?: number;
    size?: number;
  }): Promise<TimeOffType[]> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffType[]>(
      this.BASE_URL,
      { params }
    );
    const data = extractApiResponse<TimeOffType[]>(response);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Lấy danh sách loại nghỉ phép cho dropdown (chỉ active types)
   * 
   * Requires: VIEW_LEAVE_TYPE permission
   */
  static async getActiveTimeOffTypes(): Promise<TimeOffType[]> {
    const response = await this.getTimeOffTypes({
      isActive: true
    });
    return response;
  }

  /**
   * Lấy danh sách loại nghỉ phép yêu cầu phê duyệt
   * 
   * Requires: VIEW_LEAVE_TYPE permission
   */
  static async getApprovalRequiredTypes(): Promise<TimeOffType[]> {
    const response = await this.getTimeOffTypes({
      isActive: true,
      requiresApproval: true
    });
    return response;
  }

  /**
   * ============================================
   * ADMIN APIs (Full CRUD for management)
   * ============================================
   */

  /**
   * 1. GET /api/v1/admin/time-off-types
   * Lấy danh sách TẤT CẢ loại nghỉ phép (bao gồm cả inactive)
   * 
   * Requires: VIEW_LEAVE_TYPE permission
   * 
   * Possible errors:
   * - 403: FORBIDDEN - Insufficient permissions
   */
  static async getAllTimeOffTypes(params?: {
    isActive?: boolean;
    isPaid?: boolean;
  }): Promise<TimeOffType[]> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffType[]>(
      this.ADMIN_BASE_URL,
      { params }
    );
    const data = extractApiResponse<TimeOffType[]>(response);
    return Array.isArray(data) ? data : [];
  }

  /**
   * 2. POST /api/v1/admin/time-off-types
   * Tạo loại nghỉ phép mới
   * 
   * Requires: MANAGE_LEAVE_TYPE permission
   * 
   * Possible errors:
   * - 400: BAD_REQUEST - Validation errors
   * - 403: FORBIDDEN - Insufficient permissions
   * - 409: CONFLICT - DUPLICATE_TYPE_CODE
   */
  static async createTimeOffType(data: CreateTimeOffTypeDto): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<TimeOffType>(
      this.ADMIN_BASE_URL,
      data
    );
    return extractApiResponse<TimeOffType>(response);
  }

  /**
   * 3. PATCH /api/v1/admin/time-off-types/{id}
   * Cập nhật loại nghỉ phép
   * 
   * Requires: MANAGE_LEAVE_TYPE permission
   * 
   * Possible errors:
   * - 400: BAD_REQUEST - Validation errors
   * - 403: FORBIDDEN - Insufficient permissions
   * - 404: NOT_FOUND - TIMEOFF_TYPE_NOT_FOUND
   * - 409: CONFLICT - DUPLICATE_TYPE_CODE
   */
  static async updateTimeOffType(
    typeId: string,
    data: UpdateTimeOffTypeDto
  ): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<TimeOffType>(
      `${this.ADMIN_BASE_URL}/${typeId}`,
      data
    );
    return extractApiResponse<TimeOffType>(response);
  }

  /**
   * 4. DELETE /api/v1/admin/time-off-types/{id}
   * Toggle trạng thái is_active (soft delete)
   * 
   * Requires: MANAGE_LEAVE_TYPE permission
   * 
   * Business Logic:
   * - Đảo ngược is_active (true -> false hoặc false -> true)
   * - Nếu vô hiệu hóa (true -> false), kiểm tra xem có yêu cầu PENDING nào đang dùng không
   * 
   * Possible errors:
   * - 403: FORBIDDEN - Insufficient permissions
   * - 404: NOT_FOUND - TIMEOFF_TYPE_NOT_FOUND
   * - 409: CONFLICT - TIMEOFF_TYPE_IN_USE (có yêu cầu PENDING đang dùng)
   */
  static async deleteTimeOffType(typeId: string): Promise<TimeOffType> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.delete<TimeOffType>(
      `${this.ADMIN_BASE_URL}/${typeId}`
    );
    return extractApiResponse<TimeOffType>(response);
  }
}

// Export singleton instance
export const timeOffTypeService = new TimeOffTypeService();