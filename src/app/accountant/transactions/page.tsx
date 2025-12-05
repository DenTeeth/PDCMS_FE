'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Download, Printer } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    /// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
    /// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
    const transactions = [
        { id: 'PT001', code: 'PT-20250120-001', type: 'Thu', category: 'Dịch vụ nha khoa', description: 'Thanh toán dịch vụ trám răng - Nguyễn Văn A', amount: 2500000, payer: 'Nguyễn Văn A', date: '2025-01-20', status: 'Đã duyệt' },
        { id: 'PC001', code: 'PC-20250120-001', type: 'Chi', category: 'Lương nhân viên', description: 'Lương tháng 1/2025', amount: 15000000, receiver: 'Phòng Nhân Sự', date: '2025-01-20', status: 'Đã duyệt' },
        { id: 'PT002', code: 'PT-20250119-001', type: 'Thu', category: 'Bán nha phẩm', description: 'Bán bàn chải điện - Trần Thị B', amount: 850000, payer: 'Trần Thị B', date: '2025-01-19', status: 'Đã duyệt' },
    ];
    /// - KẾT THÚC DATA GIẢ

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Quản Lý Thu Chi</h1>
                    <p className="text-gray-600">Ghi nhận và theo dõi các giao dịch thu chi</p>
                </div>
                <Link href="/accountant/transactions/new">
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Tạo Phiếu Mới
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm theo mã phiếu, nội dung..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Lọc
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Xuất Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Mã Phiếu</th>
                                    <th className="text-left p-3">Loại</th>
                                    <th className="text-left p-3">Danh Mục</th>
                                    <th className="text-left p-3">Nội Dung</th>
                                    <th className="text-right p-3">Số Tiền</th>
                                    <th className="text-left p-3">Ngày</th>
                                    <th className="text-center p-3">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{transaction.code}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${transaction.type === 'Thu' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm">{transaction.category}</td>
                                        <td className="p-3 text-sm">{transaction.description}</td>
                                        <td className={`p-3 text-right font-bold ${transaction.type === 'Thu' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.type === 'Thu' ? '+' : '-'}{transaction.amount.toLocaleString()} ₫
                                        </td>
                                        <td className="p-3 text-sm">{transaction.date}</td>
                                        <td className="p-3 text-center">
                                            <Button variant="ghost" size="sm">Chi tiết</Button>
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
