/**
 * Leave Balance Service
 * Handles all API interactions for Employee Leave Balance Management
 * Based on P6.1/P6.2 specification
 */

import { apiClient } from '@/lib/api';
import {
  EmployeeLeaveBalancesResponse,
  AdjustBalanceRequest,
  AdjustBalanceResponse,
  AnnualResetRequest,
  AnnualResetResponse,
} from '@/types/leaveBalance';
import { TimeOffType } from '@/types/timeOff';

export class LeaveBalanceService {
  private static readonly BASE_URL = '/admin';

  /**
   * Lấy số dư phép của một nhân viên theo năm
   * 
   * GET /api/v1/admin/employees/{employee_id}/leave-balances?cycle_year=2025
   * 
   * Requires: VIEW_LEAVE_BALANCE_ALL permission
   * 
   * @param employeeId - ID của nhân viên
   * @param cycleYear - Năm chu kỳ (mặc định là năm hiện tại)
   * 
   * Possible errors:
   * - 403: FORBIDDEN (missing VIEW_LEAVE_BALANCE_ALL permission)
   * - 404: RELATED_RESOURCE_NOT_FOUND (employee not found)
   */
  static async getEmployeeBalances(
    employeeId: number,
    cycleYear?: number
  ): Promise<EmployeeLeaveBalancesResponse> {
    const axios = apiClient.getAxiosInstance();
    try {
      const response = await axios.get<EmployeeLeaveBalancesResponse>(
        `${this.BASE_URL}/employees/${employeeId}/leave-balances`,
        {
          params: {
            cycle_year: cycleYear || new Date().getFullYear()
          }
        }
      );
      return response.data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ LeaveBalanceService.getEmployeeBalances error:', {
          employeeId,
          cycleYear: cycleYear || new Date().getFullYear(),
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          message: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Điều chỉnh thủ công số dư phép
   * 
   * POST /api/v1/admin/leave-balances/adjust
   * 
   * Requires: ADJUST_LEAVE_BALANCE permission
   * 
   * @param data - Dữ liệu điều chỉnh (employee_id, type_id, year, amount, notes)
   * 
   * Possible errors:
   * - 400: INVALID_BALANCE (balance would be negative after adjustment)
   * - 403: FORBIDDEN (missing ADJUST_LEAVE_BALANCE permission)
   * - 404: RELATED_RESOURCE_NOT_FOUND (employee or type not found)
   */
  static async adjustBalance(
    data: AdjustBalanceRequest
  ): Promise<AdjustBalanceResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<AdjustBalanceResponse>(
      `${this.BASE_URL}/leave-balances/adjust`,
      data
    );
    return response.data;
  }

  /**
   * Kích hoạt Job cộng phép năm mới cho toàn bộ nhân viên
   * 
   * POST /api/v1/admin/leave-balances/annual-reset
   * 
   * Requires: ADJUST_LEAVE_BALANCE permission (hoặc admin cấp cao)
   * 
   * @param data - Dữ liệu reset (year, type_id, default_allowance)
   * 
   * Possible errors:
   * - 400: INVALID_YEAR (invalid cycle year)
   * - 403: FORBIDDEN (missing ADJUST_LEAVE_BALANCE permission)
   * - 409: JOB_ALREADY_RUN (job already run for this year)
   */
  static async annualReset(
    data: AnnualResetRequest
  ): Promise<AnnualResetResponse> {
    const axios = apiClient.getAxiosInstance();

    try {
      console.log('🔄 Calling annual-reset with:', data);

      const response = await axios.post<AnnualResetResponse>(
        `${this.BASE_URL}/leave-balances/annual-reset`,
        data
      );

      console.log('✅ Annual-reset response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Annual-reset error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        requestData: data
      });
      throw error;
    }
  }

  /**
   * Lấy danh sách loại nghỉ phép (cho form điều chỉnh)
   * 
   * GET /api/v1/time-off-types
   * 
   * Requires: VIEW_TIME_OFF_TYPE permission
   * 
   * Note: Sử dụng lại API của P5 (Employee API)
   */
  static async getTimeOffTypes(): Promise<TimeOffType[]> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<TimeOffType[]>('/time-off-types');
    return response.data;
  }
}

// Export singleton instance
export const leaveBalanceService = new LeaveBalanceService();
