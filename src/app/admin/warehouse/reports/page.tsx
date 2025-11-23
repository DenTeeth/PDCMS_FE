'use client';

/**
 * Warehouse Reports Page - Báo cáo thống kê kho
 * Simple version: Chỉ hiển thị danh sách, chưa có biểu đồ
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faExclamationTriangle,
  faBoxes,
  faSnowflake,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import inventoryService from '@/services/inventoryService';
import categoryService from '@/services/categoryService';

export default function ReportsPage() {
  // Fetch inventory stats
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => inventoryService.getStats(),
  });

  // Fetch all inventory items
  const { data: allItems = [] } = useQuery({
    queryKey: ['allInventoryItems'],
    queryFn: () => inventoryService.getSummary({}),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['allCategories'],
    queryFn: () => categoryService.getAll(),
  });

  // Calculate low stock items (top 10)
  const lowStockItems = allItems
    .filter(item => item.stockStatus === 'LOW_STOCK')
    .sort((a, b) => (a.totalQuantity || 0) - (b.totalQuantity || 0))
    .slice(0, 10);

  // Calculate expiring soon items (top 10, cold storage only)
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

  // Calculate inventory by category
  const inventoryByCategory = categories.map(cat => {
    const categoryItems = allItems.filter(item => item.categoryName === cat.name);
    const totalQty = categoryItems.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
    return {
      categoryName: cat.name,
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
          <h1 className="text-3xl font-bold">Báo cáo Kho</h1>
          <p className="text-slate-600 mt-1">Thống kê và phân tích tồn kho</p>
        </div>
      </div>

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
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">STT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã VT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tên VT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tồn kho</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Min/Max</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
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
                    <tr key={item.itemMasterId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-sm">{item.itemCode}</td>
                      <td className="px-4 py-3">{item.itemName}</td>
                      <td className="px-4 py-3 font-semibold">{item.totalQuantity || 0}</td>
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">STT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã VT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tên VT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hạn sử dụng</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Còn lại</th>
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
                      <tr key={item.itemMasterId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-sm">{item.itemCode}</td>
                        <td className="px-4 py-3">{item.itemName}</td>
                        <td className="px-4 py-3">
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">STT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Danh mục</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Loại kho</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số loại VT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tổng số lượng</th>
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
                    <tr key={cat.categoryName} className="hover:bg-gray-50">
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
                      <td className="px-4 py-3">{cat.itemCount}</td>
                      <td className="px-4 py-3 font-semibold">{cat.totalQuantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
