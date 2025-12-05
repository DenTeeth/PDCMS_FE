'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

export default function PayrollPage() {
    const [selectedMonth, setSelectedMonth] = useState('2025-01');
    const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const payrollData = [
        {
            employeeId: 'EMP001',
            employeeName: 'BS. Nguyễn Văn A',
            role: 'Bác sĩ chính',
            totalRevenue: 45000000,
            commissionRate: 40,
            commissionAmount: 18000000,
            baseSalary: 15000000,
            advance: 5000000,
            netSalary: 28000000,
            status: 'Chưa chốt' as const,
            procedures: [
                { procedureId: 'P001', patientName: 'Nguyễn Thị B', serviceName: 'Cấy ghép Implant', price: 25000000, commissionRate: 40, commissionAmount: 10000000, date: '2025-01-15' },
                { procedureId: 'P002', patientName: 'Trần Văn C', serviceName: 'Niềng răng Invisalign', price: 20000000, commissionRate: 40, commissionAmount: 8000000, date: '2025-01-18' },
            ],
        },
        {
            employeeId: 'EMP002',
            employeeName: 'Phụ tá Trần Thị D',
            role: 'Phụ tá',
            totalRevenue: 15000000,
            commissionRate: 15,
            commissionAmount: 2250000,
            baseSalary: 8000000,
            advance: 0,
            netSalary: 10250000,
            status: 'Chưa chốt' as const,
            procedures: [
                { procedureId: 'P003', patientName: 'Lê Thị E', serviceName: 'Tẩy trắng răng', price: 5000000, commissionRate: 15, commissionAmount: 750000, date: '2025-01-10' },
                { procedureId: 'P004', patientName: 'Phạm Văn F', serviceName: 'Nhổ răng khôn', price: 10000000, commissionRate: 15, commissionAmount: 1500000, date: '2025-01-20' },
            ],
        },
        {
            employeeId: 'EMP003',
            employeeName: 'BS. Lê Văn G',
            role: 'Bác sĩ chính',
            totalRevenue: 32000000,
            commissionRate: 35,
            commissionAmount: 11200000,
            baseSalary: 15000000,
            advance: 3000000,
            netSalary: 23200000,
            status: 'Đã chi lương' as const,
            procedures: [
                { procedureId: 'P005', patientName: 'Hoàng Thị H', serviceName: 'Bọc răng sứ', price: 18000000, commissionRate: 35, commissionAmount: 6300000, date: '2025-01-12' },
                { procedureId: 'P006', patientName: 'Vũ Văn I', serviceName: 'Điều trị tủy', price: 14000000, commissionRate: 35, commissionAmount: 4900000, date: '2025-01-16' },
            ],
        },
    ];

    const summary = {
        totalRevenue: payrollData.reduce((sum, e) => sum + e.totalRevenue, 0),
        totalCommission: payrollData.reduce((sum, e) => sum + e.commissionAmount, 0),
        totalSalary: payrollData.reduce((sum, e) => sum + e.baseSalary, 0),
        totalNet: payrollData.reduce((sum, e) => sum + e.netSalary, 0),
    };
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tính Lương & Hoa Hồng</h1>
                    <p className="text-gray-600">Quản lý lương và hoa hồng nhân viên</p>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-40"
                    />
                    <Button className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Doanh Thu</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {summary.totalRevenue.toLocaleString()} ₫
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Hoa Hồng</p>
                        <p className="text-2xl font-bold text-green-600">
                            {summary.totalCommission.toLocaleString()} ₫
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Lương Cứng</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {summary.totalSalary.toLocaleString()} ₫
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Thực Lĩnh</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {summary.totalNet.toLocaleString()} ₫
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Payroll Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Bảng Lương Tháng {selectedMonth}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {payrollData.map((employee) => (
                            <div key={employee.employeeId} className="border rounded-lg">
                                {/* Main Row */}
                                <div className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpandedEmployee(
                                        expandedEmployee === employee.employeeId ? null : employee.employeeId
                                    )}
                                >
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-2">
                                            <p className="font-medium">{employee.employeeName}</p>
                                            <p className="text-xs text-gray-500">{employee.role}</p>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <p className="text-sm text-gray-600">Doanh thu</p>
                                            <p className="font-bold">{employee.totalRevenue.toLocaleString()} ₫</p>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <p className="text-sm text-gray-600">% HH</p>
                                            <p className="font-bold text-blue-600">{employee.commissionRate}%</p>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <p className="text-sm text-gray-600">Hoa hồng</p>
                                            <p className="font-bold text-green-600">{employee.commissionAmount.toLocaleString()} ₫</p>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <p className="text-sm text-gray-600">Lương cứng</p>
                                            <p className="font-medium">{employee.baseSalary.toLocaleString()} ₫</p>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <p className="text-sm text-gray-600">Tạm ứng</p>
                                            <p className="font-medium text-red-600">-{employee.advance.toLocaleString()} ₫</p>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <p className="text-sm text-gray-600">Thực lĩnh</p>
                                            <p className="font-bold text-orange-600">{employee.netSalary.toLocaleString()} ₫</p>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <span className={`px-2 py-1 text-xs rounded ${employee.status === 'Đã chi lương'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {employee.status}
                                            </span>
                                            {expandedEmployee === employee.employeeId ? (
                                                <ChevronUp className="h-4 w-4 inline ml-2" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 inline ml-2" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedEmployee === employee.employeeId && (
                                    <div className="border-t bg-gray-50 p-4">
                                        <h4 className="font-medium mb-3">Chi tiết thủ thuật:</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Ngày</th>
                                                        <th className="text-left p-2">Bệnh nhân</th>
                                                        <th className="text-left p-2">Dịch vụ</th>
                                                        <th className="text-right p-2">Giá</th>
                                                        <th className="text-center p-2">% HH</th>
                                                        <th className="text-right p-2">Hoa hồng</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {employee.procedures.map((proc) => (
                                                        <tr key={proc.procedureId} className="border-b">
                                                            <td className="p-2">{proc.date}</td>
                                                            <td className="p-2">{proc.patientName}</td>
                                                            <td className="p-2">{proc.serviceName}</td>
                                                            <td className="p-2 text-right">{proc.price.toLocaleString()} ₫</td>
                                                            <td className="p-2 text-center">{proc.commissionRate}%</td>
                                                            <td className="p-2 text-right text-green-600 font-bold">
                                                                {proc.commissionAmount.toLocaleString()} ₫
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            {employee.status === 'Chưa chốt' && (
                                                <>
                                                    <Button size="sm" variant="outline">Chỉnh sửa</Button>
                                                    <Button size="sm">Chốt lương</Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
