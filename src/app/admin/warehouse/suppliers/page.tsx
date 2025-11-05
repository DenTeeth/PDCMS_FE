'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faEye,
  faUsers,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { warehouseService } from '@/services/warehouseService';
import { Supplier, SupplierStatus, PageResponse } from '@/types/warehouse';
import SupplierFormModal from '../components/SupplierFormModal';
import SupplierDetailModal from '../components/SupplierDetailModal';

export default function SuppliersPage() {
  const [pageData, setPageData] = useState<PageResponse<Supplier> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For input debounce
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10; // Fixed 10 items per page

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchInput);
      setCurrentPage(0); // Reset to page 0 when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch suppliers (client-side search filter)
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // Always get all suppliers (BE auto sorts newest first)
      const allData = await warehouseService.getSuppliers({
        page: 0,
        size: 1000, // Get enough for client filtering
      });
      
      let filtered = allData.content;
      
      // Apply search filter (client-side)
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase().trim();
        filtered = allData.content.filter((supplier) =>
          supplier.supplierName?.toLowerCase().includes(keyword) ||
          supplier.phoneNumber?.includes(keyword) ||
          supplier.email?.toLowerCase().includes(keyword) ||
          supplier.address?.toLowerCase().includes(keyword)
        );
      }
      
      // Manual pagination
      const start = currentPage * pageSize;
      const end = start + pageSize;
      const data: PageResponse<Supplier> = {
        content: filtered.slice(start, end),
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        size: pageSize,
        number: currentPage,
        numberOfElements: filtered.slice(start, end).length,
        first: currentPage === 0,
        last: currentPage >= Math.ceil(filtered.length / pageSize) - 1,
        empty: filtered.length === 0,
      };
      
      console.log('Suppliers data received:', data);
      setPageData(data);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách nhà cung cấp');
      setPageData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchKeyword]);

  // Handle create/edit
  const handleOpenFormModal = (supplier?: Supplier) => {
    setEditingSupplier(supplier || null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(false);
  };

  const handleSaveSupplier = async (data: any) => {
    try {
      if (editingSupplier) {
        await warehouseService.updateSupplier(editingSupplier.supplierId, data);
        toast.success('Cập nhật nhà cung cấp thành công');
      } else {
        await warehouseService.createSupplier(data);
        toast.success('Tạo nhà cung cấp thành công');
      }
      handleCloseFormModal();
      
      // Reset to page 0 to see the new/updated item at top (newest first)
      setCurrentPage(0);
      await fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle specific error codes
      let errorMessage = 'Không thể lưu nhà cung cấp';
      
      if (error.response?.status === 409) {
        const responseMessage = error.response?.data?.message || error.response?.data?.error || '';
        if (responseMessage.toLowerCase().includes('phone')) {
          errorMessage = 'Số điện thoại đã tồn tại trong hệ thống';
        } else if (responseMessage.toLowerCase().includes('certification')) {
          errorMessage = 'Số giấy phép đã tồn tại trong hệ thống';
        } else if (responseMessage.toLowerCase().includes('email')) {
          errorMessage = 'Email đã tồn tại trong hệ thống';
        } else {
          errorMessage = responseMessage || 'Thông tin nhà cung cấp đã tồn tại';
        }
      } else {
        errorMessage = error.response?.data?.message || error.response?.data?.error || errorMessage;
      }
      
      toast.error(errorMessage);
      throw error; // Re-throw để modal không đóng khi lỗi
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) return;

    try {
      await warehouseService.deleteSupplier(id);
      toast.success('Xóa nhà cung cấp thành công');
      await fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Không thể xóa nhà cung cấp');
    }
  };

  // Handle view detail
  const handleViewDetail = async (id: number) => {
    try {
      const data = await warehouseService.getSupplierById(id);
      if (data) {
        setViewingSupplier(data);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching supplier detail:', error);
      toast.error('Không thể tải thông tin nhà cung cấp');
    }
  };

  const handleCloseViewModal = () => {
    setViewingSupplier(null);
    setIsViewModalOpen(false);
  };

  // Helper: status badge
  const getStatusBadge = (status: SupplierStatus) => {
    const variants = {
      [SupplierStatus.ACTIVE]: { variant: 'default' as const, label: 'Hoạt động' },
      [SupplierStatus.INACTIVE]: { variant: 'secondary' as const, label: 'Ngưng' },
      [SupplierStatus.SUSPENDED]: { variant: 'destructive' as const, label: 'Tạm ngừng' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nhà Cung Cấp</h1>
          <p className="text-muted-foreground mt-1">Quản lý thông tin nhà cung cấp vật tư y tế</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Thêm Nhà Cung Cấp
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tổng Nhà Cung Cấp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-2xl" />
            <span className="text-3xl font-bold">{pageData?.totalElements || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Tìm theo tên, SĐT, email, địa chỉ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
          {searchKeyword && (
            <p className="text-sm text-muted-foreground mt-2">
              Đang tìm: <span className="font-medium">{searchKeyword}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      ) : !pageData || pageData.empty ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {searchKeyword ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Tên NCC</th>
                    <th className="text-left p-4 font-medium">Liên hệ</th>
                    <th className="text-left p-4 font-medium">Địa chỉ</th>
                    <th className="text-left p-4 font-medium">Trạng thái</th>
                    <th className="text-right p-4 font-medium">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.content.map((supplier) => (
                    <tr key={supplier.supplierId} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{supplier.supplierName || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <FontAwesomeIcon icon={faPhone} className="text-muted-foreground" />
                            {supplier.phoneNumber || 'N/A'}
                          </div>
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <FontAwesomeIcon icon={faEnvelope} className="text-muted-foreground" />
                              {supplier.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <span>{supplier.address || 'Chưa có địa chỉ'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(supplier.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(supplier.supplierId)}
                            title="Xem chi tiết"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFormModal(supplier)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.supplierId)}>
                            <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pageData && !pageData.empty && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị {pageData.numberOfElements} / {pageData.totalElements} nhà cung cấp
                {searchKeyword && ` - Tìm kiếm: "${searchKeyword}"`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={pageData.first || loading}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                  Trước
                </Button>
                <span className="text-sm px-3">
                  Trang {pageData.number + 1} / {pageData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={pageData.last || loading}
                >
                  Sau
                  <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveSupplier}
        supplier={editingSupplier}
      />

      {/* View Detail Modal */}
      <SupplierDetailModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        supplier={viewingSupplier}
      />
    </div>
  );
}
