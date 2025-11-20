/**
 * Storage Service - API V1
 * Handles API calls for storage in/out operations (Nhập/Xuất kho)
 */

import { apiClient } from '@/lib/api';

const api = apiClient.getAxiosInstance();

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface StorageTransactionItem {
  transactionItemId?: number;
  itemMasterId: number;
  itemName?: string;
  itemCode?: string;
  lotNumber: string;
  quantityChange: number;
  unitPrice: number;
  totalPrice?: number;
  expiryDate?: string;
  notes?: string;
}

export interface StorageTransaction {
  transactionId: number;
  transactionCode: string;
  transactionType: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT' | 'LOSS';
  transactionDate: string;
  supplierId?: number;
  supplierName?: string;
  totalAmount: number;
  notes?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  items: StorageTransactionItem[];
}

export interface ImportRequest {
  supplierId: number;
  transactionDate?: string;
  notes?: string;
  items: {
    itemMasterId: number;
    lotNumber: string;
    quantity: number;
    importPrice: number;
    expiryDate?: string;
  }[];
}

export interface ExportRequest {
  transactionDate?: string;
  notes?: string;
  items: {
    batchId: number;
    quantity: number;
  }[];
}

export interface StorageStats {
  monthlyImportValue: number;
  monthlyExportValue: number;
  importGrowthPercent: number;
  exportGrowthPercent: number;
  totalImportTransactions?: number;
  totalExportTransactions?: number;
}

export interface StorageFilter {
  transactionType?: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT' | 'LOSS';
  month?: number;
  year?: number;
  search?: string;
}

// ============================================
// STORAGE SERVICE
// ============================================

export const storageService = {
  /**
   * POST /api/v1/storage/import - Tạo phiếu nhập kho
   */
  createImport: async (data: ImportRequest): Promise<StorageTransaction> => {
    try {
      const response = await api.post<StorageTransaction>('/storage/import', data);
      console.log('✅ Create import:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create import error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/storage/export - Tạo phiếu xuất kho
   */
  createExport: async (data: ExportRequest): Promise<StorageTransaction> => {
    try {
      const response = await api.post<StorageTransaction>('/storage/export', data);
      console.log('✅ Create export:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create export error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/storage/stats - Lấy thống kê import/export
   */
  getStats: async (month?: number, year?: number): Promise<StorageStats> => {
    try {
      const response = await api.get<StorageStats>('/storage/stats', {
        params: { month, year },
      });
      console.log('✅ Get storage stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get storage stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/storage - Lấy danh sách phiếu (NEW)
   */
  getAll: async (filter?: StorageFilter): Promise<StorageTransaction[]> => {
    try {
      const response = await api.get<StorageTransaction[]>('/storage', {
        params: filter,
      });
      console.log('✅ Get all transactions:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get all transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/storage/{id} - Chi tiết phiếu (NEW)
   */
  getById: async (id: number): Promise<StorageTransaction> => {
    try {
      const response = await api.get<StorageTransaction>(`/storage/${id}`);
      console.log('✅ Get transaction detail:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Get transaction detail error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PUT /api/v1/storage/{id} - Cập nhật notes (NEW)
   */
  updateNotes: async (id: number, notes: string): Promise<StorageTransaction> => {
    try {
      const response = await api.put<StorageTransaction>(`/storage/${id}`, null, {
        params: { notes },
      });
      console.log('✅ Update transaction notes:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Update transaction notes error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * DELETE /api/v1/storage/{id} - Xóa phiếu (NEW)
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/storage/${id}`);
      console.log('✅ Delete transaction:', id);
    } catch (error: any) {
      console.error('❌ Delete transaction error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default storageService;
