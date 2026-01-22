/**
 * Payment Service
 * 
 * Handles payment-related API operations
 * Last updated: 2025-12-30
 * Based on: docs/files/payment/controller/PaymentController.java
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse } from '@/utils/apiResponse';

/**
 * Payment Method Enum
 * Based on: docs/files/payment/enums/PaymentMethod.java
 */
export type PaymentMethod = 'SEPAY' | 'CASH' | 'CARD' | 'BANK_TRANSFER';

/**
 * Create Payment Request
 * Based on: docs/files/payment/dto/CreatePaymentRequest.java
 */
export interface CreatePaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string; // ISO 8601 format (optional)
  referenceNumber?: string; // Optional reference number
  notes?: string; // Optional notes
}

/**
 * Payment Response
 * Based on: docs/files/payment/dto/PaymentResponse.java
 */
export interface PaymentResponse {
  paymentId: number;
  paymentCode: string;
  invoiceId: number;
  invoiceCode: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdBy?: number;
  createdByName?: string;
  createdAt?: string;
}

/**
 * Payment Service Class
 * Handles payment creation and retrieval
 */
class PaymentService {
  private readonly endpoint = '/payments';

  /**
   * Create payment
   * BE Requirements:
   * - Endpoint: POST /api/v1/payments
   * - Permission: CREATE_PAYMENT
   * - Request body: CreatePaymentRequest (invoiceId, amount, paymentMethod, etc.)
   * - Returns PaymentResponse
   * 
   * @param request Payment creation request
   * @returns Payment response
   */
  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.post<any>(this.endpoint, request);
      
      console.log('✅ Create payment success:', response.data);
      
      return extractApiResponse<PaymentResponse>(response);
    } catch (error: any) {
      console.error('❌ Create payment error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        endpoint: this.endpoint,
        request,
      });
      throw error;
    }
  }

  /**
   * Get payments by invoice
   * BE Requirements:
   * - Endpoint: GET /api/v1/payments/invoice/{invoiceId}
   * - Permission: VIEW_PAYMENT_ALL or VIEW_INVOICE_ALL
   * - Returns list of payments for the invoice
   * 
   * @param invoiceId Invoice ID
   * @returns List of payments
   */
  async getPaymentsByInvoice(invoiceId: number): Promise<PaymentResponse[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<any>(`${this.endpoint}/invoice/${invoiceId}`);
      
      console.log('✅ Get payments by invoice success:', response.data);
      
      const data = extractApiResponse<PaymentResponse[]>(response);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        endpoint: `${this.endpoint}/invoice/${invoiceId}`,
        invoiceId,
      };
      
      console.error('❌ Get payments by invoice error:', errorDetails);
      
      // Re-throw with enhanced error information
      const enhancedError = new Error(error.response?.data?.message || error.message || 'Không thể lấy danh sách thanh toán theo hóa đơn');
      (enhancedError as any).status = error.response?.status;
      (enhancedError as any).response = error.response;
      throw enhancedError;
    }
  }

  /**
   * Get payment by code
   * BE Requirements:
   * - Endpoint: GET /api/v1/payments/{paymentCode}
   * - Permission: VIEW_PAYMENT_ALL or VIEW_INVOICE_ALL
   * - Returns payment details
   * 
   * @param paymentCode Payment code
   * @returns Payment response
   */
  async getPaymentByCode(paymentCode: string): Promise<PaymentResponse> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      const response = await axiosInstance.get<any>(`${this.endpoint}/${paymentCode}`);
      
      console.log('✅ Get payment by code success:', response.data);
      
      return extractApiResponse<PaymentResponse>(response);
    } catch (error: any) {
      console.error('❌ Get payment by code error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        endpoint: `${this.endpoint}/${paymentCode}`,
        paymentCode,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

