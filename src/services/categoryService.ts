/**
 * Category Service - API V1
 * Handles API calls for category management (Danh mục vật tư)
 */

import { apiClient } from '@/lib/api';

const api = apiClient.getAxiosInstance();

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CategoryV1 {
  id: number;
  name: string;
  description?: string;
  warehouseType: 'COLD' | 'NORMAL';
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  warehouseType: 'COLD' | 'NORMAL';
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  warehouseType?: 'COLD' | 'NORMAL';
}

export interface CategoryFilter {
  warehouseType?: 'COLD' | 'NORMAL';
  search?: string;
}

export interface CategoryStats {
  totalCategories: number;
  coldStorageCategories: number;
  normalStorageCategories: number;
}

// ============================================
// CATEGORY SERVICE
// ============================================

export const categoryService = {
  /**
   * GET /api/v1/inventory/categories - Lấy danh sách categories
   */
  getAll: async (filter?: CategoryFilter): Promise<CategoryV1[]> => {
    try {
      const response = await api.get<CategoryV1[]>('/inventory/categories', {
        params: filter,
      });
      console.log('✅ Get all categories:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get categories error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/categories/{id} - Lấy chi tiết category
   */
  getById: async (id: number): Promise<CategoryV1> => {
    try {
      const response = await api.get<CategoryV1>(`/inventory/categories/${id}`);
      console.log('✅ Get category detail:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get category detail error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/inventory/categories - Tạo category mới
   */
  create: async (data: CreateCategoryRequest): Promise<CategoryV1> => {
    try {
      const response = await api.post<CategoryV1>('/inventory/categories', data);
      console.log('✅ Create category:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create category error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PUT /api/v1/inventory/categories/{id} - Cập nhật category
   */
  update: async (id: number, data: UpdateCategoryRequest): Promise<CategoryV1> => {
    try {
      const response = await api.put<CategoryV1>(`/inventory/categories/${id}`, data);
      console.log('✅ Update category:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Update category error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * DELETE /api/v1/inventory/categories/{id} - Xóa category
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/categories/${id}`);
      console.log('✅ Delete category:', id);
    } catch (error: any) {
      console.error('❌ Delete category error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/categories/stats - Thống kê categories
   */
  getStats: async (): Promise<CategoryStats> => {
    try {
      const response = await api.get<CategoryStats>('/inventory/categories/stats');
      console.log('✅ Get category stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get category stats error:', error.response?.data || error.message);
      // Return default stats if endpoint doesn't exist
      return {
        totalCategories: 0,
        coldStorageCategories: 0,
        normalStorageCategories: 0,
      };
    }
  },
};

export default categoryService;
