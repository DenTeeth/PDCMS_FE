'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';
import { Loader2, AlertCircle, DollarSign, TrendingDown, Info } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { RevenueExpenses } from '@/types/dashboard';
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

interface RevenueExpensesTabProps {
  startDate: string;
  endDate: string;
  compareWithPrevious: boolean;
  comparisonMode?: string;
}

const COLORS = ['#8b5fbf', '#10b981', '#f59e0b', '#ef4444'];

export function RevenueExpensesTab({
  startDate,
  endDate,
  compareWithPrevious,
  comparisonMode,
}: RevenueExpensesTabProps) {
  const [data, setData] = useState<RevenueExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, compareWithPrevious, comparisonMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getRevenueExpenses({
        startDate,
        endDate,
        compareWithPrevious,
        comparisonMode: comparisonMode || 'PREVIOUS_MONTH',
      });
      setData(result);
    } catch (err: any) {
      console.error('Error loading revenue/expenses:', err);
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

  const revenueByTypeData = [
    { name: 'Appointment', value: data.revenue.byType.appointment },
    { name: 'Treatment Plan', value: data.revenue.byType.treatmentPlan },
    { name: 'Supplemental', value: data.revenue.byType.supplemental },
  ].filter((item) => item.value > 0);

  const expenseByTypeData = [
    { name: 'Tiêu hao dịch vụ (Vật tư điều trị)', value: data.expenses.byType.serviceConsumption },
    { name: 'Hỏng (Vật tư bị hỏng)', value: data.expenses.byType.damaged },
    { name: 'Hết hạn (Vật tư hết hạn)', value: data.expenses.byType.expired },
    { name: 'Khác', value: data.expenses.byType.other },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={data.revenue.total}
          icon={<DollarSign className="h-6 w-6" />}
          change={
            data.comparison
              ? {
                  value: data.comparison.revenue.change,
                  percent: data.comparison.revenue.changePercent,
                }
              : undefined
          }
          color="green"
        />
        <StatCard
          title="Tổng chi phí"
          value={data.expenses.total}
          icon={<TrendingDown className="h-6 w-6" />}
          change={
            data.comparison
              ? {
                  value: data.comparison.expenses.change,
                  percent: data.comparison.expenses.changePercent,
                }
              : undefined
          }
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenue.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenue.byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Chi phí theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {data.expenses.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.expenses.byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#ef4444"
                    name="Chi Phí"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(value)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Type */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Chi phí theo loại</CardTitle>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Phân loại chi phí xuất kho theo mục đích sử dụng
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expenseByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(value)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Services Table */}
      {data.revenue.topServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 dịch vụ doanh thu cao nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">STT</th>
                    <th className="text-left p-2">Tên dịch vụ</th>
                    <th className="text-right p-2">Số lượng</th>
                    <th className="text-right p-2">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenue.topServices.map((service, index) => (
                    <tr key={service.serviceId} className="border-b hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{service.serviceName}</td>
                      <td className="text-right p-2">{service.count}</td>
                      <td className="text-right p-2">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(service.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Items Table */}
      {data.expenses.topItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 vật tư tiêu hao nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">STT</th>
                    <th className="text-left p-2">Tên vật tư</th>
                    <th className="text-right p-2">Số lượng</th>
                    <th className="text-right p-2">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.topItems.map((item, index) => (
                    <tr key={item.itemId} className="border-b hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{item.itemName}</td>
                      <td className="text-right p-2">{item.quantity}</td>
                      <td className="text-right p-2">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



