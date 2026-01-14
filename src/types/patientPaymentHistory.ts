/**
 * Patient Payment History Types
 * For API endpoint: GET /api/v1/invoices/patient-history/{patientCode}
 */

/**
 * Invoice item in payment history
 */
export interface PaymentHistoryInvoiceItem {
  itemId: number;
  serviceName: string;
  serviceCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

/**
 * Payment transaction in invoice
 */
export interface PaymentHistoryPayment {
  paymentId: number;
  amount: number;
  paymentMethod: 'SEPAY'; // Currently only SePay supported
  paymentDate: string; // ISO 8601 format
  notes?: string;
}

/**
 * Invoice in payment history
 */
export interface PaymentHistoryInvoice {
  invoiceCode: string;
  patientCode: string;
  patientName: string;
  appointmentCode?: string;
  treatmentPlanCode?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PENDING_PAYMENT' | 'PARTIAL_PAID' | 'PAID' | 'CANCELLED';
  paymentMethod?: 'SEPAY';
  issuedDate: string; // ISO 8601 format
  dueDate?: string; // ISO 8601 format
  lastPaymentDate?: string; // ISO 8601 format
  notes?: string;
  items: PaymentHistoryInvoiceItem[];
  payments: PaymentHistoryPayment[];
}

/**
 * Pagination info
 * Note: currentPage is 1-based (converted by BE for FE convenience)
 */
export interface PaymentHistoryPagination {
  currentPage: number; // 1-based (BE converts from 0-based)
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Summary statistics
 */
export interface PaymentHistorySummary {
  totalInvoices: number; // Total invoices matching filters
  totalAmount: number; // Sum of totalAmount
  paidAmount: number; // Sum of paidAmount
  remainingAmount: number; // Sum of remainingAmount
  unpaidInvoices: number; // Count of PENDING_PAYMENT + PARTIAL_PAID
}

/**
 * Complete payment history response
 */
export interface PatientPaymentHistoryResponse {
  invoices: PaymentHistoryInvoice[];
  pagination: PaymentHistoryPagination;
  summary: PaymentHistorySummary;
}

/**
 * Query filters for payment history API
 */
export interface PaymentHistoryFilters {
  patientCode: string; // Required path parameter
  status?: 'PENDING_PAYMENT' | 'PARTIAL_PAID' | 'PAID' | 'CANCELLED';
  fromDate?: string; // YYYY-MM-DD format
  toDate?: string; // YYYY-MM-DD format
  page?: number; // 0-based for API call
  size?: number; // Default: 10
  sort?: string; // Format: field,direction (e.g., "createdAt,desc")
}

/**
 * Payment status config for UI display
 */
export const PAYMENT_STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'faHourglassHalf',
  },
  PARTIAL_PAID: {
    label: 'Thanh toán một phần',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'faCircleHalfStroke',
  },
  PAID: {
    label: 'Đã thanh toán',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'faCheckCircle',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'faBan',
  },
} as const;

/**
 * Payment method config for UI display
 */
export const PAYMENT_METHOD_CONFIG = {
  SEPAY: {
    label: 'SePay',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'faQrcode',
  },
} as const;
