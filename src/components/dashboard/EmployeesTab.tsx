'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, UserCheck, Calendar } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { EmployeeStatistics } from '@/types/dashboard';
import {
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

interface EmployeesTabProps {
  month: string;
}

const COLORS = ['#8b5fbf', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function EmployeesTab({ month }: EmployeesTabProps) {
  const [data, setData] = useState<EmployeeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getEmployees(month, 10);
      setData(result);
    } catch (err: any) {
      console.error('Error loading employees:', err);
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

  // Group time-off types: show 3 main types + "Other" (grouping emergencyLeave + other)
  const timeOffByTypeData = [
    { name: 'Có phép', value: data.timeOff.byType.paidLeave?.days || 0 },
    { name: 'Nghỉ ốm', value: data.timeOff.byType.sickLeave?.days || 0 },
    { name: 'Không phép', value: data.timeOff.byType.unpaidLeave?.days || 0 },
    {
      name: 'Khác',
      value: (data.timeOff.byType.emergencyLeave?.days || 0) + 
             (data.timeOff.byType.other?.days || 0)
    }
  ].filter((item) => item.value > 0);

  const timeOffByStatusData = [
    { name: 'Chờ duyệt', value: data.timeOff.byStatus.pending },
    { name: 'Đã duyệt', value: data.timeOff.byStatus.approved },
    { name: 'Từ chối', value: data.timeOff.byStatus.rejected },
    { name: 'Đã hủy', value: data.timeOff.byStatus.cancelled },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Doctors Table */}
      {data.topDoctors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 bác sĩ năng suất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">STT</th>
                    <th className="text-left p-2">Mã NV</th>
                    <th className="text-left p-2">Tên bác sĩ</th>
                    <th className="text-right p-2">Số ca</th>
                    <th className="text-right p-2">Doanh thu</th>
                    <th className="text-right p-2">TB/Ca</th>
                    <th className="text-right p-2">Số dịch vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topDoctors.map((doctor, index) => (
                    <tr key={doctor.employeeId} className="border-b hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{doctor.employeeCode}</td>
                      <td className="p-2">{doctor.fullName}</td>
                      <td className="text-right p-2">{doctor.appointmentCount}</td>
                      <td className="text-right p-2">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(doctor.totalRevenue)}
                      </td>
                      <td className="text-right p-2">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(doctor.averageRevenuePerAppointment)}
                      </td>
                      <td className="text-right p-2">{doctor.serviceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Doctors Chart */}
      {data.topDoctors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top bác sĩ theo doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.topDoctors.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fullName" angle={-45} textAnchor="end" height={100} />
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
                <Bar dataKey="totalRevenue" fill="#8b5fbf" name="Doanh Thu" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Time-Off Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time-Off by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Nghỉ phép theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            {timeOffByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={timeOffByTypeData}
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
                    {timeOffByTypeData.map((entry, index) => (
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

        {/* Time-Off by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Nghỉ phép theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            {timeOffByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeOffByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5fbf" name="Số lượng" />
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

      {/* Top Employees by Time-Off */}
      {data.timeOff.topEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 nhân viên nghỉ nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">STT</th>
                    <th className="text-left p-2">Mã NV</th>
                    <th className="text-left p-2">Tên nhân viên</th>
                    <th className="text-right p-2">Tổng ngày nghỉ</th>
                    <th className="text-right p-2">Số yêu cầu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeOff.topEmployees.map((emp, index) => (
                    <tr key={emp.employeeId} className="border-b hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{emp.employeeCode}</td>
                      <td className="p-2">{emp.fullName}</td>
                      <td className="text-right p-2">{emp.totalDays} ngày</td>
                      <td className="text-right p-2">{emp.requests}</td>
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



