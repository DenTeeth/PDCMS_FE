'use client';

/**
 * Inventory Page - Warehouse API 6.x (Item Master Management)
 *  Using /api/v1/warehouse endpoints for summary + items
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  faPlus,
  faSearch,
  faBoxes,
  faExclamationTriangle,
  faClock,
  faSort,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService, type ItemMasterV1, type InventorySummary } from '@/services/inventoryService';
import CreateItemMasterModal from '../components/CreateItemMasterModal';
import ItemDetailModal from '../components/ItemDetailModal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

type FilterTab = 'ALL' | 'COLD' | 'NORMAL' | 'LOW_STOCK' | 'EXPIRING_SOON';

interface TabState {
  activeFilter: FilterTab;
  searchQuery: string;
}

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_WAREHOUSE_ITEM') || hasPermission('MANAGE_WAREHOUSE');
  const canUpdate = hasPermission('UPDATE_WAREHOUSE_ITEM') || hasPermission('MANAGE_WAREHOUSE');
  const canDelete = hasPermission('DELETE_WAREHOUSE_ITEM') || hasPermission('MANAGE_WAREHOUSE');
  const canView = hasPermission('VIEW_WAREHOUSE');

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: number | null; itemName: string }>({ isOpen: false, itemId: null, itemName: '' });

  // Dashboard Stats - API V1
  const { data: stats, error: statsError } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => inventoryService.getStats(),
    retry: 1, // Only retry once on failure
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Main Inventory Data - Warehouse API 6.1
  // Note: BE /api/v1/warehouse/summary supports: search, stockStatus, warehouseType, categoryId, page, size
  // Note: BE does NOT support isExpiringSoon filter or sort parameter
  const { data: inventoryPage, isLoading, error: inventoryError } = useQuery({
    queryKey: ['inventorySummary', tabState.activeFilter, page, sortField, sortDirection],
    queryFn: () => {
      const filter: any = {
        page: 0, // Fetch all for client-side search
        size: 1000, // Fetch large number to enable client-side filtering
        // Note: BE doesn't support sort parameter, so we do client-side sorting
      };

      // Apply tab filters (BE supported filters only)
      if (tabState.activeFilter === 'COLD') filter.warehouseType = 'COLD';
      if (tabState.activeFilter === 'NORMAL') filter.warehouseType = 'NORMAL';
      if (tabState.activeFilter === 'LOW_STOCK') filter.stockStatus = 'LOW_STOCK';
      // Note: EXPIRING_SOON filter is not supported by BE, we'll filter client-side

      // Add search if available (BE supports search parameter)
      if (tabState.searchQuery) {
        filter.search = tabState.searchQuery;
      }

      return inventoryService.getSummary(filter);
    },
    retry: 1, // Only retry once on failure
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Client-side filtering by search query and EXPIRING_SOON filter
  const allInventory = Array.isArray(inventoryPage) ? inventoryPage : ((inventoryPage as any)?.content || []);

  let filteredInventory = allInventory;

  // Apply search filter
  if (tabState.searchQuery) {
    filteredInventory = filteredInventory.filter((item: InventorySummary) => {
      const searchLower = tabState.searchQuery.toLowerCase();
      return (
        item.itemCode?.toLowerCase().includes(searchLower) ||
        item.itemName?.toLowerCase().includes(searchLower) ||
        item.categoryName?.toLowerCase().includes(searchLower)
      );
    });
  }

  // Apply EXPIRING_SOON filter (client-side, BE doesn't support this filter)
  if (tabState.activeFilter === 'EXPIRING_SOON') {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    filteredInventory = filteredInventory.filter((item: InventorySummary) => {
      if (!item.nearestExpiryDate) return false;
      const expiryDate = new Date(item.nearestExpiryDate);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    });
  }

  // Client-side pagination
  const totalElements = filteredInventory.length;
  const totalPages = Math.ceil(totalElements / size);
  const inventory = filteredInventory.slice(page * size, (page + 1) * size);

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

  const handleDelete = async (id: number, itemName: string) => {
    setDeleteConfirm({ isOpen: true, itemId: id, itemName });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.itemId) {
      await deleteMutation.mutateAsync(deleteConfirm.itemId);
    }
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
      isTool: item.isTool ?? false,
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
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      NORMAL: { variant: 'default', label: 'Bình thường', className: 'bg-green-100 text-green-800 border-green-300' },
      LOW_STOCK: { variant: 'destructive', label: 'Sắp hết hàng', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      OUT_OF_STOCK: { variant: 'secondary', label: 'Hết hàng', className: 'bg-red-100 text-red-800 border-red-300' },
      OVERSTOCK: { variant: 'outline', label: 'Dư thừa', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      EXPIRING_SOON: { variant: 'destructive', label: 'Sắp hết hạn', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      EXPIRED: { variant: 'secondary', label: 'Hết hạn', className: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    const config = variants[status] || variants.NORMAL;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getQuantityColor = (item: InventorySummary) => {
    if (item.totalQuantity <= 0) return 'text-red-600';
    if (item.totalQuantity <= item.minStockLevel) return 'text-orange-600';
    return 'text-green-600';
  };

  const getExpiryDateDisplay = (item: InventorySummary) => {
    // Only show for COLD storage items
    if (item.warehouseType !== 'COLD') {
      return <span className="text-sm text-gray-500">-</span>;
    }

    // Show nearest expiry date if available
    if (item.nearestExpiryDate) {
      const expiryDate = new Date(item.nearestExpiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Show warning if expiring soon
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        return (
          <span className="text-sm text-orange-600 font-medium">
            {expiryDate.toLocaleDateString('vi-VN')}
          </span>
        );
      } else if (daysUntilExpiry <= 0) {
        return (
          <span className="text-sm text-red-600 font-bold">
            {expiryDate.toLocaleDateString('vi-VN')}
          </span>
        );
      }

      return <span className="text-sm text-gray-700">{expiryDate.toLocaleDateString('vi-VN')}</span>;
    }

    return <span className="text-sm text-gray-500">-</span>;
  };

  const getWarehouseTypeBadge = (type: string) => {
    return type === 'COLD' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">Kho lạnh</Badge>
    ) : (
      <Badge variant="outline">Kho thường</Badge>
    );
  };

  return (
    <ProtectedRoute
      requiredBaseRole="admin"
      requiredPermissions={['VIEW_WAREHOUSE']}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản lý tồn kho</h1>
            <p className="text-slate-600 mt-1">Quản lý vật tư master & theo dõi tồn kho</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!canCreate}
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
            Thêm vật tư
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tổng số vật tư */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số vật tư</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faBoxes} className="text-blue-600 text-xl" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalElements}</p>
            </div>
          </div>

          {/* Sắp hết hàng */}
          <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Sắp hết hàng</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-700 text-xl" />
              </div>
              {statsError ? (
                <div className="text-sm text-red-600">Lỗi</div>
              ) : (
                <p className="text-3xl font-bold text-red-800">{stats?.lowStockCount || 0}</p>
              )}
            </div>
          </div>

          {/* Sắp hết hạn */}
          <div className="bg-orange-50 rounded-xl border border-orange-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-orange-800 mb-2">Sắp hết hạn</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faClock} className="text-orange-700 text-xl" />
              </div>
              {statsError ? (
                <div className="text-sm text-orange-600">Lỗi</div>
              ) : (
                <p className="text-3xl font-bold text-orange-800">{stats?.expiringWithin30Days || 0}</p>
              )}
            </div>
          </div>
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
            {inventoryError ? (
              <div className="text-center py-8">
                <div className="text-red-600 font-semibold mb-2">Lỗi tải dữ liệu tồn kho</div>
                <div className="text-sm text-gray-600">
                  {(inventoryError as any)?.message || 'Không thể tải danh sách vật tư. Vui lòng thử lại sau.'}
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : inventory.length === 0 ? (
              <EmptyState
                icon={faBoxes}
                title={tabState.searchQuery ? "Không tìm thấy vật tư" : "Chưa có vật tư nào"}
                description={tabState.searchQuery ? "Thử thay đổi từ khóa tìm kiếm" : "Bắt đầu thêm vật tư mới vào kho"}
                actionLabel={!tabState.searchQuery ? "Thêm vật tư" : undefined}
                onAction={!tabState.searchQuery ? () => setIsCreateModalOpen(true) : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => handleSort('itemCode')}
                        >
                          <div className="flex items-center gap-2 font-semibold text-sm">
                            Mã vật tư
                            <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                          </div>
                        </th>
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => handleSort('itemName')}
                        >
                          <div className="flex items-center gap-2 font-semibold text-sm">
                            Tên vật tư
                            <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="text-left p-3 font-semibold text-sm">Loại kho</th>
                        <th className="text-left p-3 font-semibold text-sm">Danh mục</th>
                        <th className="text-left p-3 font-semibold text-sm">Đơn vị</th>
                        <th
                          className="text-right p-3 cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => handleSort('totalQuantity')}
                        >
                          <div className="flex items-center justify-end gap-2 font-semibold text-sm">
                            Số lượng
                            <FontAwesomeIcon icon={faSort} className="h-3 w-3 text-gray-400" />
                          </div>
                        </th>
                        <th className="text-left p-3 font-semibold text-sm">HSD</th>
                        <th className="text-left p-3 font-semibold text-sm">Trạng thái</th>
                        <th className="text-center p-3 font-semibold text-sm w-36">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item: InventorySummary) => (
                        <tr key={item.itemMasterId} className="border-b hover:bg-gray-50 transition">
                          <td className="p-3">
                            <span className="font-mono text-sm font-medium">{item.itemCode}</span>
                          </td>
                          <td className="p-3 font-medium">{item.itemName}</td>
                          <td className="p-3">{getWarehouseTypeBadge(item.warehouseType)}</td>
                          <td className="p-3 text-sm">{item.categoryName || '-'}</td>
                          <td className="p-3">
                            <span className="text-sm text-gray-600">{item.unitOfMeasure}</span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${getQuantityColor(item)}`}>
                                {item.totalQuantity}
                              </span>
                              <span className="text-xs text-gray-500">Min: {item.minStockLevel}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {getExpiryDateDisplay(item)}
                          </td>
                          <td className="p-3">{getStockStatusBadge(item.stockStatus)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(item.itemMasterId)}
                                title="Xem chi tiết"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                title="Chỉnh sửa"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.itemMasterId, item.itemName)}
                                title="Xóa"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
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
                    Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} của {totalElements} vật tư
                    {tabState.searchQuery && (
                      <span className="text-muted-foreground ml-2">
                        (đã lọc theo: "{tabState.searchQuery}")
                      </span>
                    )}
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

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' })}
          onConfirm={confirmDelete}
          title="Xác nhận xóa vật tư"
          description={`Bạn có chắc chắn muốn xóa vật tư "${deleteConfirm.itemName}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          variant="destructive"
        />
      </div>
    </ProtectedRoute>
  );
}
