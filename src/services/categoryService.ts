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
  categoryId: number; // Matching BE ItemCategoryResponse.categoryId
  categoryCode?: string; // Matching BE ItemCategoryResponse.categoryCode
  categoryName: string; // Matching BE ItemCategoryResponse.categoryName
  description?: string; // Matching BE ItemCategoryResponse.description
  isActive?: boolean; // Matching BE ItemCategoryResponse.isActive
  
  // Legacy fields for backward compatibility
  id?: number; // Alias for categoryId
  name?: string; // Alias for categoryName
  warehouseType?: 'COLD' | 'NORMAL'; // Not in BE response, kept for compatibility
  itemCount?: number; // Not in BE response, kept for compatibility
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
   * BE returns: ItemCategoryResponse[] with categoryId, categoryCode, categoryName, description, isActive
   */
  getAll: async (filter?: CategoryFilter): Promise<CategoryV1[]> => {
    try {
      const response = await api.get<any[]>('/inventory/categories', {
        params: filter,
      });
      // Map BE response to FE type
      const mapped: CategoryV1[] = (response.data || []).map((cat: any) => ({
        categoryId: cat.categoryId ?? cat.category_id,
        categoryCode: cat.categoryCode ?? cat.category_code,
        categoryName: cat.categoryName ?? cat.category_name,
        description: cat.description,
        isActive: cat.isActive ?? cat.is_active ?? true,
        // Legacy aliases for backward compatibility
        id: cat.categoryId ?? cat.category_id ?? cat.id,
        name: cat.categoryName ?? cat.category_name ?? cat.name,
        warehouseType: cat.warehouseType ?? cat.warehouse_type,
        itemCount: cat.itemCount ?? cat.item_count,
        createdAt: cat.createdAt ?? cat.created_at,
        updatedAt: cat.updatedAt ?? cat.updated_at,
      }));
      console.log('✅ Get all categories:', mapped);
      return mapped;
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
      const response = await api.get<any>(`/inventory/categories/${id}`);
      const cat = response.data || {};
      // Map BE response to FE type
      const mapped: CategoryV1 = {
        categoryId: cat.categoryId ?? cat.category_id,
        categoryCode: cat.categoryCode ?? cat.category_code,
        categoryName: cat.categoryName ?? cat.category_name,
        description: cat.description,
        isActive: cat.isActive ?? cat.is_active ?? true,
        // Legacy aliases for backward compatibility
        id: cat.categoryId ?? cat.category_id ?? cat.id,
        name: cat.categoryName ?? cat.category_name ?? cat.name,
        warehouseType: cat.warehouseType ?? cat.warehouse_type,
        itemCount: cat.itemCount ?? cat.item_count,
        createdAt: cat.createdAt ?? cat.created_at,
        updatedAt: cat.updatedAt ?? cat.updated_at,
      };
      console.log('✅ Get category detail:', mapped);
      return mapped;
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
