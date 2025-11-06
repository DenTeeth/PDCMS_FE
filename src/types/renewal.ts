/**
 * Shift Renewal Type Definitions
 * 
 * Dựa trên CRON_JOB_AND_RENEWAL_API_GUIDE.md
 * Hệ thống renewal chỉ áp dụng cho Fixed Schedule (Luồng 1):
 * - Full-Time employees
 * - Part-Time Fixed employees
 * 
 * Part-Time Flex (Luồng 2) KHÔNG có renewal, tự động hết hạn.
 * 
 * Last updated: 2025-01-XX
 */

/**
 * Enum định nghĩa các trạng thái của renewal request
 * 
 * Workflow:
 * PENDING_ACTION → CONFIRMED → FINALIZED ✅
 *               → DECLINED ❌
 *               → EXPIRED ⏰ (tự động bởi Job P10)
 */
export enum RenewalStatus {
  /** 
   * Trạng thái ban đầu khi Job P9 tạo renewal request
   * Nhân viên có ~26 ngày để phản hồi (expires_at - 2 ngày trước khi lịch hết hạn)
   */
  PENDING_ACTION = 'PENDING_ACTION',
  
  /** 
   * Nhân viên đã đồng ý gia hạn
   * Chờ Admin finalize (chọn ngày hết hạn mới)
   */
  CONFIRMED = 'CONFIRMED',
  
  /** 
   * Nhân viên đã từ chối gia hạn
   * Lịch sẽ kết thúc theo ngày hết hạn hiện tại
   */
  DECLINED = 'DECLINED',
  
  /** 
   * Admin đã hoàn tất renewal
   * Lịch cũ đã bị vô hiệu hóa, lịch mới đã được tạo
   */
  FINALIZED = 'FINALIZED',
  
  /** 
   * Renewal request đã quá hạn (Job P10 đánh dấu)
   * Nhân viên không thể phản hồi nữa
   * Admin cần tạo renewal mới hoặc registration mới thủ công
   */
  EXPIRED = 'EXPIRED'
}

/**
 * Interface cho Shift Renewal Response từ API
 * 
 * Endpoint: GET /api/v1/registrations/renewals/pending
 * 
 * Response này chứa đầy đủ thông tin để nhân viên quyết định:
 * - Thông tin lịch hiện tại (workShiftName, shiftDetails, effectiveFrom, effectiveTo)
 * - Thông tin renewal (renewalId, status, expiresAt)
 * - Message thân thiện từ backend
 */
export interface ShiftRenewal {
  /** ID của renewal request (Format: SRR_YYYYMMDD_XXXXX) */
  renewalId: string;
  
  /** ID của registration sắp hết hạn */
  expiringRegistrationId: number;
  
  /** ID nhân viên */
  employeeId: number;
  
  /** Tên nhân viên */
  employeeName: string;
  
  /** Trạng thái hiện tại của renewal */
  status: RenewalStatus;
  
  /** Deadline để nhân viên phản hồi (expires_at = effective_to - 2 ngày) */
  expiresAt: string; // ISO datetime string
  
  /** Thời gian tạo renewal request (Job P9 chạy lúc 00:05 AM) */
  createdAt: string; // ISO datetime string
  
  /** Thời gian nhân viên phản hồi (null nếu chưa phản hồi) */
  confirmedAt: string | null; // ISO datetime string
  
  /** Lý do từ chối (chỉ có khi status = DECLINED) */
  declineReason: string | null;
  
  /** Ngày bắt đầu hiệu lực của lịch hiện tại */
  effectiveFrom: string; // ISO date string (YYYY-MM-DD)
  
  /** Ngày kết thúc hiệu lực của lịch hiện tại (28 ngày nữa từ khi job chạy) */
  effectiveTo: string; // ISO date string (YYYY-MM-DD)
  
  /** Tên ca làm việc (VD: "Ca sáng (8:00 - 12:00)") */
  workShiftName: string;
  
  /** Chi tiết ca làm việc (VD: "Thứ 2, Thứ 4, Thứ 6 (Ca sáng)") */
  shiftDetails: string;
  
  /** Message thân thiện từ backend để hiển thị cho nhân viên */
  message: string;
}

/**
 * Request body để nhân viên phản hồi renewal
 * 
 * Endpoint: PATCH /api/v1/registrations/renewals/{renewalId}/respond
 * 
 * Validation:
 * - Nếu action = "DECLINED" → declineReason bắt buộc
 * - Nếu action = "CONFIRMED" → declineReason = null
 */
export interface RenewalResponseRequest {
  /** Hành động: Đồng ý hoặc Từ chối */
  action: 'CONFIRMED' | 'DECLINED';
  
  /** Lý do từ chối (bắt buộc nếu action = DECLINED) */
  declineReason: string | null;
}

/**
 * Request body để Admin finalize renewal
 * 
 * Endpoint: POST /api/v1/admin/registrations/renewals/finalize
 * 
 * Validation:
 * - renewalRequestId: Phải tồn tại và có status = CONFIRMED
 * - newEffectiveTo: Phải > old registration's effective_to
 * 
 * Business Logic:
 * - Vô hiệu hóa lịch cũ (is_active = false)
 * - Tạo lịch mới với effective_from = old_effective_to + 1 day
 * - Copy days of week từ lịch cũ
 */
export interface FinalizeRenewalRequest {
  /** ID của renewal request cần finalize */
  renewalRequestId: string;
  
  /** Ngày hết hạn mới (Format: YYYY-MM-DD, phải > old effective_to) */
  newEffectiveTo: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Query parameters để Admin lọc danh sách renewals
 * 
 * Endpoint: GET /api/v1/admin/registrations/renewals
 */
export interface RenewalQueryParams {
  /** Filter theo trạng thái */
  status?: RenewalStatus;
  
  /** Filter theo employee ID */
  employeeId?: number;
  
  /** Pagination (optional, nếu API hỗ trợ) */
  page?: number;
  size?: number;
}

