/**
 * Inventory Service - API V1
 * Handles API calls for inventory management (Vật tư tồn kho)
 */

import { apiClient } from '@/lib/api';
import type {
  CreateImportTransactionDto,
  ImportTransactionResponse,
  CreateExportTransactionDto,
  ExportTransactionResponse,
  BatchResponse,
} from '@/types/warehouse';

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

// BatchResponse is now imported from @/types/warehouse

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
}

export interface InventorySummary {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  categoryName: string;
  unitOfMeasure: string;
  warehouseType: 'COLD' | 'NORMAL';
  totalQuantity: number;
  totalQuantityOnHand?: number;
  minStockLevel: number;
  maxStockLevel: number;
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  isTool?: boolean;
  isExpiringSoon?: boolean;
  nearestExpiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventorySummaryPage {
  content: InventorySummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface InventoryStats {
  totalItems: number;
  totalValue?: number;
  lowStockCount: number;
  outOfStockCount?: number;
  expiringWithin30Days?: number;
  coldStorageItems?: number;
  normalStorageItems?: number;
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
  sort?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// Export types are now imported from @/types/warehouse

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
  getSummary: async (filter?: InventoryFilter): Promise<InventorySummaryPage> => {
    try {
      const params: Record<string, any> = {
        page: filter?.page ?? 0,
        size: filter?.size ?? 10,
      };

      if (filter?.sort) {
        params.sort = filter.sort;
      } else if (filter?.sortBy) {
        params.sort = `${filter.sortBy},${filter.sortDirection ?? 'asc'}`;
      }
      if (filter?.warehouseType) params.warehouseType = filter.warehouseType;
      if (filter?.stockStatus) params.stockStatus = filter.stockStatus;
      if (filter?.categoryId) params.categoryId = filter.categoryId;
      if (filter?.isExpiringSoon) params.isExpiringSoon = filter.isExpiringSoon;
      if (filter?.search) params.search = filter.search;

      const response = await api.get('/inventory/summary', { params });
      const raw = response.data;

      const mapItem = (item: any): InventorySummary => ({
        itemMasterId: item.itemMasterId ?? item.item_master_id,
        itemCode: item.itemCode ?? item.item_code,
        itemName: item.itemName ?? item.item_name,
        categoryName: item.categoryName ?? item.category_name ?? '',
        unitOfMeasure: item.unitOfMeasure ?? item.unit_name ?? '',
        warehouseType: item.warehouseType ?? item.warehouse_type ?? 'NORMAL',
        minStockLevel: item.minStockLevel ?? item.min_stock_level ?? 0,
        maxStockLevel: item.maxStockLevel ?? item.max_stock_level ?? 0,
        stockStatus: item.stockStatus ?? item.stock_status ?? 'NORMAL',
        isTool: item.isTool ?? item.is_tool ?? false,
        isExpiringSoon: item.isExpiringSoon ?? item.is_expiring_soon ?? false,
        totalQuantity:
          item.totalQuantity ??
          item.total_quantity ??
          item.totalQuantityOnHand ??
          item.total_quantity_on_hand ??
          0,
        totalQuantityOnHand:
          item.totalQuantityOnHand ?? item.total_quantity_on_hand ?? item.totalQuantity ?? item.total_quantity ?? 0,
        nearestExpiryDate: item.nearestExpiryDate ?? item.nearest_expiry_date,
        createdAt: item.createdAt ?? item.created_at,
        updatedAt: item.updatedAt ?? item.updated_at,
      });

      if (Array.isArray(raw)) {
        const content = raw.map(mapItem);
        return {
          content,
          totalElements: content.length,
          totalPages: 1,
          size: content.length,
          number: 0,
        };
      }

      const content = (raw.content || raw.data || []).map(mapItem);
      return {
        ...raw,
        content,
      };
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
      const response = await api.get('/inventory/stats');
      const data = response.data || {};
      const mapped: InventoryStats = {
        totalItems: data.totalItems ?? data.total_items ?? 0,
        totalValue: data.totalValue ?? data.total_value,
        lowStockCount: data.lowStockCount ?? data.lowStockItems ?? 0,
        outOfStockCount: data.outOfStockCount ?? data.outOfStockItems ?? 0,
        expiringWithin30Days: data.expiringWithin30Days ?? data.expiringSoonItems ?? 0,
        coldStorageItems: data.coldStorageItems ?? data.cold_storage_items,
        normalStorageItems: data.normalStorageItems ?? data.normal_storage_items,
      };
      console.log('✅ Get inventory stats:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Get inventory stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/categories - Lấy danh sách danh mục
   * BE returns: ItemCategoryResponse[] with categoryId, categoryCode, categoryName, description, isActive
   */
  getCategories: async (): Promise<CategoryV1[]> => {
    try {
      const response = await api.get<any[]>('/inventory/categories');
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
      }));
      console.log('✅ Get categories:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Get categories error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/inventory/batches/{itemMasterId} - Lấy danh sách lô hàng theo FEFO
   */
  getBatchesByItemId: async (itemMasterId: number): Promise<BatchResponse[]> => {
    try {
      const response = await api.get<BatchResponse[]>(`/inventory/batches/${itemMasterId}`);
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

  /**
   * POST /api/v1/inventory/import - Tạo phiếu nhập kho nâng cấp
   */
  createImportTransaction: async (
    data: CreateImportTransactionDto
  ): Promise<ImportTransactionResponse> => {
    try {
      const response = await api.post<ImportTransactionResponse>('/inventory/import', data);
      console.log('✅ Create import transaction:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create import transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/inventory/export - Tạo phiếu xuất kho (FEFO)
   */
  createExportTransaction: async (
    data: CreateExportTransactionDto
  ): Promise<ExportTransactionResponse> => {
    try {
      const response = await api.post<ExportTransactionResponse>('/inventory/export', data);
      console.log('✅ Create export transaction:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create export transaction error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default inventoryService;
