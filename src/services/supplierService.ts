/**
 * Supplier Service - API V1
 * Backend: http://localhost:8080/api/v1/suppliers
 * Authentication: Bearer Token required
 */

import { apiClient } from '@/lib/api';
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
      const data = response.data.data || response.data;
      
      // Ensure we always return a valid PageResponse
      if (!data || !data.content) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from supplier API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  /**
   * API 6.13 - GET /api/v1/warehouse/suppliers/list
   * Get suppliers with business metrics (Advanced endpoint)
   * Features: Business metrics (totalOrders, lastOrderDate), advanced filters (isBlacklisted, isActive), advanced sorting
   */
  getSuppliersWithMetrics: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    isBlacklisted?: boolean;
    isActive?: boolean;
    sortBy?: 'supplierName' | 'totalOrders' | 'lastOrderDate' | 'createdAt' | 'tierLevel' | 'ratingScore';
    sortDir?: 'ASC' | 'DESC';
  }): Promise<any> => {
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
      
      // BE returns SupplierPageResponse directly
      const data = response.data.data || response.data;
      
      if (!data) {
        throw new Error('Invalid response from supplier with metrics API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching suppliers with metrics:', error);
      throw error;
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
      const data = response.data.data || response.data;
      
      if (!data) {
        throw new Error('Invalid response from supplier detail API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching supplier detail:', error);
      throw error;
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
      const data = response.data.data || response.data;
      
      // Return empty array if no data
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching supplied items:', error);
      throw error;
    }
  },

  /**
   * API 6.14 - POST /api/v1/warehouse/suppliers
   * Create new supplier (auto-generates supplier code)
   */
  create: async (data: CreateSupplierRequest): Promise<SupplierResponse> => {
    try {
      const response = await axios.post(
        '/warehouse/suppliers',
        data
      );
      
      console.log('Create Supplier API Response:', response.data);
      
      // Handle both response formats
      const result = response.data.data || response.data;
      
      if (!result) {
        throw new Error('Invalid response from create supplier API');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
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
      const result = response.data.data || response.data;
      
      if (!result) {
        throw new Error('Invalid response from update supplier API');
      }
      
      return result;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/v1/warehouse/suppliers/{id}
   * Delete supplier (soft delete - sets isActive=false)
   * Note: Cannot delete if supplier has transaction history
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`/warehouse/suppliers/${id}`);
  },
};

export default supplierService;
