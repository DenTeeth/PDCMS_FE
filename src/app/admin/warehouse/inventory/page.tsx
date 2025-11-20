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
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { inventoryService, type ItemMasterV1, type InventorySummary } from '@/services/inventoryService';
import CreateItemMasterModal from '../components/CreateItemMasterModal';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMasterV1 | null>(null);

  // Dashboard Stats - API V1
  const { data: stats } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => inventoryService.getStats(),
  });

  // Main Inventory Data - API V1
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventorySummary', tabState],
    queryFn: () => {
      const filter: any = {
        search: tabState.searchQuery || undefined,
      };

      // Apply tab filters
      if (tabState.activeFilter === 'COLD') filter.warehouseType = 'COLD';
      if (tabState.activeFilter === 'NORMAL') filter.warehouseType = 'NORMAL';
      if (tabState.activeFilter === 'LOW_STOCK') filter.stockStatus = 'LOW_STOCK';
      if (tabState.activeFilter === 'EXPIRING_SOON') filter.isExpiringSoon = true;

      return inventoryService.getSummary(filter);
    },
  });

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
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng số vật tư
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-red-500" />
              Sắp hết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.lowStockCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-orange-500" />
              Sắp hết hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.expiringWithin30Days || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Giá trị tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(stats?.totalValue || 0).toLocaleString('vi-VN')} ₫
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={tabState.activeFilter} onValueChange={(v: any) => setTabState({ ...tabState, activeFilter: v })}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ALL">Tất cả</TabsTrigger>
          <TabsTrigger value="COLD">Kho lạnh</TabsTrigger>
          <TabsTrigger value="NORMAL">Kho thường</TabsTrigger>
          <TabsTrigger value="LOW_STOCK">Sắp hết</TabsTrigger>
          <TabsTrigger value="EXPIRING_SOON">Sắp hết hạn</TabsTrigger>
        </TabsList>

        <TabsContent value={tabState.activeFilter} className="mt-6">
          {/* Search Bar */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo mã vật tư, tên..."
                  className="pl-10"
                  value={tabState.searchQuery}
                  onChange={(e) => setTabState({ ...tabState, searchQuery: e.target.value })}
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Mã vật tư</th>
                        <th className="text-left p-3">Tên vật tư</th>
                        <th className="text-left p-3">Loại kho</th>
                        <th className="text-left p-3">Danh mục</th>
                        <th className="text-right p-3">Tồn kho</th>
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
                              onClick={() => handleEdit(item)}
                            >
                              <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.itemMasterId)}
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <CreateItemMasterModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        item={editingItem}
      />
    </div>
  );
}
