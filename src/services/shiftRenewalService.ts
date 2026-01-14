/**
 * Shift Renewal Request Service
 * Based on SHIFT_API.md specification (BE-307)
 */

import { apiClient } from '@/lib/api';
import {
  ShiftRenewalRequest,
  RespondRenewalDto,
  ShiftRenewalListResponse,
} from '@/types/shiftRenewal';

export class ShiftRenewalService {
  private static readonly BASE_URL = '/registrations/renewals';

  /**
   * Lấy danh sách yêu cầu gia hạn đang chờ xử lý
   */
  static async getPendingRenewals(): Promise<ShiftRenewalListResponse> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<ShiftRenewalListResponse>(`${this.BASE_URL}/pending`);
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<ShiftRenewalListResponse | ShiftRenewalRequest>(response);
  }

  /**
   * Phản hồi yêu cầu gia hạn (CONFIRMED/DECLINED)
   */
  static async respondToRenewal(
    renewalId: string,
    data: RespondRenewalDto
  ): Promise<ShiftRenewalRequest> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<ShiftRenewalRequest>(
      `${this.BASE_URL}/${renewalId}/respond`,
      data
    );
    const { extractApiResponse } = await import('@/utils/apiResponse');
    return extractApiResponse<ShiftRenewalListResponse | ShiftRenewalRequest>(response);
  }

  /**
   * Xác nhận gia hạn
   */
  static async confirmRenewal(renewalId: string): Promise<ShiftRenewalRequest> {
    return this.respondToRenewal(renewalId, { action: 'CONFIRMED' });
  }

  /**
   * Từ chối gia hạn
   */
  static async declineRenewal(renewalId: string): Promise<ShiftRenewalRequest> {
    return this.respondToRenewal(renewalId, { action: 'DECLINED' });
  }
}

export default ShiftRenewalService;
