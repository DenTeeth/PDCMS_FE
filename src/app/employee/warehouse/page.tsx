'use client';

/**
 * Warehouse Dashboard - Tổng quan kho (Employee)
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
  faHistory,
  faTags,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { inventoryService } from '@/services/inventoryService';
import { storageService } from '@/services/storageService';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function EmployeeWarehouseDashboard() {
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

  // Fetch recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async () => {
      const result = await storageService.getAll({
        page: 0,
        size: 5,
        sortBy: 'transactionDate',
        sortDirection: 'desc',
      });
      return result.content || [];
    },
  });

  // Fetch recent items
  const { data: recentItems } = useQuery({
    queryKey: ['recentItems'],
    queryFn: async () => {
      const result = await inventoryService.getSummary({
        page: 0,
        size: 10,
      });
      // Return first 5 items
      return (result.content || []).slice(0, 5);
    },
  });

  // Fetch categories count
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories(),
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getTransactionTypeLabel = (type: string) => {
    return type === 'IMPORT' ? 'Nhập' : 'Xuất';
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'IMPORT' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50';
  };

  return (
    <ProtectedRoute requiredPermissions={['VIEW_WAREHOUSE']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tổng quan kho</h1>
            <p className="text-slate-600 mt-1">Dashboard quản lý tồn kho và giao dịch</p>
          </div>
          <div className="flex gap-2">
            <Link href="/employee/warehouse/inventory">
              <Button variant="outline">
                <FontAwesomeIcon icon={faBoxes} className="h-4 w-4 mr-2" />
                Vật tư
              </Button>
            </Link>
            <Link href="/employee/warehouse/storage">
              <Button>
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                Nhập/Xuất kho
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng vật tư</p>
                  <p className="text-2xl font-bold mt-1">{stats?.totalItems || 0}</p>
                </div>
                <FontAwesomeIcon icon={faBoxes} className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Danh mục</p>
                  <p className="text-2xl font-bold mt-1">{categories?.length || 0}</p>
                </div>
                <FontAwesomeIcon icon={faTags} className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sắp hết hàng</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.lowStockCount || 0}</p>
                </div>
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats?.expiringWithin30Days || 0}</p>
                </div>
                <FontAwesomeIcon icon={faClock} className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-orange-500" />
                  Cảnh báo tồn kho thấp
                </span>
                <Link href="/employee/warehouse/inventory?filter=LOW_STOCK">
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
                  Cảnh báo hết hạn
                </span>
                <Link href="/employee/warehouse/inventory?filter=EXPIRING_SOON">
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

        {/* Recent Transactions and Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faHistory} className="h-5 w-5 text-blue-500" />
                  Giao dịch gần đây
                </span>
                <Link href="/employee/warehouse/storage">
                  <Button variant="ghost" size="sm">
                    Xem tất cả
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((tx: any) => (
                    <div
                      key={tx.transactionId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTransactionTypeColor(tx.transactionType)}>
                            {getTransactionTypeLabel(tx.transactionType)}
                          </Badge>
                          <span className="font-medium text-sm">{tx.transactionCode}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {tx.supplierName && `NCC: ${tx.supplierName} • `}
                          {formatDate(tx.transactionDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={tx.status === 'APPROVED' ? 'default' : 'outline'}>
                          {tx.status === 'APPROVED' ? 'Đã duyệt' : tx.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : 'Nháp'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon={faHistory} className="h-12 w-12 mb-2 opacity-20" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBoxes} className="h-5 w-5 text-purple-500" />
                  Vật tư mới nhất
                </span>
                <Link href="/employee/warehouse/inventory">
                  <Button variant="ghost" size="sm">
                    Xem tất cả
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentItems && recentItems.length > 0 ? (
                <div className="space-y-3">
                  {recentItems.slice(0, 5).map((item: any) => (
                    <div
                      key={item.itemMasterId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-500">
                          Mã: {item.itemCode} • {item.categoryName || 'Chưa phân loại'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{item.totalQuantityOnHand || 0}</p>
                        <p className="text-xs text-gray-500">{item.unitOfMeasure || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon={faBoxes} className="h-12 w-12 mb-2 opacity-20" />
                  <p>Chưa có vật tư nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - No Card wrapper */}
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/employee/warehouse/inventory">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FontAwesomeIcon icon={faBoxes} className="h-6 w-6" />
                <span className="text-sm">Danh sách vật tư</span>
              </Button>
            </Link>
            <Link href="/employee/warehouse/storage">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FontAwesomeIcon icon={faClipboard} className="h-6 w-6" />
                <span className="text-sm">Nhập/Xuất kho</span>
              </Button>
            </Link>
            <Link href="/employee/warehouse/suppliers">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />
                <span className="text-sm">Nhà cung cấp</span>
              </Button>
            </Link>
            <Link href="/employee/warehouse/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FontAwesomeIcon icon={faChartLine} className="h-6 w-6" />
                <span className="text-sm">Báo cáo</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

