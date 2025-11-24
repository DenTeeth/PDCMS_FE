/**
 * React Query Hooks for Supplier API V1
 * Handles data fetching, caching, and mutations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  SupplierSummaryResponse,
  SupplierDetailResponse,
  SuppliedItemResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierResponse,
  SupplierQueryParams,
  PageResponse,
} from '@/types/supplier';
import { supplierService } from '@/services/supplierService';

// ============================================
// QUERY HOOKS (GET)
// ============================================

/**
 * Get all suppliers with pagination
 * Usage: const { data, isLoading, error } = useSuppliers({ page: 0, size: 10 })
 */
export const useSuppliers = (params?: SupplierQueryParams) => {
  return useQuery<PageResponse<SupplierSummaryResponse>>({
    queryKey: ['suppliers', params],
    queryFn: () => supplierService.getAll(params),
  });
};

/**
 * Get supplier detail by ID
 * Usage: const { data, isLoading } = useSupplier(supplierId)
 */
export const useSupplier = (id: number | null) => {
  return useQuery<SupplierDetailResponse>({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getById(id!),
    enabled: !!id,
  });
};

/**
 * Get supplied items by supplier ID
 * Usage: const { data, isLoading } = useSuppliedItems(supplierId)
 */
export const useSuppliedItems = (id: number | null) => {
  return useQuery<SuppliedItemResponse[]>({
    queryKey: ['suppliedItems', id],
    queryFn: () => supplierService.getSuppliedItems(id!),
    enabled: !!id,
  });
};

// ============================================
// MUTATION HOOKS (CREATE, UPDATE, DELETE)
// ============================================

/**
 * Create new supplier
 * Usage:
 * const { mutate } = useCreateSupplier()
 * mutate(createData, {
 *   onSuccess: (data) => console.log('Created:', data)
 * })
 */
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<SupplierResponse, Error, CreateSupplierRequest>({
    mutationFn: (data) => supplierService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Tạo nhà cung cấp thành công!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo nhà cung cấp!';
      toast.error(errorMessage);
    },
  });
};

/**
 * Update existing supplier
 * Usage:
 * const { mutate } = useUpdateSupplier()
 * mutate({ id: 1, data: updateData })
 */
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SupplierResponse,
    Error,
    { id: number; data: UpdateSupplierRequest }
  >({
    mutationFn: ({ id, data }) => supplierService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      toast.success('Cập nhật nhà cung cấp thành công!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!';
      toast.error(errorMessage);
    },
  });
};

/**
 * Delete supplier
 * Usage:
 * const { mutate } = useDeleteSupplier()
 * mutate(supplierId)
 */
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Xóa nhà cung cấp thành công!');
    },
    onError: (error: any) => {
      const errorCode = error.response?.data?.error;
      
      // Special handling for supplier with transactions
      if (errorCode === 'SUPPLIER_HAS_TRANSACTIONS') {
        toast.error('Không thể xóa nhà cung cấp đã có lịch sử giao dịch!');
      } else {
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa!';
        toast.error(errorMessage);
      }
    },
  });
};
