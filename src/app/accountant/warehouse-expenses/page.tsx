'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxes,
    faSearch,
    faFileExport,
    faFilter,
    faEye,
} from '@fortawesome/free-solid-svg-icons';

interface WarehouseExpense {
    id: string;
    transactionCode: string;
    date: string;
    type: 'IMPORT' | 'EXPORT';
    supplier?: string;
    items: number;
    totalAmount: number;
    paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
    paidAmount: number;
    note?: string;
}

/// - ĐÂY LÀ DATA GIẢ - BẮT ĐẦU
/// Xóa tất cả code giữa 2 dòng comment này khi tích hợp API thật
const mockExpenses: WarehouseExpense[] = [
    {
        id: '1',
        transactionCode: 'NK001',
        date: '2024-01-15',
        type: 'IMPORT',
        supplier: 'Công ty TNHH Vật Tư Y Tế ABC',
        items: 15,
        totalAmount: 25000000,
        paymentStatus: 'PAID',
        paidAmount: 25000000,
        note: 'Nhập vật tư định kỳ tháng 1',
    },
    {
        id: '2',
        transactionCode: 'XK001',
        date: '2024-01-16',
        type: 'EXPORT',
        items: 8,
        totalAmount: 5000000,
        paymentStatus: 'PAID',
        paidAmount: 5000000,
        note: 'Xuất vật tư cho phòng khám 1',
    },
    {
        id: '3',
        transactionCode: 'NK002',
        date: '2024-01-18',
        type: 'IMPORT',
        supplier: 'Công ty CP Thiết Bị Nha Khoa XYZ',
        items: 20,
        totalAmount: 45000000,
        paymentStatus: 'PARTIAL',
        paidAmount: 20000000,
        note: 'Nhập thiết bị mới',
    },
];
/// - KẾT THÚC DATA GIẢ

export default function WarehouseExpensesPage() {
    const [expenses] = useState<WarehouseExpense[]>(mockExpenses);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch =
            expense.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.note?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'ALL' || expense.type === filterType;
        const matchesStatus = filterStatus === 'ALL' || expense.paymentStatus === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    const totalImport = expenses
        .filter((e) => e.type === 'IMPORT')
        .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalExport = expenses
        .filter((e) => e.type === 'EXPORT')
        .reduce((sum, e) => sum + e.totalAmount, 0);

    const unpaidAmount = expenses
        .filter((e) => e.paymentStatus !== 'PAID')
        .reduce((sum, e) => sum + (e.totalAmount - e.paidAmount), 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return <Badge className="bg-green-500">Đã thanh toán</Badge>;
            case 'UNPAID':
                return <Badge className="bg-red-500">Chưa thanh toán</Badge>;
            case 'PARTIAL':
                return <Badge className="bg-yellow-500">Thanh toán 1 phần</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        return type === 'IMPORT' ? (
            <Badge className="bg-blue-500">Nhập kho</Badge>
        ) : (
            <Badge className="bg-purple-500">Xuất kho</Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Chi Xuất Nhập Kho</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý chi phí xuất nhập kho vật tư
                    </p>
                </div>
                <Button>
                    <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                    Xuất Excel
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng Nhập Kho</CardTitle>
                        <FontAwesomeIcon icon={faBoxes} className="text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {totalImport.toLocaleString('vi-VN')} đ
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {expenses.filter((e) => e.type === 'IMPORT').length} giao dịch
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng Xuất Kho</CardTitle>
                        <FontAwesomeIcon icon={faBoxes} className="text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {totalExport.toLocaleString('vi-VN')} đ
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {expenses.filter((e) => e.type === 'EXPORT').length} giao dịch
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Công Nợ Chưa Trả</CardTitle>
                        <FontAwesomeIcon icon={faBoxes} className="text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {unpaidAmount.toLocaleString('vi-VN')} đ
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {expenses.filter((e) => e.paymentStatus !== 'PAID').length} giao dịch
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFilter} />
                        Bộ Lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Tìm kiếm</Label>
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    placeholder="Mã giao dịch, NCC, ghi chú..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Loại giao dịch</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="IMPORT">Nhập kho</SelectItem>
                                    <SelectItem value="EXPORT">Xuất kho</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Trạng thái thanh toán</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="PAID">Đã thanh toán</SelectItem>
                                    <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
                                    <SelectItem value="PARTIAL">Thanh toán 1 phần</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh Sách Giao Dịch</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã GD</TableHead>
                                <TableHead>Ngày</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Nhà cung cấp</TableHead>
                                <TableHead className="text-right">Số mặt hàng</TableHead>
                                <TableHead className="text-right">Tổng tiền</TableHead>
                                <TableHead className="text-right">Đã trả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-center">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.transactionCode}</TableCell>
                                    <TableCell>{new Date(expense.date).toLocaleDateString('vi-VN')}</TableCell>
                                    <TableCell>{getTypeBadge(expense.type)}</TableCell>
                                    <TableCell>{expense.supplier || '-'}</TableCell>
                                    <TableCell className="text-right">{expense.items}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {expense.totalAmount.toLocaleString('vi-VN')} đ
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {expense.paidAmount.toLocaleString('vi-VN')} đ
                                    </TableCell>
                                    <TableCell>{getStatusBadge(expense.paymentStatus)}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="sm">
                                            <FontAwesomeIcon icon={faEye} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
