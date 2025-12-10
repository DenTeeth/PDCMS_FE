'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Alert component - using inline alert instead
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';
import {
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faEye,
  faUsers,
  faChevronLeft,
  faChevronRight,
  faSort,
  faExclamationTriangle,
  faBan,
  faShoppingCart,
  faCalendarAlt,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import {
  useSuppliersWithMetrics,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/hooks/useSuppliers';
import {
  SupplierListDTO,
  SupplierSummaryResponse,
  SupplierDetailResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from '@/types/supplier';
import { formatDate, getStatusColor, getStatusLabel } from '@/utils/formatters';
import SupplierFormModal from '../components/SupplierFormModal';
import SupplierDetailModal from '../components/SupplierDetailModal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { supplierService } from '@/services/supplierService';

export default function SuppliersPage() {
  // Pagination & Search state
  const [page, setPage] = useState(0);
  const [size] = useState(20); // Default 20 for API 6.13
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'supplierName' | 'totalOrders' | 'lastOrderDate' | 'createdAt'>('supplierName');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  
  // Advanced filters (API 6.13)
  const [isBlacklistedFilter, setIsBlacklistedFilter] = useState<boolean | null>(null);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDetailResponse | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierSummaryResponse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; supplierId: number | null; supplierName: string }>({ isOpen: false, supplierId: null, supplierName: '' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchKeyword);
      setPage(0); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Fetch suppliers using API 6.13 (with business metrics)
  const { data: suppliersPage, isLoading } = useSuppliersWithMetrics({
    page,
    size,
    search: debouncedSearch || undefined,
    isBlacklisted: isBlacklistedFilter ?? undefined,
    isActive: isActiveFilter ?? undefined,
    sortBy,
    sortDir,
  });

  const suppliers: SupplierListDTO[] = suppliersPage?.suppliers || [];
  const totalPages = suppliersPage?.totalPages || 0;
  const totalElements = suppliersPage?.totalElements || 0;

  // Mutations
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const handleOpenFormModal = (supplier?: SupplierListDTO | SupplierSummaryResponse) => {
    if (supplier) {
      // Convert to detail format for editing
      const detailData: SupplierDetailResponse = {
        supplierId: supplier.supplierId,
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        phoneNumber: (supplier as any).phoneNumber || '',
        email: supplier.email || '',
        address: (supplier as any).address || '',
        notes: (supplier as any).notes || '',
        contactPerson: (supplier as any).contactPerson || '',
        isActive: (supplier as any).isActive ?? (supplier as any).status === 'ACTIVE',
        createdAt: (supplier as any).createdAt || '',
        suppliedItems: [],
      };
      setEditingSupplier(detailData);
    } else {
      setEditingSupplier(null);
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(false);
  };

  const handleSaveSupplier = async (data: CreateSupplierRequest | UpdateSupplierRequest) => {
    if (editingSupplier) {
      updateMutation.mutate(
        { id: editingSupplier.supplierId, data: data as UpdateSupplierRequest },
        { onSuccess: () => handleCloseFormModal() }
      );
    } else {
      createMutation.mutate(
        data as CreateSupplierRequest,
        { onSuccess: () => handleCloseFormModal() }
      );
    }
  };

  const handleDelete = async (supplierId: number, supplierName: string) => {
    setDeleteConfirm({ isOpen: true, supplierId, supplierName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.supplierId) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.supplierId);
      // Trigger re-fetch by resetting page
      setPage(0);
      setDeleteConfirm({ isOpen: false, supplierId: null, supplierName: '' });
    } catch (error: any) {
      // Error handling is done in useDeleteSupplier hook
      console.error('Error deleting supplier:', error);
    }
  };

  const handleViewDetail = async (supplier: SupplierListDTO | SupplierSummaryResponse) => {
    // Convert SupplierListDTO to SupplierSummaryResponse format for modal
    const summarySupplier: SupplierSummaryResponse = {
      supplierId: supplier.supplierId,
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      phoneNumber: (supplier as any).phoneNumber || '',
      email: supplier.email || '',
      status: (supplier as any).isActive ? 'ACTIVE' : 'INACTIVE',
    };
    setViewingSupplier(summarySupplier);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewingSupplier(null);
    setIsViewModalOpen(false);
  };

  // Helper: Check if supplier is inactive (> 6 months)
  const isSupplierInactive = (supplier: SupplierListDTO): boolean => {
    if (!supplier.lastOrderDate) return true; // Never ordered = inactive
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const lastOrder = new Date(supplier.lastOrderDate);
    return lastOrder < sixMonthsAgo;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const getStatusBadge = (isActive: boolean, isBlacklisted: boolean) => {
    // If blacklisted, show BLACKLIST badge only
    if (isBlacklisted) {
      return (
        <Badge variant="destructive" className="text-xs">
          <FontAwesomeIcon icon={faBan} className="w-3 h-3 mr-1" />
          Danh sách đen
        </Badge>
      );
    }
    // Otherwise show active/inactive status
    const status = isActive ? 'ACTIVE' : 'INACTIVE';
    return (
      <Badge className={getStatusColor(status)}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const handleSort = (field: 'supplierName' | 'totalOrders' | 'lastOrderDate' | 'createdAt') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDir('ASC');
    }
  };

  const activeCount = suppliers.filter((s) => s.isActive).length;
  const inactiveCount = suppliers.filter((s) => !s.isActive).length;
  const blacklistedCount = suppliers.filter((s) => s.isBlacklisted).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Nhà cung cấp</h1>
          <p className="text-slate-600 mt-1">Quản lý danh sách nhà cung cấp vật tư</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
          Thêm nhà cung cấp
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng số NCC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalElements}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ngưng hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {inactiveCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Danh sách đen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {blacklistedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, mã, SĐT, email..."
              className="pl-10"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          
          {/* Advanced Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Lọc:</span>
            </div>
            
            <Select
              value={isBlacklistedFilter === null ? 'all' : isBlacklistedFilter ? 'true' : 'false'}
              onValueChange={(value) => {
                setIsBlacklistedFilter(value === 'all' ? null : value === 'true');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái blacklist" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="false">Không blacklist</SelectItem>
                <SelectItem value="true">Blacklist</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={isActiveFilter === null ? 'all' : isActiveFilter ? 'true' : 'false'}
              onValueChange={(value) => {
                setIsActiveFilter(value === 'all' ? null : value === 'true');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái hoạt động" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={faUsers}
              title={debouncedSearch ? "Không tìm thấy nhà cung cấp" : "Chưa có nhà cung cấp"}
              description={debouncedSearch ? "Thử thay đổi từ khóa tìm kiếm" : "Thêm nhà cung cấp đầu tiên"}
              actionLabel={!debouncedSearch ? "Thêm nhà cung cấp" : undefined}
              onAction={!debouncedSearch ? () => handleOpenFormModal() : undefined}
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th
                        className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('supplierName')}
                      >
                        <div className="flex items-center gap-2">
                          Tên nhà cung cấp
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`h-3 w-3 text-gray-400 ${sortBy === 'supplierName' ? 'text-gray-700' : ''}`} 
                          />
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">Mã NCC</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Điện thoại</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                      <th
                        className="text-right p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('totalOrders')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <FontAwesomeIcon icon={faShoppingCart} className="h-3 w-3 text-gray-500" />
                          Tổng đơn
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`h-3 w-3 text-gray-400 ${sortBy === 'totalOrders' ? 'text-gray-700' : ''}`} 
                          />
                        </div>
                      </th>
                      <th
                        className="text-center p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('lastOrderDate')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="h-3 w-3 text-gray-500" />
                          Đơn gần nhất
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`h-3 w-3 text-gray-400 ${sortBy === 'lastOrderDate' ? 'text-gray-700' : ''}`} 
                          />
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">Trạng thái</th>
                      <th className="text-right p-4 font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suppliers.map((supplier) => {
                      return (
                        <tr 
                          key={supplier.supplierId} 
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4">
                            <span 
                              className="font-medium text-gray-900 block truncate max-w-[300px]" 
                              title={supplier.supplierName}
                            >
                              {supplier.supplierName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              {supplier.supplierCode}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700">{supplier.phoneNumber || <span className="text-gray-400">-</span>}</td>
                          <td className="p-4 text-sm text-gray-700">{supplier.email || <span className="text-gray-400">-</span>}</td>
                          <td className="p-4 text-right">
                            <span className="font-semibold text-gray-900">{supplier.totalOrders || 0}</span>
                          </td>
                          <td className="p-4 text-center text-sm">
                            {supplier.lastOrderDate ? (
                              <span className="text-gray-700">{formatDate(supplier.lastOrderDate)}</span>
                            ) : (
                              <span className="text-gray-400 italic">Chưa có</span>
                            )}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(supplier.isActive, supplier.isBlacklisted ?? false)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => handleViewDetail(supplier)}
                                title="Xem chi tiết"
                              >
                                <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                onClick={() => handleOpenFormModal(supplier)}
                                title="Chỉnh sửa"
                              >
                                <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleDelete(supplier.supplierId, supplier.supplierName)}
                                title="Xóa"
                              >
                                <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                              </Button>
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
                  Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} của {totalElements} nhà cung cấp
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(0)}
                    disabled={page === 0}
                  >
                    Đầu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                  </Button>
                  <span className="text-sm px-3">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages - 1)}
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
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveSupplier}
        supplier={editingSupplier}
      />

      <SupplierDetailModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        supplier={viewingSupplier}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, supplierId: null, supplierName: '' })}
        onConfirm={confirmDelete}
        title="Xác nhận xóa nhà cung cấp"
        description={`Bạn có chắc chắc muốn xóa nhà cung cấp "${deleteConfirm.supplierName}"? 

 Lưu ý: Không thể xóa nhà cung cấp đã có lịch sử giao dịch. Nếu nhà cung cấp này đã có đơn hàng, hệ thống sẽ từ chối và đề xuất vô hiệu hóa (isActive=false) thay vì xóa.`}
        confirmLabel="Xóa"
        variant="destructive"
      />
    </div>
  );
}
