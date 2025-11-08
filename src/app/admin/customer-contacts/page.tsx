"use client";

/**
 * ADMIN CUSTOMER CONTACTS MANAGEMENT PAGE
 * Kế thừa UI/UX từ Time Off Types page
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useContacts, useSoftDeleteContact } from '@/hooks/contactHooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus, Search, Phone, Mail, Calendar, Trash2, AlertCircle, RefreshCw,
    Eye, Pencil, Filter, ChevronDown, ArrowUp, ArrowDown, XCircle, CheckCircle2, User
} from 'lucide-react';
import { format } from 'date-fns';

type FilterStatus = 'ALL' | 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'NOT_INTERESTED';
type SortField = 'fullName' | 'createdAt' | 'status' | null;
type SortOrder = 'asc' | 'desc';


export default function AdminContactsList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, error, refetch } = useContacts({ page: 0, size: 1000, search });
    const del = useSoftDeleteContact();
    const { user } = useAuth();

    // Admin có full quyền, hoặc check từng permission cụ thể
    const canView = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('VIEW_CONTACT');
    const canCreate = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('CREATE_CONTACT');
    const canUpdate = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('UPDATE_CONTACT');
    const canDelete = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('DELETE_CONTACT');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const stats = useMemo(() => {
        const contacts = data?.items || [];
        return {
            total: contacts.length,
            new: contacts.filter((c: any) => c.status === 'NEW').length,
            contacted: contacts.filter((c: any) => c.status === 'CONTACTED').length,
            interested: contacts.filter((c: any) => c.status === 'INTERESTED').length,
            converted: contacts.filter((c: any) => c.status === 'CONVERTED').length,
            notInterested: contacts.filter((c: any) => c.status === 'NOT_INTERESTED').length
        };
    }, [data?.items]);

    const processedContacts = useMemo(() => {
        let contacts = data?.items || [];
        if (statusFilter !== 'ALL') {
            contacts = contacts.filter((c: any) => c.status === statusFilter);
        }
        if (sortField) {
            contacts = [...contacts].sort((a: any, b: any) => {
                let compareResult = 0;
                switch (sortField) {
                    case 'fullName':
                        compareResult = (a.fullName || '').localeCompare(b.fullName || '', 'vi');
                        break;
                    case 'createdAt':
                        compareResult = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                        break;
                    case 'status':
                        compareResult = (a.status || '').localeCompare(b.status || '');
                        break;
                }
                return sortOrder === 'asc' ? compareResult : -compareResult;
            });
        }
        return contacts;
    }, [data?.items, statusFilter, sortField, sortOrder]);

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xóa mềm liên hệ này? Liên hệ sẽ được chuyển sang trang Không hoạt động.')) return;
        try {
            await del.mutateAsync(id);
            toast.success('Đã xóa liên hệ');
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'Xóa thất bại');
        }
    };

    const getSortLabel = () => {
        if (!sortField) return 'Sắp xếp';
        const labels = { fullName: 'Tên', createdAt: 'Ngày tạo', status: 'Trạng thái' };
        return labels[sortField];
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            'NEW': { color: 'bg-blue-100 text-blue-800', label: 'Mới' },
            'CONTACTED': { color: 'bg-yellow-100 text-yellow-800', label: 'Đã liên hệ' },
            'INTERESTED': { color: 'bg-green-100 text-green-800', label: 'Quan tâm' },
            'NOT_INTERESTED': { color: 'bg-red-100 text-red-800', label: 'Không quan tâm' },
            'CONVERTED': { color: 'bg-emerald-100 text-emerald-800', label: 'Đã chuyển đổi' }
        };
        const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
        return <Badge className={config.color}>{config.label}</Badge>;
    };

    if (!canView) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-96">
                    <CardContent className="pt-6 text-center">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Không có quyền truy cập</h3>
                        <p className="text-gray-600">Bạn không có quyền xem danh sách liên hệ khách hàng.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <Card className="w-full max-w-2xl">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                            <div>
                                <p className="font-semibold text-lg text-gray-900">Lỗi tải dữ liệu</p>
                                <p className="text-sm text-gray-600 mt-2">{(error as any)?.message || 'Không thể kết nối API'}</p>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={() => refetch()} variant="outline" className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Thử lại
                                </Button>
                                <Button onClick={() => router.push('/admin')} variant="ghost">
                                    Quay lại Dashboard
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Liên Hệ Khách Hàng</h1>
                    <p className="text-sm text-gray-600 mt-1">Quản lý thông tin liên hệ từ khách hàng tiềm năng</p>
                </div>
                {canCreate && (
                    <Link href="/admin/customer-contacts/new">
                        <Button className="bg-[#8b5fbf] hover:bg-[#7a4fa8] text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo Liên Hệ
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số</p>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Mới</p>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Đã liên hệ</p>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-6 w-6 text-yellow-600" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-600">{stats.contacted}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Đã chuyển đổi</p>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">{stats.converted}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Không quan tâm</p>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <p className="text-3xl font-bold text-red-600">{stats.notInterested}</p>
                    </div>
                </div>
            </div>

            {/* Toolbar: Search + Sort */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="w-full sm:flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm theo tên, email, số điện thoại..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 border-gray-300 focus:border-[#8b5fbf] focus:ring-[#8b5fbf]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 border border-[#8b5fbf] rounded-lg text-sm font-medium text-[#8b5fbf] hover:bg-[#f3f0ff] bg-white"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span>{getSortLabel()}</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSortDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                        <div className="p-2">
                                            {[
                                                { value: null as SortField, label: 'Mặc định' },
                                                { value: 'fullName' as SortField, label: 'Tên' },
                                                { value: 'createdAt' as SortField, label: 'Ngày tạo' },
                                                { value: 'status' as SortField, label: 'Trạng thái' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value || 'default'}
                                                    onClick={() => {
                                                        setSortField(option.value);
                                                        setIsSortDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${sortField === option.value ? 'bg-[#8b5fbf] text-white' : 'hover:bg-[#f3f0ff]'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {sortField && (
                                <div className="flex gap-1 border rounded-lg p-1">
                                    <button
                                        onClick={() => setSortOrder('asc')}
                                        className={`p-1.5 rounded ${sortOrder === 'asc' ? 'bg-[#8b5fbf] text-white' : 'hover:bg-gray-50'}`}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setSortOrder('desc')}
                                        className={`p-1.5 rounded ${sortOrder === 'desc' ? 'bg-[#8b5fbf] text-white' : 'hover:bg-gray-50'}`}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100 flex-wrap">
                        <Button
                            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('ALL')}
                            size="sm"
                            className={statusFilter === 'ALL' ? 'bg-[#8b5fbf] hover:bg-[#7a4fa8]' : ''}
                        >
                            Tất Cả ({stats.total})
                        </Button>
                        <Button
                            variant={statusFilter === 'NEW' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('NEW')}
                            size="sm"
                            className={statusFilter === 'NEW' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                            Mới ({stats.new})
                        </Button>
                        <Button
                            variant={statusFilter === 'CONTACTED' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('CONTACTED')}
                            size="sm"
                            className={statusFilter === 'CONTACTED' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                        >
                            Đã liên hệ ({stats.contacted})
                        </Button>
                        <Button
                            variant={statusFilter === 'CONVERTED' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('CONVERTED')}
                            size="sm"
                            className={statusFilter === 'CONVERTED' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                            Đã chuyển đổi ({stats.converted})
                        </Button>
                        <Button
                            variant={statusFilter === 'NOT_INTERESTED' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('NOT_INTERESTED')}
                            size="sm"
                            className={statusFilter === 'NOT_INTERESTED' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            Không quan tâm ({stats.notInterested})
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên Hệ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nguồn</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Tạo</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {processedContacts.map((contact: any) => (
                                <tr key={contact.contactId || contact.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{contact.fullName || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm flex flex-col gap-1">
                                            {contact.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    <span>{contact.phone}</span>
                                                </div>
                                            )}
                                            {contact.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    <span className="truncate max-w-xs">{contact.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline">{contact.source || 'N/A'}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(contact.status || 'NEW')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            {contact.createdAt ? format(new Date(contact.createdAt), 'dd/MM/yyyy') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/customer-contacts/${contact.contactId || contact.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {canUpdate && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/customer-contacts/${contact.contactId || contact.id}/edit`)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(contact.contactId || contact.id)}
                                                    className="text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {processedContacts.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900">Không tìm thấy liên hệ nào</p>
                        <p className="text-sm text-gray-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </div>
        </div>
    );
}
