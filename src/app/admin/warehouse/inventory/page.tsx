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
  faBoxes,
  faWarehouse,
  faExclamationTriangle,
  faClock,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { warehouseService } from '@/services/warehouseService';
import { Inventory, WarehouseType, InventoryStatus, PageResponse } from '@/types/warehouse';
import InventoryFormModal from '../components/InventoryFormModal';
import InventoryDetailModal from '../components/InventoryDetailModal';

export default function InventoryPage() {
  const [pageData, setPageData] = useState<PageResponse<Inventory> | null>(null);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseType, setSelectedWarehouseType] = useState<WarehouseType | 'ALL'>('ALL');
  
  // Quick filters
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [sortBy] = useState<'itemName' | 'unitPrice' | 'stockQuantity' | 'createdAt' | 'updatedAt'>('itemName');
  const [sortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [viewingInventory, setViewingInventory] = useState<Inventory | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch inventory
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getInventory({
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDirection,
        warehouseType: selectedWarehouseType === 'ALL' ? undefined : selectedWarehouseType,
      });
      console.log('Inventory data received:', data);
      setPageData(data);
      setFilteredInventory(data?.content || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách vật tư');
      setPageData(null);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentPage, pageSize, sortBy, sortDirection, selectedWarehouseType]);

  // Search filter (client-side for current page)
  useEffect(() => {
    if (pageData) {
      let filtered = pageData.content;

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(
          (item) =>
            item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply quick filters
      if (showLowStock) {
        filtered = filtered.filter((item) => isLowStock(item));
      }

      if (showExpiringSoon) {
        filtered = filtered.filter((item) => isExpiringSoon(item.expiryDate));
      }

      setFilteredInventory(filtered);
    }
  }, [searchTerm, pageData, showLowStock, showExpiringSoon]);

  // Handle create/edit
  const handleOpenFormModal = (inventory?: Inventory) => {
    setEditingInventory(inventory || null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setEditingInventory(null);
    setIsFormModalOpen(false);
  };

  const handleSaveInventory = async (data: any) => {
    try {
      if (editingInventory) {
        await warehouseService.updateInventory(editingInventory.inventoryId, data);
        toast.success('Cập nhật vật tư thành công');
      } else {
        await warehouseService.createInventory(data);
        toast.success('Tạo vật tư thành công');
      }
      handleCloseFormModal();
      await fetchInventory();
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle specific error codes
      let errorMessage = 'Không thể lưu vật tư';
      
      if (error.response?.status === 409) {
        errorMessage = error.response?.data?.message || 'Tên vật tư đã tồn tại trong hệ thống';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
      } else {
        errorMessage = error.response?.data?.message || error.response?.data?.error || errorMessage;
      }
      
      toast.error(errorMessage);
      throw error; // Re-throw để modal không đóng khi lỗi
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa vật tư này?')) return;

    try {
      await warehouseService.deleteInventory(id);
      toast.success('Xóa vật tư thành công');
      await fetchInventory();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Không thể xóa vật tư');
    }
  };

  // Handle view detail
  const handleViewDetail = async (id: number) => {
    try {
      const data = await warehouseService.getInventoryById(id);
      if (data) {
        setViewingInventory(data);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching inventory detail:', error);
      toast.error('Không thể tải thông tin vật tư');
    }
  };

  const handleCloseViewModal = () => {
    setViewingInventory(null);
    setIsViewModalOpen(false);
  };

  // Helper: check expiry
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 90 && daysLeft >= 0; // Expiring within 90 days
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Helper: check low stock
  const isLowStock = (item: Inventory) => {
    return item.minStockLevel && item.stockQuantity <= item.minStockLevel;
  };

  // Helper: status badge
  const getStatusBadge = (status: InventoryStatus) => {
    const variants = {
      [InventoryStatus.ACTIVE]: { variant: 'default' as const, label: 'Hoạt động' },
      [InventoryStatus.INACTIVE]: { variant: 'secondary' as const, label: 'Ngưng' },
      [InventoryStatus.OUT_OF_STOCK]: { variant: 'destructive' as const, label: 'Hết hàng' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Vật Tư</h1>
          <p className="text-muted-foreground mt-1">Quản lý kho vật tư y tế</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Thêm Vật Tư
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Vật Tư
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBoxes} className="text-blue-500 text-2xl" />
              <span className="text-3xl font-bold">{pageData?.totalElements || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cảnh Báo Tồn Thấp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500 text-2xl" />
              <span className="text-3xl font-bold">
                {pageData?.content.filter(i => isLowStock(i)).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sắp Hết Hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-red-500 text-2xl" />
              <span className="text-3xl font-bold">
                {pageData?.content.filter(i => isExpiringSoon(i.expiryDate)).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Tìm tên vật tư, nhóm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Warehouse Type Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedWarehouseType === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedWarehouseType('ALL')}
              >
                Tất Cả
              </Button>
              <Button
                variant={selectedWarehouseType === WarehouseType.COLD ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedWarehouseType(WarehouseType.COLD)}
              >
                Kho Lạnh
              </Button>
              <Button
                variant={selectedWarehouseType === WarehouseType.NORMAL ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedWarehouseType(WarehouseType.NORMAL)}
              >
                Kho Thường
              </Button>

              {/* Quick Filters */}
              <div className="w-px bg-border mx-1"></div>
              <Button
                variant={showLowStock ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowLowStock(!showLowStock)}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faExclamationTriangle} />
                Tồn Thấp
              </Button>

              <Button
                variant={showExpiringSoon ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowExpiringSoon(!showExpiringSoon)}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faClock} />
                Sắp Hết Hạn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      ) : filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Không có dữ liệu</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Tên Vật Tư</th>
                    <th className="text-left p-4 font-medium">Nhà Cung Cấp</th>
                    <th className="text-left p-4 font-medium">Loại Kho</th>
                    <th className="text-left p-4 font-medium">Nhóm</th>
                    <th className="text-left p-4 font-medium">Tồn Kho</th>
                    <th className="text-left p-4 font-medium">Hạn SD</th>
                    <th className="text-left p-4 font-medium">Trạng Thái</th>
                    <th className="text-right p-4 font-medium">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr key={item.inventoryId} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{item.itemName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.unitOfMeasure}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {item.supplierName || `#${item.supplierId}`}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={item.warehouseType === WarehouseType.COLD ? 'default' : 'secondary'}>
                          {item.warehouseType === WarehouseType.COLD ? '❄️ Kho lạnh' : '📦 Kho thường'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{item.category || '-'}</span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className={`font-semibold ${isLowStock(item) ? 'text-red-600' : ''}`}>
                            {item.stockQuantity}
                            {isLowStock(item) && (
                              <FontAwesomeIcon icon={faExclamationTriangle} className="ml-2 text-red-500" />
                            )}
                          </div>
                          {item.minStockLevel && (
                            <div className="text-xs text-muted-foreground">
                              Min: {item.minStockLevel}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {item.expiryDate ? (
                          <div className="space-y-1">
                            {isExpired(item.expiryDate) ? (
                              <Badge variant="destructive" className="text-xs">
                                <FontAwesomeIcon icon={faClock} className="mr-1" />
                                Đã hết hạn
                              </Badge>
                            ) : isExpiringSoon(item.expiryDate) ? (
                              <Badge variant="destructive" className="text-xs">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                Sắp hết hạn
                              </Badge>
                            ) : (
                              <span className="text-sm text-green-600">
                                {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(item.inventoryId)}
                            title="Xem chi tiết"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFormModal(item)}
                            title="Chỉnh sửa"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(item.inventoryId)}
                            title="Xóa"
                          >
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
                Hiển thị {pageData.numberOfElements} / {pageData.totalElements} vật tư
                {searchTerm && ` (đang lọc)`}
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
      <InventoryFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveInventory}
        inventory={editingInventory}
      />

      {/* View Detail Modal */}
      <InventoryDetailModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        inventory={viewingInventory}
      />
    </div>
  );
}
