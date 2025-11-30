'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@fortawesome/free-solid-svg-icons';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/hooks/useSuppliers';
import {
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
  const [size] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<string>('supplierName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
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

  // Fetch suppliers using API V1
  const { data: suppliersPage, isLoading } = useSuppliers({
    page,
    size,
    search: debouncedSearch || undefined,
    sort: `${sortField},${sortDirection}`,
  });

  const suppliers = suppliersPage?.content || [];
  const totalPages = suppliersPage?.totalPages || 0;
  const totalElements = suppliersPage?.totalElements || 0;

  // Mutations
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const handleOpenFormModal = (supplier?: SupplierSummaryResponse) => {
    if (supplier) {
      // Convert summary to detail format for editing
      const detailData: SupplierDetailResponse = {
        supplierId: supplier.supplierId,
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        phoneNumber: supplier.phoneNumber,
        email: supplier.email,
        address: '',
        notes: '',
        contactPerson: '',
        isActive: supplier.status === 'ACTIVE',
        createdAt: '',
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
        { id: editingSupplier.supplierId, data },
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
      await supplierService.delete(deleteConfirm.supplierId);
      toast.success('Đã xóa nhà cung cấp thành công');
      // Trigger re-fetch by resetting page
      setPage(0);
      setDeleteConfirm({ isOpen: false, supplierId: null, supplierName: '' });
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa nhà cung cấp');
    }
  };

  const handleViewDetail = async (supplier: SupplierSummaryResponse) => {
    setViewingSupplier(supplier);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewingSupplier(null);
    setIsViewModalOpen(false);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => {
    return (
      <Badge className={getStatusColor(status)}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const activeCount = suppliers.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = suppliers.filter((s) => s.status === 'INACTIVE').length;

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
      <div className="grid grid-cols-3 gap-4">
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
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT, email, địa chỉ..."
              className="pl-10"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th
                        className="text-left p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('supplierCode')}
                      >
                        <div className="flex items-center gap-2">
                          Mã NCC
                          <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                        </div>
                      </th>
                      <th
                        className="text-left p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('supplierName')}
                      >
                        <div className="flex items-center gap-2">
                          Tên nhà cung cấp
                          <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="text-left p-3">Điện thoại</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Trạng thái</th>
                      <th className="text-right p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.supplierId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className="font-mono text-sm">{supplier.supplierCode}</span>
                        </td>
                        <td className="p-3 font-medium">{supplier.supplierName}</td>
                        <td className="p-3">{supplier.phoneNumber || '-'}</td>
                        <td className="p-3 text-sm">{supplier.email || '-'}</td>
                        <td className="p-3">{getStatusBadge(supplier.status)}</td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(supplier)}
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFormModal(supplier)}
                          >
                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier.supplierId, supplier.supplierName)}
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
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
        description={`Bạn có chắc chắc muốn xóa nhà cung cấp "${deleteConfirm.supplierName}"? Xóa NCC sẽ ảnh hưởng đến lịch sử nhập hàng.`}
        confirmLabel="Xóa"
        variant="destructive"
      />
    </div>
  );
}
