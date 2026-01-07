'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';
import { Loader2, AlertCircle, DollarSign, TrendingDown, TrendingUp, Receipt, Calendar, Users, UserCheck, AlertTriangle } from 'lucide-react';
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
  month: string;
  compareWithPrevious: boolean;
}

const COLORS = ['#8b5fbf', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function OverviewTab({ month, compareWithPrevious }: OverviewTabProps) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [month, compareWithPrevious]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getOverview(month, compareWithPrevious);
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
    { name: 'Đã hủy', value: data.invoices.cancelled, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const appointmentStatusData = [
    { name: 'Đã đặt lịch', value: data.appointments.scheduled || 0, color: '#3b82f6' },
    { name: 'Đã check-in', value: data.appointments.checkedIn || 0, color: '#8b5cf6' },
    { name: 'Đang điều trị', value: data.appointments.inProgress || 0, color: '#f59e0b' },
    { name: 'Hoàn thành', value: data.appointments.completed || 0, color: '#10b981' },
    { name: 'Đã hủy', value: data.appointments.cancelled || 0, color: '#ef4444' },
    { name: 'Hủy muộn', value: data.appointments.cancelledLate || 0, color: '#dc2626' },
    { name: 'Không đến', value: data.appointments.noShow || 0, color: '#6b7280' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
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
          title="Tổng số invoice"
          value={data.summary.totalInvoices}
          icon={<Receipt className="h-6 w-6" />}
          subtitle={`${data.invoices.paidPercent.toFixed(1)}% đã thanh toán`}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng số appointment"
          value={data.summary.totalAppointments}
          icon={<Calendar className="h-6 w-6" />}
          subtitle={`${data.appointments.completionRate.toFixed(1)}% hoàn thành`}
          color="orange"
        />
        <StatCard
          title="Tổng số bệnh nhân"
          value={data.summary.totalPatients}
          icon={<Users className="h-6 w-6" />}
          color="pink"
        />
        <StatCard
          title="Tổng số nhân viên"
          value={data.summary.totalEmployees}
          icon={<UserCheck className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Công nợ"
          value={data.invoices.debt}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* Charts */}
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
            <CardTitle>Trạng thái invoice</CardTitle>
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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

      {/* Appointment Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái appointment</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Số lượng" fill="#8b5fbf" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



