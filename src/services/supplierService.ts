/**
 * Supplier Service - API V1
 * Backend: http://localhost:8080/api/v1/suppliers
 * Authentication: Bearer Token required
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse, extractErrorMessage, createApiError } from '@/utils/apiResponse';
import {
  ApiResponse,
  PageResponse,
  SupplierSummaryResponse,
  SupplierDetailResponse,
  SuppliedItemResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierResponse,
  SupplierQueryParams,
} from '@/types/supplier';

const axios = apiClient.getAxiosInstance();

export const supplierService = {
  /**
   * GET /api/v1/warehouse/suppliers
   * Get all suppliers with pagination, search, and sort (Basic endpoint)
   */
  getAll: async (
    params?: SupplierQueryParams
  ): Promise<PageResponse<SupplierSummaryResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.search) queryParams.append('search', params.search);

      const response = await axios.get(
        `/warehouse/suppliers?${queryParams.toString()}`
      );
      
      console.log('Supplier API Response:', response.data);
      
      // BE returns PageResponse directly (no wrapper)
      const data = extractApiResponse(response);
      
      // Ensure we always return a valid PageResponse
      if (!data || !data.content) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from supplier API');
      }
      
      return data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: '/warehouse/suppliers',
        method: 'GET',
        params,
      });
      
      console.error(' Error fetching suppliers:', {
        message: enhancedError.message,
        status: enhancedError.status,
        endpoint: enhancedError.endpoint,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 6.13 - GET /api/v1/warehouse/suppliers/list
   * Get suppliers with business metrics (Advanced endpoint)
   * Features: Business metrics (totalOrders, lastOrderDate), advanced filters (isBlacklisted, isActive), advanced sorting
   */
  getSuppliersWithMetrics: async (
    params?: {
      page?: number;
      size?: number;
      search?: string;
      isBlacklisted?: boolean;
      isActive?: boolean;
      sortBy?: 'supplierName' | 'supplierCode' | 'totalOrders' | 'lastOrderDate' | 'createdAt' | 'tierLevel' | 'ratingScore';
      sortDir?: 'ASC' | 'DESC';
    }
  ): Promise<import('@/types/supplier').SupplierPageResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isBlacklisted !== undefined) queryParams.append('isBlacklisted', params.isBlacklisted.toString());
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

      const response = await axios.get(
        `/warehouse/suppliers/list?${queryParams.toString()}`
      );
      
      console.log('Supplier with Metrics API Response:', response.data);
      
      // BE returns SupplierPageResponse directly (no wrapper)
      const data = extractApiResponse(response);
      
      if (!data || !data.suppliers) {
        throw new Error('Invalid response from supplier with metrics API');
      }
      
      return data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: '/warehouse/suppliers/list',
        method: 'GET',
        params,
      });
      
      console.error(' Error fetching suppliers with metrics:', {
        message: enhancedError.message,
        status: enhancedError.status,
        endpoint: enhancedError.endpoint,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * GET /api/v1/warehouse/suppliers/{id}
   * Get supplier detail by ID
   */
  getById: async (id: number): Promise<SupplierDetailResponse> => {
    try {
      const response = await axios.get(
        `/warehouse/suppliers/${id}`
      );
      
      console.log('Supplier Detail API Response:', response.data);
      
      // Handle both response formats
      const data = extractApiResponse(response);
      
      if (!data) {
        throw new Error('Invalid response from supplier detail API');
      }
      
      return data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/warehouse/suppliers/${id}`,
        method: 'GET',
      });
      
      console.error(' Error fetching supplier detail:', {
        id,
        message: enhancedError.message,
        status: enhancedError.status,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * GET /api/v1/warehouse/suppliers/{id}/supplied-items
   * Get all items supplied by this supplier
   */
  getSuppliedItems: async (id: number): Promise<SuppliedItemResponse[]> => {
    try {
      const response = await axios.get(
        `/warehouse/suppliers/${id}/supplied-items`
      );
      
      console.log('Supplied Items API Response:', response.data);
      
      // Handle both response formats
      const data = extractApiResponse(response);
      
      // Return empty array if no data
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/warehouse/suppliers/${id}/supplied-items`,
        method: 'GET',
      });
      
      console.error(' Error fetching supplied items:', {
        id,
        message: enhancedError.message,
        status: enhancedError.status,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 6.14 - POST /api/v1/warehouse/suppliers
   * Create new supplier (auto-generates supplier code)
   * Note: supplierCode is auto-generated by BE (SUP-001, SUP-002, ...)
   */
  create: async (data: CreateSupplierRequest): Promise<SupplierResponse> => {
    try {
      // BE expects phoneNumber field (not phone)
      const requestData = {
        supplierName: data.supplierName,
        phoneNumber: data.phone, // Map from "phone" to "phoneNumber" for BE
        email: data.email,
        address: data.address,
        isBlacklisted: data.isBlacklisted ?? false,
        notes: data.notes,
      };
      
      const response = await axios.post(
        '/warehouse/suppliers',
        requestData
      );
      
      console.log('Create Supplier API Response:', response.data);
      
      // Handle both response formats
      const result = extractApiResponse(response);
      
      if (!result) {
        throw new Error('Invalid response from create supplier API');
      }
      
      return result;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: '/warehouse/suppliers',
        method: 'POST',
        params: requestData,
      });
      
      console.error(' Error creating supplier:', {
        message: enhancedError.message,
        status: enhancedError.status,
        endpoint: enhancedError.endpoint,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 6.15 - PUT /api/v1/warehouse/suppliers/{id}
   * Update existing supplier (including risk management flags)
   */
  update: async (id: number, data: UpdateSupplierRequest): Promise<SupplierResponse> => {
    try {
      const response = await axios.put(
        `/warehouse/suppliers/${id}`,
        data
      );
      
      console.log('Update Supplier API Response:', response.data);
      
      // Handle both response formats
      const result = extractApiResponse(response);
      
      if (!result) {
        throw new Error('Invalid response from update supplier API');
      }
      
      return result;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/warehouse/suppliers/${id}`,
        method: 'PUT',
        params: data,
      });
      
      console.error(' Error updating supplier:', {
        id,
        message: enhancedError.message,
        status: enhancedError.status,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 6.16 - DELETE /api/v1/warehouse/suppliers/{id}
   * Delete supplier (soft delete - sets isActive=false)
   * Note: Cannot delete if supplier has transaction history (returns 409 Conflict)
   */
  delete: async (id: number): Promise<void> => {
    try {
      await axios.delete(`/warehouse/suppliers/${id}`);
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/warehouse/suppliers/${id}`,
        method: 'DELETE',
      });
      
      console.error(' Error deleting supplier:', {
        id,
        message: enhancedError.message,
        status: enhancedError.status,
        originalError: error,
      });
      
      // Handle 409 Conflict (supplier has transactions)
      if (enhancedError.status === 409) {
        const errorMessage = extractErrorMessage(error) || 
          'Không thể xóa nhà cung cấp vì đã có lịch sử giao dịch. Vui lòng vô hiệu hóa thay vì xóa.';
        throw new Error(errorMessage);
      }
      
      throw enhancedError;
    }
  },
};

export default supplierService;
