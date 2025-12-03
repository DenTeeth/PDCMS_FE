'use client';

/**
 * Warehouse Dashboard - Tổng quan kho
 * Displays key metrics, alerts, and quick actions
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxes,
  faWarehouse,
  faExclamationTriangle,
  faClock,
  faArrowUp,
  faArrowDown,
  faChartLine,
  faClipboard,
  faUsers,
  faPlus,
  faEye,
  faSnowflake,
} from '@fortawesome/free-solid-svg-icons';
import { inventoryService } from '@/services/inventoryService';
import { storageService } from '@/services/storageService';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function WarehouseDashboard() {
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // Fetch inventory stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventoryStats'],
    queryFn: () => inventoryService.getStats(),
  });

  // Fetch storage stats (import/export)
  const { data: storageStats, isLoading: storageLoading } = useQuery({
    queryKey: ['storageStats', selectedMonth, selectedYear],
    queryFn: () => storageService.getStats(selectedMonth, selectedYear),
  });

  // Fetch low stock items
  const { data: lowStockItems } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      const result = await inventoryService.getSummary({
        stockStatus: 'LOW_STOCK',
        page: 0,
        size: 5,
      });
      return result.content || [];
    },
  });

  // Fetch expiring items (API 6.3)
  const { data: expiringAlerts } = useQuery({
    queryKey: ['expiringAlerts'],
    queryFn: async () => {
      const result = await inventoryService.getExpiringAlerts({
        days: 30,
        warehouseType: 'COLD',
        page: 0,
        size: 5,
      });
      return result.alerts || [];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    // TODO: Re-enable permission check after BE adds VIEW_WAREHOUSE permission
    // <ProtectedRoute requiredPermissions={['VIEW_WAREHOUSE']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tổng Quan Kho</h1>
            <p className="text-slate-600 mt-1">Dashboard quản lý tồn kho và giao dịch</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/warehouse/inventory">
              <Button variant="outline">
                <FontAwesomeIcon icon={faBoxes} className="h-4 w-4 mr-2" />
                Vật Tư
              </Button>
            </Link>
            <Link href="/admin/warehouse/storage">
              <Button>
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                Nhập/Xuất Kho
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxes} className="h-4 w-4" />
                Tổng Vật Tư
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Đang quản lý trong hệ thống
              </p>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                Sắp Hết Hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {stats?.lowStockCount || 0}
              </div>
              <p className="text-xs text-orange-600 mt-1">Cần nhập thêm ngay</p>
            </CardContent>
          </Card>

          {/* Expiring Soon */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                Sắp Hết Hạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">
                {stats?.expiringWithin30Days || 0}
              </div>
              <p className="text-xs text-red-600 mt-1">Trong vòng 30 ngày</p>
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <FontAwesomeIcon icon={faWarehouse} className="h-4 w-4" />
                Tổng Giá Trị Kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(stats?.totalValue || 0)}
              </div>
              <p className="text-xs text-green-600 mt-1">Giá trị tồn kho hiện tại</p>
            </CardContent>
          </Card>
        </div>

        {/* Import/Export Stats */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Thống Kê Nhập/Xuất Kho</CardTitle>
              <div className="flex gap-2">
                <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const month = idx + 1;
                      return (
                        <SelectItem key={month} value={String(month)}>
                          Tháng {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const year = today.getFullYear() - idx;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {storageLoading ? (
              <div className="text-center py-6 text-sm text-gray-500">Đang tải dữ liệu...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Import Stats */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faArrowDown} className="h-4 w-4 text-blue-500" />
                    <span>Số phiếu nhập</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {storageStats?.monthlyImportCount ?? 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        (storageStats?.importGrowthPercent ?? 0) >= 0 ? 'default' : 'destructive'
                      }
                    >
                      <FontAwesomeIcon
                        icon={(storageStats?.importGrowthPercent ?? 0) >= 0 ? faArrowUp : faArrowDown}
                        className="h-3 w-3 mr-1"
                      />
                      {storageStats?.importGrowthPercent !== undefined
                        ? formatPercent(storageStats.importGrowthPercent)
                        : 'N/A'}
                    </Badge>
                    <span className="text-xs text-gray-500">so với tháng trước</span>
                  </div>
                </div>

                {/* Export Stats */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faArrowUp} className="h-4 w-4 text-orange-500" />
                    <span>Số phiếu xuất</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {storageStats?.monthlyExportCount ?? 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        (storageStats?.exportGrowthPercent ?? 0) >= 0 ? 'default' : 'destructive'
                      }
                    >
                      <FontAwesomeIcon
                        icon={(storageStats?.exportGrowthPercent ?? 0) >= 0 ? faArrowUp : faArrowDown}
                        className="h-3 w-3 mr-1"
                      />
                      {storageStats?.exportGrowthPercent !== undefined
                        ? formatPercent(storageStats.exportGrowthPercent)
                        : 'N/A'}
                    </Badge>
                    <span className="text-xs text-gray-500">so với tháng trước</span>
                  </div>
                </div>

                {/* Transactions Count */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faClipboard} className="h-4 w-4 text-purple-500" />
                    <span>Tổng giao dịch</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {storageStats?.totalTransactionsCount ?? 0}
                  </div>
                  <p className="text-xs text-gray-500">
                    Tháng {selectedMonth}/{selectedYear}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-orange-500" />
                  Cảnh Báo Tồn Kho Thấp
                </span>
                <Link href="/admin/warehouse/inventory?filter=LOW_STOCK">
                  <Button variant="ghost" size="sm">
                    Xem tất cả
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems && lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.slice(0, 5).map((item: any) => (
                    <div
                      key={item.id || item.itemMasterId}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-500">
                          Mã: {item.itemCode} • {item.warehouseType === 'COLD' ? (
                            <>
                              <FontAwesomeIcon icon={faSnowflake} className="mr-1" />
                              Kho lạnh
                            </>
                          ) : 'Kho thường'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">
                          {item.totalQuantity ?? item.totalQuantityOnHand ?? 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {item.minStockLevel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon={faBoxes} className="h-12 w-12 mb-2 opacity-20" />
                  <p>Không có vật tư sắp hết hàng</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiring Items Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-red-500" />
                  Cảnh Báo Hết Hạn
                </span>
                <Link href="/admin/warehouse/inventory?filter=EXPIRING_SOON">
                  <Button variant="ghost" size="sm">
                    Xem tất cả
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringAlerts && expiringAlerts.length > 0 ? (
                <div className="space-y-3">
                  {expiringAlerts.slice(0, 5).map((alert: any) => {
                    const daysRemaining = alert.daysRemaining ?? 0;
                    const status = alert.status || (daysRemaining < 0 ? 'EXPIRED' : daysRemaining <= 7 ? 'CRITICAL' : 'EXPIRING_SOON');

                    return (
                      <div
                        key={alert.batchId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          status === 'EXPIRED'
                            ? 'bg-red-50 border-red-200'
                            : status === 'CRITICAL'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.itemName}</p>
                          <p className="text-xs text-gray-500">
                            Mã: {alert.itemCode} | Lô: {alert.lotNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            status === 'EXPIRED' ? 'text-red-600' :
                            status === 'CRITICAL' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {daysRemaining < 0 ? `Đã hết hạn ${Math.abs(daysRemaining)} ngày` :
                             daysRemaining === 0 ? 'Hết hạn hôm nay' :
                             `${daysRemaining} ngày`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon={faClock} className="h-12 w-12 mb-2 opacity-20" />
                  <p>Không có vật tư sắp hết hạn</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao Tác Nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/warehouse/inventory">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FontAwesomeIcon icon={faBoxes} className="h-6 w-6" />
                  <span className="text-sm">Danh Sách Vật Tư</span>
                </Button>
              </Link>
              <Link href="/admin/warehouse/storage">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FontAwesomeIcon icon={faClipboard} className="h-6 w-6" />
                  <span className="text-sm">Nhập/Xuất Kho</span>
                </Button>
              </Link>
              <Link href="/admin/warehouse/suppliers">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />
                  <span className="text-sm">Nhà Cung Cấp</span>
                </Button>
              </Link>
              <Link href="/admin/warehouse/reports">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FontAwesomeIcon icon={faChartLine} className="h-6 w-6" />
                  <span className="text-sm">Báo Cáo</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    // </ProtectedRoute>
  );
}


