'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TruckIcon, Package, AlertTriangle } from 'lucide-react';
import { warehouseAnalyticsService } from '@/services/warehouseService';
import CreateImportModal from '../components/CreateImportModal';
import CreateExportModal from '../components/CreateExportModal';

export default function StorageInOutPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'reports'>('import');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['storageStats'],
    queryFn: () => warehouseAnalyticsService.getStorageStats(),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Xuất/Nhập Kho</h1>
        <p className="text-slate-600 mt-1">Quản lý giao dịch nhập/xuất kho & báo cáo</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Nhập Tháng</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.monthly_import_value?.toLocaleString('vi-VN') || 0} đ</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Xuất Tháng</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.monthly_export_value?.toLocaleString('vi-VN') || 0} đ</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Tổng GD</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.total_transactions_count || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Tăng trưởng</CardTitle></CardHeader>
          <CardContent><Badge>{stats?.import_growth_percent?.toFixed(1) || 0}%</Badge></CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import"><Package className="h-4 w-4 mr-2" />Phiếu Nhập</TabsTrigger>
          <TabsTrigger value="export"><TruckIcon className="h-4 w-4 mr-2" />Phiếu Xuất</TabsTrigger>
          <TabsTrigger value="reports"><AlertTriangle className="h-4 w-4 mr-2" />Báo Cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh Sách Phiếu Nhập</CardTitle>
              <Button onClick={() => setIsImportModalOpen(true)}><Package className="h-4 w-4 mr-2" />Tạo Phiếu Nhập</Button>
            </CardHeader>
            <CardContent><p className="text-center py-12 text-slate-500">Chưa có phiếu nhập</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh Sách Phiếu Xuất (FEFO)</CardTitle>
              <Button onClick={() => setIsExportModalOpen(true)}><TruckIcon className="h-4 w-4 mr-2" />Tạo Phiếu Xuất</Button>
            </CardHeader>
            <CardContent><p className="text-center py-12 text-slate-500">Chưa có phiếu xuất</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Báo Cáo Thất Thoát</CardTitle></CardHeader>
            <CardContent><p className="text-center py-12 text-emerald-600">✓ Không có thất thoát</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <CreateExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
