'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';
import { Loader2, AlertCircle, Warehouse, Package, AlertTriangle, Info } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { WarehouseStatistics } from '@/types/dashboard';
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

interface WarehouseTabProps {
  startDate: string;
  endDate: string;
}

const COLORS = ['#8b5fbf', '#10b981', '#f59e0b', '#ef4444'];

export function WarehouseTab({ startDate, endDate }: WarehouseTabProps) {
  const [data, setData] = useState<WarehouseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getWarehouse({
        startDate,
        endDate,
      });
      setData(result);
    } catch (err: any) {
      console.error('Error loading warehouse:', err);
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

  const transactionByStatusData = [
    { name: 'Chờ duyệt', value: data.transactions.byStatus.pending },
    { name: 'Đã duyệt', value: data.transactions.byStatus.approved },
    { name: 'Từ chối', value: data.transactions.byStatus.rejected },
    { name: 'Đã hủy', value: data.transactions.byStatus.cancelled },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng giao ddịch"
          value={data.transactions.total}
          icon={<Warehouse className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Giá trị tồn kho"
          value={data.inventory.currentTotalValue}
          icon={<Package className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Vật tư sắp hết"
          value={data.inventory.lowStockItems}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Vật tư sắp hết hạn"
          value={data.inventory.expiringItems}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Transaction Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Giao Dịch Theo Ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {data.transactions.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.transactions.byDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5fbf"
                    name="Số lượng"
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

        {/* Transactions by Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Giao dịch kho theo trạng thái</CardTitle>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Thống kê trạng thái của các giao dịch xuất/nhập kho trong tháng
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transactionByStatusData}
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
                    {transactionByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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

      {/* Top Imports */}
      {data.topImports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 vật tư nhập nhiều nhất</CardTitle>
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
                  {data.topImports.map((item, index) => (
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

      {/* Top Exports */}
      {data.topExports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 vật tư xuất nhiều nhất</CardTitle>
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
                  {data.topExports.map((item, index) => (
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



