'use client';

/**
 * Modern Inventory Page (Unified V3)
 * Following Stripe/Vercel/Linear design patterns
 * Implements: Item Master management, Dashboard stats, FEFO tracking
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Package, 
  AlertTriangle, 
  AlarmClock, 
  TrendingDown,
  Search,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  itemMasterService,
  warehouseAnalyticsService,
  formatCurrency,
  formatDate,
} from '@/services/warehouseService';
import { ItemMaster, InventoryTabState } from '@/types/warehouse';
import CreateItemMasterModal from '../components/CreateItemMasterModal';

export default function InventoryPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [tabState, setTabState] = useState<InventoryTabState>({
    activeFilter: 'ALL',
    searchQuery: '',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);

  // ============================================
  // DATA FETCHING (React Query)
  // ============================================
  
  // Dashboard Stats
  const { data: stats } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => warehouseAnalyticsService.getInventoryStats(),
  });

  // Main Inventory Data
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['itemMasterSummary', tabState],
    queryFn: () => {
      const filter: any = {
        search: tabState.searchQuery || undefined,
      };

      // Apply tab filters
      if (tabState.activeFilter === 'COLD') filter.warehouse_type = 'COLD';
      if (tabState.activeFilter === 'NORMAL') filter.warehouse_type = 'NORMAL';
      if (tabState.activeFilter === 'LOW_STOCK') filter.stock_status = 'LOW_STOCK';
      if (tabState.activeFilter === 'EXPIRING_SOON') filter.is_expiring_soon = true;

      return itemMasterService.getSummary(filter);
    },
  });

  // ============================================
  // UI HELPERS
  // ============================================
  const getStockStatusBadge = (status: string) => {
    const configs = {
      NORMAL: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✓ Bình thường' },
      LOW_STOCK: { className: 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse', label: '⚠ Tồn thấp' },
      OUT_OF_STOCK: { className: 'bg-rose-50 text-rose-700 border-rose-300', label: '✕ Hết hàng' },
      OVERSTOCK: { className: 'bg-blue-50 text-blue-700 border-blue-200', label: '↑ Dư thừa' },
    };
    const config = configs[status as keyof typeof configs] || configs.NORMAL;
    return <Badge className={`${config.className} font-medium`}>{config.label}</Badge>;
  };

  const getWarehouseTypeBadge = (type: string) => {
    return type === 'COLD' ? (
      <Badge className="bg-blue-500 text-white hover:bg-blue-600">🧊 Kho Lạnh</Badge>
    ) : (
      <Badge variant="secondary" className="bg-slate-100 text-slate-700">📦 Kho Thường</Badge>
    );
  };

  // ============================================
  // RENDER: MODERN DASHBOARD
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-[1400px] mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Quản Lý Vật Tư
            </h1>
            <p className="text-muted-foreground mt-1">
              Tổng quan tồn kho và định nghĩa vật tư (Item Master)
            </p>
          </div>
          <Button 
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Thêm Vật Tư Mới
          </Button>
        </div>

        {/* Stats Cards (Mentor Requirements) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Items */}
          <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng Mã Vật Tư</p>
                  <p className="text-3xl font-bold mt-2">{stats?.total_items || 0}</p>
                </div>
                <div className="h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Low Stock Warning (Amber Border) */}
          <Card className="border-2 border-amber-400 shadow-md shadow-amber-200/50 hover:shadow-xl transition-all duration-300 animate-border-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Cảnh Báo Tồn Thấp</p>
                  <p className="text-3xl font-bold mt-2 text-amber-600">{stats?.low_stock_count || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Dưới mức tối thiểu</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Expiring Soon (Red Border) */}
          <Card className="border-2 border-rose-400 shadow-md shadow-rose-200/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Sắp Hết Hạn</p>
                  <p className="text-3xl font-bold mt-2 text-rose-600">{stats?.expiring_soon_count || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trong 30 ngày</p>
                </div>
                <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <AlarmClock className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Monthly Loss */}
          <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thất Thoát (Tháng Này)</p>
                  <p className="text-3xl font-bold mt-2 text-rose-600">
                    {formatCurrency(stats?.monthly_loss_value || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Hủy/Hỏng</p>
                </div>
                <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Section */}
        <Card className="border-none shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Danh Sách Vật Tư</CardTitle>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo mã, tên vật tư..."
                    value={tabState.searchQuery}
                    onChange={(e) => setTabState({ ...tabState, searchQuery: e.target.value })}
                    className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs 
              value={tabState.activeFilter} 
              onValueChange={(value) => setTabState({ ...tabState, activeFilter: value as any })}
              className="mt-4"
            >
              <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <TabsTrigger value="ALL">Tất Cả</TabsTrigger>
                <TabsTrigger value="COLD">🧊 Kho Lạnh</TabsTrigger>
                <TabsTrigger value="NORMAL">📦 Kho Thường</TabsTrigger>
                <TabsTrigger value="LOW_STOCK" className="text-amber-600">⚠ Tồn Thấp</TabsTrigger>
                <TabsTrigger value="EXPIRING_SOON" className="text-rose-600">⏰ Sắp Hết Hạn</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Mã Vật Tư</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Tên Vật Tư</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Nhóm</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Loại Kho</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Tồn Kho</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng Thái</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Đang tải...
                      </td>
                    </tr>
                  ) : !inventory || inventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Không tìm thấy dữ liệu
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr 
                        key={item.item_master_id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm font-semibold text-violet-600 dark:text-violet-400">
                            {item.item_code}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs">
                            <div className="font-medium text-sm">{item.item_name}</div>
                            {item.is_tool && (
                              <Badge variant="outline" className="mt-1 text-xs">🔧 Dụng cụ</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">
                          {item.category?.category_name || '-'}
                        </td>
                        <td className="py-4 px-6">
                          {getWarehouseTypeBadge(item.warehouse_type)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold text-sm">
                            {item.total_quantity.toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.unit_of_measure}</div>
                        </td>
                        <td className="py-4 px-6">
                          {getStockStatusBadge(item.stock_status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" title="Xem chi tiết">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Chỉnh sửa">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Create/Edit Item Modal */}
      <CreateItemMasterModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
      />
    </div>
  );
}
