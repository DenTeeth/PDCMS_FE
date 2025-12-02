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
  ExpiringAlertsResponse,
  ExpiringAlertsFilter,
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

export interface ItemUnitRequest {
  unitId?: number; // Optional - required when updating existing units
  unitName: string;
  conversionRate: number;
  isBaseUnit: boolean;
  displayOrder: number;
  isActive?: boolean; // Required when updating existing units
  isDefaultImportUnit?: boolean;
  isDefaultExportUnit?: boolean;
}

export interface CreateItemMasterRequest {
  itemCode: string;
  itemName: string;
  description?: string;
  categoryId: number;
  warehouseType: 'COLD' | 'NORMAL';
  minStockLevel: number;
  maxStockLevel: number;
  isPrescriptionRequired?: boolean;
  defaultShelfLifeDays?: number;
  units: ItemUnitRequest[]; // Required - must have at least 1 unit with isBaseUnit=true
  notes?: string;
  // Legacy fields for backward compatibility
  unitOfMeasure?: string;
  isTool?: boolean;
}

export interface UpdateItemMasterRequest {
  itemName?: string;
  description?: string;
  categoryId?: number;
  warehouseType?: 'COLD' | 'NORMAL';
  minStockLevel?: number;
  maxStockLevel?: number;
  isPrescriptionRequired?: boolean;
  defaultShelfLifeDays?: number;
  units?: ItemUnitRequest[]; // Optional - for updating unit hierarchy (Safety Lock applies)
  notes?: string;
  // Legacy fields for backward compatibility
  unitOfMeasure?: string;
  isTool?: boolean;
}

export interface UpdateItemMasterResponse {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  safetyLockApplied: boolean; // Indicates if Safety Lock was active during update
  units: Array<{
    unitId: number;
    unitName: string;
    conversionRate: number;
    isBaseUnit: boolean;
    displayOrder: number;
    isActive: boolean;
  }>;
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
   * GET /api/v1/warehouse/items - Lấy danh sách vật tư (API 6.8)
   */
  getAll: async (filter?: InventoryFilter): Promise<ItemMasterV1[]> => {
    try {
      const response = await api.get<ItemMasterV1[]>('/warehouse/items', {
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
   * 
   * Note: BE has endpoint at /api/v1/inventory/{id} (InventoryController)
   * Returns: ItemMasterSummaryResponse
   */
  getById: async (id: number): Promise<ItemMasterV1> => {
    try {
      const response = await api.get(`/inventory/${id}`);
      const data = response.data || {};
      
      // Map ItemMasterSummaryResponse to ItemMasterV1
      const mapped: ItemMasterV1 = {
        id: data.itemMasterId ?? data.item_master_id ?? id,
        itemCode: data.itemCode ?? data.item_code ?? '',
        itemName: data.itemName ?? data.item_name ?? '',
        categoryId: 0, // Not in response, will need to fetch separately if needed
        categoryName: data.categoryName ?? data.category_name,
        unitOfMeasure: data.unitOfMeasure ?? data.unit_of_measure ?? '',
        warehouseType: (data.warehouseType ?? data.warehouse_type ?? 'NORMAL') as 'COLD' | 'NORMAL',
        minStockLevel: data.minStockLevel ?? data.min_stock_level ?? 0,
        maxStockLevel: data.maxStockLevel ?? data.max_stock_level ?? 0,
        currentStock: data.totalQuantityOnHand ?? data.total_quantity_on_hand ?? 0,
        stockStatus: (data.stockStatus ?? data.stock_status ?? 'NORMAL') as 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK',
        isTool: data.isTool ?? data.is_tool ?? false,
        notes: undefined, // Not in ItemMasterSummaryResponse
        createdAt: data.createdAt ?? data.created_at,
        updatedAt: data.updatedAt ?? data.updated_at,
      };
      
      console.log('✅ Get item detail:', mapped);
      return mapped;
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        error.toString() || 
        'Unknown error occurred';
      
      const errorDetails = error.response?.data || error.data || {};
      const statusCode = error.response?.status || error.status;
      const requestUrl = error.config?.url || error.url || `/inventory/${id}`;
      
      console.error('❌ Get item detail error:', {
        message: errorMessage,
        status: statusCode,
        statusText: error.response?.statusText || error.statusText,
        data: errorDetails,
        url: requestUrl,
        itemId: id,
        fullError: error,
      });
      
      // Re-throw with more context
      const enhancedError = new Error(`Failed to fetch item detail: ${errorMessage}`);
      (enhancedError as any).status = statusCode;
      (enhancedError as any).data = errorDetails;
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  /**
   * GET /api/v1/inventory/summary - Lấy danh sách tồn kho (Inventory Dashboard)
   * 
   * Note: BE document (FE_ISSUES_RESOLUTION_2025_11_29.md) confirms this endpoint works correctly.
   * Advanced version /warehouse/summary may have issues, so using simple version.
   * 
   * BE Response: Page<ItemMasterSummaryResponse> with:
   * - content: ItemMasterSummaryResponse[]
   * - totalElements, totalPages, number, size
   * 
   * ItemMasterSummaryResponse: { itemMasterId, itemCode, itemName, categoryName, warehouseType, 
   *   unitOfMeasure, totalQuantityOnHand, stockStatus, isExpiringSoon, minStockLevel, maxStockLevel }
   */
  getSummary: async (filter?: InventoryFilter): Promise<InventorySummaryPage> => {
    try {
      const params: Record<string, any> = {
        page: filter?.page ?? 0,
        size: filter?.size ?? 10,
      };

      // BE /inventory/summary supports: warehouseType, stockStatus, page, size, sort
      if (filter?.warehouseType) params.warehouseType = filter.warehouseType;
      if (filter?.stockStatus) params.stockStatus = filter.stockStatus;
      if (filter?.sort) {
        params.sort = filter.sort;
      } else if (filter?.sortBy) {
        params.sort = `${filter.sortBy},${filter.sortDirection ?? 'asc'}`;
      } else {
        params.sort = 'itemName,asc'; // Default sort
      }
      // Note: /inventory/summary doesn't support search or categoryId filters

      const response = await api.get('/inventory/summary', { params });
      const raw = response.data;

      // Map ItemMasterSummaryResponse to InventorySummary
      // BE /inventory/summary returns: { content: ItemMasterSummaryResponse[], totalElements, totalPages, number, size }
      // ItemMasterSummaryResponse has: itemMasterId, itemCode, itemName, categoryName, warehouseType,
      //   unitOfMeasure, totalQuantityOnHand, stockStatus, isExpiringSoon, minStockLevel, maxStockLevel
      const mapItem = (item: any): InventorySummary => ({
        itemMasterId: item.itemMasterId ?? item.item_master_id ?? 0,
        itemCode: item.itemCode ?? item.item_code ?? '',
        itemName: item.itemName ?? item.item_name ?? '',
        categoryName: item.categoryName ?? item.category_name ?? '',
        // BE /inventory/summary uses 'unitOfMeasure' (not 'unitName')
        unitOfMeasure: item.unitOfMeasure ?? item.unit_of_measure ?? item.unitName ?? item.unit_name ?? '',
        warehouseType: (item.warehouseType ?? item.warehouse_type ?? 'NORMAL') as 'COLD' | 'NORMAL',
        minStockLevel: item.minStockLevel ?? item.min_stock_level ?? 0,
        maxStockLevel: item.maxStockLevel ?? item.max_stock_level ?? 0,
        stockStatus: (item.stockStatus ?? item.stock_status ?? 'NORMAL') as 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK',
        // ItemMasterSummaryResponse has isExpiringSoon field
        isTool: item.isTool ?? item.is_tool ?? false,
        isExpiringSoon: item.isExpiringSoon ?? item.is_expiring_soon ?? false,
        totalQuantity: item.totalQuantityOnHand ?? item.total_quantity_on_hand ?? item.totalQuantity ?? item.total_quantity ?? 0,
        totalQuantityOnHand: item.totalQuantityOnHand ?? item.total_quantity_on_hand ?? item.totalQuantity ?? item.total_quantity ?? 0,
        nearestExpiryDate: item.nearestExpiryDate ?? item.nearest_expiry_date, // May not be in simple version
        createdAt: item.createdAt ?? item.created_at,
        updatedAt: item.updatedAt ?? item.updated_at,
      });

      // BE /inventory/summary returns Spring Page: { content[], totalElements, totalPages, number, size }
      if (Array.isArray(raw)) {
        // Fallback: if response is array directly (shouldn't happen, but handle gracefully)
        const content = raw.map(mapItem);
        return {
          content,
          totalElements: content.length,
          totalPages: 1,
          size: content.length,
          number: 0,
        };
      }

      // Normal response structure: Spring Page<ItemMasterSummaryResponse>
      const content = (raw.content || []).map(mapItem);
      return {
        content,
        // Spring Page uses 'totalElements' (not 'totalItems')
        totalElements: Number(raw.totalElements ?? raw.total_elements ?? content.length),
        totalPages: Number(raw.totalPages ?? raw.total_pages ?? 1),
        size: Number(raw.size ?? content.length),
        number: Number(raw.number ?? raw.page ?? 0),
      };
    } catch (error: any) {
      // Better error logging with fallbacks
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        error.toString() || 
        'Unknown error occurred';
      
      const errorDetails = error.response?.data || error.data || {};
      const statusCode = error.response?.status || error.status;
      const requestUrl = error.config?.url || error.url || '/warehouse/summary';
      const requestParams = error.config?.params || {};
      
      // Log full error details for BE debugging
      const errorLog = {
        message: errorMessage,
        status: statusCode,
        statusText: error.response?.statusText || error.statusText,
        data: errorDetails,
        url: requestUrl,
        params: requestParams,
        timestamp: new Date().toISOString(),
        // Additional context for BE team
        requestInfo: {
          endpoint: '/api/v1/inventory/summary',
          method: 'GET',
          params: requestParams,
          userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'N/A',
        },
        // Full error for debugging
        fullError: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
          } : null,
        },
      };
      
      console.error('❌ Get inventory summary error:', errorLog);
      
      // Also log to console in a format BE team can easily read
      if (statusCode === 500) {
        console.error('🔴 BE 500 ERROR DETAILS:', {
          endpoint: '/api/v1/inventory/summary',
          requestParams,
          errorResponse: errorDetails,
        possibleCauses: [
          'Switched to /inventory/summary endpoint (simple version)',
          'If still fails, check BE logs for actual error',
        ],
        });
      }
      
      // Re-throw with more context
      const enhancedError = new Error(`Failed to fetch inventory summary: ${errorMessage}`);
      (enhancedError as any).status = statusCode;
      (enhancedError as any).data = errorDetails;
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  /**
   * GET /api/v1/inventory/stats - Lấy thống kê tổng quan kho
   * BE Response: WarehouseStatsResponse { totalItems, lowStockItems, expiringSoonItems, outOfStockItems }
   */
  getStats: async (): Promise<InventoryStats> => {
    try {
      const response = await api.get('/inventory/stats');
      const data = response.data || {};
      
      // Map WarehouseStatsResponse to InventoryStats
      const mapped: InventoryStats = {
        totalItems: data.totalItems ?? data.total_items ?? 0,
        // These fields are NOT in WarehouseStatsResponse, set to undefined
        totalValue: undefined,
        lowStockCount: data.lowStockItems ?? data.low_stock_items ?? 0,
        outOfStockCount: data.outOfStockItems ?? data.out_of_stock_items ?? 0,
        expiringWithin30Days: data.expiringSoonItems ?? data.expiring_soon_items ?? 0,
        coldStorageItems: undefined, // Not in WarehouseStatsResponse
        normalStorageItems: undefined, // Not in WarehouseStatsResponse
      };
      
      console.log('✅ Get inventory stats:', mapped);
      return mapped;
    } catch (error: any) {
      // Better error logging with fallbacks
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        error.toString() || 
        'Unknown error occurred';
      
      const errorDetails = error.response?.data || error.data || {};
      const statusCode = error.response?.status || error.status;
      const requestUrl = error.config?.url || error.url || '/inventory/stats';
      
      console.error('❌ Get inventory stats error:', {
        message: errorMessage,
        status: statusCode,
        statusText: error.response?.statusText || error.statusText,
        data: errorDetails,
        url: requestUrl,
        fullError: error,
      });
      
      // Re-throw with more context
      const enhancedError = new Error(`Failed to fetch inventory stats: ${errorMessage}`);
      (enhancedError as any).status = statusCode;
      (enhancedError as any).data = errorDetails;
      (enhancedError as any).originalError = error;
      throw enhancedError;
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
   * 
   * Note: BE document (FE_ISSUES_RESOLUTION_2025_11_29.md) confirms this endpoint works correctly.
   * Simple version returns List<BatchResponse>[] with FEFO sorting.
   * 
   * Alternative advanced endpoint: /api/v1/warehouse/batches/{itemMasterId} (with stats, pagination)
   * 
   * BE Response: BatchResponse[] sorted by expiryDate ASC (FEFO)
   * BatchResponse: { batchId, lotNumber, quantityOnHand, expiryDate, importedAt, supplierName, isExpiringSoon, isExpired }
   */
  getBatchesByItemId: async (itemMasterId: number): Promise<BatchResponse[]> => {
    try {
      const response = await api.get(`/inventory/batches/${itemMasterId}`);
      const data = response.data || [];
      
      // Map BatchResponse to ensure correct structure
      const mapped: BatchResponse[] = Array.isArray(data) ? data.map((batch: any) => ({
        batchId: batch.batchId ?? batch.batch_id ?? 0,
        lotNumber: batch.lotNumber ?? batch.lot_number ?? '',
        quantityOnHand: batch.quantityOnHand ?? batch.quantity_on_hand ?? 0,
        expiryDate: batch.expiryDate ?? batch.expiry_date,
        importedAt: batch.importedAt ?? batch.imported_at,
        supplierName: batch.supplierName ?? batch.supplier_name,
        isExpiringSoon: batch.isExpiringSoon ?? batch.is_expiring_soon ?? false,
        isExpired: batch.isExpired ?? batch.is_expired ?? false,
      })) : [];
      
      console.log('✅ Get batches (FEFO):', mapped.length, 'batches');
      return mapped;
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        error.toString() || 
        'Unknown error occurred';
      
      const errorDetails = error.response?.data || error.data || {};
      const statusCode = error.response?.status || error.status;
      const requestUrl = error.config?.url || error.url || `/inventory/batches/${itemMasterId}`;
      
      console.error('❌ Get batches error:', {
        message: errorMessage,
        status: statusCode,
        statusText: error.response?.statusText || error.statusText,
        data: errorDetails,
        url: requestUrl,
        itemMasterId,
        fullError: error,
      });
      
      // Re-throw with more context
      const enhancedError = new Error(`Failed to fetch batches: ${errorMessage}`);
      (enhancedError as any).status = statusCode;
      (enhancedError as any).data = errorDetails;
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  },

  /**
   * GET /api/v1/warehouse/alerts/expiring - Lấy danh sách cảnh báo hết hạn (API 6.3)
   */
  getExpiringAlerts: async (filter?: ExpiringAlertsFilter): Promise<ExpiringAlertsResponse> => {
    try {
      const params: Record<string, any> = {
        days: filter?.days ?? 30, // Default 30 days
        page: filter?.page ?? 0,
        size: filter?.size ?? 20,
      };

      if (filter?.categoryId) params.categoryId = filter.categoryId;
      if (filter?.warehouseType) params.warehouseType = filter.warehouseType;
      if (filter?.statusFilter) params.statusFilter = filter.statusFilter;

      const response = await api.get('/warehouse/alerts/expiring', { params });
      const raw = response.data;

      // Handle BE response structure (may be wrapped in data field)
      const payload = raw.data || raw;

      // Map response to match ExpiringAlertsResponse type
      const mapped: ExpiringAlertsResponse = {
        reportDate: payload.reportDate || payload.report_date || new Date().toISOString(),
        thresholdDays: payload.thresholdDays || payload.threshold_days || params.days,
        stats: {
          totalAlerts: payload.stats?.totalAlerts ?? payload.stats?.total_alerts ?? 0,
          expiredCount: payload.stats?.expiredCount ?? payload.stats?.expired_count ?? 0,
          criticalCount: payload.stats?.criticalCount ?? payload.stats?.critical_count ?? 0,
          expiringSoonCount: payload.stats?.expiringSoonCount ?? payload.stats?.expiring_soon_count ?? 0,
          totalQuantity: payload.stats?.totalQuantity ?? payload.stats?.total_quantity ?? 0,
        },
        meta: {
          page: payload.meta?.page ?? payload.page ?? params.page,
          size: payload.meta?.size ?? payload.size ?? params.size,
          totalPages: payload.meta?.totalPages ?? payload.meta?.total_pages ?? payload.totalPages ?? payload.total_pages ?? 0,
          totalElements: payload.meta?.totalElements ?? payload.meta?.total_elements ?? payload.totalElements ?? payload.total_elements ?? 0,
        },
        alerts: (payload.alerts || []).map((alert: any) => ({
          batchId: alert.batchId ?? alert.batch_id,
          itemCode: alert.itemCode ?? alert.item_code,
          itemName: alert.itemName ?? alert.item_name,
          categoryName: alert.categoryName ?? alert.category_name,
          warehouseType: alert.warehouseType ?? alert.warehouse_type ?? 'NORMAL',
          lotNumber: alert.lotNumber ?? alert.lot_number,
          binLocation: alert.binLocation ?? alert.bin_location,
          quantityOnHand: alert.quantityOnHand ?? alert.quantity_on_hand ?? 0,
          unitName: alert.unitName ?? alert.unit_name,
          expiryDate: alert.expiryDate ?? alert.expiry_date,
          daysRemaining: alert.daysRemaining ?? alert.days_remaining ?? 0,
          status: alert.status,
          supplierName: alert.supplierName ?? alert.supplier_name,
        })),
      };

      console.log('✅ Get expiring alerts:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Get expiring alerts error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/warehouse/items - Tạo vật tư mới
   */
  create: async (data: CreateItemMasterRequest): Promise<ItemMasterV1> => {
    try {
      const response = await api.post<ItemMasterV1>('/warehouse/items', data);
      console.log('✅ Create item:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create item error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * API 6.10 - PUT /api/v1/warehouse/items/{id} - Cập nhật vật tư với Safety Lock
   * 
   * Safety Lock: Blocks dangerous changes when stock > 0
   * - BLOCKED: Change conversion rate, change isBaseUnit flag, hard delete units
   * - ALLOWED: Rename units, add new units, change displayOrder, soft delete units
   * 
   * @throws 409 CONFLICT if Safety Lock violation occurs
   */
  update: async (id: number, data: UpdateItemMasterRequest): Promise<UpdateItemMasterResponse> => {
    // Log request details for BE debugging
    console.group('🔄 [WAREHOUSE] Update Item Request');
    console.log('📋 Item ID:', id);
    console.log('📦 Request Data:', JSON.stringify(data, null, 2));
    console.log('🔗 Endpoint: PUT /warehouse/items/' + id);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    try {
      const response = await api.put<UpdateItemMasterResponse>(`/warehouse/items/${id}`, data);
      
      console.log('✅ [WAREHOUSE] Update Success');
      console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
      
      // Show warning if Safety Lock was applied
      if (response.data.safetyLockApplied) {
        console.warn('⚠️ [WAREHOUSE] Safety Lock was applied - some changes may have been blocked due to existing inventory');
        console.warn('📌 Safety Lock Details:', {
          itemId: id,
          itemCode: data.itemCode || 'N/A',
          safetyLockApplied: response.data.safetyLockApplied,
          timestamp: new Date().toISOString()
        });
      }
      
      console.groupEnd();
      return response.data;
    } catch (error: any) {
      // Detailed error logging for BE debugging
      console.error('❌ [WAREHOUSE] Update Item Error');
      console.error('📋 Item ID:', id);
      console.error('📦 Request Data:', JSON.stringify(data, null, 2));
      console.error('🔗 Endpoint: PUT /warehouse/items/' + id);
      console.error('⏰ Timestamp:', new Date().toISOString());
      
      // Log full error details
      if (error.response) {
        console.error('📡 Response Status:', error.response.status);
        console.error('📡 Response Headers:', error.response.headers);
        console.error('📡 Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('📡 Full Response:', error.response);
      } else if (error.request) {
        console.error('📡 Request made but no response received:', error.request);
      } else {
        console.error('📡 Error setting up request:', error.message);
      }
      
      console.error('📡 Full Error Object:', error);
      console.error('📡 Error Stack:', error.stack);
      
      // Handle validation errors (400 Bad Request) - Detailed logging
      if (error.response?.status === 400) {
        const errorData = error.response.data || {};
        console.error('❌ [WAREHOUSE] Validation Error (400)');
        console.error('📌 Validation Details:', {
          itemId: id,
          itemCode: data.itemCode || 'N/A',
          status: 400,
          message: errorData.message || 'No message provided',
          errorCode: errorData.errorCode || 'NO_ERROR_CODE',
          timestamp: new Date().toISOString(),
          fullErrorData: JSON.stringify(errorData, null, 2)
        });
        
        const errorMessage = errorData.message || 
          'Lỗi validation. Vui lòng kiểm tra lại dữ liệu.';
        
        console.groupEnd();
        throw new Error(errorMessage);
      }
      
      // Handle Safety Lock errors (409 CONFLICT) - Detailed logging
      if (error.response?.status === 409) {
        const conflictData = error.response.data || {};
        console.error('🚫 [WAREHOUSE] CONFLICT (409) - Safety Lock Violation');
        console.error('📌 Conflict Details:', {
          itemId: id,
          itemCode: data.itemCode || 'N/A',
          status: 409,
          message: conflictData.message || 'No message provided',
          errorCode: conflictData.errorCode || 'NO_ERROR_CODE',
          timestamp: new Date().toISOString(),
          fullErrorData: JSON.stringify(conflictData, null, 2)
        });
        
        const errorMessage = conflictData.message || 
          'Không thể thực hiện thay đổi này vì vật tư đã có tồn kho. Vui lòng kiểm tra lại.';
        
        console.groupEnd();
        throw new Error(errorMessage);
      }
      
      // Log other error types
      console.error('❌ [WAREHOUSE] Other Error Type:', {
        status: error.response?.status || 'NO_STATUS',
        message: error.message || 'NO_MESSAGE',
        errorCode: error.response?.data?.errorCode || 'NO_ERROR_CODE',
        timestamp: new Date().toISOString()
      });
      
      console.groupEnd();
      throw error;
    }
  },

  /**
   * DELETE /api/v1/warehouse/items/{id} - Xóa vật tư
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/warehouse/items/${id}`);
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
   * POST /api/v1/warehouse/import - Tạo phiếu nhập kho nâng cấp (API 6.4)
   */
  createImportTransaction: async (
    data: CreateImportTransactionDto
  ): Promise<ImportTransactionResponse> => {
    try {
      const response = await api.post<ImportTransactionResponse>('/warehouse/import', data);
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
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error.message;
      const errorCode = errorData?.error;
      
      console.error('❌ Create export transaction error:', {
        message: errorMessage,
        code: errorCode,
        status: error.response?.status,
        data: errorData,
        url: error.config?.url,
        payload: data,
        fullError: error,
      });
      
      // Re-throw with enhanced error info
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).code = errorCode;
      (enhancedError as any).status = error.response?.status;
      (enhancedError as any).response = error.response;
      throw enhancedError;
    }
  },
};

export default inventoryService;
