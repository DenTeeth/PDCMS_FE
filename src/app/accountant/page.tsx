'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import StatCard from './components/StatCard';
import TodoList from './components/TodoList';
import RevenueExpenseChart from './components/RevenueExpenseChart';
import ExpensePieChart from './components/ExpensePieChart';
import {
    mockDashboardStats,
    mockTransactions,
    mockTodoItems,
    mockDailyRevenueExpense,
    mockExpensePieChart
} from './lib/mockData';

export default function AccountantDashboard() {
    const stats = useMemo(() => [
        {
            title: 'Tổng Thu Tháng Này',
            value: `${mockDashboardStats.totalIncome.toLocaleString()} ₫`,
            change: `+${mockDashboardStats.incomeChange}%`,
            trend: 'up' as const,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Tổng Chi Tháng Này',
            value: `${mockDashboardStats.totalExpense.toLocaleString()} ₫`,
            change: `+${mockDashboardStats.expenseChange}%`,
            trend: 'up' as const,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Lợi Nhuận',
            value: `${mockDashboardStats.profit.toLocaleString()} ₫`,
            change: `+${mockDashboardStats.profitChange}%`,
            trend: 'up' as const,
            icon: DollarSign,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Công Nợ Phải Trả',
            value: `${mockDashboardStats.supplierDebt.toLocaleString()} ₫`,
            change: '+3.2%',
            trend: 'up' as const,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ], []);

    const recentTransactions = useMemo(() => mockTransactions.slice(0, 5), []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Bảng Điều Khiển Kế Toán</h1>
                <p className="text-gray-600">Tổng quan tài chính và báo cáo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TodoList items={mockTodoItems} />
                <RevenueExpenseChart data={mockDailyRevenueExpense} />
                <ExpensePieChart data={mockExpensePieChart} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Giao Dịch Gần Đây
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${transaction.type === 'Thu'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {transaction.type}
                                            </span>
                                            <span className="text-xs text-gray-500">{transaction.code}</span>
                                        </div>
                                        <p className="text-sm font-medium mt-1">{transaction.description}</p>
                                        <p className="text-xs text-gray-500">{transaction.date}</p>
                                    </div>
                                    <div className={`text-sm font-bold ${transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.type === 'Thu' ? '+' : '-'}{transaction.amount.toLocaleString()} ₫
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/accountant/transactions"
                            className="block mt-4 text-center text-sm text-blue-600 hover:underline"
                        >
                            Xem tất cả giao dịch →
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Thao Tác Nhanh</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/accountant/transactions/new"
                                className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                                <span className="text-sm font-medium text-center">Tạo Phiếu Thu Chi</span>
                            </Link>
                            <Link
                                href="/accountant/revenue-report"
                                className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                                <span className="text-sm font-medium text-center">Báo Cáo Doanh Thu</span>
                            </Link>
                            <Link
                                href="/accountant/cashflow-report"
                                className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
                                <span className="text-sm font-medium text-center">Dòng Tiền Thu Chi</span>
                            </Link>
                            <Link
                                href="/accountant/profit-loss"
                                className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
                                <span className="text-sm font-medium text-center">Báo Cáo Lãi/Lỗ</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/accountant/revenue-report">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                Báo Cáo Doanh Thu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Thống kê doanh thu theo bác sĩ, dịch vụ, nguồn khách hàng</p>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/accountant/cashflow-report">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                                Dòng Tiền Thu Chi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Theo dõi dòng tiền ra vào, thu chi khách hàng và phòng khám</p>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href="/accountant/profit-loss">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                                Báo Cáo Lãi/Lỗ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Phân tích doanh thu, chi phí và lợi nhuận</p>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
