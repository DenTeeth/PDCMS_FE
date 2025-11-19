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
   * GET /api/v1/suppliers
   * Get all suppliers with pagination, search, and sort
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
        `/suppliers?${queryParams.toString()}`
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
   * GET /api/v1/suppliers/{id}
   * Get supplier detail by ID
   */
  getById: async (id: number): Promise<SupplierDetailResponse> => {
    try {
      const response = await axios.get(
        `/suppliers/${id}`
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
   * GET /api/v1/suppliers/{id}/supplied-items
   * Get all items supplied by this supplier
   */
  getSuppliedItems: async (id: number): Promise<SuppliedItemResponse[]> => {
    try {
      const response = await axios.get(
        `/suppliers/${id}/supplied-items`
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
   * POST /api/v1/suppliers
   * Create new supplier
   */
  create: async (data: CreateSupplierRequest): Promise<SupplierResponse> => {
    try {
      const response = await axios.post(
        '/suppliers',
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
   * PUT /api/v1/suppliers/{id}
   * Update existing supplier
   */
  update: async (id: number, data: UpdateSupplierRequest): Promise<SupplierResponse> => {
    try {
      const response = await axios.put(
        `/suppliers/${id}`,
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
   * DELETE /api/v1/suppliers/{id}
   * Delete supplier (soft delete)
   * Note: Cannot delete if supplier has transaction history
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`/suppliers/${id}`);
  },
};

export default supplierService;
