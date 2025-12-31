/**
 * Invoice Service
 * 
 * Handles invoice-related API operations including SePay payment integration
 * Last updated: 2025-12-30
 */

import { apiClient } from '@/lib/api';

/**
 * Invoice Status
 */
export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

/**
 * Invoice Response from BE
 */
export interface InvoiceResponse {
  invoiceId: number;
  paymentCode: string; // Format: PDCMSyymmddxy
  qrCodeUrl: string; // VietQR image URL
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Invoice Request
 */
export interface CreateInvoiceRequest {
  patient: {
    patientId: number;
  };
  appointment?: {
    appointmentId: number;
  };
  discount?: number;
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
   * - Request body: { patient: { patientId }, appointment?: { appointmentId }, discount?: number }
   * - Returns invoice with paymentCode and qrCodeUrl
   * 
   * @param request Invoice creation request
   * @returns Invoice response with payment code and QR code URL
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.post<{
        success: boolean;
        statusCode: number;
        message: string;
        data: InvoiceResponse;
      }>(this.endpoint, request);
      
      console.log(' Create invoice success:', response.data);
      
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error(' Create invoice error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * BE Requirements:
   * - Endpoint: GET /api/v1/invoices/{invoiceId}
   * - Returns invoice with current payment status
   * 
   * @param invoiceId Invoice ID
   * @returns Invoice response
   */
  async getInvoice(invoiceId: number): Promise<InvoiceResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<{
        success: boolean;
        data: InvoiceResponse;
      }>(`${this.endpoint}/${invoiceId}`);
      
      console.log(' Get invoice success:', response.data);
      
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error(' Get invoice error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();

