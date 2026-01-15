'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeInput } from '@/components/ui/date-range-input';
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
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { dashboardService } from '@/services/dashboardService';
import { DashboardTab, DashboardFilters, DashboardSavedView } from '@/types/dashboard';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { RevenueExpensesTab } from '@/components/dashboard/RevenueExpensesTab';
import { EmployeesTab } from '@/components/dashboard/EmployeesTab';
import { WarehouseTab } from '@/components/dashboard/WarehouseTab';
import { TransactionsTab } from '@/components/dashboard/TransactionsTab';
import { FeedbacksTab } from '@/components/dashboard/FeedbacksTab';
import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters';
import { SavedViewsManager } from '@/components/dashboard/SavedViewsManager';

// Quick date range presets
const getDateRangePreset = (preset: string) => {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: format(now, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    case 'week':
      return { from: format(startOfWeek(now), 'yyyy-MM-dd'), to: format(endOfWeek(now), 'yyyy-MM-dd') };
    case 'month':
      return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { from: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), to: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
    case 'year':
      return { from: format(startOfYear(now), 'yyyy-MM-dd'), to: format(endOfYear(now), 'yyyy-MM-dd') };
    default:
      return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
};

export default function StatisticsPage() {
  const { user } = useAuth();
  // ✅ NEW: Date range instead of month
  const [dateRange, setDateRange] = useState(getDateRangePreset('month'));
  const [datePreset, setDatePreset] = useState<string>('month');
  
  // ✅ NEW: Comparison mode
  const [comparisonMode, setComparisonMode] = useState<string>('PREVIOUS_MONTH');
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(true);
  
  // ✅ NEW: Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState<DashboardFilters>({
    employeeIds: [],
    patientIds: [],
    serviceIds: [],
  });
  
  // ✅ NEW: Saved views
  const [savedViews, setSavedViews] = useState<DashboardSavedView[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedViews, setShowSavedViews] = useState(false);
  
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [exporting, setExporting] = useState<boolean>(false);
  
  // ✅ NEW: Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      
      // Determine if we should use month or date range
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      
      // Check if it's a full month (same month, from 1st to last day)
      const isFullMonth = 
        fromDate.getDate() === 1 &&
        toDate.getDate() === new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate() &&
        fromDate.getMonth() === toDate.getMonth() &&
        fromDate.getFullYear() === toDate.getFullYear();
      
      let exportParams: { month?: string; startDate?: string; endDate?: string };
      
      if (isFullMonth) {
        // Use month format for full months
        const monthFormat = format(fromDate, 'yyyy-MM');
        exportParams = { month: monthFormat };
      } else {
        // Use date range for custom ranges
        exportParams = {
          startDate: format(fromDate, 'yyyy-MM-dd'),
          endDate: format(toDate, 'yyyy-MM-dd'),
        };
      }
      
      await dashboardService.downloadExcel(tab, exportParams);
      
      const successMessage = isFullMonth
        ? `Đã xuất báo cáo ${format(fromDate, 'MM/yyyy')} thành công!`
        : `Đã xuất báo cáo từ ${format(fromDate, 'dd/MM/yyyy')} đến ${format(toDate, 'dd/MM/yyyy')} thành công!`;
      
      toast.success(successMessage);
    } catch (error: any) {
      console.error('❌ Export error:', error);
      
      // Extract error message - service already handles blob parsing
      let errorMessage = 'Không thể xuất báo cáo. Vui lòng thử lại sau.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        // If response is blob, try to read it as text
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const json = JSON.parse(text);
            errorMessage = json.message || errorMessage;
          } catch {
            // If parsing fails, use default message
          }
        }
      }
      
      toast.error('Xuất báo cáo thất bại', {
        description: errorMessage,
      });
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard thống kê</h1>
            <p className="text-gray-600 mt-1">
              Thống kê và phân tích hoạt động phòng khám
            </p>
          </div>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Row 1: Quick filters and date range */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Quick date presets */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={datePreset === 'today' ? 'default' : 'outline'}
                  onClick={() => {
                    setDatePreset('today');
                    setDateRange(getDateRangePreset('today'));
                  }}
                  className={datePreset === 'today' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
                >
                  Hôm nay
                </Button>
                <Button
                  size="sm"
                  variant={datePreset === 'week' ? 'default' : 'outline'}
                  onClick={() => {
                    setDatePreset('week');
                    setDateRange(getDateRangePreset('week'));
                  }}
                  className={datePreset === 'week' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
                >
                  Tuần này
                </Button>
                <Button
                  size="sm"
                  variant={datePreset === 'month' ? 'default' : 'outline'}
                  onClick={() => {
                    setDatePreset('month');
                    setDateRange(getDateRangePreset('month'));
                  }}
                  className={datePreset === 'month' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
                >
                  Tháng này
                </Button>
                <Button
                  size="sm"
                  variant={datePreset === 'lastMonth' ? 'default' : 'outline'}
                  onClick={() => {
                    setDatePreset('lastMonth');
                    setDateRange(getDateRangePreset('lastMonth'));
                  }}
                  className={datePreset === 'lastMonth' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
                >
                  Tháng trước
                </Button>
                <Button
                  size="sm"
                  variant={datePreset === 'year' ? 'default' : 'outline'}
                  onClick={() => {
                    setDatePreset('year');
                    setDateRange(getDateRangePreset('year'));
                  }}
                  className={datePreset === 'year' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
                >
                  Năm nay
                </Button>
              </div>
              
              {/* Custom date range */}
              <div className="flex-1">
                <Label htmlFor="date-range" className="mb-2 block">
                  Khoảng thời gian tùy chỉnh
                </Label>
                <DateRangeInput
                  value={dateRange}
                  onChange={(range) => {
                    if (range.from && range.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                    setDatePreset('custom');
                  }}
                  placeholder="Chọn khoảng ngày"
                />
              </div>
            </div>
            
            {/* Row 2: Comparison, refresh, export */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Comparison mode */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="compare-toggle"
                    checked={compareWithPrevious}
                    onChange={(e) => setCompareWithPrevious(e.target.checked)}
                    className="h-4 w-4 text-[#8b5fbf] focus:ring-[#8b5fbf] border-gray-300 rounded"
                  />
                  <Label htmlFor="compare-toggle" className="cursor-pointer">
                    So sánh với
                  </Label>
                </div>
                {compareWithPrevious && (
                  <Select 
                    value={comparisonMode || 'PREVIOUS_MONTH'} 
                    onValueChange={setComparisonMode}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn kiểu so sánh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREVIOUS_MONTH">Tháng trước</SelectItem>
                      <SelectItem value="PREVIOUS_QUARTER">Quý trước</SelectItem>
                      <SelectItem value="PREVIOUS_YEAR">Năm trước</SelectItem>
                      <SelectItem value="SAME_PERIOD_LAST_YEAR">Cùng kỳ năm trước</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Auto-refresh */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 text-[#8b5fbf] focus:ring-[#8b5fbf] border-gray-300 rounded"
                />
                <Label htmlFor="auto-refresh" className="cursor-pointer text-sm">
                  Tự động làm mới (5 phút)
                </Label>
              </div>
              
              {/* Refresh button */}
              <Button
                onClick={() => window.location.reload()}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Làm mới
              </Button>
              
              {/* Toggle Filters & Views */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedViews(!showSavedViews)}
              >
                {showSavedViews ? 'Ẩn chế độ xem' : 'Chế độ xem'}
              </Button>
              
              {/* Export button */}
              <Button
                onClick={() => handleExport(activeTab as DashboardTab)}
                disabled={exporting}
                className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white"
                size="sm"
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
          </div>
        </CardContent>
      </Card>

      {/* ✅ NEW: Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          employees={[]}
          patients={[]}
          services={[]}
        />
      )}

      {/* ✅ NEW: Saved Views */}
      {showSavedViews && (
        <SavedViewsManager
          views={savedViews}
          onSaveView={(view) => {
            const newView: DashboardSavedView = {
              ...view,
              id: Date.now(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setSavedViews([...savedViews, newView]);
            toast.success('Đã lưu chế độ xem!');
          }}
          onLoadView={(view) => {
            setDateRange({ from: view.dateRange.startDate, to: view.dateRange.endDate });
            setAdvancedFilters(view.filters);
            toast.success(`Đã áp dụng chế độ xem "${view.name}"!`);
          }}
          onDeleteView={(viewId) => {
            setSavedViews(savedViews.filter(v => v.id !== viewId));
            toast.success('Đã xóa chế độ xem!');
          }}
          onSetDefaultView={(viewId) => {
            setSavedViews(savedViews.map(v => ({
              ...v,
              isDefault: v.id === viewId,
            })));
            toast.success('Đã đặt làm chế độ xem mặc định!');
          }}
          currentFilters={advancedFilters}
          currentDateRange={{ startDate: dateRange.from, endDate: dateRange.to }}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="feedbacks" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Góp ý</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            startDate={dateRange.from}
            endDate={dateRange.to}
            compareWithPrevious={compareWithPrevious}
            comparisonMode={comparisonMode}
          />
        </TabsContent>

        <TabsContent value="revenue-expenses" className="mt-6">
          <RevenueExpensesTab
            startDate={dateRange.from}
            endDate={dateRange.to}
            compareWithPrevious={compareWithPrevious}
            comparisonMode={comparisonMode}
          />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeesTab 
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>

        <TabsContent value="warehouse" className="mt-6">
          <WarehouseTab 
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab 
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>

        <TabsContent value="feedbacks" className="mt-6">
          <FeedbacksTab 
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>
      </Tabs>
      </div>
    </ProtectedRoute>
  );
}

