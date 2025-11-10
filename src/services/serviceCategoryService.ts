/**
 * Service Category Service
 * 
 * Handles all API calls related to Service Category management
 * Based on ServiceCategory.md - Service Category Management API (V17)
 */

import { apiClient } from '@/lib/api';
import {
  ServiceCategory,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
  ReorderServiceCategoriesRequest,
  ServiceCategoryErrorCode
} from '@/types/serviceCategory';

export class ServiceCategoryService {
  private static readonly BASE_URL = '/service-categories';

  /**
   * Get all service categories (admin view - includes inactive)
   * GET /api/v1/service-categories
   * Permission: VIEW_SERVICE
   */
  static async getAllCategories(): Promise<ServiceCategory[]> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      console.log('[ServiceCategoryService] getAllCategories - URL:', this.BASE_URL);
      const response = await axiosInstance.get<ServiceCategory[]>(this.BASE_URL);
      console.log('[ServiceCategoryService] getAllCategories - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ServiceCategoryService] getAllCategories - Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/v1/service-categories/{categoryId}
   * Permission: VIEW_SERVICE
   */
  static async getCategoryById(categoryId: number): Promise<ServiceCategory> {
    const axiosInstance = apiClient.getAxiosInstance();
    const url = `${this.BASE_URL}/${categoryId}`;
    
    try {
      console.log('[ServiceCategoryService] getCategoryById - URL:', url);
      const response = await axiosInstance.get<ServiceCategory>(url);
      console.log('[ServiceCategoryService] getCategoryById - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ServiceCategoryService] getCategoryById - Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create new service category
   * POST /api/v1/service-categories
   * Permission: CREATE_SERVICE
   */
  static async createCategory(data: CreateServiceCategoryRequest): Promise<ServiceCategory> {
    const axiosInstance = apiClient.getAxiosInstance();
    
    try {
      console.log('[ServiceCategoryService] createCategory - URL:', this.BASE_URL);
      console.log('[ServiceCategoryService] createCategory - Data:', data);
      const response = await axiosInstance.post<ServiceCategory>(this.BASE_URL, data);
      console.log('[ServiceCategoryService] createCategory - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ServiceCategoryService] createCategory - Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update existing service category (partial update)
   * PATCH /api/v1/service-categories/{categoryId}
   * Permission: UPDATE_SERVICE
   */
  static async updateCategory(
    categoryId: number,
    data: UpdateServiceCategoryRequest
  ): Promise<ServiceCategory> {
    const axiosInstance = apiClient.getAxiosInstance();
    const url = `${this.BASE_URL}/${categoryId}`;
    
    try {
      console.log('[ServiceCategoryService] updateCategory - URL:', url);
      console.log('[ServiceCategoryService] updateCategory - Data:', data);
      const response = await axiosInstance.patch<ServiceCategory>(url, data);
      console.log('[ServiceCategoryService] updateCategory - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ServiceCategoryService] updateCategory - Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete service category (soft delete)
   * DELETE /api/v1/service-categories/{categoryId}
   * Permission: DELETE_SERVICE
   * 
   * Note: Fails if category has active services (409 Conflict)
   */
  static async deleteCategory(categoryId: number): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    const url = `${this.BASE_URL}/${categoryId}`;
    
    try {
      console.log('[ServiceCategoryService] deleteCategory - URL:', url);
      await axiosInstance.delete(url);
      console.log('[ServiceCategoryService] deleteCategory - Success');
    } catch (error: any) {
      console.error('[ServiceCategoryService] deleteCategory - Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Reorder service categories (bulk operation)
   * POST /api/v1/service-categories/reorder
   * Permission: UPDATE_SERVICE
   */
  static async reorderCategories(data: ReorderServiceCategoriesRequest): Promise<void> {
    const axiosInstance = apiClient.getAxiosInstance();
    const url = `${this.BASE_URL}/reorder`;
    
    try {
      console.log('[ServiceCategoryService] reorderCategories - URL:', url);
      console.log('[ServiceCategoryService] reorderCategories - Data:', data);
      await axiosInstance.post(url, data);
      console.log('[ServiceCategoryService] reorderCategories - Success');
    } catch (error: any) {
      console.error('[ServiceCategoryService] reorderCategories - Error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and provide meaningful error messages
   */
  private static handleError(error: any): Error {
    // Handle network errors
    if (!error.response) {
      return new Error('Network error: Unable to connect to server');
    }

    const status = error.response.status;
    const data = error.response.data;

    // Handle specific error codes
    if (data?.errorCode) {
      const errorCode = data.errorCode as ServiceCategoryErrorCode;
      const message = data.message || data.detail || 'An error occurred';

      const customError = new Error(message);
      (customError as any).errorCode = errorCode;
      (customError as any).status = status;
      return customError;
    }

    // Handle HTTP status codes
    switch (status) {
      case 400:
        return new Error(data?.message || data?.detail || 'Invalid request data');
      case 403:
        return new Error('Access denied: You do not have permission to perform this action');
      case 404:
        return new Error('Service category not found');
      case 409:
        // Check if it's about active services
        if (data?.errorCode === ServiceCategoryErrorCode.CATEGORY_HAS_ACTIVE_SERVICES ||
            data?.detail?.includes('active service')) {
          return new Error(
            data?.detail || 
            'Cannot delete category with active services. Please deactivate or reassign services first.'
          );
        }
        return new Error(data?.message || data?.detail || 'Category code already exists');
      case 500:
        return new Error('Server error: Please try again later');
      default:
        return new Error(data?.message || data?.detail || `Error: ${status}`);
    }
  }
}

