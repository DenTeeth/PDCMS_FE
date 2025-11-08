"use client";

import { useParams, useRouter } from 'next/navigation';
import { useContact, useSoftDeleteContact } from '@/hooks/contactHooks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, ArrowLeft, Pencil, Trash2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

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

export default function ViewContactPage() {
    const { contactId } = useParams() as { contactId: string };
    const router = useRouter();
    const { data: contact, isLoading, error } = useContact(contactId);
    const del = useSoftDeleteContact();
    const { user } = useAuth();

    const canDelete = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('DELETE_CONTACT');
    const canEdit = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('UPDATE_CONTACT');

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

    if (error || !contact) {
        return (
            <div className="container mx-auto p-6">
                <Button
                    variant="outline"
                    onClick={() => router.push('/admin/customer-contacts')}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <Card>
                    <CardContent className="pt-6">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error ? `Lỗi: ${(error as any)?.message || 'Không thể tải liên hệ'}` : 'Không tìm thấy liên hệ'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleDelete = async () => {
        if (!confirm('Xác nhận xóa mềm liên hệ này?')) return;
        try {
            await del.mutateAsync((contact as any).contactId || contact.id);
            toast.success('Đã xóa liên hệ');
            router.push('/admin/customer-contacts');
        } catch (err: any) {
            toast.error(err?.message || 'Xóa thất bại');
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/customer-contacts')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{contact.fullName || 'N/A'}</h1>
                        <p className="text-sm text-gray-600 mt-1">ID: {(contact as any).contactId || contact.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canEdit && (
                        <Button
                            variant="default"
                            onClick={() => router.push(`/admin/customer-contacts/${contactId}/edit`)}
                            className="bg-[#8b5fbf] hover:bg-[#7a4fa8]"
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                        </Button>
                    )}
                </div>
            </div>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Thông Tin Liên Hệ
                    </CardTitle>
                    <CardDescription>Thông tin cơ bản và liên hệ của khách hàng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Họ tên</p>
                            <p className="text-lg font-medium">{contact.fullName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Số điện thoại
                            </p>
                            <p className="text-lg font-medium">{contact.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </p>
                            <p className="text-lg font-medium">{contact.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Nguồn</p>
                            <Badge variant="outline">{contact.source || 'N/A'}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Thông Tin Chi Tiết
                    </CardTitle>
                    <CardDescription>Trạng thái, dịch vụ quan tâm và ghi chú</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                            <div className="mt-1">{getStatusBadge(contact.status || 'NEW')}</div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Dịch vụ quan tâm</p>
                            <p className="text-base">{(contact as any).serviceInterested || 'N/A'}</p>
                        </div>
                    </div>
                    {(contact as any).notes && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ghi chú</p>
                            <p className="text-base bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{(contact as any).notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Lịch Sử
                    </CardTitle>
                    <CardDescription>Thời gian tạo và cập nhật</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                            <p className="text-lg font-medium">
                                {contact.createdAt ? format(new Date(contact.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ngày cập nhật</p>
                            <p className="text-lg font-medium">
                                {contact.updatedAt ? format(new Date(contact.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
