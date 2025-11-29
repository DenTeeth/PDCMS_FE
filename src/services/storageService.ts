/**
 * Storage Service - API V1
 * Handles API calls for storage in/out operations (Nhập/Xuất kho)
 * Matching BE: TransactionHistoryController (API 6.6/6.7)
 */

import { apiClient } from '@/lib/api';
import type {
  StorageTransactionV3,
  StorageTransactionItemV3,
  StorageStats,
  TransactionType,
} from '@/types/warehouse';

const api = apiClient.getAxiosInstance();
const TRANSACTION_BASE = '/warehouse/transactions';

// ============================================
// TYPE DEFINITIONS (Matching BE)
// ============================================

export type StorageTransaction = StorageTransactionV3;
export type StorageTransactionItem = StorageTransactionItemV3;

export interface StorageFilter {
  transactionType?: TransactionType;
  status?: string;
  paymentStatus?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  supplierId?: number;
  appointmentId?: number;
  createdBy?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface StorageTransactionListMeta {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

export interface StorageTransactionStatsSummary {
  periodStart?: string;
  periodEnd?: string;
  totalImportValue?: number;
  totalExportValue?: number;
  pendingApprovalCount?: number;
}

export interface StorageTransactionListResult {
  content: StorageTransactionV3[];
  meta: StorageTransactionListMeta;
  stats?: StorageTransactionStatsSummary;
}

interface GetAllOptions {
  includeItems?: boolean;
  detailLimit?: number;
}

const mapTransactionItem = (item: any): StorageTransactionItemV3 => ({
  transactionItemId: item.transactionItemId ?? item.transaction_item_id ?? item.batchId ?? item.batch_id,
  itemMasterId: item.itemMasterId ?? item.item_master_id,
  itemCode: item.itemCode ?? item.item_code ?? undefined,
  itemName: item.itemName ?? item.item_name ?? undefined,
  unitName: item.unitName ?? item.unit_name ?? undefined,
  lotNumber: item.lotNumber ?? item.lot_number ?? undefined,
  quantityChange:
    item.quantityChange ??
    item.quantity_change ??
    item.quantity ??
    0,
  expiryDate: item.expiryDate ?? item.expiry_date ?? undefined,
  notes: item.notes ?? item.note ?? undefined,
  unitPrice: item.unitPrice ?? item.purchasePrice ?? item.price ?? item.unit_price,
  totalLineValue: item.totalLineValue ?? item.total_line_value ?? item.totalPrice ?? item.total_price,
});

const mapTransactionSummary = (item: any): StorageTransactionV3 => ({
  transactionId: item.transactionId ?? item.transaction_id,
  transactionCode: item.transactionCode ?? item.transaction_code,
  transactionType: (item.transactionType ?? item.type ?? item.transaction_type) as TransactionType,
  transactionDate: item.transactionDate ?? item.transaction_date,
  supplierId: item.supplierId ?? item.supplier_id,
  supplierName: item.supplierName ?? item.supplier_name,
  invoiceNumber: item.invoiceNumber ?? item.invoice_number,
  notes: item.notes ?? item.transactionNotes,
  createdByName: item.createdByName ?? item.created_by_name ?? item.createdBy,
  createdAt: item.createdAt ?? item.created_at,
  approvedByName: item.approvedByName ?? item.approved_by_name,
  approvedAt: item.approvedAt ?? item.approved_at,
  rejectedBy: item.rejectedBy ?? item.rejected_by,
  rejectedAt: item.rejectedAt ?? item.rejected_at,
  rejectionReason: item.rejectionReason ?? item.rejection_reason,
  cancelledBy: item.cancelledBy ?? item.cancelled_by,
  cancelledAt: item.cancelledAt ?? item.cancelled_at,
  cancellationReason: item.cancellationReason ?? item.cancellation_reason,
  totalItems: item.totalItems ?? item.total_items,
  totalValue: item.totalValue ?? item.total_value,
  status: item.status ?? item.approvalStatus ?? item.approval_status ?? 'DRAFT', // Default to DRAFT if not set
  paymentStatus: item.paymentStatus ?? item.payment_status,
  paidAmount: item.paidAmount ?? item.paid_amount,
  remainingDebt: item.remainingDebt ?? item.remaining_debt,
  dueDate: item.dueDate ?? item.due_date,
  relatedAppointmentId: item.relatedAppointmentId ?? item.related_appointment_id,
  relatedAppointmentCode: item.relatedAppointmentCode ?? item.related_appointment_code,
  patientName: item.patientName ?? item.patient_name,
  items: Array.isArray(item.items) ? item.items.map(mapTransactionItem) : [],
});

const mapTransactionDetail = (item: any): StorageTransactionV3 => {
  // Determine transaction type:
  // - If has supplierName -> IMPORT
  // - If has exportType or relatedAppointmentId -> EXPORT
  // - Otherwise try to infer from fields
  let transactionType: TransactionType = 'IMPORT';
  if (item.exportType || item.relatedAppointmentId || item.relatedAppointmentCode) {
    transactionType = 'EXPORT';
  } else if (item.supplierName || item.supplierId) {
    transactionType = 'IMPORT';
  } else if (item.transactionType || item.transaction_type || item.type) {
    transactionType = (item.transactionType ?? item.transaction_type ?? item.type) as TransactionType;
  }

  return {
    transactionId: item.transactionId ?? item.transaction_id,
    transactionCode: item.transactionCode ?? item.transaction_code,
    transactionType,
    transactionDate: item.transactionDate ?? item.transaction_date,
    supplierId: item.supplierId ?? item.supplier_id,
    supplierName: item.supplierName ?? item.supplier_name,
    invoiceNumber: item.invoiceNumber ?? item.invoice_number,
    exportType: item.exportType ?? item.export_type,
    notes: item.notes,
    createdByName: item.createdByName ?? item.created_by_name ?? item.createdBy,
    createdAt: item.createdAt ?? item.created_at,
    approvedByName: item.approvedByName ?? item.approved_by_name,
    approvedAt: item.approvedAt ?? item.approved_at,
    rejectedBy: item.rejectedBy ?? item.rejected_by,
    rejectedAt: item.rejectedAt ?? item.rejected_at,
    rejectionReason: item.rejectionReason ?? item.rejection_reason,
    cancelledBy: item.cancelledBy ?? item.cancelled_by,
    cancelledAt: item.cancelledAt ?? item.cancelled_at,
    cancellationReason: item.cancellationReason ?? item.cancellation_reason,
    totalItems: item.totalItems ?? item.total_items,
    totalValue: item.totalValue ?? item.total_value,
    status: item.status ?? item.approvalStatus ?? item.approval_status ?? 'DRAFT', // Default to DRAFT if not set
    paymentStatus: item.paymentStatus ?? item.payment_status,
    paidAmount: item.paidAmount ?? item.paid_amount,
    remainingDebt: item.remainingDebt ?? item.remaining_debt,
    dueDate: item.dueDate ?? item.due_date,
    relatedAppointmentId: item.relatedAppointmentId ?? item.related_appointment_id,
    relatedAppointmentCode: item.relatedAppointmentCode ?? item.related_appointment_code ?? item.referenceCode,
    patientName: item.patientName ?? item.patient_name,
    items: Array.isArray(item.items) ? item.items.map(mapTransactionItem) : [],
  };
};

const buildTransactionParams = (filter?: StorageFilter) => {
  const params: Record<string, any> = {
    page: filter?.page ?? 0,
    size: filter?.size ?? 20,
    sortBy: filter?.sortBy ?? 'transactionDate',
    sortDir: filter?.sortDirection ?? 'desc',
  };

  if (filter?.transactionType) params.type = filter.transactionType;
  if (filter?.status) params.status = filter.status;
  if (filter?.paymentStatus) params.paymentStatus = filter.paymentStatus;
  if (filter?.search) params.search = filter.search;
  if (filter?.fromDate) params.fromDate = filter.fromDate;
  if (filter?.toDate) params.toDate = filter.toDate;
  if (filter?.supplierId) params.supplierId = filter.supplierId;
  if (filter?.appointmentId) params.appointmentId = filter.appointmentId;
  if (filter?.createdBy) params.createdBy = filter.createdBy;

  return params;
};

const extractPayload = (response: any) => response?.data?.data ?? response?.data ?? response ?? {};

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
      console.error('Get storage stats error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/warehouse/transactions - Lấy danh sách phiếu nhập/xuất kho (API 6.6)
   */
  getAll: async (filter?: StorageFilter, options?: GetAllOptions): Promise<StorageTransactionListResult> => {
    try {
      const response = await api.get(TRANSACTION_BASE, {
        params: buildTransactionParams(filter),
      });

      const payload = extractPayload(response);
      const rawContent = Array.isArray(payload)
        ? payload
        : payload.content ?? payload.items ?? [];
      let content = rawContent.map(mapTransactionSummary);

      if (options?.includeItems && content.length > 0) {
        const detailLimit = options.detailLimit ?? content.length;
        const idsToFetch = content.slice(0, detailLimit).map((tx: StorageTransactionV3) => tx.transactionId);
        const details = await Promise.all(
          idsToFetch.map(async (id: number) => {
            try {
              return await storageService.getById(id);
            } catch (error) {
              console.error('Failed to load detail for transaction', id, error);
              return null;
            }
          }),
        );

        content = content.map((tx: StorageTransactionV3) => {
          const detail = details.find(
            (detailTx: StorageTransactionV3 | null) => detailTx?.transactionId === tx.transactionId,
          );
          return detail ? detail : tx;
        });
      }

      const metaSource = payload.meta ?? payload;
      const meta: StorageTransactionListMeta = {
        page: metaSource?.page ?? metaSource?.number ?? filter?.page ?? 0,
        size: metaSource?.size ?? filter?.size ?? content.length,
        totalPages: metaSource?.totalPages ?? metaSource?.total_pages ?? 1,
        totalElements: metaSource?.totalElements ?? metaSource?.total_elements ?? content.length,
      };

      const stats: StorageTransactionStatsSummary | undefined = payload.stats
        ? {
            periodStart: payload.stats.periodStart ?? payload.stats.period_start,
            periodEnd: payload.stats.periodEnd ?? payload.stats.period_end,
            totalImportValue: payload.stats.totalImportValue ?? payload.stats.total_import_value,
            totalExportValue: payload.stats.totalExportValue ?? payload.stats.total_export_value,
            pendingApprovalCount: payload.stats.pendingApprovalCount ?? payload.stats.pending_approval_count,
          }
        : undefined;

      console.log('✅ Get transactions:', content.length);
      return { content, meta, stats };
    } catch (error: any) {
      console.error('Get all transactions error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/warehouse/transactions/{id} - Chi tiết phiếu nhập/xuất kho (API 6.7)
   * 
   * BE returns: ImportTransactionResponse or ExportTransactionResponse directly (not wrapped)
   */
  getById: async (id: number): Promise<StorageTransactionV3> => {
    try {
      const response = await api.get(`${TRANSACTION_BASE}/${id}`);
      
      // BE returns response directly (ResponseEntity.ok(response))
      // Axios wraps it in response.data
      // So response.data is ImportTransactionResponse or ExportTransactionResponse
      const rawData = response.data;
      
      // Handle case where BE might wrap in { data: ... } or return directly
      const data = rawData?.data ?? rawData;
      
      if (!data) {
        throw new Error('Empty response from server');
      }
      
      const mapped = mapTransactionDetail(data);
      console.log('✅ Get transaction detail:', mapped.transactionCode);
      return mapped;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Unknown error';
      console.error('Get transaction detail error:', {
        id,
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
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
      const payload = extractPayload(response);
      const mapped = mapTransactionDetail(payload.data ?? payload);
      console.log('✅ Update transaction notes:', mapped.transactionCode);
      return mapped;
    } catch (error: any) {
      console.error('Update transaction notes error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/warehouse/transactions/{id}/approve - Duyệt phiếu nhập/xuất kho (API 6.6.1)
   */
  approve: async (id: number, notes?: string): Promise<StorageTransactionV3> => {
    try {
      const response = await api.post(`${TRANSACTION_BASE}/${id}/approve`, notes ? { notes } : undefined);
      const payload = extractPayload(response);
      const mapped = mapTransactionDetail(payload.data ?? payload);
      console.log('✅ Approve transaction:', mapped.transactionCode);
      return mapped;
    } catch (error: any) {
      console.error('Approve transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/warehouse/transactions/{id}/reject - Từ chối phiếu nhập/xuất kho (API 6.6.2)
   */
  reject: async (id: number, rejectionReason: string): Promise<StorageTransactionV3> => {
    try {
      const response = await api.post(`${TRANSACTION_BASE}/${id}/reject`, { rejectionReason });
      const payload = extractPayload(response);
      const mapped = mapTransactionDetail(payload.data ?? payload);
      console.log('✅ Reject transaction:', mapped.transactionCode);
      return mapped;
    } catch (error: any) {
      console.error('Reject transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST /api/v1/warehouse/transactions/{id}/cancel - Hủy phiếu nhập/xuất kho (API 6.6.3)
   */
  cancel: async (id: number, cancellationReason?: string): Promise<StorageTransactionV3> => {
    try {
      const response = await api.post(
        `${TRANSACTION_BASE}/${id}/cancel`,
        cancellationReason ? { cancellationReason } : undefined
      );
      const payload = extractPayload(response);
      const mapped = mapTransactionDetail(payload.data ?? payload);
      console.log('✅ Cancel transaction:', mapped.transactionCode);
      return mapped;
    } catch (error: any) {
      console.error('Cancel transaction error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * DELETE /api/v1/warehouse/transactions/{id} - Xóa phiếu nhập/xuất kho (admin)
   * 
   * ⚠️ NOTE: BE chưa implement DELETE endpoint trong TransactionHistoryController.
   * API 6.6/6.7 chỉ có GET endpoints. Delete functionality đã bị disable trong UI.
   * 
   * Nếu cần delete, có thể:
   * 1. Tạo issue cho BE để implement DELETE endpoint
   * 2. Hoặc sử dụng status = CANCELLED thay vì delete
   */
  delete: async (id: number): Promise<void> => {
    // TODO: BE chưa implement DELETE endpoint
    // TransactionHistoryController chỉ có GET /transactions và GET /transactions/{id}
    throw new Error('Delete transaction endpoint chưa được implement bởi BE. Vui lòng liên hệ Backend team.');
  },
};

export default storageService;
