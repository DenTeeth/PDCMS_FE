'use client';

/**
 * Inventory Page - API V1 (Item Master Management)
 * ✅ Using /api/v1/inventory endpoints
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faBoxes,
  faExclamationTriangle,
  faClock,
  faEye,
  faSort,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { inventoryService, type ItemMasterV1, type InventorySummary } from '@/services/inventoryService';
import CreateItemMasterModal from '../components/CreateItemMasterModal';
import ItemDetailModal from '../components/ItemDetailModal';

type FilterTab = 'ALL' | 'COLD' | 'NORMAL' | 'LOW_STOCK' | 'EXPIRING_SOON';

interface TabState {
  activeFilter: FilterTab;
  searchQuery: string;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [tabState, setTabState] = useState<TabState>({
    activeFilter: 'ALL',
    searchQuery: '',
  });
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sortField, setSortField] = useState<string>('itemName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMasterV1 | null>(null);
  const [viewingItemId, setViewingItemId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Dashboard Stats - API V1
  const { data: stats } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => inventoryService.getStats(),
  });

  // Main Inventory Data - API V1
  const { data: inventoryPage, isLoading } = useQuery({
    queryKey: ['inventorySummary', tabState, page, sortField, sortDirection],
    queryFn: () => {
      const filter: any = {
        search: tabState.searchQuery || undefined,
        page,
        size,
        sort: `${sortField},${sortDirection}`,
      };

      // Apply tab filters
      if (tabState.activeFilter === 'COLD') filter.warehouseType = 'COLD';
      if (tabState.activeFilter === 'NORMAL') filter.warehouseType = 'NORMAL';
      if (tabState.activeFilter === 'LOW_STOCK') filter.stockStatus = 'LOW_STOCK';
      if (tabState.activeFilter === 'EXPIRING_SOON') filter.isExpiringSoon = true;

      return inventoryService.getSummary(filter);
    },
  });

  const inventory = Array.isArray(inventoryPage) ? inventoryPage : ((inventoryPage as any)?.content || []);
  const totalPages = (inventoryPage as any)?.totalPages || 1;
  const totalElements = (inventoryPage as any)?.totalElements || inventory.length;

  // Delete mutation - API V1
  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
      toast.success('Xóa vật tư thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể xóa vật tư!');
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa vật tư này?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleEdit = (item: InventorySummary) => {
    // Convert InventorySummary to ItemMasterV1 for editing
    const itemMaster: ItemMasterV1 = {
      id: item.itemMasterId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      categoryId: 0, // Will be fetched from categories
      categoryName: item.categoryName,
      unitOfMeasure: item.unitOfMeasure,
      warehouseType: item.warehouseType,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
      currentStock: item.totalQuantity,
      stockStatus: item.stockStatus,
      isTool: item.isTool,
    };
    setEditingItem(itemMaster);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsCreateModalOpen(false);
  };

  const handleViewDetail = (itemId: number) => {
    setViewingItemId(itemId);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewingItemId(null);
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

  const handleSearchChange = (value: string) => {
    setTabState({ ...tabState, searchQuery: value });
    setPage(0); // Reset to first page on search
  };

  const handleFilterChange = (filter: FilterTab) => {
    setTabState({ activeFilter: filter, searchQuery: tabState.searchQuery });
    setPage(0); // Reset to first page on filter change
  };

  const getStockStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      NORMAL: { variant: 'default', label: 'Bình thường' },
      LOW_STOCK: { variant: 'destructive', label: 'Sắp hết' },
      OUT_OF_STOCK: { variant: 'secondary', label: 'Hết hàng' },
      OVERSTOCK: { variant: 'outline', label: 'Dư thừa' },
    };
    const config = variants[status] || variants.NORMAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getWarehouseTypeBadge = (type: string) => {
    return type === 'COLD' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">Kho lạnh</Badge>
    ) : (
      <Badge variant="outline">Kho thường</Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Tồn kho</h1>
          <p className="text-slate-600 mt-1">Quản lý vật tư master & theo dõi tồn kho</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
          Thêm vật tư
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng số vật tư
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalElements}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sắp hết hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.lowStockCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sắp hết hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.expiringWithin30Days || 0}
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
              placeholder="Tìm kiếm theo mã vật tư, tên, danh mục..."
              className="pl-10"
              value={tabState.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : inventory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon={faBoxes} className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy vật tư</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th 
                            className="text-left p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('itemCode')}
                          >
                            <div className="flex items-center gap-2">
                              Mã vật tư
                              <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th 
                            className="text-left p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('itemName')}
                          >
                            <div className="flex items-center gap-2">
                              Tên vật tư
                              <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th className="text-left p-3">Loại kho</th>
                          <th className="text-left p-3">Danh mục</th>
                          <th 
                            className="text-right p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('totalQuantity')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Tồn kho
                              <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                            </div>
                          </th>
                          <th className="text-right p-3">Min/Max</th>
                          <th className="text-left p-3">Trạng thái</th>
                          <th className="text-right p-3">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item: InventorySummary) => (
                          <tr key={item.itemMasterId} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <span className="font-mono text-sm">{item.itemCode}</span>
                          </td>
                          <td className="p-3 font-medium">{item.itemName}</td>
                          <td className="p-3">{getWarehouseTypeBadge(item.warehouseType)}</td>
                          <td className="p-3">{item.categoryName || '-'}</td>
                          <td className="p-3 text-right">
                            <span className={`font-bold ${item.stockStatus === 'LOW_STOCK' ? 'text-red-600' : ''}`}>
                              {item.totalQuantity} {item.unitOfMeasure}
                            </span>
                          </td>
                          <td className="p-3 text-right text-sm text-gray-600">
                            {item.minStockLevel} / {item.maxStockLevel}
                          </td>
                          <td className="p-3">{getStockStatusBadge(item.stockStatus)}</td>
                          <td className="p-3 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(item.itemMasterId)}
                              title="Xem chi tiết"
                            >
                              <FontAwesomeIcon icon={faEye} className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              title="Chỉnh sửa"
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.itemMasterId)}
                              title="Xóa"
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
                    Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} của {totalElements} vật tư
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
                      Trang {page + 1} / {totalPages || 1}
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

      {/* Create/Edit Modal */}
      <CreateItemMasterModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        item={editingItem}
      />

      {/* View Detail Modal */}
      <ItemDetailModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        itemId={viewingItemId}
      />
    </div>
  );
}
