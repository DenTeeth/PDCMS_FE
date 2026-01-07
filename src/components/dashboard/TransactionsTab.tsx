'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';
import { Loader2, AlertCircle, Receipt, CreditCard, AlertTriangle } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { TransactionStatistics } from '@/types/dashboard';
import {
  LineChart,
  Line,
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

interface TransactionsTabProps {
  month: string;
}

const COLORS = ['#8b5fbf', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function TransactionsTab({ month }: TransactionsTabProps) {
  const [data, setData] = useState<TransactionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getTransactions(month);
      setData(result);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
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

  const invoiceByStatusData = [
    {
      name: 'Chờ thanh toán',
      value: data.invoices.byStatus.pendingPayment.count,
      color: '#f59e0b',
    },
    {
      name: 'Thanh toán một phần',
      value: data.invoices.byStatus.partialPaid.count,
      color: '#3b82f6',
    },
    {
      name: 'Đã thanh toán',
      value: data.invoices.byStatus.paid.count,
      color: '#10b981',
    },
    {
      name: 'Đã hủy',
      value: data.invoices.byStatus.cancelled.count,
      color: '#ef4444',
    },
  ].filter((item) => item.value > 0);

  const invoiceByTypeData = [
    { name: 'Appointment', value: data.invoices.byType.appointment.count },
    { name: 'Treatment Plan', value: data.invoices.byType.treatmentPlan.count },
    { name: 'Supplemental', value: data.invoices.byType.supplemental.count },
  ].filter((item) => item.value > 0);

  const paymentByMethodData = [
    { name: 'Chuyển khoản', value: data.payments.byMethod.bankTransfer.count },
    { name: 'Tiền mặt', value: data.payments.byMethod.cash.count },
    { name: 'Thẻ', value: data.payments.byMethod.card.count },
    { name: 'Khác', value: data.payments.byMethod.other.count },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng ssố Invoice"
          value={data.invoices.total}
          icon={<Receipt className="h-6 w-6" />}
          subtitle={`${data.invoices.paymentRate.toFixed(1)}% thanh toán`}
          color="purple"
        />
        <StatCard
          title="Tổng giá trị Invoice"
          value={data.invoices.totalValue}
          icon={<Receipt className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Tổng số payment"
          value={data.payments.total}
          icon={<CreditCard className="h-6 w-6" />}
          color="green"
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
        {/* Invoice by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceByStatusData}
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
                    {invoiceByStatusData.map((entry, index) => (
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

        {/* Invoice by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceByTypeData}
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
                    {invoiceByTypeData.map((entry, index) => (
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

      {/* Payment Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment by Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment theo phương thức</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentByMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentByMethodData}
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
                    {paymentByMethodData.map((entry, index) => (
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

        {/* Payment by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Payment theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {data.payments.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.payments.byDay}>
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
                    dataKey="value"
                    stroke="#10b981"
                    name="Giá trị"
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
    </div>
  );
}



