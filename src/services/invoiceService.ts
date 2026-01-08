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
export type InvoicePaymentStatus = 'PENDING_PAYMENT' | 'PARTIAL_PAID' | 'PAID' | 'CANCELLED';

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
 * Invoice Response from BE
 * Based on: docs/files/payment/dto/InvoiceResponse.java
 */
export interface InvoiceResponse {
  invoiceId: number;
  invoiceCode: string; // Invoice code (e.g., "INV_20250126_001")
  invoiceType: InvoiceType;
  patientId: number;
  patientName?: string;
  appointmentId?: number;
  appointmentCode?: string;
  treatmentPlanId?: number;
  treatmentPlanCode?: string;
  phaseNumber?: number;
  installmentNumber?: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  paymentStatus: InvoicePaymentStatus;
  dueDate?: string;
  notes?: string;
  paymentCode?: string; // SePay payment code (Format: PDCMSyymmddxy)
  qrCodeUrl?: string; // VietQR image URL
  // Bác sĩ phụ trách (from appointment.employeeId)
  createdBy?: number;
  createdByName?: string;
  // ✅ NEW: Người thực sự tạo invoice (lễ tân/admin who clicked "Create")
  invoiceCreatorId?: number;
  invoiceCreatorName?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: InvoiceItemResponse[];
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
   * Get all invoices
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices
   * - Permission: VIEW_INVOICE_ALL
   * 
   * @param params Optional query parameters (page, size, sort, etc.)
   * @returns List of all invoices
   */
  async getAllInvoices(params?: {
    page?: number;
    size?: number;
    sort?: string;
    status?: InvoicePaymentStatus;
    type?: InvoiceType;
  }): Promise<InvoiceResponse[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);

      const url = queryParams.toString() 
        ? `${this.endpoint}?${queryParams.toString()}`
        : this.endpoint;

      const response = await axiosInstance.get<InvoiceResponse[]>(url);
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

