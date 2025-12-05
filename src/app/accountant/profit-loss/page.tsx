'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

export default function ProfitLossPage() {
    const [startDate, setStartDate] = useState('2025-01-01');
    const [endDate, setEndDate] = useState('2025-01-31');

    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const plReport = {
        period: 'Tháng 01/2025',
        revenue: {
            total: 125500000,
            dentalServices: 95000000,
            productSales: 18000000,
            medicineSales: 10000000,
            other: 2500000,
        },
        expenses: {
            total: 68200000,
            salary: 35000000,
            supplies: 15000000,
            utilities: 3200000,
            rent: 8000000,
            marketing: 4000000,
            lab: 2000000,
            other: 1000000,
            breakdown: [
                { category: 'Lương nhân viên', amount: 35000000, percentage: 51.3 },
                { category: 'Vật tư nha khoa', amount: 15000000, percentage: 22.0 },
                { category: 'Thuê mặt bằng', amount: 8000000, percentage: 11.7 },
                { category: 'Marketing', amount: 4000000, percentage: 5.9 },
                { category: 'Điện nước', amount: 3200000, percentage: 4.7 },
                { category: 'Chi Labo', amount: 2000000, percentage: 2.9 },
                { category: 'Khác', amount: 1000000, percentage: 1.5 },
            ],
        },
        netProfit: 57300000,
        profitMargin: 45.7,
    };

    const monthlyComparison = [
        { month: 'T10/2024', revenue: 110000000, expense: 62000000, profit: 48000000 },
        { month: 'T11/2024', revenue: 118000000, expense: 65000000, profit: 53000000 },
        { month: 'T12/2024', revenue: 122000000, expense: 67000000, profit: 55000000 },
        { month: 'T01/2025', revenue: 125500000, expense: 68200000, profit: 57300000 },
    ];
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Báo Cáo Lãi/Lỗ (P&L)</h1>
                    <p className="text-gray-600">Phân tích doanh thu, chi phí và lợi nhuận</p>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-40"
                    />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-40"
                    />
                    <Button className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Xuất PDF
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Doanh Thu</p>
                        <p className="text-2xl font-bold text-green-600">
                            {plReport.revenue.total.toLocaleString()} ₫
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600">+8.5% vs tháng trước</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tổng Chi Phí</p>
                        <p className="text-2xl font-bold text-red-600">
                            {plReport.expenses.total.toLocaleString()} ₫
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-red-600">+1.8% vs tháng trước</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Lợi Nhuận Ròng</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {plReport.netProfit.toLocaleString()} ₫
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-blue-600">+4.2% vs tháng trước</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600">Tỷ Suất Lợi Nhuận</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {plReport.profitMargin}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Profit Margin</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Chi Tiết Doanh Thu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="font-medium">Dịch vụ nha khoa</span>
                                <span className="font-bold text-green-600">
                                    {plReport.revenue.dentalServices.toLocaleString()} ₫
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>Bán nha phẩm</span>
                                <span className="font-bold">
                                    {plReport.revenue.productSales.toLocaleString()} ₫
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>Bán thuốc</span>
                                <span className="font-bold">
                                    {plReport.revenue.medicineSales.toLocaleString()} ₫
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span>Thu khác</span>
                                <span className="font-bold">
                                    {plReport.revenue.other.toLocaleString()} ₫
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-600">
                                <span className="font-bold">TỔNG DOANH THU</span>
                                <span className="font-bold text-green-600 text-lg">
                                    {plReport.revenue.total.toLocaleString()} ₫
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            Chi Tiết Chi Phí
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {plReport.expenses.breakdown.map((item, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">{item.category}</span>
                                        <span className="font-bold text-red-600">
                                            {item.amount.toLocaleString()} ₫
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500">{item.percentage}%</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-2 border-red-600 mt-4">
                                <span className="font-bold">TỔNG CHI PHÍ</span>
                                <span className="font-bold text-red-600 text-lg">
                                    {plReport.expenses.total.toLocaleString()} ₫
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Net Profit */}
            <Card className="border-2 border-blue-600">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-lg font-medium text-gray-600">LỢI NHUẬN RÒNG</p>
                            <p className="text-sm text-gray-500">
                                Doanh thu - Chi phí = Lợi nhuận
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold text-blue-600">
                                {plReport.netProfit.toLocaleString()} ₫
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Tỷ suất: {plReport.profitMargin}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>So Sánh Theo Tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Tháng</th>
                                    <th className="text-right p-3">Doanh Thu</th>
                                    <th className="text-right p-3">Chi Phí</th>
                                    <th className="text-right p-3">Lợi Nhuận</th>
                                    <th className="text-right p-3">Tỷ Suất</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyComparison.map((month, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{month.month}</td>
                                        <td className="p-3 text-right text-green-600">
                                            {month.revenue.toLocaleString()} ₫
                                        </td>
                                        <td className="p-3 text-right text-red-600">
                                            {month.expense.toLocaleString()} ₫
                                        </td>
                                        <td className="p-3 text-right text-blue-600 font-bold">
                                            {month.profit.toLocaleString()} ₫
                                        </td>
                                        <td className="p-3 text-right">
                                            {((month.profit / month.revenue) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
