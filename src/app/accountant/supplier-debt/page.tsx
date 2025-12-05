'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, DollarSign } from 'lucide-react';

export default function SupplierDebtPage() {
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const supplierDebts = [
        {
            supplierId: 'SUP001',
            supplierName: '3M Việt Nam',
            totalPurchase: 50000000,
            totalPaid: 30000000,
            remainingDebt: 20000000,
            unpaidReceipts: [
                { receiptId: 'PN001', receiptCode: 'PN-20250115-001', date: '2025-01-15', totalAmount: 10000000, paidAmount: 0, remainingAmount: 10000000, status: 'Chưa thanh toán' as const },
                { receiptId: 'PN002', receiptCode: 'PN-20250118-001', date: '2025-01-18', totalAmount: 15000000, paidAmount: 5000000, remainingAmount: 10000000, status: 'Thanh toán một phần' as const },
            ],
        },
        {
            supplierId: 'SUP002',
            supplierName: 'Công ty Vật tư Nha khoa ABC',
            totalPurchase: 35000000,
            totalPaid: 35000000,
            remainingDebt: 0,
            unpaidReceipts: [],
        },
        {
            supplierId: 'SUP003',
            supplierName: 'Dentsply Sirona',
            totalPurchase: 80000000,
            totalPaid: 50000000,
            remainingDebt: 30000000,
            unpaidReceipts: [
                { receiptId: 'PN003', receiptCode: 'PN-20250120-001', date: '2025-01-20', totalAmount: 30000000, paidAmount: 0, remainingAmount: 30000000, status: 'Chưa thanh toán' as const },
            ],
        },
    ];

    const paymentHistory = [
        { id: 'PAY001', date: '2025-01-10', supplier: '3M Việt Nam', amount: 10000000, method: 'Chuyển khoản', receiptCode: 'PN-20250105-001' },
        { id: 'PAY002', date: '2025-01-12', supplier: 'Công ty Vật tư Nha khoa ABC', amount: 15000000, method: 'Tiền mặt', receiptCode: 'PN-20250108-001' },
        { id: 'PAY003', date: '2025-01-18', supplier: 'PN-20250118-001', amount: 5000000, method: 'Chuyển khoản', receiptCode: 'PN-20250118-001' },
    ];

    const summary = {
        totalDebt: supplierDebts.reduce((sum, s) => sum + s.remainingDebt, 0),
        totalPaid: supplierDebts.reduce((sum, s) => sum + s.totalPaid, 0),
        suppliersWithDebt: supplierDebts.filter(s => s.remainingDebt > 0).length,
    };
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Công Nợ Nhà Cung Cấp</h1>
                    <p className="text-gray-600">Quản lý thanh toán cho các phiếu nhập kho</p>
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
                        <p className="text-sm text-gray-600">Tổng Công Nợ</p>
                        <p className="text-2xl font-bold text-red-600">
                            {summary.totalDebt.toLocaleString()} ₫
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {summary.suppliersWithDebt} nhà cung cấp
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
                        <p className="text-sm text-gray-600">Tổng Nhập Hàng</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {supplierDebts.reduce((sum, s) => sum + s.totalPurchase, 0).toLocaleString()} ₫
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
                                <CardTitle>Danh Sách Nhà Cung Cấp</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Tìm kiếm NCC..." className="pl-10" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Nhà Cung Cấp</th>
                                            <th className="text-right p-3">Tổng Nhập Hàng</th>
                                            <th className="text-right p-3">Đã Thanh Toán</th>
                                            <th className="text-right p-3">Còn Nợ</th>
                                            <th className="text-center p-3">Hành Động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplierDebts.map((supplier) => (
                                            <tr key={supplier.supplierId} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{supplier.supplierName}</td>
                                                <td className="p-3 text-right">
                                                    {supplier.totalPurchase.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-right text-green-600">
                                                    {supplier.totalPaid.toLocaleString()} ₫
                                                </td>
                                                <td className={`p-3 text-right font-bold ${supplier.remainingDebt > 0 ? 'text-red-600' : 'text-gray-400'
                                                    }`}>
                                                    {supplier.remainingDebt.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-center">
                                                    {supplier.remainingDebt > 0 ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setSelectedSupplier(supplier.supplierId)}
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

                    {/* Payment Modal would go here */}
                    {selectedSupplier && (
                        <Card className="mt-4 border-blue-200 bg-blue-50">
                            <CardHeader>
                                <CardTitle>Thanh Toán Cho NCC</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    Modal thanh toán sẽ hiển thị ở đây với danh sách phiếu nhập chưa trả
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setSelectedSupplier(null)}
                                >
                                    Đóng
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch Sử Thanh Toán</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Ngày</th>
                                            <th className="text-left p-3">Nhà Cung Cấp</th>
                                            <th className="text-left p-3">Mã Phiếu Nhập</th>
                                            <th className="text-right p-3">Số Tiền</th>
                                            <th className="text-left p-3">Hình Thức</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{payment.date}</td>
                                                <td className="p-3">{payment.supplier}</td>
                                                <td className="p-3 font-mono text-sm">{payment.receiptCode}</td>
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
