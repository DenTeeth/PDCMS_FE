'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  DollarSign,
  Users,
  Warehouse,
  Receipt,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { dashboardService } from '@/services/dashboardService';
import { DashboardTab } from '@/types/dashboard';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { RevenueExpensesTab } from '@/components/dashboard/RevenueExpensesTab';
import { EmployeesTab } from '@/components/dashboard/EmployeesTab';
import { WarehouseTab } from '@/components/dashboard/WarehouseTab';
import { TransactionsTab } from '@/components/dashboard/TransactionsTab';

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  return new Date().toISOString().substring(0, 7);
}

/**
 * Get previous month from given month
 */
function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 2, 1); // -2 because months are 0-indexed
  return date.toISOString().substring(0, 7);
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [exporting, setExporting] = useState<boolean>(false);

  // Debug: Log user roles and permissions
  useEffect(() => {
    if (user) {
      console.log('[Dashboard Statistics] User info:', {
        baseRole: user.baseRole,
        roles: user.roles,
        permissions: user.permissions,
      });
    }
  }, [user]);

  // Format month for display (MM/YYYY)
  const formatMonthDisplay = (month: string): string => {
    const [year, monthNum] = month.split('-');
    return `${monthNum}/${year}`;
  };

  // Handle Excel export
  const handleExport = async (tab: DashboardTab) => {
    try {
      setExporting(true);
      await dashboardService.downloadExcel(tab, selectedMonth);
      toast.success(`Đã xuất báo cáo ${formatMonthDisplay(selectedMonth)} thành công!`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(
        error.response?.data?.message ||
          'Không thể xuất báo cáo. Vui lòng thử lại sau.'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute 
      requiredBaseRole="admin" 
      requiredRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ADMIN', 'MANAGER']}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Thống Kê</h1>
            <p className="text-gray-600 mt-1">
              Thống kê và phân tích hoạt động phòng khám
            </p>
          </div>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="month-selector" className="mb-2 block">
                Chọn tháng
              </Label>
              <Input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="compare-toggle"
                checked={compareWithPrevious}
                onChange={(e) => setCompareWithPrevious(e.target.checked)}
                className="h-4 w-4 text-[#8b5fbf] focus:ring-[#8b5fbf] border-gray-300 rounded"
              />
              <Label htmlFor="compare-toggle" className="cursor-pointer">
                So sánh với tháng trước
              </Label>
            </div>
            <Button
              onClick={() => handleExport(activeTab as DashboardTab)}
              disabled={exporting}
              className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Xuất Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Tổng Quan</span>
          </TabsTrigger>
          <TabsTrigger value="revenue-expenses" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Doanh Thu</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Nhân Viên</span>
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            <span className="hidden sm:inline">Kho</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Giao Dịch</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            month={selectedMonth}
            compareWithPrevious={compareWithPrevious}
          />
        </TabsContent>

        <TabsContent value="revenue-expenses" className="mt-6">
          <RevenueExpensesTab
            month={selectedMonth}
            compareWithPrevious={compareWithPrevious}
          />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeesTab month={selectedMonth} />
        </TabsContent>

        <TabsContent value="warehouse" className="mt-6">
          <WarehouseTab month={selectedMonth} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab month={selectedMonth} />
        </TabsContent>
      </Tabs>
      </div>
    </ProtectedRoute>
  );
}

