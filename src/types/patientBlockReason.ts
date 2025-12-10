/**
 * Patient Booking Block Reason Types & Utilities
 * 
 * Updated: Dec 10, 2025
 * BE refactored booking block system - removed isBlacklisted, unified into isBookingBlocked
 */

/**
 * Booking Block Reason Enum (Simplified)
 * Maps to BE enum: BookingBlockReason
 * 
 * Note: BE has 10 values, but we only show 5 most common reasons in UI
 */
export enum BookingBlockReason {
  // Temporary Block (Can be auto-unblocked)
  EXCESSIVE_NO_SHOWS = 'EXCESSIVE_NO_SHOWS',
  
  // Permanent Blacklist (Requires manager approval to unblock)
  PAYMENT_ISSUES = 'DEBT_DEFAULT', // Maps to DEBT_DEFAULT
  STAFF_ABUSE = 'STAFF_ABUSE', // Includes DISRUPTIVE_BEHAVIOR
  POLICY_VIOLATION = 'POLICY_VIOLATION', // Includes EXCESSIVE_CANCELLATIONS
  OTHER_SERIOUS = 'OTHER_SERIOUS' // Catch-all for rare cases
}

// Full BE enum mapping (for backward compatibility)
export const BE_BOOKING_BLOCK_REASONS = {
  EXCESSIVE_NO_SHOWS: 'EXCESSIVE_NO_SHOWS',
  EXCESSIVE_CANCELLATIONS: 'EXCESSIVE_CANCELLATIONS',
  STAFF_ABUSE: 'STAFF_ABUSE',
  DEBT_DEFAULT: 'DEBT_DEFAULT',
  FRIVOLOUS_LAWSUIT: 'FRIVOLOUS_LAWSUIT',
  PROPERTY_DAMAGE: 'PROPERTY_DAMAGE',
  INTOXICATION: 'INTOXICATION',
  DISRUPTIVE_BEHAVIOR: 'DISRUPTIVE_BEHAVIOR',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  OTHER_SERIOUS: 'OTHER_SERIOUS'
} as const;

/**
 * Vietnamese labels for booking block reasons (Simplified - 5 reasons)
 */
export const BOOKING_BLOCK_REASON_LABELS: Record<string, string> = {
  // Frontend enum (5 values)
  [BookingBlockReason.EXCESSIVE_NO_SHOWS]: 'Bỏ hẹn quá nhiều',
  [BookingBlockReason.PAYMENT_ISSUES]: 'Vấn đề thanh toán',
  [BookingBlockReason.STAFF_ABUSE]: 'Bạo lực/Quấy rối nhân viên',
  [BookingBlockReason.POLICY_VIOLATION]: 'Vi phạm quy định',
  [BookingBlockReason.OTHER_SERIOUS]: 'Vi phạm nghiêm trọng khác',
  
  // BE enum mapping (for received data)
  'EXCESSIVE_NO_SHOWS': 'Bỏ hẹn quá nhiều',
  'EXCESSIVE_CANCELLATIONS': 'Hủy hẹn quá nhiều',
  'STAFF_ABUSE': 'Bạo lực với nhân viên',
  'DEBT_DEFAULT': 'Nợ chi phí điều trị',
  'FRIVOLOUS_LAWSUIT': 'Kiện tụng vô căn cứ',
  'PROPERTY_DAMAGE': 'Phá hoại tài sản',
  'INTOXICATION': 'Say xỉn',
  'DISRUPTIVE_BEHAVIOR': 'Gây rối',
  'POLICY_VIOLATION': 'Vi phạm quy định',
  'OTHER_SERIOUS': 'Vi phạm nghiêm trọng khác'
};

/**
 * Permanent blacklist reasons (requires manager to unblock)
 * Includes all BE reasons except EXCESSIVE_NO_SHOWS
 */
export const PERMANENT_BLACKLIST_REASONS = [
  BookingBlockReason.PAYMENT_ISSUES,
  BookingBlockReason.STAFF_ABUSE,
  BookingBlockReason.POLICY_VIOLATION,
  BookingBlockReason.OTHER_SERIOUS,
  // BE values
  'EXCESSIVE_CANCELLATIONS',
  'STAFF_ABUSE',
  'DEBT_DEFAULT',
  'FRIVOLOUS_LAWSUIT',
  'PROPERTY_DAMAGE',
  'INTOXICATION',
  'DISRUPTIVE_BEHAVIOR',
  'POLICY_VIOLATION',
  'OTHER_SERIOUS'
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
 * Dropdown options for booking block reason selector (SIMPLIFIED - 5 options)
 */
export const BOOKING_BLOCK_REASON_OPTIONS = [
  { 
    value: 'EXCESSIVE_NO_SHOWS', 
    label: '🟠 Bỏ hẹn quá nhiều', 
    temporary: true,
    description: 'Tạm chặn - Tự động mở khóa khi bệnh nhân đến khám'
  },
  { 
    value: 'DEBT_DEFAULT', 
    label: '🔴 Vấn đề thanh toán', 
    temporary: false,
    description: 'Nợ chi phí điều trị'
  },
  { 
    value: 'STAFF_ABUSE', 
    label: '🔴 Bạo lực/Quấy rối nhân viên', 
    temporary: false,
    description: 'Có hành vi bạo lực, quấy rối hoặc gây rối'
  },
  { 
    value: 'POLICY_VIOLATION', 
    label: '🔴 Vi phạm quy định', 
    temporary: false,
    description: 'Hủy hẹn liên tục, vi phạm quy định phòng khám'
  },
  { 
    value: 'OTHER_SERIOUS', 
    label: '🔴 Vi phạm nghiêm trọng khác', 
    temporary: false,
    description: 'Các vi phạm nghiêm trọng khác'
  }
];

