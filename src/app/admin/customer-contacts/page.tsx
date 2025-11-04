"use client";

import { useState } from 'react';
import { useContacts, useSoftDeleteContact } from '@/hooks/contactHooks';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Phone, Mail, Calendar, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminContactsList() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const { data, isLoading, error, refetch } = useContacts({ page, size: pageSize, search });
    const del = useSoftDeleteContact();

    // Debug logging
    console.log('Customer Contacts - Loading:', isLoading);
    console.log('Customer Contacts - Error:', error);
    console.log('Customer Contacts - Data:', data);

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xóa liên hệ này?')) return;
        try {
            await del.mutateAsync(id);
            toast.success('Đã xóa liên hệ');
        } catch (err: any) {
            toast.error(err.message || 'Xóa thất bại');
        }
    };

    const handleRefresh = () => {
        refetch();
        toast.info('Đang tải lại dữ liệu...');
    };

    if (error) {
        console.error('Customer Contacts API Error:', error);
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <Card className="w-full max-w-2xl">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                            <div>
                                <p className="font-semibold text-lg text-gray-900">Lỗi tải dữ liệu</p>
                                <p className="text-sm text-gray-600 mt-2">
                                    {(error as any)?.message || 'Không thể kết nối API'}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-left max-h-60 overflow-auto">
                                <p className="text-xs text-gray-600 mb-2 font-medium">Thông tin chi tiết:</p>
                                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                    {JSON.stringify(error, null, 2)}
                                </pre>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button
                                    onClick={handleRefresh}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Thử lại
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/admin'}
                                    variant="ghost"
                                >
                                    Quay lại Dashboard
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Liên Hệ Khách Hàng</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Quản lý thông tin liên hệ từ khách hàng</p>
                </div>
                <Link href="/admin/customer-contacts/new">
                    <Button className="bg-[#8b5fbf] hover:bg-[#7a4fb0] w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm Liên Hệ
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setPageSize(pageSize === 10 ? 10000 : 10)}
                                className="flex-1 sm:flex-none"
                            >
                                {pageSize === 10 ? 'Hiển thị tất cả' : 'Phân trang'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                className="px-3"
                                title="Tải lại"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table/Cards */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Danh Sách Liên Hệ</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#8b5fbf]" />
                        </div>
                    ) : !data?.items || data.items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium">Không có liên hệ nào</p>
                            <p className="text-sm mt-1">Chưa có dữ liệu liên hệ khách hàng</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table - Hidden on mobile */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Khách Hàng
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Liên Hệ
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nguồn
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng Thái
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ngày Tạo
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao Tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.items.map((contact: any) => (
                                            <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-gray-900">
                                                        {contact.fullName || contact.name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="space-y-1">
                                                        {contact.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Phone className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">{contact.phone}</span>
                                                            </div>
                                                        )}
                                                        {contact.email && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                                <span className="truncate">{contact.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {contact.source || 'N/A'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge
                                                        variant={contact.status === 'ACTIVE' ? 'default' : 'secondary'}
                                                        className={
                                                            contact.status === 'ACTIVE'
                                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                                        }
                                                    >
                                                        {contact.status || 'N/A'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {contact.createdAt ? (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            {format(new Date(contact.createdAt), 'dd/MM/yyyy')}
                                                        </div>
                                                    ) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(contact.id)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards - Visible on mobile only */}
                            <div className="lg:hidden space-y-3">
                                {data.items.map((contact: any) => (
                                    <Card key={contact.id} className="overflow-hidden">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {contact.fullName || contact.name || 'N/A'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant={contact.status === 'ACTIVE' ? 'default' : 'secondary'}
                                                            className={
                                                                contact.status === 'ACTIVE'
                                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                                            }
                                                        >
                                                            {contact.status || 'N/A'}
                                                        </Badge>
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            {contact.source || 'N/A'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(contact.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{contact.phone}</span>
                                                    </div>
                                                )}
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Mail className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{contact.email}</span>
                                                    </div>
                                                )}
                                                {contact.createdAt && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="h-4 w-4 flex-shrink-0" />
                                                        {format(new Date(contact.createdAt), 'dd/MM/yyyy')}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination Info */}
                    {data?.meta && (
                        <div className="mt-4 text-xs sm:text-sm text-gray-600 text-center">
                            Tổng số: {data.meta.totalElements} liên hệ
                            {data.meta.totalPages > 1 && ` | Trang ${(data.meta.pageNumber || 0) + 1}/${data.meta.totalPages}`}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
