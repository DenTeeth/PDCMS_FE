'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, DollarSign } from 'lucide-react';

export default function LabDebtPage() {
    const [selectedLab, setSelectedLab] = useState<string | null>(null);

    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const labDebts = [
        {
            labId: 'LAB001',
            labName: 'Labo Nha Khoa Việt',
            totalOrders: 45000000,
            totalPaid: 30000000,
            remainingDebt: 15000000,
            unpaidOrders: [
                { orderId: 'LO001', orderCode: 'LO-20250115-001', date: '2025-01-15', patientName: 'Nguyễn Văn A', service: 'Răng sứ Zirconia', totalAmount: 8000000, paidAmount: 0, remainingAmount: 8000000, status: 'Chưa thanh toán' },
                { orderId: 'LO002', orderCode: 'LO-20250118-001', date: '2025-01-18', patientName: 'Trần Thị B', service: 'Hàm giả tháo lắp', totalAmount: 10000000, paidAmount: 3000000, remainingAmount: 7000000, status: 'Thanh toán một phần' },
            ],
        },
        {
            labId: 'LAB002',
            labName: 'Labo Quốc Tế ABC',
            totalOrders: 60000000,
            totalPaid: 40000000,
            remainingDebt: 20000000,
            unpaidOrders: [
                { orderId: 'LO003', orderCode: 'LO-20250120-001', date: '2025-01-20', patientName: 'Lê Văn C', service: 'Implant Crown', totalAmount: 12000000, paidAmount: 0, remainingAmount: 12000000, status: 'Chưa thanh toán' },
                { orderId: 'LO004', orderCode: 'LO-20250122-001', date: '2025-01-22', patientName: 'Phạm Thị D', service: 'Veneer Emax', totalAmount: 8000000, paidAmount: 0, remainingAmount: 8000000, status: 'Chưa thanh toán' },
            ],
        },
        {
            labId: 'LAB003',
            labName: 'Labo Dental Pro',
            totalOrders: 25000000,
            totalPaid: 25000000,
            remainingDebt: 0,
            unpaidOrders: [],
        },
    ];

    const paymentHistory = [
        { id: 'LPAY001', date: '2025-01-10', lab: 'Labo Nha Khoa Việt', amount: 10000000, method: 'Chuyển khoản', orderCode: 'LO-20250105-001' },
        { id: 'LPAY002', date: '2025-01-12', lab: 'Labo Quốc Tế ABC', amount: 15000000, method: 'Tiền mặt', orderCode: 'LO-20250108-001' },
        { id: 'LPAY003', date: '2025-01-18', lab: 'Labo Nha Khoa Việt', amount: 3000000, method: 'Chuyển khoản', orderCode: 'LO-20250118-001' },
    ];

    const summary = {
        totalDebt: labDebts.reduce((sum, l) => sum + l.remainingDebt, 0),
        totalPaid: labDebts.reduce((sum, l) => sum + l.totalPaid, 0),
        labsWithDebt: labDebts.filter(l => l.remainingDebt > 0).length,
    };
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Công Nợ Labo</h1>
                    <p className="text-gray-600">Quản lý thanh toán cho đơn vị gia công răng giả</p>
                </div>
                <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Xuất Excel
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Công Nợ Labo</p>
                        <p className="text-2xl font-bold text-red-600">
                            {summary.totalDebt.toLocaleString()} ₫
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {summary.labsWithDebt} labo
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Đã Thanh Toán</p>
                        <p className="text-2xl font-bold text-green-600">
                            {summary.totalPaid.toLocaleString()} ₫
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Đơn Hàng</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {labDebts.reduce((sum, l) => sum + l.totalOrders, 0).toLocaleString()} ₫
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="summary" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="summary">Tổng Hợp Công Nợ</TabsTrigger>
                    <TabsTrigger value="history">Lịch Sử Thanh Toán</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Danh Sách Labo</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Tìm kiếm Labo..." className="pl-10" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Labo</th>
                                            <th className="text-right p-3">Tổng Đơn Hàng</th>
                                            <th className="text-right p-3">Đã Thanh Toán</th>
                                            <th className="text-right p-3">Còn Nợ</th>
                                            <th className="text-center p-3">Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {labDebts.map((lab) => (
                                            <tr key={lab.labId} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{lab.labName}</td>
                                                <td className="p-3 text-right">
                                                    {lab.totalOrders.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-right text-green-600">
                                                    {lab.totalPaid.toLocaleString()} ₫
                                                </td>
                                                <td className={`p-3 text-right font-bold ${lab.remainingDebt > 0 ? 'text-red-600' : 'text-gray-400'
                                                    }`}>
                                                    {lab.remainingDebt.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-center">
                                                    {lab.remainingDebt > 0 ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setSelectedLab(lab.labId)}
                                                        >
                                                            <DollarSign className="h-4 w-4 mr-1" />
                                                            Thanh Toán
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Đã thanh toán</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Modal Placeholder */}
                    {selectedLab && (
                        <Card className="mt-4 border-blue-200 bg-blue-50">
                            <CardHeader>
                                <CardTitle>Thanh Toán Cho Labo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                        Danh sách đơn hàng chưa thanh toán:
                                    </p>
                                    {labDebts.find(l => l.labId === selectedLab)?.unpaidOrders.map((order) => (
                                        <div key={order.orderId} className="p-3 bg-white rounded border">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{order.orderCode}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {order.patientName} - {order.service}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-600">
                                                        {order.remainingAmount.toLocaleString()} ₫
                                                    </p>
                                                    <p className="text-xs text-gray-500">{order.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <Button className="flex-1">Thanh Toán</Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedLab(null)}
                                        >
                                            Đóng
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch Sử Thanh Toán Labo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Ngày</th>
                                            <th className="text-left p-3">Labo</th>
                                            <th className="text-left p-3">Mã Đơn Hàng</th>
                                            <th className="text-right p-3">Số Tiền</th>
                                            <th className="text-left p-3">Hình Thức</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{payment.date}</td>
                                                <td className="p-3">{payment.lab}</td>
                                                <td className="p-3 font-mono text-sm">{payment.orderCode}</td>
                                                <td className="p-3 text-right text-green-600 font-bold">
                                                    {payment.amount.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                        {payment.method}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
