import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '@/services/accountingService';
import type { TransactionQueryParams, CreateTransactionRequest } from '@/types/accounting';
import { toast } from 'sonner';

export function useTransactions(params: TransactionQueryParams = {}) {
    return useQuery({
        queryKey: ['transactions', params],
        queryFn: () => accountingService.getTransactions(params),
        staleTime: 30000, // 30 seconds
    });
}

export function useTransaction(id: string) {
    return useQuery({
        queryKey: ['transaction', id],
        queryFn: () => accountingService.getTransactionById(id),
        enabled: !!id,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTransactionRequest) => accountingService.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('Tạo phiếu thành công');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Có lỗi xảy ra');
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionRequest> }) =>
            accountingService.updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('Cập nhật phiếu thành công');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Có lỗi xảy ra');
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => accountingService.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            toast.success('Xóa phiếu thành công');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Có lỗi xảy ra');
        },
    });
}
