/**
 * Inventory Service - API V1
 * Handles API calls for inventory management (Vật tư tồn kho)
 */

import { apiClient } from '@/lib/api';

const api = apiClient.getAxiosInstance();

// ============================================
// TYPE DEFINITIONS (Based on Swagger)
// ============================================

export interface ItemMasterV1 {
  id: number;
  itemCode: string;
  itemName: string;
  categoryId: number;
  categoryName?: string;
  unitOfMeasure: string;
  warehouseType: 'COLD' | 'NORMAL';
  minStockLevel: number;
  maxStockLevel: number;
  currentStock?: number;
  stockStatus?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  isTool: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemBatchV1 {
  batchId: number;
  itemMasterId: number;
  lotNumber: string;
  quantityOnHand: number;
  importPrice: number;
  expiryDate?: string;
  importDate: string;
  warehouseType: 'COLD' | 'NORMAL';
}

export interface CategoryV1 {
  id: number;
  name: string;
  description?: string;
  warehouseType: 'COLD' | 'NORMAL';
  itemCount?: number;
}

export interface InventorySummary {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  categoryName: string;
  unitOfMeasure: string;
  warehouseType: 'COLD' | 'NORMAL';
  totalQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  isTool: boolean;
  nearestExpiryDate?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringWithin30Days?: number;
  coldStorageItems: number;
  normalStorageItems: number;
}

export interface CreateItemMasterRequest {
  itemCode: string;
  itemName: string;
  categoryId: number;
  unitOfMeasure: string;
  warehouseType: 'COLD' | 'NORMAL';
  minStockLevel: number;
  maxStockLevel: number;
  isTool: boolean;
  notes?: string;
}

export interface UpdateItemMasterRequest {
  itemName?: string;
  categoryId?: number;
  unitOfMeasure?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  isTool?: boolean;
  notes?: string;
}

export interface InventoryFilter {
  warehouseType?: 'COLD' | 'NORMAL';
  stockStatus?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  categoryId?: number;
  search?: string;
  isExpiringSoon?: boolean;
}

// ============================================
// INVENTORY SERVICE
// ============================================

export const inventoryService = {
  /**
   * GET /api/v1/inventory - Lấy danh sách tất cả vật tư
   */
  getAll: async (filter?: InventoryFilter): Promise<ItemMasterV1[]> => {
    try {
      const response = await api.get<ItemMasterV1[]>('/inventory', {
        params: filter,
      });
      console.log('✅ Get all items:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get all items error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/{id} - Lấy chi tiết 1 vật tư
   */
  getById: async (id: number): Promise<ItemMasterV1> => {
    try {
      const response = await api.get<ItemMasterV1>(`/inventory/${id}`);
      console.log('✅ Get item detail:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get item detail error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/summary - Lấy danh sách tồn kho (Inventory Dashboard)
   */
  getSummary: async (filter?: InventoryFilter): Promise<InventorySummary[]> => {
    try {
      const response = await api.get<InventorySummary[]>('/inventory/summary', {
        params: filter,
      });
      console.log('✅ Get inventory summary:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get inventory summary error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/stats - Lấy thống kê tổng quan kho
   */
  getStats: async (): Promise<InventoryStats> => {
    try {
      const response = await api.get<InventoryStats>('/inventory/stats');
      console.log('✅ Get inventory stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get inventory stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/categories - Lấy danh sách danh mục
   */
  getCategories: async (): Promise<CategoryV1[]> => {
    try {
      const response = await api.get<CategoryV1[]>('/inventory/categories');
      console.log('✅ Get categories:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get categories error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/batches/{itemMasterId} - Lấy danh sách lô hàng theo FEFO
   */
  getBatchesByItemId: async (itemMasterId: number): Promise<ItemBatchV1[]> => {
    try {
      const response = await api.get<ItemBatchV1[]>(`/inventory/batches/${itemMasterId}`);
      console.log('✅ Get batches (FEFO):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get batches error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/inventory/item-master - Tạo vật tư mới
   */
  create: async (data: CreateItemMasterRequest): Promise<ItemMasterV1> => {
    try {
      const response = await api.post<ItemMasterV1>('/inventory/item-master', data);
      console.log('✅ Create item:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create item error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PUT /api/v1/inventory/item-master/{id} - Cập nhật vật tư
   */
  update: async (id: number, data: UpdateItemMasterRequest): Promise<ItemMasterV1> => {
    try {
      const response = await api.put<ItemMasterV1>(`/inventory/item-master/${id}`, data);
      console.log('✅ Update item:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Update item error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * DELETE /api/v1/inventory/item-master/{id} - Xóa vật tư
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/item-master/${id}`);
      console.log('✅ Delete item:', id);
    } catch (error: any) {
      console.error('❌ Delete item error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/inventory/categories - Tạo danh mục mới
   */
  createCategory: async (data: { name: string; description?: string; warehouseType: 'COLD' | 'NORMAL' }): Promise<CategoryV1> => {
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
   * PUT /api/v1/inventory/categories/{id} - Cập nhật danh mục
   */
  updateCategory: async (id: number, data: { name?: string; description?: string }): Promise<CategoryV1> => {
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
   * DELETE /api/v1/inventory/categories/{id} - Xóa danh mục
   */
  deleteCategory: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/categories/${id}`);
      console.log('✅ Delete category:', id);
    } catch (error: any) {
      console.error('❌ Delete category error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default inventoryService;
