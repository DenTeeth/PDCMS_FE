'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';

export default function CashflowReportPage() {
    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const summaryData = {
        openingBalance: 50000000,
        totalIncome: 125500000,
        totalExpense: 45200000,
        closingBalance: 130300000,
    };

    const customerCashflow = [
        { date: '2025-01-20', totalReceipt: 8500000, actualRevenue: 7200000, refund: 0, balance: 1300000 },
        { date: '2025-01-19', totalReceipt: 6200000, actualRevenue: 6200000, refund: 500000, balance: -500000 },
        { date: '2025-01-18', totalReceipt: 12000000, actualRevenue: 10500000, refund: 0, balance: 1500000 },
    ];

    const clinicCashflow = [
        { date: '2025-01-20', receipt: 2000000, expense: 15000000, net: -13000000 },
        { date: '2025-01-19', receipt: 1500000, expense: 3200000, net: -1700000 },
        { date: '2025-01-18', receipt: 0, expense: 5000000, net: -5000000 },
    ];
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Báo Cáo Dòng Tiền Thu Chi</h1>
                    <p className="text-gray-600">Theo dõi dòng tiền ra vào của nha khoa</p>
                </div>
                <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Xuất Excel
                </Button>
            </div>

            <Tabs defaultValue="summary" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Tổng Hợp</TabsTrigger>
                    <TabsTrigger value="customer">Thu Chi KH</TabsTrigger>
                    <TabsTrigger value="clinic">Thu Chi Phòng Khám</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tổng Hợp Thu Chi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Số Dư Đầu Kỳ</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {summaryData.openingBalance.toLocaleString()} ₫
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Phát Sinh Tăng</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        +{summaryData.totalIncome.toLocaleString()} ₫
                                    </p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Phát Sinh Giảm</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        -{summaryData.totalExpense.toLocaleString()} ₫
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Số Dư Cuối Kỳ</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {summaryData.closingBalance.toLocaleString()} ₫
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="customer">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thu Chi Khách Hàng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Ngày</th>
                                            <th className="text-right p-3">Tổng Thu</th>
                                            <th className="text-right p-3">Tổng Thực Thu</th>
                                            <th className="text-right p-3">Tổng Hoàn Ứng</th>
                                            <th className="text-right p-3">Biến Động Số Dư</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerCashflow.map((item, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{item.date}</td>
                                                <td className="p-3 text-right text-green-600">
                                                    +{item.totalReceipt.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-right">
                                                    {item.actualRevenue.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-right text-red-600">
                                                    -{item.refund.toLocaleString()} ₫
                                                </td>
                                                <td className={`p-3 text-right font-bold ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {item.balance >= 0 ? '+' : ''}{item.balance.toLocaleString()} ₫
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="clinic">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thu Chi Phòng Khám</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3">Ngày</th>
                                            <th className="text-right p-3">Phiếu Thu</th>
                                            <th className="text-right p-3">Phiếu Chi</th>
                                            <th className="text-right p-3">Chênh Lệch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clinicCashflow.map((item, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{item.date}</td>
                                                <td className="p-3 text-right text-green-600">
                                                    +{item.receipt.toLocaleString()} ₫
                                                </td>
                                                <td className="p-3 text-right text-red-600">
                                                    -{item.expense.toLocaleString()} ₫
                                                </td>
                                                <td className={`p-3 text-right font-bold ${item.net >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {item.net >= 0 ? '+' : ''}{item.net.toLocaleString()} ₫
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
