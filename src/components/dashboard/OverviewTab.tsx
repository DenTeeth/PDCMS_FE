'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { AlertBadge } from './AlertBadge';
import { HeatmapChart } from './HeatmapChart';
import { Loader2, AlertCircle, DollarSign, TrendingDown, TrendingUp, Receipt, Calendar, Users, UserPlus, AlertTriangle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { DashboardOverview } from '@/types/dashboard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface OverviewTabProps {
  startDate: string;
  endDate: string;
  compareWithPrevious: boolean;
  comparisonMode?: string;
}

const COLORS = ['#8b5fbf', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function OverviewTab({ startDate, endDate, compareWithPrevious, comparisonMode }: OverviewTabProps) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ NEW: View mode toggle (table/chart)
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    loadData();
  }, [startDate, endDate, compareWithPrevious, comparisonMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getOverview({
        startDate,
        endDate,
        compareWithPrevious,
        comparisonMode: comparisonMode || 'PREVIOUS_MONTH',
      });
      setData(result);
    } catch (err: any) {
      console.error('Error loading overview:', err);
      setError(
        err.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b5fbf]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Không có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const revenueExpenseChartData = compareWithPrevious
    ? [
        {
          name: 'Tháng trước',
          DoanhThu: data.revenue.previous,
          ChiPhi: data.expenses.previous,
        },
        {
          name: 'Tháng này',
          DoanhThu: data.revenue.current,
          ChiPhi: data.expenses.current,
        },
      ]
    : [
        {
          name: 'Tháng này',
          DoanhThu: data.revenue.current,
          ChiPhi: data.expenses.current,
        },
      ];

  const invoiceStatusData = [
    { name: 'Đã thanh toán', value: data.invoices.paid, color: '#10b981' },
    { name: 'Chờ thanh toán', value: data.invoices.pending, color: '#f59e0b' },
    { name: 'Quá hạn', value: data.invoices.overdue || 0, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const appointmentStatusData = [
    { name: 'Đã đặt lịch', value: data.appointments.scheduled || 0, color: '#3b82f6' },
    { name: 'Hoàn thành', value: data.appointments.completed || 0, color: '#10b981' },
    { name: 'Đã hủy', value: data.appointments.cancelled || 0, color: '#ef4444' },
    // ❌ Removed: checkedIn, inProgress, cancelledLate, noShow
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* ✅ NEW: Alerts Section */}
      {data.alerts && data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Cảnh báo ({data.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.alerts.map((alert, index) => (
                <AlertBadge key={index} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={data.summary.totalRevenue}
          icon={<DollarSign className="h-6 w-6" />}
          change={
            compareWithPrevious
              ? {
                  value: data.revenue.change,
                  percent: data.revenue.changePercent,
                }
              : undefined
          }
          color="green"
        />
        <StatCard
          title="Tổng chi phí"
          value={data.summary.totalExpenses}
          icon={<TrendingDown className="h-6 w-6" />}
          change={
            compareWithPrevious
              ? {
                  value: data.expenses.change,
                  percent: data.expenses.changePercent,
                }
              : undefined
          }
          color="red"
        />
        <StatCard
          title="Lợi nhuận gộp"
          value={data.summary.netProfit}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Tổng số hóa đơn"
          value={data.summary.totalInvoices}
          icon={<Receipt className="h-6 w-6" />}
          subtitle={`${data.invoices.paid}/${data.invoices.total} đã thanh toán`}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Tổng số buổi hẹn"
          value={data.summary.totalAppointments}
          icon={<Calendar className="h-6 w-6" />}
          subtitle={`${data.appointments.completed} hoàn thành`}
          color="orange"
        />
        <StatCard
          title="Tổng bệnh nhân"
          value={data.summary.totalPatients}
          icon={<Users className="h-6 w-6" />}
          subtitle="Trong hệ thống"
          color="blue"
        />
        <StatCard
          title="Bệnh nhân mới"
          value={data.summary.newPatientsThisMonth}
          icon={<UserPlus className="h-6 w-6" />}
          subtitle="Tháng này"
          color="green"
        />
      </div>

      {/* Charts */}
      {/* ✅ NEW: Charts Section with View Toggle */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Biểu đồ thống kê</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              onClick={() => setViewMode('chart')}
              className={viewMode === 'chart' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
            >
              <PieChartIcon className="h-4 w-4 mr-2" />
              Biểu đồ
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Bảng
            </Button>
          </div>
        </div>

        {viewMode === 'chart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu & chi phí</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueExpenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Bar dataKey="DoanhThu" fill="#10b981" name="Doanh thu" />
                    <Bar dataKey="ChiPhi" fill="#ef4444" name="Chi phí" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Invoice Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái hóa đơn</CardTitle>
              </CardHeader>
              <CardContent>
                {invoiceStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={invoiceStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // @ts-ignore - Recharts PieLabel type is incorrect
                        label={(props: any) =>
                          `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {invoiceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          `${value} hóa đơn`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Không có dữ liệu hóa đơn
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái lịch hẹn</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // @ts-ignore - Recharts PieLabel type is incorrect
                        label={(props: any) =>
                          `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {appointmentStatusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          `${value} lịch hẹn`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Không có dữ liệu lịch hẹn
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Heatmap temporarily disabled - heatmapData not available in API */}
          </div>
        ) : (
          /* ✅ Table View */
          <Card>
            <CardHeader>
              <CardTitle>Dữ liệu chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue & Expenses Table */}
                <div>
                  <h4 className="font-semibold mb-2">Doanh thu & Chi phí</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Kỳ</th>
                          <th className="border p-2 text-right">Doanh thu</th>
                          <th className="border p-2 text-right">Chi phí</th>
                          <th className="border p-2 text-right">Lợi nhuận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueExpenseChartData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="border p-2">{row.name}</td>
                            <td className="border p-2 text-right text-green-600">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.DoanhThu)}
                            </td>
                            <td className="border p-2 text-right text-red-600">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.ChiPhi)}
                            </td>
                            <td className="border p-2 text-right font-semibold">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.DoanhThu - row.ChiPhi)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Status Table */}
                <div>
                  <h4 className="font-semibold mb-2">Trạng thái hóa đơn</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Trạng thái</th>
                          <th className="border p-2 text-right">Số lượng</th>
                          <th className="border p-2 text-right">Tỷ lệ (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceStatusData.map((row, idx) => {
                          const total = invoiceStatusData.reduce((sum, item) => sum + item.value, 0);
                          const percent = ((row.value / total) * 100).toFixed(1);
                          return (
                            <tr key={idx}>
                              <td className="border p-2 flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: row.color }}></div>
                                {row.name}
                              </td>
                              <td className="border p-2 text-right">{row.value}</td>
                              <td className="border p-2 text-right">{percent}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Appointment Status Table */}
                <div>
                  <h4 className="font-semibold mb-2">Trạng thái lịch hẹn</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Trạng thái</th>
                          <th className="border p-2 text-right">Số lượng</th>
                          <th className="border p-2 text-right">Tỷ lệ (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointmentStatusData.map((row, idx) => {
                          const total = appointmentStatusData.reduce((sum, item) => sum + item.value, 0);
                          const percent = ((row.value / total) * 100).toFixed(1);
                          return (
                            <tr key={idx}>
                              <td className="border p-2 flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: row.color }}></div>
                                {row.name}
                              </td>
                              <td className="border p-2 text-right">{row.value}</td>
                              <td className="border p-2 text-right">{percent}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}



