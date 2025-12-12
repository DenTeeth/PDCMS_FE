/**
 * Patient Booking Block Reason Types & Utilities
 * 
 * Updated: Dec 10, 2025
 * BE consolidated from 10 to 5 reasons based on FE feedback
 * Matches BE enum: BookingBlockReason.java exactly
 */

/**
 * Booking Block Reason Enum (Consolidated - 5 values)
 * Matches BE enum: BookingBlockReason
 * 
 * BR-005: Automatic temporary block after 3 consecutive no-shows
 * BR-043: Automatic blacklist after 3 appointment cancellations within 30 days
 * BR-044: Manual blacklist by staff for serious violations
 */
export enum BookingBlockReason {
  // ===== TEMPORARY BLOCKS (BR-005) =====
  /** 🟠 BR-005: Patient has 3 consecutive no-shows - Can be auto-unblocked */
  EXCESSIVE_NO_SHOWS = 'EXCESSIVE_NO_SHOWS',
  
  // ===== PERMANENT BLACKLIST =====
  /** 🔴 Payment issues: debt default, refuses to pay, payment disputes */
  PAYMENT_ISSUES = 'PAYMENT_ISSUES',
  
  /** 🔴 Staff abuse: verbal/physical abuse, harassment, disruptive behavior */
  STAFF_ABUSE = 'STAFF_ABUSE',
  
  /** 🔴 Policy violations: excessive cancellations, repeated rule violations (BR-043) */
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  
  /** 🔴 Other serious reasons: property damage, intoxication, frivolous lawsuits, etc. */
  OTHER_SERIOUS = 'OTHER_SERIOUS'
}

/**
 * All BE enum values match FE enum values now (consolidated to 5)
 * Old BE values (10 reasons) have been consolidated into these 5 categories
 */

/**
 * Vietnamese labels for booking block reasons (Matches BE exactly)
 */
export const BOOKING_BLOCK_REASON_LABELS: Record<string, string> = {
  [BookingBlockReason.EXCESSIVE_NO_SHOWS]: 'Bỏ hẹn quá nhiều',
  [BookingBlockReason.PAYMENT_ISSUES]: 'Vấn đề thanh toán',
  [BookingBlockReason.STAFF_ABUSE]: 'Bạo lực/Quấy rối nhân viên',
  [BookingBlockReason.POLICY_VIOLATION]: 'Vi phạm quy định',
  [BookingBlockReason.OTHER_SERIOUS]: 'Lý do nghiêm trọng khác',
};

/**
 * Permanent blacklist reasons (requires manager to unblock)
 * All reasons except EXCESSIVE_NO_SHOWS
 */
export const PERMANENT_BLACKLIST_REASONS = [
  BookingBlockReason.PAYMENT_ISSUES,
  BookingBlockReason.STAFF_ABUSE,
  BookingBlockReason.POLICY_VIOLATION,
  BookingBlockReason.OTHER_SERIOUS,
];

/**
 * Check if a block reason is temporary (can be auto-unblocked)
 */
export function isTemporaryBlock(reason: string | BookingBlockReason | null | undefined): boolean {
  return reason === BookingBlockReason.EXCESSIVE_NO_SHOWS || reason === 'EXCESSIVE_NO_SHOWS';
}

/**
 * Check if a block reason is permanent (requires manager approval)
 */
export function isPermanentBlacklist(reason: string | BookingBlockReason | null | undefined): boolean {
  if (!reason) return false;
  return PERMANENT_BLACKLIST_REASONS.includes(reason as BookingBlockReason);
}

/**
 * Get Vietnamese label for a booking block reason
 */
export function getBookingBlockReasonLabel(reason: string | BookingBlockReason | null | undefined): string {
  if (!reason) return 'Không xác định';
  return BOOKING_BLOCK_REASON_LABELS[reason as BookingBlockReason] || 'Bị chặn';
}

/**
 * Get block status display info for UI
 */
export interface BlockStatusDisplay {
  status: 'active' | 'temporarily_blocked' | 'blacklisted';
  color: 'green' | 'orange' | 'red';
  badgeColor: string;
  message: string;
  details?: string;
  blockedBy?: string;
  blockedAt?: string;
  canAutoUnblock: boolean;
}

/**
 * Get comprehensive block status display information
 */
export function getBlockStatusDisplay(patient: {
  isBookingBlocked?: boolean;
  bookingBlockReason?: string | BookingBlockReason | null;
  bookingBlockNotes?: string | null;
  blockedBy?: string | null;
  blockedAt?: string | null;
}): BlockStatusDisplay {
  if (!patient.isBookingBlocked) {
    return {
      status: 'active',
      color: 'green',
      badgeColor: 'bg-green-100 text-green-700',
      message: 'Có thể đặt hẹn',
      canAutoUnblock: false
    };
  }

  const isTemporary = isTemporaryBlock(patient.bookingBlockReason);
  
  return {
    status: isTemporary ? 'temporarily_blocked' : 'blacklisted',
    color: isTemporary ? 'orange' : 'red',
    badgeColor: isTemporary ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700',
    message: getBookingBlockReasonLabel(patient.bookingBlockReason),
    details: patient.bookingBlockNotes || undefined,
    blockedBy: patient.blockedBy || undefined,
    blockedAt: patient.blockedAt || undefined,
    canAutoUnblock: isTemporary
  };
}

/**
 * Dropdown options for booking block reason selector (5 options - matches BE)
 */
export const BOOKING_BLOCK_REASON_OPTIONS = [
  { 
    value: BookingBlockReason.EXCESSIVE_NO_SHOWS, 
    label: '🟠 Bỏ hẹn quá nhiều', 
    temporary: true,
    description: 'Tạm chặn - Tự động mở khóa khi bệnh nhân đến khám'
  },
  { 
    value: BookingBlockReason.PAYMENT_ISSUES, 
    label: '🔴 Vấn đề thanh toán', 
    temporary: false,
    description: 'Nợ chi phí, từ chối thanh toán, tranh chấp thanh toán'
  },
  { 
    value: BookingBlockReason.STAFF_ABUSE, 
    label: '🔴 Bạo lực/Quấy rối nhân viên', 
    temporary: false,
    description: 'Bạo lực, quấy rối, gây rối với nhân viên'
  },
  { 
    value: BookingBlockReason.POLICY_VIOLATION, 
    label: '🔴 Vi phạm quy định', 
    temporary: false,
    description: 'Hủy hẹn quá nhiều, vi phạm quy định phòng khám lặp lại'
  },
  { 
    value: BookingBlockReason.OTHER_SERIOUS, 
    label: '🔴 Lý do nghiêm trọng khác', 
    temporary: false,
    description: 'Phá hoại tài sản, say xỉn, kiện tụng vô căn cứ, v.v.'
  }
];

