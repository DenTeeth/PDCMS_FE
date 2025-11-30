'use client';

/**
 * Storage In/Out Page - API V1 (Transactions Management)
 * ✅ Using /api/v1/warehouse/transactions endpoints with full CRUD, pagination, search, sort
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  faChartLine,
  faExclamationTriangle,
  faBoxes,
  faSnowflake,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { storageService, type StorageTransaction, type StorageTransactionListResult } from '@/services/storageService';
import inventoryService, { InventorySummary } from '@/services/inventoryService';
import { supplierService } from '@/services/supplierService';
import type { TransactionType } from '@/types/warehouse';
import categoryService from '@/services/categoryService';
import { usePermission } from '@/hooks/usePermissions';
import ImportTransactionFormNew from '../components/ImportTransactionFormNew';
import ExportTransactionFormNew from '../components/ExportTransactionFormNew';
import StorageDetailModal from '../components/StorageDetailModal';
import UpdateStorageNotesModal from '../components/UpdateStorageNotesModal';
import EditImportModal from '../components/EditImportModal';
import EditExportModal from '../components/EditExportModal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

type TransactionFilter = 'ALL' | 'IMPORT' | 'EXPORT';
type ViewMode = 'transactions' | 'reports';

export default function StorageInOutPage() {
  // RBAC: Check VIEW_COST permission
  const hasViewCost = usePermission('VIEW_COST');
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('transactions');
  
  // Filter & Pagination state
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<string>('transactionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Advanced filters (API 6.6)
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [supplierIdFilter, setSupplierIdFilter] = useState<number | undefined>(undefined);
  const [appointmentIdFilter, setAppointmentIdFilter] = useState<number | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewingTransactionId, setViewingTransactionId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<StorageTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editImportId, setEditImportId] = useState<number | null>(null);
  const [editExportId, setEditExportId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transaction: StorageTransaction | null }>({ isOpen: false, transaction: null });

  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Reset filters when transaction type changes
  useEffect(() => {
    if (activeFilter !== 'IMPORT') {
      setPaymentStatusFilter('');
      setSupplierIdFilter(undefined);
    }
    if (activeFilter !== 'EXPORT') {
      setAppointmentIdFilter(undefined);
    }
  }, [activeFilter]);

  // Dashboard Stats - API V1 (Backend error)
  const { data: stats } = useQuery({
    queryKey: ['storageStats'],
    queryFn: () => storageService.getStats(),
    enabled: false, // Backend returning 500
  });

  // Fetch suppliers for filter dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => supplierService.getAll({ page: 0, size: 100 }),
    enabled: showAdvancedFilters,
  });
  const suppliers = suppliersData?.content || [];

  // Fetch transactions with server-side pagination/filtering (API 6.6)
  const {
    data: transactionResult,
    isLoading,
    error,
  } = useQuery<StorageTransactionListResult>({
    queryKey: [
      'transactions',
      activeFilter,
      page,
      size,
      debouncedSearch,
      sortField,
      sortDirection,
      statusFilter,
      paymentStatusFilter,
      fromDate,
      toDate,
      supplierIdFilter,
      appointmentIdFilter,
    ],
    queryFn: () =>
      storageService.getAll({
        transactionType: activeFilter === 'ALL' ? undefined : (activeFilter as TransactionType),
        page,
        size,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortDirection,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        supplierId: supplierIdFilter,
        appointmentId: appointmentIdFilter,
      }),
  });

  // Reports data (only fetch when viewing reports)
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => inventoryService.getStats(),
    enabled: viewMode === 'reports',
  });

  const { data: allItemsResponse, error: inventorySummaryError } = useQuery({
    queryKey: ['allInventoryItems'],
    queryFn: () => inventoryService.getSummary({ page: 0, size: 1000 }),
    enabled: viewMode === 'reports',
    retry: 1, // Only retry once on failure
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Extract array from response (handle both array and Page response)
  const allItems: InventorySummary[] = inventorySummaryError 
    ? [] // Return empty array if error occurs
    : (Array.isArray(allItemsResponse) 
      ? allItemsResponse 
      : (allItemsResponse as any)?.content || []);

  const { data: categories = [] } = useQuery({
    queryKey: ['allCategories'],
    queryFn: () => categoryService.getAll(),
    enabled: viewMode === 'reports',
  });

  const transactions: StorageTransaction[] = transactionResult?.content ?? [];
  const paginationMeta = transactionResult?.meta;
  const transactionStats = transactionResult?.stats;
  const totalPages = paginationMeta?.totalPages ?? 0;
  const totalElements = paginationMeta?.totalElements ?? transactions.length;
  const pageStart = totalElements === 0 ? 0 : page * size + 1;
  const pageEnd = totalElements === 0 ? 0 : Math.min((page + 1) * size, totalElements);

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
    setPage(0);
  };

  const handleViewDetail = (transactionId: number) => {
    setViewingTransactionId(transactionId);
    setIsViewModalOpen(true);
  };

  const handleEdit = (transaction: StorageTransaction) => {
    if (transaction.transactionType === 'IMPORT') {
      setEditImportId(transaction.transactionId);
    } else if (transaction.transactionType === 'EXPORT') {
      setEditExportId(transaction.transactionId);
    } else {
      // For ADJUSTMENT/LOSS: fallback to edit notes only
      setEditingTransaction(transaction);
      setIsEditModalOpen(true);
    }
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
    setDeleteConfirm({ isOpen: true, transaction });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.transaction) {
      await deleteMutation.mutateAsync(deleteConfirm.transaction.transactionId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'bg-green-100 text-green-800';
      case 'EXPORT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IMPORT': return 'Nhập kho';
      case 'EXPORT': return 'Xuất kho';
      default: return type;
    }
  };

  const { data: importCount = 0 } = useQuery<StorageTransactionListResult, Error, number>({
    queryKey: ['transactionCount', 'IMPORT'],
    queryFn: () => storageService.getAll({ transactionType: 'IMPORT' as TransactionType, page: 0, size: 1 }),
    select: (result) => result.meta.totalElements,
    enabled: viewMode === 'transactions',
  });

  const { data: exportCount = 0 } = useQuery<StorageTransactionListResult, Error, number>({
    queryKey: ['transactionCount', 'EXPORT'],
    queryFn: () => storageService.getAll({ transactionType: 'EXPORT' as TransactionType, page: 0, size: 1 }),
    select: (result) => result.meta.totalElements,
    enabled: viewMode === 'transactions',
  });

  const { data: totalCount = 0 } = useQuery<StorageTransactionListResult, Error, number>({
    queryKey: ['transactionCount', 'ALL'],
    queryFn: () => storageService.getAll({ page: 0, size: 1 }),
    select: (result) => result.meta.totalElements,
    enabled: viewMode === 'transactions',
  });

  const filterStats = {
    ALL: totalCount,
    IMPORT: importCount,
    EXPORT: exportCount,
  };

  // Reports calculations
  const lowStockItems = allItems
    .filter(item => item.stockStatus === 'LOW_STOCK')
    .sort((a, b) => (a.totalQuantity || 0) - (b.totalQuantity || 0))
    .slice(0, 10);

  const expiringSoonItems = allItems
    .filter(item => {
      if (item.warehouseType !== 'COLD' || !item.nearestExpiryDate) return false;
      const daysUntilExpiry = Math.floor(
        (new Date(item.nearestExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
    })
    .sort((a, b) => {
      const daysA = Math.floor((new Date(a.nearestExpiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const daysB = Math.floor((new Date(b.nearestExpiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysA - daysB;
    })
    .slice(0, 10);

  const inventoryByCategory = categories.map(cat => {
    const categoryName = cat.categoryName ?? cat.name ?? '';
    const categoryItems = allItems.filter(item => item.categoryName === categoryName);
    const totalQty = categoryItems.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
    return {
      categoryName: categoryName,
      warehouseType: cat.warehouseType,
      itemCount: categoryItems.length,
      totalQuantity: totalQty,
    };
  }).filter(cat => cat.itemCount > 0);

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStockBadge = (status: string) => {
    const config = {
      LOW_STOCK: { variant: 'destructive' as const, label: 'Sắp hết' },
      OUT_OF_STOCK: { variant: 'secondary' as const, label: 'Hết hàng' },
      NORMAL: { variant: 'default' as const, label: 'Bình thường' },
      OVERSTOCK: { variant: 'outline' as const, label: 'Dư thừa' },
    };
    const cfg = config[status as keyof typeof config] || config.NORMAL;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Xuất/Nhập Kho</h1>
          <p className="text-slate-600 mt-1">Quản lý giao dịch nhập/xuất kho & báo cáo</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'transactions' ? 'default' : 'outline'}
            onClick={() => setViewMode('transactions')}
            className="gap-2"
          >
            <FontAwesomeIcon icon={faBoxes} />
            Giao dịch
          </Button>
          <Button
            variant={viewMode === 'reports' ? 'default' : 'outline'}
            onClick={() => setViewMode('reports')}
            className="gap-2"
          >
            <FontAwesomeIcon icon={faChartLine} />
            Báo cáo
          </Button>
        </div>
      </div>

      {/* Backend Error Warning */}
      {error && viewMode === 'transactions' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-red-600">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-900">Lỗi kết nối Backend</p>
                <p className="text-xs text-red-700">Server trả về lỗi 500. Vui lòng liên hệ Backend để kiểm tra API /api/v1/warehouse/transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'transactions' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
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
                  {filterStats.ALL}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tất cả loại phiếu
                </p>
              </CardContent>
            </Card>
            
            {/* API 6.6 Statistics */}
            {transactionStats && (
              <>
                {transactionStats.pendingApprovalCount !== undefined && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-orange-700">
                        Chờ duyệt
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {transactionStats.pendingApprovalCount}
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        Phiếu đang chờ
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {hasViewCost && transactionStats.totalImportValue !== undefined && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">
                        Tổng giá trị nhập
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {transactionStats.totalImportValue?.toLocaleString('vi-VN')} ₫
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {transactionStats.periodStart && transactionStats.periodEnd
                          ? `${new Date(transactionStats.periodStart).toLocaleDateString('vi-VN')} - ${new Date(transactionStats.periodEnd).toLocaleDateString('vi-VN')}`
                          : 'Trong kỳ'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

      {/* Search Bar & Advanced Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <FontAwesomeIcon icon={faLayerGroup} className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'}
              </Button>
              <Button onClick={() => setIsImportModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
                Nhập kho
              </Button>
              <Button onClick={() => setIsExportModalOpen(true)} variant="destructive">
                <FontAwesomeIcon icon={faUpload} className="h-4 w-4 mr-2" />
                Xuất kho
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Trạng thái duyệt</label>
                    <Select value={statusFilter || 'ALL'} onValueChange={(value) => { setStatusFilter(value === 'ALL' ? '' : value); setPage(0); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        <SelectItem value="DRAFT">Nháp</SelectItem>
                        <SelectItem value="PENDING_APPROVAL">Chờ duyệt</SelectItem>
                        <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                        <SelectItem value="REJECTED">Từ chối</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Status Filter (only for IMPORT) */}
                  {activeFilter === 'IMPORT' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Trạng thái thanh toán</label>
                      <Select value={paymentStatusFilter || 'ALL'} onValueChange={(value) => { setPaymentStatusFilter(value === 'ALL' ? '' : value); setPage(0); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tất cả" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Tất cả</SelectItem>
                          <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
                          <SelectItem value="PARTIAL">Thanh toán một phần</SelectItem>
                          <SelectItem value="PAID">Đã thanh toán</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* From Date */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Từ ngày</label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Đến ngày</label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Supplier Filter (only for IMPORT) */}
                  {activeFilter === 'IMPORT' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Nhà cung cấp</label>
                      <Select
                        value={supplierIdFilter?.toString() || 'ALL'}
                        onValueChange={(value) => {
                          setSupplierIdFilter(value === 'ALL' ? undefined : Number(value));
                          setPage(0);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tất cả nhà cung cấp" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Tất cả nhà cung cấp</SelectItem>
                          {suppliers.map((supplier: any) => (
                            <SelectItem key={supplier.supplierId} value={supplier.supplierId.toString()}>
                              {supplier.supplierName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Appointment Filter (only for EXPORT) */}
                  {activeFilter === 'EXPORT' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Ca điều trị (ID)</label>
                      <Input
                        type="number"
                        placeholder="Nhập ID ca điều trị"
                        value={appointmentIdFilter || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAppointmentIdFilter(value ? Number(value) : undefined);
                          setPage(0);
                        }}
                      />
                    </div>
                  )}

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter('');
                        setPaymentStatusFilter('');
                        setFromDate('');
                        setToDate('');
                        setSupplierIdFilter(undefined);
                        setAppointmentIdFilter(undefined);
                        setPage(0);
                      }}
                      className="w-full"
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {(['ALL', 'IMPORT', 'EXPORT'] as TransactionFilter[]).map((filter) => (
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
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={faUpload}
              title={debouncedSearch ? "Không tìm thấy giao dịch" : "Chưa có giao dịch nào"}
              description={debouncedSearch ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc" : "Tạo phiếu nhập hoặc xuất kho đầu tiên"}
              actionLabel={!debouncedSearch ? "Tạo phiếu nhập" : undefined}
              onAction={!debouncedSearch ? () => setIsImportModalOpen(true) : undefined}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('transactionCode')}>
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          Mã phiếu
                          <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">Loại</th>
                      <th className="text-left p-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('transactionDate')}>
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          Ngày
                          <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">Trạng thái</th>
                      <th className="text-left p-3 font-semibold text-sm">Nhà cung cấp</th>
                      {hasViewCost && (
                        <th className="text-right p-3 font-semibold text-sm">Giá trị</th>
                      )}
                      {activeFilter === 'IMPORT' && (
                        <th className="text-left p-3 font-semibold text-sm">Thanh toán</th>
                      )}
                      <th className="text-left p-3 font-semibold text-sm">Ghi chú</th>
                      <th className="text-center p-3 font-semibold text-sm w-36">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => {
                      const getStatusBadge = (status?: string) => {
                        if (!status) return null;
                        const config: Record<string, { variant?: any; className?: string; label: string }> = {
                          DRAFT: { variant: 'outline', label: 'Nháp' },
                          PENDING_APPROVAL: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Chờ duyệt' },
                          APPROVED: { variant: 'default', label: 'Đã duyệt' },
                          REJECTED: { variant: 'destructive', label: 'Từ chối' },
                          CANCELLED: { variant: 'secondary', label: 'Đã hủy' },
                        };
                        const cfg = config[status] || { variant: 'outline', label: status };
                        if (cfg.className) {
                          return <Badge className={cfg.className}>{cfg.label}</Badge>;
                        }
                        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
                      };

                      const getPaymentStatusBadge = (paymentStatus?: string) => {
                        if (!paymentStatus) return <span className="text-gray-400">-</span>;
                        const config: Record<string, { className: string; label: string }> = {
                          UNPAID: { className: 'text-red-600', label: 'Chưa thanh toán' },
                          PARTIAL: { className: 'text-orange-600', label: 'Thanh toán một phần' },
                          PAID: { className: 'text-green-600', label: 'Đã thanh toán' },
                        };
                        const cfg = config[paymentStatus] || { className: 'text-gray-600', label: paymentStatus };
                        return <span className={cfg.className}>{cfg.label}</span>;
                      };

                      return (
                        <tr key={txn.transactionId} className="border-b hover:bg-gray-50 transition">
                          <td className="p-3 font-mono text-sm font-medium">{txn.transactionCode}</td>
                          <td className="p-3">
                            <Badge className={getTypeColor(txn.transactionType)}>
                              {getTypeLabel(txn.transactionType)}
                            </Badge>
                          </td>
                          <td className="p-3">{formatDate(txn.transactionDate)}</td>
                          <td className="p-3">
                            {getStatusBadge(txn.status)}
                          </td>
                          <td className="p-3">{txn.supplierName || '-'}</td>
                          {hasViewCost && (
                            <td className="p-3 text-right text-sm font-medium">
                              {txn.totalValue !== null && txn.totalValue !== undefined
                                ? `${txn.totalValue.toLocaleString('vi-VN')} ₫`
                                : <span className="text-gray-400">-</span>}
                            </td>
                          )}
                          {activeFilter === 'IMPORT' && (
                            <td className="p-3 text-sm">
                              {getPaymentStatusBadge(txn.paymentStatus)}
                              {hasViewCost && txn.paymentStatus === 'PARTIAL' && txn.remainingDebt !== null && txn.remainingDebt !== undefined && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Còn nợ: {txn.remainingDebt.toLocaleString('vi-VN')} ₫
                                </div>
                              )}
                            </td>
                          )}
                          <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{txn.notes || '-'}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetail(txn.transactionId)}
                                title="Xem chi tiết"
                                className="h-8 w-8 p-0"
                              >
                                <FontAwesomeIcon icon={faEye} className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(txn)}
                                title="Sửa ghi chú"
                                className="h-8 w-8 p-0"
                              >
                                <FontAwesomeIcon icon={faEdit} className="h-4 w-4 text-orange-600" />
                              </Button>
                              {/* 
                                ⚠️ DELETE DISABLED: BE chưa implement DELETE endpoint trong API 6.6/6.7
                                TransactionHistoryController chỉ có GET endpoints.
                                Nếu cần xóa, có thể set status = CANCELLED thay vì delete.
                              */}
                              {/* <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(txn)}
                                title="Xóa (chưa khả dụng - BE chưa implement)"
                                className="h-8 w-8 p-0"
                                disabled
                              >
                                <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-gray-400" />
                              </Button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Hiển thị {pageStart} - {pageEnd} trong tổng số {totalElements} giao dịch
                  {debouncedSearch && (
                    <span className="text-muted-foreground ml-2">
                      (đã lọc theo: "{debouncedSearch}")
                    </span>
                  )}
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
        </>
      ) : (
        /* ========== REPORTS VIEW ========== */
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBoxes} className="w-4 h-4" />
                  Tổng vật tư
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allItems.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-red-600" />
                  Sắp hết
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{inventoryStats?.lowStockCount || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FontAwesomeIcon icon={faSnowflake} className="w-4 h-4 text-orange-600" />
                  Sắp hết hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{inventoryStats?.expiringWithin30Days || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4" />
                  Danh mục
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600" />
                Top 10 Vật tư sắp hết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">STT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Mã VT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tên VT</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Tồn kho</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Min/Max</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lowStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Không có vật tư sắp hết
                        </td>
                      </tr>
                    ) : (
                      lowStockItems.map((item, idx) => (
                        <tr key={item.itemMasterId} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-sm">{item.itemCode}</td>
                          <td className="px-4 py-3 font-medium">{item.itemName}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{item.totalQuantity || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.minStockLevel} / {item.maxStockLevel}
                          </td>
                          <td className="px-4 py-3">{getStockBadge(item.stockStatus || 'NORMAL')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faSnowflake} className="w-5 h-5 text-orange-600" />
                Top 10 Vật tư sắp hết hạn (Kho lạnh)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">STT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Mã VT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tên VT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Hạn sử dụng</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expiringSoonItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Không có vật tư sắp hết hạn
                        </td>
                      </tr>
                    ) : (
                      expiringSoonItems.map((item, idx) => {
                        const daysLeft = getDaysUntilExpiry(item.nearestExpiryDate!);
                        return (
                          <tr key={item.itemMasterId} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3 font-mono text-sm">{item.itemCode}</td>
                            <td className="px-4 py-3 font-medium">{item.itemName}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(item.nearestExpiryDate!).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={daysLeft <= 30 ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {daysLeft} ngày
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Inventory by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5" />
                Tồn kho theo Danh mục
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">STT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Danh mục</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Loại kho</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Số loại VT</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Tổng số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventoryByCategory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Chưa có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      inventoryByCategory.map((cat, idx) => (
                        <tr key={cat.categoryName} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{cat.categoryName}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">
                              {cat.warehouseType === 'COLD' ? (
                                <>
                                  <FontAwesomeIcon icon={faSnowflake} className="w-3 h-3 mr-1" />
                                  Kho lạnh
                                </>
                              ) : (
                                'Kho thường'
                              )}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">{cat.itemCount}</td>
                          <td className="px-4 py-3 text-right font-bold">{cat.totalQuantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals - Only for transactions view */}
      {viewMode === 'transactions' && (
        <>
          <ImportTransactionFormNew 
            isOpen={isImportModalOpen} 
            onClose={() => {
              setIsImportModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['storageStats'] });
            }} 
          />
          <ExportTransactionFormNew 
            isOpen={isExportModalOpen} 
            onClose={() => {
              setIsExportModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['storageStats'] });
            }}
            warehouseType="NORMAL"
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
      <EditImportModal
        isOpen={!!editImportId}
        onClose={() => setEditImportId(null)}
        transactionId={editImportId}
      />
      <EditExportModal
        isOpen={!!editExportId}
        onClose={() => setEditExportId(null)}
        transactionId={editExportId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, transaction: null })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa phiếu"
        description={`Bạn có chắc chắc muốn xóa phiếu ${deleteConfirm.transaction?.transactionCode}? Hành động này không thể khôi phục.`}
        confirmLabel="Xóa"
        variant="destructive"
      />
        </>
      )}
    </div>
  );
}
