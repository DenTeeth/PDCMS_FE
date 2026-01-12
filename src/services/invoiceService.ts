/**
 * Invoice Service
 * 
 * Handles invoice-related API operations including SePay payment integration
 * Last updated: 2025-01-26
 * Based on: docs/files/payment/controller/InvoiceController.java
 */

import { apiClient } from '@/lib/api';

/**
 * Invoice Type Enum
 */
export type InvoiceType = 'APPOINTMENT' | 'TREATMENT_PLAN' | 'SUPPLEMENTAL';

/**
 * Invoice Payment Status Enum
 */
export type InvoicePaymentStatus = 'PENDING_PAYMENT' | 'PARTIAL_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

/**
 * Invoice Item DTO
 */
export interface InvoiceItemDto {
  serviceId: number;
  serviceCode?: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Invoice Item Response
 */
export interface InvoiceItemResponse {
  itemId: number;
  serviceId: number;
  serviceCode?: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

/**
 * Payment Summary
 */
export interface PaymentSummary {
  paymentId: number;
  paymentCode: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

/**
 * Paginated Response from BE
 * Based on Spring Data Page interface
 */
export interface PageResponse<T> {
  content: T[];  // Array of items
  totalElements: number;  // Total count across all pages
  totalPages: number;  // Total number of pages
  size: number;  // Items per page
  number: number;  // Current page (0-based)
  first: boolean;  // Is first page?
  last: boolean;  // Is last page?
  empty: boolean;  // Is result empty?
}

/**
 * Invoice Response from BE
 * Based on: docs/api-guide/INVOICE_API_500_ERROR_COMPLETE_RESOLUTION.md
 */
export interface InvoiceResponse {
  invoiceId: number;
  invoiceCode: string;
  invoiceType: InvoiceType;
  
  // Patient Info
  patientId: number;
  patientName: string | null;  // ✅ Can be null if patient deleted
  
  // Appointment Info
  appointmentId: number | null;
  appointmentCode: string | null;  // ✅ Can be null if appointment deleted
  
  // Treatment Plan Info
  treatmentPlanId: number | null;
  treatmentPlanCode: string | null;  // ✅ Can be null if treatment plan deleted
  phaseNumber: number | null;
  installmentNumber: number | null;
  
  // Financial Info
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  paymentStatus: InvoicePaymentStatus;
  dueDate: string | null;  // ISO date string
  
  // Payment Info
  paymentCode: string | null;  // "PDCMS26011201"
  qrCodeUrl: string | null;  // VietQR URL (null if service down)
  notes: string | null;
  
  // Creator Info
  createdBy: number;  // Doctor/Employee who handled appointment
  createdByName: string | null;  // ✅ Doctor's name (null if deleted)
  invoiceCreatorId: number | null;  // Who clicked "Create Invoice"
  invoiceCreatorName: string | null;  // ✅ Creator's name (null if deleted)
  
  // Timestamps
  createdAt: string;  // ISO datetime string
  updatedAt: string;  // ISO datetime string
  
  // Line Items
  items: InvoiceItemResponse[];
  
  // Payments (optional, might not be in list view)
  payments?: PaymentSummary[];
}

/**
 * Create Invoice Request
 * Based on: docs/files/payment/dto/CreateInvoiceRequest.java
 */
export interface CreateInvoiceRequest {
  invoiceType: InvoiceType;
  patientId: number;
  appointmentId?: number;
  treatmentPlanId?: number;
  phaseNumber?: number;
  installmentNumber?: number;
  items: InvoiceItemDto[];
  dueDate?: string;
  notes?: string;
}

/**
 * Invoice Service Class
 * Handles invoice creation and SePay payment integration
 */
class InvoiceService {
  private readonly endpoint = '/invoices';

  /**
   * Create invoice with SePay payment code
   * BE Requirements:
   * - Endpoint: POST /api/v1/invoices
   * - Permission: CREATE_INVOICE
   * - Request body: CreateInvoiceRequest (invoiceType, patientId, items, etc.)
   * - Returns InvoiceResponse with paymentCode and qrCodeUrl
   * 
   * @param request Invoice creation request
   * @returns Invoice response with payment code and QR code URL
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.post<InvoiceResponse>(this.endpoint, request);
      
      console.log('✅ Create invoice success:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Create invoice error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Get invoice by code
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices/{invoiceCode}
   * - Permission: VIEW_INVOICE_ALL or VIEW_INVOICE_OWN
   * - Returns invoice with current payment status
   * 
   * @param invoiceCode Invoice code (e.g., "INV_20250126_001")
   * @returns Invoice response
   */
  async getInvoiceByCode(invoiceCode: string): Promise<InvoiceResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<InvoiceResponse>(`${this.endpoint}/${invoiceCode}`);
      
      console.log('✅ Get invoice success:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Get invoice error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Get invoices by patient
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices/patient/{patientId}
   * - Permission: VIEW_INVOICE_ALL or VIEW_INVOICE_OWN
   * 
   * @param patientId Patient ID
   * @returns List of invoices
   */
  async getInvoicesByPatient(patientId: number): Promise<InvoiceResponse[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<InvoiceResponse[]>(`${this.endpoint}/patient/${patientId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get invoices by patient error:', error);
      throw error;
    }
  }

  /**
   * Get invoices by appointment
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices/appointment/{appointmentId}
   * - Permission: VIEW_INVOICE_ALL or VIEW_APPOINTMENT_ALL
   * 
   * @param appointmentId Appointment ID
   * @returns List of invoices for the appointment
   */
  async getInvoicesByAppointment(appointmentId: number): Promise<InvoiceResponse[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<InvoiceResponse[]>(`${this.endpoint}/appointment/${appointmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get invoices by appointment error:', error);
      throw error;
    }
  }

  /**
   * Get all invoices (PAGINATED)
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices
   * - Permission: VIEW_INVOICE_ALL
   * - Returns: Page<InvoiceResponse> (paginated)
   * 
   * @param params Optional query parameters
   * @returns Paginated invoice response
   */
  async getAllInvoices(params?: {
    page?: number;
    size?: number;
    sort?: string;
    status?: InvoicePaymentStatus;
    type?: InvoiceType;
    patientId?: number;
    startDate?: string; // yyyy-MM-dd
    endDate?: string; // yyyy-MM-dd
  }): Promise<PageResponse<InvoiceResponse>> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.patientId !== undefined) queryParams.append('patientId', params.patientId.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const url = queryParams.toString() 
        ? `${this.endpoint}?${queryParams.toString()}`
        : this.endpoint;

      const response = await axiosInstance.get<PageResponse<InvoiceResponse>>(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get all invoices error:', error);
      throw error;
    }
  }

  /**
   * Get unpaid invoices by patient
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices/patient/{patientId}/unpaid
   * - Permission: VIEW_INVOICE_ALL or VIEW_INVOICE_OWN
   * 
   * @param patientId Patient ID
   * @returns List of unpaid invoices
   */
  async getUnpaidInvoicesByPatient(patientId: number): Promise<InvoiceResponse[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<InvoiceResponse[]>(`${this.endpoint}/patient/${patientId}/unpaid`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get unpaid invoices error:', error);
      throw error;
    }
  }

  /**
   * Check payment status
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices/{invoiceCode}/payment-status
   * - Permission: VIEW_INVOICE_ALL or VIEW_INVOICE_OWN or VIEW_PAYMENT_ALL
   * 
   * @param invoiceCode Invoice code
   * @returns Invoice with current payment status
   */
  async checkPaymentStatus(invoiceCode: string): Promise<InvoiceResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<InvoiceResponse>(`${this.endpoint}/${invoiceCode}/payment-status`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Check payment status error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();

