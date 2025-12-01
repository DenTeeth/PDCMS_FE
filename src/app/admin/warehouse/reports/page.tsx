'use client';

/**
 * Warehouse Reports Page - Báo cáo & Thống kê kho
 * Includes: Inventory reports, transaction reports, expiring alerts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faBoxes,
  faClipboard,
  faClock,
  faExclamationTriangle,
  faDownload,
  faFilter,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import { inventoryService } from '@/services/inventoryService';
import { storageService, StorageTransaction } from '@/services/storageService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

type ReportType = 'inventory' | 'transactions' | 'expiring';
type TimeRange = '7days' | '30days' | '90days' | 'custom';

export default function WarehouseReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('inventory');
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [warehouseFilter, setWarehouseFilter] = useState<'ALL' | 'COLD' | 'NORMAL'>('ALL');

  // Fetch inventory summary for reports
  const { data: inventorySummary, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['inventoryReportSummary', warehouseFilter],
    queryFn: async () => {
      const filter: any = {
        page: 0,
        size: 100,
      };
      if (warehouseFilter !== 'ALL') {
        filter.warehouseType = warehouseFilter;
      }
      return await inventoryService.getSummary(filter);
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch expiring items (API 6.3)
  const { data: expiringAlertsData, isLoading: expiringLoading, error: expiringError } = useQuery({
    queryKey: ['expiringAlertsReport'],
    queryFn: async () => {
      const result = await inventoryService.getExpiringAlerts({
        days: 30,
        page: 0,
        size: 50,
      });
      return result;
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch transactions for reports
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactionsReport', timeRange],
    queryFn: async () => {
      // Calculate date range based on timeRange
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const result = await storageService.getAll({
        fromDate: startDate.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
        page: 0,
        size: 100, // BE limit: max 100 (see TransactionHistoryService.validateRequest)
        sortBy: 'transactionDate',
        sortDirection: 'desc',
      });
      return result.content;
    },
    retry: 1,
    retryDelay: 1000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (days: number) => {
    if (days < 0) return <Badge variant="destructive">Đã hết hạn</Badge>;
    if (days <= 7) return <Badge variant="destructive">Hết hạn trong {days} ngày</Badge>;
    if (days <= 30) return <Badge className="bg-orange-500">Còn {days} ngày</Badge>;
    return <Badge variant="outline">Còn {days} ngày</Badge>;
  };

  const getStockStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      OUT_OF_STOCK: { variant: 'destructive', label: 'Hết hàng' },
      LOW_STOCK: { variant: 'destructive', label: 'Sắp hết' },
      NORMAL: { variant: 'default', label: 'Bình thường' },
      OVERSTOCK: { variant: 'outline', label: 'Dư thừa' },
    };
    const cfg = config[status] || config.NORMAL;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const inventoryItems = Array.isArray(inventorySummary) 
    ? inventorySummary 
    : (inventorySummary as any)?.content || [];

  return (
    // TODO: Re-enable permission check after BE adds VIEW_WAREHOUSE permission
    // <ProtectedRoute requiredPermissions={['VIEW_WAREHOUSE']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Báo Cáo & Thống Kê Kho</h1>
            <p className="text-slate-600 mt-1">Phân tích chi tiết về tồn kho, giao dịch và cảnh báo</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 ngày qua</SelectItem>
                <SelectItem value="30days">30 ngày qua</SelectItem>
                <SelectItem value="90days">90 ngày qua</SelectItem>
                <SelectItem value="custom">Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Report Tabs */}
        <Tabs value={activeReport} onValueChange={(v) => setActiveReport(v as ReportType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBoxes} className="h-4 w-4" />
              Tồn Kho
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClipboard} className="h-4 w-4" />
              Giao Dịch
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
              Sắp Hết Hạn
            </TabsTrigger>
          </TabsList>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Báo Cáo Tồn Kho Chi Tiết</CardTitle>
                  <Select value={warehouseFilter} onValueChange={(v) => setWarehouseFilter(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả kho</SelectItem>
                      <SelectItem value="COLD">❄️ Kho lạnh</SelectItem>
                      <SelectItem value="NORMAL">📦 Kho thường</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : inventoryError ? (
                  <div className="text-center py-8 text-red-500">
                    <p className="font-semibold">Không thể tải dữ liệu tồn kho</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {(inventoryError as any)?.response?.data?.message || 'Vui lòng thử lại sau'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Mã Vật Tư</th>
                          <th className="text-left py-3 px-4">Tên Vật Tư</th>
                          <th className="text-center py-3 px-4">Loại Kho</th>
                          <th className="text-right py-3 px-4">Tồn Kho</th>
                          <th className="text-right py-3 px-4">Min/Max</th>
                          <th className="text-center py-3 px-4">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryItems.map((item: any) => (
                          <tr key={item.id || item.itemMasterId} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-sm">{item.itemCode}</td>
                            <td className="py-3 px-4">{item.itemName}</td>
                            <td className="py-3 px-4 text-center">
                              {item.warehouseType === 'COLD' ? '❄️ Lạnh' : '📦 Thường'}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {item.currentStock || item.totalQuantity || 0}
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-600">
                              {item.minStockLevel} / {item.maxStockLevel}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getStockStatusBadge(item.stockStatus || 'NORMAL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {inventoryItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Không có dữ liệu
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Report */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Import Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClipboard} className="h-5 w-5 text-blue-500" />
                    Phiếu Nhập Kho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="text-center py-6 text-gray-500 text-sm">Đang tải...</div>
                  ) : transactionsError ? (
                    <div className="text-center py-6 text-red-500 text-sm">
                      <p className="font-semibold">Không thể tải giao dịch</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(transactionsError as any)?.message || 
                         (transactionsError as any)?.response?.data?.message || 
                         'Vui lòng thử lại sau'}
                      </p>
                      {(transactionsError as any)?.status && (
                        <p className="text-xs text-gray-400 mt-1">
                          Status: {(transactionsError as any).status}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions
                        .filter((tx: StorageTransaction) => tx.transactionType === 'IMPORT')
                        .map((txn) => {
                          const totalItems =
                            txn.items?.reduce(
                              (sum, item) => sum + Math.max(item.quantityChange, 0),
                              0
                            ) ?? 0;
                          return (
                            <div
                              key={txn.transactionId}
                              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold">{txn.supplierName || 'N/A'}</p>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(txn.transactionDate)}
                                  </p>
                                </div>
                                {totalItems > 0 && (
                                  <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                                    +{totalItems} dòng vật tư
                                  </Badge>
                                )}
                              </div>
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Mã phiếu</span>
                                <span className="font-mono text-gray-800">
                                  {txn.transactionCode || '-'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      {transactions.filter((tx) => tx.transactionType === 'IMPORT').length === 0 && (
                        <div className="text-center text-sm text-gray-500 py-4">
                          Chưa có giao dịch nhập kho.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClipboard} className="h-5 w-5 text-orange-500" />
                    Phiếu Xuất Kho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="text-center py-6 text-gray-500 text-sm">Đang tải...</div>
                  ) : transactionsError ? (
                    <div className="text-center py-6 text-red-500 text-sm">
                      <p className="font-semibold">Không thể tải giao dịch</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(transactionsError as any)?.message || 
                         (transactionsError as any)?.response?.data?.message || 
                         'Vui lòng thử lại sau'}
                      </p>
                      {(transactionsError as any)?.status && (
                        <p className="text-xs text-gray-400 mt-1">
                          Status: {(transactionsError as any).status}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions
                        .filter((tx: StorageTransaction) => tx.transactionType === 'EXPORT')
                        .map((txn) => {
                          const totalItems =
                            txn.items?.reduce(
                              (sum, item) => sum + Math.abs(item.quantityChange),
                              0
                            ) ?? 0;
                          return (
                            <div
                              key={txn.transactionId}
                              className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold">{txn.notes || 'Phiếu xuất kho'}</p>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(txn.transactionDate)}
                                  </p>
                                </div>
                                {totalItems > 0 && (
                                  <Badge variant="outline" className="bg-white text-orange-700 border-orange-300">
                                    -{totalItems} dòng vật tư
                                  </Badge>
                                )}
                              </div>
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Mã phiếu</span>
                                <span className="font-mono text-gray-800">
                                  {txn.transactionCode || '-'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      {transactions.filter((tx) => tx.transactionType === 'EXPORT').length === 0 && (
                        <div className="text-center text-sm text-gray-500 py-4">
                          Chưa có giao dịch xuất kho.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expiring Items Report */}
          <TabsContent value="expiring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-red-500" />
                  Danh Sách Vật Tư Sắp Hết Hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringLoading ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : expiringError ? (
                  <div className="text-center py-8 text-red-500">
                    <p className="font-semibold">Không thể tải cảnh báo hết hạn</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {(expiringError as any)?.response?.data?.message || 'Vui lòng thử lại sau'}
                    </p>
                  </div>
                ) : expiringAlertsData && expiringAlertsData.alerts && expiringAlertsData.alerts.length > 0 ? (
                  <div className="space-y-4">
                    {/* Stats Summary */}
                    {expiringAlertsData.stats && (
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold">{expiringAlertsData.stats.totalAlerts}</div>
                            <div className="text-sm text-gray-500">Tổng cảnh báo</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-600">{expiringAlertsData.stats.expiredCount}</div>
                            <div className="text-sm text-gray-500">Đã hết hạn</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-orange-600">{expiringAlertsData.stats.criticalCount}</div>
                            <div className="text-sm text-gray-500">Nguy cấp (0-7 ngày)</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-600">{expiringAlertsData.stats.expiringSoonCount}</div>
                            <div className="text-sm text-gray-500">Sắp hết hạn (7-30 ngày)</div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Mã Vật Tư</th>
                            <th className="text-left py-3 px-4">Tên Vật Tư</th>
                            <th className="text-left py-3 px-4">Lô</th>
                            <th className="text-right py-3 px-4">Số Lượng</th>
                            <th className="text-center py-3 px-4">Hạn Sử Dụng</th>
                            <th className="text-center py-3 px-4">Còn Lại</th>
                            <th className="text-center py-3 px-4">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expiringAlertsData.alerts.map((alert: any) => {
                            const daysRemaining = alert.daysRemaining ?? 0;
                            const status = alert.status || (daysRemaining < 0 ? 'EXPIRED' : daysRemaining <= 7 ? 'CRITICAL' : 'EXPIRING_SOON');

                            return (
                              <tr key={alert.batchId} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-mono text-sm">{alert.itemCode}</td>
                                <td className="py-3 px-4">{alert.itemName}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{alert.lotNumber}</td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {alert.quantityOnHand} {alert.unitName}
                                </td>
                                <td className="py-3 px-4 text-center text-sm">
                                  {alert.expiryDate ? formatDate(alert.expiryDate) : 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`font-semibold ${
                                    status === 'EXPIRED' ? 'text-red-600' :
                                    status === 'CRITICAL' ? 'text-orange-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {daysRemaining < 0 ? `-${Math.abs(daysRemaining)}` : daysRemaining} ngày
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {status === 'EXPIRED' ? (
                                    <Badge variant="destructive">Đã hết hạn</Badge>
                                  ) : status === 'CRITICAL' ? (
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">Nguy cấp</Badge>
                                  ) : (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Sắp hết hạn</Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FontAwesomeIcon icon={faClock} className="h-12 w-12 mb-2 opacity-20" />
                    <p>Không có vật tư sắp hết hạn</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    // </ProtectedRoute>
  );
}


