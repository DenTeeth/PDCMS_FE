'use client';

/**
 * Storage In/Out Page - API V1 (Transactions Management)
 * ✅ Using /api/v1/storage endpoints with full CRUD, pagination, search, sort
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faDownload,
  faUpload,
  faSearch,
  faEdit,
  faTrash,
  faEye,
  faChevronLeft,
  faChevronRight,
  faSort,
} from '@fortawesome/free-solid-svg-icons';
import { storageService, StorageTransaction } from '@/services/storageService';
import CreateImportModal from '../components/CreateImportModal';
import CreateExportModal from '../components/CreateExportModal';
import StorageDetailModal from '../components/StorageDetailModal';
import UpdateStorageNotesModal from '../components/UpdateStorageNotesModal';

type TransactionFilter = 'ALL' | 'IMPORT' | 'EXPORT' | 'ADJUSTMENT' | 'LOSS';

export default function StorageInOutPage() {
  // Filter & Pagination state
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<string>('transactionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewingTransactionId, setViewingTransactionId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<StorageTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Dashboard Stats - API V1
  const { data: stats } = useQuery({
    queryKey: ['storageStats'],
    queryFn: () => storageService.getStats(),
  });

  // Fetch transactions with filter
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['transactions', activeFilter, debouncedSearch],
    queryFn: () => storageService.getAll({
      transactionType: activeFilter === 'ALL' ? undefined : activeFilter,
      search: debouncedSearch || undefined,
    }),
  });

  // Client-side pagination and sorting
  const sortedTransactions = [...allTransactions].sort((a, b) => {
    let aValue: any = a[sortField as keyof StorageTransaction];
    let bValue: any = b[sortField as keyof StorageTransaction];
    
    if (sortField === 'transactionDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedTransactions.length / size);
  const paginatedTransactions = sortedTransactions.slice(page * size, (page + 1) * size);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      storageService.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storageTransaction'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => storageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storageStats'] });
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetail = (transactionId: number) => {
    setViewingTransactionId(transactionId);
    setIsViewModalOpen(true);
  };

  const handleEdit = (transaction: StorageTransaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleUpdateNotes = async (notes: string) => {
    if (editingTransaction) {
      await updateMutation.mutateAsync({
        id: editingTransaction.transactionId,
        notes,
      });
    }
  };

  const handleDelete = async (transaction: StorageTransaction) => {
    if (confirm(`Bạn có chắc muốn xóa phiếu ${transaction.transactionCode}?`)) {
      await deleteMutation.mutateAsync(transaction.transactionId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'bg-green-100 text-green-800';
      case 'EXPORT': return 'bg-red-100 text-red-800';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-800';
      case 'LOSS': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'Nhập kho';
      case 'EXPORT': return 'Xuất kho';
      case 'ADJUSTMENT': return 'Điều chỉnh';
      case 'LOSS': return 'Hao hụt';
      default: return type;
    }
  };

  const getFilterStats = () => {
    const importCount = allTransactions.filter(t => t.transactionType === 'IMPORT').length;
    const exportCount = allTransactions.filter(t => t.transactionType === 'EXPORT').length;
    
    return {
      ALL: allTransactions.length,
      IMPORT: importCount,
      EXPORT: exportCount,
      ADJUSTMENT: allTransactions.filter(t => t.transactionType === 'ADJUSTMENT').length,
      LOSS: allTransactions.filter(t => t.transactionType === 'LOSS').length,
    };
  };

  const filterStats = getFilterStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Xuất/Nhập Kho</h1>
        <p className="text-slate-600 mt-1">Quản lý giao dịch nhập/xuất kho & báo cáo</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Phiếu nhập kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filterStats.IMPORT}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Phiếu nhập trong tháng
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Phiếu xuất kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filterStats.EXPORT}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Phiếu xuất trong tháng
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTransactions.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tất cả loại phiếu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo mã phiếu, nhà cung cấp..."
                className="pl-10"
                value={searchKeyword}
                onChange={handleSearchChange}
              />
            </div>
            <Button onClick={() => setIsImportModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
              Nhập kho
            </Button>
            <Button onClick={() => setIsExportModalOpen(true)} variant="destructive">
              <FontAwesomeIcon icon={faUpload} className="h-4 w-4 mr-2" />
              Xuất kho
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {(['ALL', 'IMPORT', 'EXPORT', 'ADJUSTMENT', 'LOSS'] as TransactionFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => {
              setActiveFilter(filter);
              setPage(0);
            }}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeFilter === filter
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter === 'ALL' ? 'Tất cả' : getTypeLabel(filter)} ({filterStats[filter]})
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy giao dịch nào
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('transactionCode')}>
                        <div className="flex items-center gap-2">
                          Mã phiếu
                          <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left p-3">Loại</th>
                      <th className="text-left p-3 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('transactionDate')}>
                        <div className="flex items-center gap-2">
                          Ngày
                          <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left p-3">Nhà cung cấp</th>
                      <th className="text-left p-3">Ghi chú</th>
                      <th className="text-center p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => (
                      <tr key={txn.transactionId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm font-medium">{txn.transactionCode}</td>
                        <td className="p-3">
                          <Badge className={getTypeColor(txn.transactionType)}>
                            {getTypeLabel(txn.transactionType)}
                          </Badge>
                        </td>
                        <td className="p-3">{formatDate(txn.transactionDate)}</td>
                        <td className="p-3">{txn.supplierName || '-'}</td>
                        <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{txn.notes || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(txn.transactionId)}
                              title="Xem chi tiết"
                            >
                              <FontAwesomeIcon icon={faEye} className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(txn)}
                              title="Sửa ghi chú"
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-orange-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(txn)}
                              title="Xóa"
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Hiển thị {page * size + 1} - {Math.min((page + 1) * size, sortedTransactions.length)} trong tổng số {sortedTransactions.length} giao dịch
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                  >
                    Đầu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Trang {page + 1} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Cuối
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => {
          setIsImportModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['storageStats'] });
        }} 
      />
      <CreateExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => {
          setIsExportModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['storageStats'] });
        }} 
      />
      <StorageDetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        transactionId={viewingTransactionId}
      />
      <UpdateStorageNotesModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateNotes}
        transaction={editingTransaction}
      />
    </div>
  );
}
