/**
 * Storage Service - API V1
 * Handles API calls for storage in/out operations (Nhập/Xuất kho)
 * Matching BE: StorageInOutController
 */

import { apiClient } from '@/lib/api';
import type {
  StorageTransactionV3,
  StorageStats,
  TransactionType,
} from '@/types/warehouse';

const api = apiClient.getAxiosInstance();
const TRANSACTION_BASE = '/warehouse/transactions';

// ============================================
// TYPE DEFINITIONS (Matching BE)
// ============================================

// StorageTransaction is now imported from @/types/warehouse as StorageTransactionV3
// StorageStats is now imported from @/types/warehouse

export interface StorageFilter {
  transactionType?: TransactionType;
  month?: number;
  year?: number;
  search?: string;
}

// ============================================
// STORAGE SERVICE
// ============================================

export const storageService = {
  /**
   * GET /api/v1/warehouse/transactions/stats - Lấy thống kê import/export (API 6.6)
   */
  getStats: async (month?: number, year?: number): Promise<StorageStats> => {
    try {
      const response = await api.get(`${TRANSACTION_BASE}/stats`, {
        params: { month, year },
      });
      const data = response.data || {};
      const mapped: StorageStats = {
        monthlyImportCount: data.monthlyImportCount ?? data.monthly_import_count ?? 0,
        monthlyExportCount: data.monthlyExportCount ?? data.monthly_export_count ?? 0,
        importGrowthPercent: data.importGrowthPercent ?? data.import_growth_percent ?? 0,
        exportGrowthPercent: data.exportGrowthPercent ?? data.export_growth_percent ?? 0,
        totalTransactionsCount: data.totalTransactionsCount ?? data.total_transactions_count ?? 0,
        expiredItemsCount: data.expiredItemsCount ?? data.expired_items_count,
      };
      console.log('✅ Get storage stats:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Get storage stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/warehouse/transactions - Lấy danh sách phiếu nhập/xuất kho (API 6.6)
   */
  getAll: async (filter?: StorageFilter): Promise<StorageTransactionV3[]> => {
    try {
      const response = await api.get(TRANSACTION_BASE, {
        params: filter,
      });
      const data = response.data || [];
      const mapped: StorageTransactionV3[] = Array.isArray(data)
        ? data.map((item: any) => ({
            transactionId: item.transactionId ?? item.transaction_id,
            transactionCode: item.transactionCode ?? item.transaction_code,
            transactionType: item.transactionType ?? item.transaction_type,
            transactionDate: item.transactionDate ?? item.transaction_date,
            supplierId: item.supplierId ?? item.supplier_id,
            supplierName: item.supplierName ?? item.supplier_name,
            notes: item.notes,
            createdByName: item.createdByName ?? item.created_by_name,
            createdAt: item.createdAt ?? item.created_at,
            items: (item.items || []).map((it: any) => ({
              transactionItemId: it.transactionItemId ?? it.transaction_item_id,
              itemMasterId: it.itemMasterId ?? it.item_master_id,
              itemCode: it.itemCode ?? it.item_code,
              itemName: it.itemName ?? it.item_name,
              unitName: it.unitName ?? it.unit_name,
              lotNumber: it.lotNumber ?? it.lot_number,
              quantityChange: it.quantityChange ?? it.quantity_change,
              expiryDate: it.expiryDate ?? it.expiry_date,
              notes: it.notes,
            })),
          }))
        : [];
      console.log('✅ Get all transactions:', mapped.length);
      return mapped;
    } catch (error: any) {
      console.error('❌ Get all transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/warehouse/transactions/{id} - Chi tiết phiếu nhập/xuất kho (API 6.6)
   */
  getById: async (id: number): Promise<StorageTransactionV3> => {
    try {
      const response = await api.get(`${TRANSACTION_BASE}/${id}`);
      const item = response.data || {};
      
      // Debug: Log raw BE response to check itemCode and expiryDate
      console.log('🔍 Raw BE response for transaction detail:', JSON.stringify(item, null, 2));
      if (item.items && item.items.length > 0) {
        console.log('🔍 First item from BE:', JSON.stringify(item.items[0], null, 2));
      }
      
      const mapped: StorageTransactionV3 = {
        transactionId: item.transactionId ?? item.transaction_id,
        transactionCode: item.transactionCode ?? item.transaction_code,
        transactionType: item.transactionType ?? item.transaction_type,
        transactionDate: item.transactionDate ?? item.transaction_date,
        supplierId: item.supplierId ?? item.supplier_id,
        supplierName: item.supplierName ?? item.supplier_name,
        notes: item.notes,
        createdByName: item.createdByName ?? item.created_by_name,
        createdAt: item.createdAt ?? item.created_at,
        items: (item.items || []).map((it: any) => ({
          transactionItemId: it.transactionItemId ?? it.transaction_item_id,
          itemMasterId: it.itemMasterId ?? it.item_master_id,
          itemCode: it.itemCode ?? it.item_code ?? null,
          itemName: it.itemName ?? it.item_name ?? null,
          unitName: it.unitName ?? it.unit_name ?? null,
          lotNumber: it.lotNumber ?? it.lot_number ?? null,
          quantityChange: it.quantityChange ?? it.quantity_change ?? 0,
          expiryDate: it.expiryDate ?? it.expiry_date ?? null,
          notes: it.notes ?? null,
        })),
      };
      console.log('✅ Get transaction detail:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Get transaction detail error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PUT /api/v1/warehouse/transactions/{id}?notes=... - Cập nhật ghi chú phiếu
   * (Legacy behavior reimplemented via API 6.6 controller)
   */
  updateNotes: async (id: number, notes: string): Promise<StorageTransactionV3> => {
    try {
      const response = await api.put(`${TRANSACTION_BASE}/${id}`, null, {
        params: { notes },
      });
      const item = response.data || {};
      const mapped: StorageTransactionV3 = {
        transactionId: item.transactionId ?? item.transaction_id,
        transactionCode: item.transactionCode ?? item.transaction_code,
        transactionType: item.transactionType ?? item.transaction_type,
        transactionDate: item.transactionDate ?? item.transaction_date,
        supplierId: item.supplierId ?? item.supplier_id,
        supplierName: item.supplierName ?? item.supplier_name,
        notes: item.notes,
        createdByName: item.createdByName ?? item.created_by_name,
        createdAt: item.createdAt ?? item.created_at,
        items: (item.items || []).map((it: any) => ({
          transactionItemId: it.transactionItemId ?? it.transaction_item_id,
          itemCode: it.itemCode ?? it.item_code,
          itemName: it.itemName ?? it.item_name,
          unitName: it.unitName ?? it.unit_name,
          lotNumber: it.lotNumber ?? it.lot_number,
          quantityChange: it.quantityChange ?? it.quantity_change,
          expiryDate: it.expiryDate ?? it.expiry_date,
          notes: it.notes,
        })),
      };
      console.log('✅ Update transaction notes:', mapped);
      return mapped;
    } catch (error: any) {
      console.error('❌ Update transaction notes error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * DELETE /api/v1/warehouse/transactions/{id} - Xóa phiếu nhập/xuất kho (admin)
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`${TRANSACTION_BASE}/${id}`);
      console.log('✅ Delete transaction:', id);
    } catch (error: any) {
      console.error('❌ Delete transaction error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default storageService;
