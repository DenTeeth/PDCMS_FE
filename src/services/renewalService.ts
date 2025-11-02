/**
 * Renewal Service
 * 
 * Service để xử lý các API calls liên quan đến Shift Renewal
 * 
 * Dựa trên CRON_JOB_AND_RENEWAL_API_GUIDE.md
 * 
 * Chức năng:
 * - Employee: Xem danh sách pending renewals, phản hồi renewal
 * - Admin: Xem tất cả renewals, finalize renewal đã được nhân viên confirm
 * 
 * Last updated: 2025-01-XX
 */

import { apiClient } from '@/lib/api';
import {
  ShiftRenewal,
  RenewalResponseRequest,
  FinalizeRenewalRequest,
  RenewalQueryParams,
  RenewalStatus
} from '@/types/renewal';

/**
 * Renewal Service Class
 * Handles all renewal-related API operations
 */
class RenewalService {
  /** Base endpoint cho Employee APIs */
  private readonly employeeEndpoint = '/registrations/renewals';
  
  /** Base endpoint cho Admin APIs */
  private readonly adminEndpoint = '/admin/registrations/renewals';

  /**
   * [EMPLOYEE API] Lấy danh sách renewal requests đang chờ nhân viên phản hồi
   * 
   * Endpoint: GET /api/v1/registrations/renewals/pending
   * 
   * Chức năng:
   * - Chỉ trả về renewals có status = PENDING_ACTION
   * - Chỉ trả về renewals của nhân viên hiện tại (từ token)
   * - Sử dụng để hiển thị notification badge và danh sách renewal
   * 
   * @returns Danh sách renewal requests đang chờ phản hồi
   * @throws Error nếu API call thất bại
   */
  async getPendingRenewals(): Promise<ShiftRenewal[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<ShiftRenewal[]>(
        `${this.employeeEndpoint}/pending`
      );
      
      // Handle both response structures
      // Case 1: Direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Case 2: Wrapped response { statusCode, data: [...] }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Fallback: return empty array
      return [];
    } catch (error: any) {
      console.error('❌ [renewalService.getPendingRenewals] Failed:', error);
      
      // Handle specific error codes
      if (error.response?.status === 404) {
        // Endpoint not found - backend might not have implemented this yet
        console.warn('⚠️ [renewalService.getPendingRenewals] Endpoint not found (404) - Backend might not have implemented renewal API yet');
        return []; // Return empty array instead of throwing
      } else if (error.response?.status === 500) {
        // Server error - backend might have issue
        console.error('❌ [renewalService.getPendingRenewals] Server error (500) - Backend might have issue');
        // Return empty array instead of throwing to avoid breaking UI
        return [];
      } else if (error.response?.status === 403) {
        // Permission denied
        console.warn('⚠️ [renewalService.getPendingRenewals] Permission denied (403)');
        return []; // Return empty array instead of throwing
      }
      
      // Re-throw với message rõ ràng cho các lỗi khác
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to fetch pending renewals');
      }
    }
  }

  /**
   * [EMPLOYEE API] Nhân viên phản hồi renewal request
   * 
   * Endpoint: PATCH /api/v1/registrations/renewals/{renewalId}/respond
   * 
   * Chức năng:
   * - Nhân viên có thể CONFIRMED (đồng ý) hoặc DECLINED (từ chối)
   * - Nếu DECLINED → phải cung cấp declineReason
   * - Nếu CONFIRMED → chờ Admin finalize
   * 
   * Validation (Backend):
   * - Renewal phải tồn tại và có status = PENDING_ACTION
   * - Renewal chưa quá hạn (expires_at > NOW)
   * - Nếu DECLINED → declineReason bắt buộc
   * 
   * @param renewalId ID của renewal request (Format: SRR_YYYYMMDD_XXXXX)
   * @param request Request body chứa action và declineReason (nếu có)
   * @returns Renewal object sau khi update
   * @throws Error nếu validation fail hoặc API call thất bại
   */
  async respondToRenewal(
    renewalId: string,
    request: RenewalResponseRequest
  ): Promise<ShiftRenewal> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      // Validate request
      if (request.action === 'DECLINED' && !request.declineReason) {
        throw new Error('Decline reason is required when action is DECLINED');
      }
      
      const response = await axiosInstance.patch<ShiftRenewal>(
        `${this.employeeEndpoint}/${renewalId}/respond`,
        request
      );
      
      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [renewalService.respondToRenewal] Failed:', error);
      
      // Handle specific error codes
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message || 
          error.response?.data?.detail || 
          'Invalid request. Please check your input.'
        );
      } else if (error.response?.status === 404) {
        throw new Error('Renewal request not found');
      } else if (error.response?.status === 409) {
        throw new Error('Renewal request already responded or expired');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to respond to renewal');
      }
    }
  }

  /**
   * [ADMIN API] Lấy danh sách tất cả renewal requests (với filters)
   * 
   * Endpoint: GET /api/v1/admin/registrations/renewals
   * 
   * Chức năng:
   * - Admin có thể xem tất cả renewals của tất cả nhân viên
   * - Có thể filter theo status, employeeId
   * - Sử dụng để quản lý và finalize renewals
   * 
   * Query Parameters:
   * - status: Filter theo trạng thái (PENDING_ACTION, CONFIRMED, etc.)
   * - employeeId: Filter theo employee ID
   * - page, size: Pagination (nếu API hỗ trợ)
   * 
   * @param params Query parameters để filter
   * @returns Danh sách renewal requests
   * @throws Error nếu API call thất bại
   */
  async getAllRenewals(params: RenewalQueryParams = {}): Promise<ShiftRenewal[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      // Build query parameters
      const queryParams: Record<string, string | number> = {};
      
      if (params.status) {
        queryParams.status = params.status;
      }
      
      if (params.employeeId) {
        queryParams.employeeId = params.employeeId;
      }
      
      if (params.page !== undefined) {
        queryParams.page = params.page;
      }
      
      if (params.size !== undefined) {
        queryParams.size = params.size;
      }
      
      const response = await axiosInstance.get<ShiftRenewal[]>(
        this.adminEndpoint,
        { params: queryParams }
      );
      
      // Handle both response structures
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Fallback: return empty array
      return [];
    } catch (error: any) {
      console.error('❌ [renewalService.getAllRenewals] Failed:', error);
      
      // Handle specific error codes
      if (error.response?.status === 404) {
        // Endpoint not found - backend might not have implemented this yet
        console.warn('⚠️ [renewalService.getAllRenewals] Endpoint not found (404) - Backend might not have implemented admin renewal API yet');
        return []; // Return empty array instead of throwing
      } else if (error.response?.status === 500) {
        // Server error - backend might have issue
        console.error('❌ [renewalService.getAllRenewals] Server error (500) - Backend might have issue');
        // Return empty array instead of throwing to avoid breaking UI
        return [];
      } else if (error.response?.status === 403) {
        // Permission denied
        console.warn('⚠️ [renewalService.getAllRenewals] Permission denied (403)');
        throw new Error('Bạn không có quyền xem danh sách renewal requests. Cần permission: MANAGE_FIXED_REGISTRATIONS');
      }
      
      // Re-throw với message rõ ràng cho các lỗi khác
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to fetch renewals');
      }
    }
  }

  /**
   * [ADMIN API] Admin finalize renewal đã được nhân viên CONFIRMED
   * 
   * Endpoint: POST /api/v1/admin/registrations/renewals/finalize
   * 
   * Chức năng:
   * - Admin chọn ngày hết hạn mới cho renewal đã được nhân viên confirm
   * - Backend tự động:
   *   1. Vô hiệu hóa lịch cũ (is_active = false)
   *   2. Tạo lịch mới với effective_from = old_effective_to + 1 day
   *   3. Copy days of week từ lịch cũ
   *   4. Update renewal status = FINALIZED
   * 
   * Validation (Backend):
   * - Renewal phải tồn tại và có status = CONFIRMED
   * - newEffectiveTo phải > old registration's effective_to
   * - Admin phải có permission: MANAGE_FIXED_REGISTRATIONS
   * 
   * Business Logic:
   * - Lịch mới bắt đầu ngay sau ngày hết hạn của lịch cũ (không có gap)
   * - VD: Lịch cũ 30/11/2025 → Lịch mới từ 01/12/2025
   * 
   * @param request Request body chứa renewalRequestId và newEffectiveTo
   * @returns Renewal object sau khi finalize (status = FINALIZED)
   * @throws Error nếu validation fail hoặc API call thất bại
   */
  async finalizeRenewal(request: FinalizeRenewalRequest): Promise<ShiftRenewal> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      // Validate request
      if (!request.renewalRequestId) {
        throw new Error('Renewal request ID is required');
      }
      
      if (!request.newEffectiveTo) {
        throw new Error('New effective to date is required');
      }
      
      const response = await axiosInstance.post<ShiftRenewal>(
        `${this.adminEndpoint}/finalize`,
        request
      );
      
      // Handle both response structures
      if (response.data?.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [renewalService.finalizeRenewal] Failed:', error);
      
      // Handle specific error codes
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message || 
          error.response?.data?.detail || 
          'Invalid request. New effective to date must be after old effective to date.'
        );
      } else if (error.response?.status === 403) {
        throw new Error('Missing required permission: MANAGE_FIXED_REGISTRATIONS');
      } else if (error.response?.status === 409) {
        throw new Error('Renewal request must be CONFIRMED by employee first');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to finalize renewal');
      }
    }
  }
}

// Export singleton instance
export const renewalService = new RenewalService();

