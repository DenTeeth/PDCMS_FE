'use client';

/**
 * Storage In/Out Page - V3 API (Transactions Management)
 * ✅ Verified against Swagger API
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload, faUpload, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { storageTransactionService, warehouseAnalyticsService } from '@/services/warehouseService';
import CreateImportModal from '../components/CreateImportModal';
import CreateExportModal from '../components/CreateExportModal';

export default function StorageInOutPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'reports'>('import');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Dashboard Stats
  const { data: stats } = useQuery({
    queryKey: ['storageStats'],
    queryFn: () => warehouseAnalyticsService.getStorageStats(),
  });

  // Import Transactions
  const { data: imports = [] } = useQuery({
    queryKey: ['transactions', 'import'],
    queryFn: async () => {
      const response = await storageTransactionService.getAll({
        transaction_type: 'IMPORT',
        page: 0,
        size: 20,
      });
      return response.content || [];
    },
  });

  // Export Transactions
  const { data: exports = [] } = useQuery({
    queryKey: ['transactions', 'export'],
    queryFn: async () => {
      const response = await storageTransactionService.getAll({
        transaction_type: 'EXPORT',
        page: 0,
        size: 20,
      });
      return response.content || [];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Xuất/Nhập Kho</h1>
        <p className="text-slate-600 mt-1">Quản lý giao dịch nhập/xuất kho & báo cáo</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nhập kho tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.monthly_import_value || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(stats?.import_growth_percent ?? 0) > 0 ? '+' : ''}{stats?.import_growth_percent ?? 0}% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Xuất kho tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.monthly_export_value || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(stats?.export_growth_percent ?? 0) > 0 ? '+' : ''}{stats?.export_growth_percent ?? 0}% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_transactions_count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chênh lệch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.monthly_import_value || 0) - (stats?.monthly_export_value || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency((stats?.monthly_import_value || 0) - (stats?.monthly_export_value || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">
            <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-2" />
            Phiếu Nhập
          </TabsTrigger>
          <TabsTrigger value="export">
            <FontAwesomeIcon icon={faUpload} className="h-4 w-4 mr-2" />
            Phiếu Xuất
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4 mr-2" />
            Báo cáo
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh sách phiếu nhập</CardTitle>
              <Button onClick={() => setIsImportModalOpen(true)}>
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                Tạo phiếu nhập
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Mã phiếu</th>
                      <th className="text-left p-3">Ngày</th>
                      <th className="text-left p-3">Nhà cung cấp</th>
                      <th className="text-right p-3">Tổng giá trị</th>
                      <th className="text-left p-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((txn: any) => (
                      <tr key={txn.transaction_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{txn.transaction_code}</td>
                        <td className="p-3">{formatDate(txn.transaction_date)}</td>
                        <td className="p-3">{txn.supplier_name || '-'}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          {formatCurrency(txn.total_value)}
                        </td>
                        <td className="p-3 text-sm text-gray-600">{txn.notes || '-'}</td>
                      </tr>
                    ))}
                    {imports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Chưa có phiếu nhập nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh sách phiếu xuất</CardTitle>
              <Button onClick={() => setIsExportModalOpen(true)}>
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                Tạo phiếu xuất
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Mã phiếu</th>
                      <th className="text-left p-3">Ngày</th>
                      <th className="text-right p-3">Tổng giá trị</th>
                      <th className="text-left p-3">Người thực hiện</th>
                      <th className="text-left p-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exports.map((txn: any) => (
                      <tr key={txn.transaction_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{txn.transaction_code}</td>
                        <td className="p-3">{formatDate(txn.transaction_date)}</td>
                        <td className="p-3 text-right font-bold text-red-600">
                          {formatCurrency(txn.total_value)}
                        </td>
                        <td className="p-3">{txn.performed_by_name || '-'}</td>
                        <td className="p-3 text-sm text-gray-600">{txn.notes || '-'}</td>
                      </tr>
                    ))}
                    {exports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Chưa có phiếu xuất nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo & Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Chức năng báo cáo đang phát triển...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <CreateExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
