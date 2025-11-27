"use client";

import { useParams, useRouter } from 'next/navigation';
import ContactForm from '@/app/employee/customers/components/ContactForm';
import { useContact, useUpdateContact, useSoftDeleteContact } from '@/hooks/contactHooks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft, Trash2 } from 'lucide-react';

export default function EditContactPage() {
    const { contactId } = useParams() as { contactId: string };
    const router = useRouter();
    const { data: contact, isLoading, error } = useContact(contactId);
    const update = useUpdateContact();
    const del = useSoftDeleteContact();
    const { user } = useAuth();
    const canDelete = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('DELETE_CONTACT');

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

    const defaultValues = {
        fullName: contact.fullName,
        phone: contact.phone,
        email: contact.email,
        source: contact.source?.toLowerCase?.() || undefined,
        serviceInterested: (contact as any).serviceInterested || '',
        message: (contact as any).message || '',
    };

    const onSubmit = async (values: any) => {
        try {
            await update.mutateAsync({ id: contactId, payload: values });
            toast.success('Cập nhật liên hệ thành công');
            router.push('/admin/customer-contacts');
        } catch (err: any) {
            toast.error(err?.message || 'Cập nhật thất bại');
        }
    };

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
                        <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Liên Hệ</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Cập nhật thông tin cho {contact.fullName}
                        </p>
                    </div>
                </div>
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

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Thông Tin Liên Hệ
                    </CardTitle>
                    <CardDescription>
                        Cập nhật thông tin liên hệ của khách hàng
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactForm defaultValues={defaultValues} onSubmit={onSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
