"use client";

import { useParams, useRouter } from 'next/navigation';
import { useContact, useSoftDeleteContact } from '@/hooks/contactHooks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faEnvelope, faInfoCircle, faArrowLeft, faEdit, faTrash, faCalendar } from '@fortawesome/free-solid-svg-icons';

// Helper function to get status badge color
const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
        case 'NEW':
        case 'PENDING':
            return <Badge variant="default" className="bg-blue-500 whitespace-nowrap">{status}</Badge>;
        case 'CONTACTED':
        case 'IN_PROGRESS':
            return <Badge variant="default" className="bg-yellow-500 whitespace-nowrap">{status}</Badge>;
        case 'INTERESTED':
        case 'QUALIFIED':
            return <Badge variant="default" className="bg-green-500 whitespace-nowrap">{status}</Badge>;
        case 'NOT_INTERESTED':
        case 'REJECTED':
            return <Badge variant="destructive" className="whitespace-nowrap">{status}</Badge>;
        case 'CONVERTED':
        case 'SUCCESS':
            return <Badge variant="default" className="bg-emerald-600 whitespace-nowrap">{status}</Badge>;
        default:
            return <Badge variant="secondary" className="whitespace-nowrap">{status}</Badge>;
    }
};

export default function ViewContactPage() {
    const { contactId } = useParams() as { contactId: string };
    const router = useRouter();
    const { data: contact, isLoading, error } = useContact(contactId);
    const del = useSoftDeleteContact();
    const { user } = useAuth();
    const canDelete = user?.roles?.includes('ROLE_ADMIN') || user?.permissions?.includes('DELETE_CONTACT');

    if (isLoading) return <div className="p-6 text-center">Đang tải...</div>;

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/employee/customer-contacts')}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                        <span>Quay lại</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Xem liên hệ</h1>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            Failed to load contact: {(error as any)?.message || 'Unknown error'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/employee/customer-contacts')}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                        <span>Quay lại</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Xem liên hệ</h1>
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                            Contact not found.
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const displayName = contact.fullName || '-';
    const phone = contact.phone || '-';
    const email = contact.email || '-';
    const source = contact.source || contact._raw?.source || '-';
    const status = contact.status || contact._raw?.status || '-';
    const serviceInterested = contact._raw?.serviceInterested || '-';
    const message = contact._raw?.message || '-';
    const createdAt = contact.createdAt ? new Date(contact.createdAt).toLocaleString() : '-';
    const updatedAt = contact.updatedAt ? new Date(contact.updatedAt).toLocaleString() : '-';

    const handleDelete = async () => {
        if (!confirm('Confirm delete this contact?')) return;
        try {
            await del.mutateAsync(contact.id);
            toast.success('Contact deleted successfully');
            router.push('/employee/customers');
        } catch (err: any) {
            console.error('Delete failed', err);
            toast.error(err?.message || 'Failed to delete contact');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/employee/customer-contacts')}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                        <span>Quay lại</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
                        <p className="text-muted-foreground mt-2">
                            Contact ID: {contact.id}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/employee/customer-contacts/${contactId}/edit`)}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                        <span>Sửa</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                        <span>Xóa</span>
                    </Button>
                </div>
            </div>

            {/* Contact Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                        <span>Contact Information</span>
                    </CardTitle>
                    <CardDescription>
                        Basic contact details and communication information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                                <span>Full Name</span>
                            </div>
                            <p className="text-lg font-medium">{displayName}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                                <span>Số điện thoại</span>
                            </div>
                            <p className="text-lg font-medium">{phone}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                                <span>Email</span>
                            </div>
                            <p className="text-lg font-medium">{email}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4" />
                                <span>Source</span>
                            </div>
                            <p className="text-lg font-medium">{source}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5" />
                        <span>Additional Details</span>
                    </CardTitle>
                    <CardDescription>
                        Status, interests, and other information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                            <div className="mt-1">
                                {getStatusBadge(status)}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Service Interested</p>
                            <p className="text-lg font-medium">{serviceInterested}</p>
                        </div>
                    </div>
                    {message && message !== '-' && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Message</p>
                            <p className="text-base whitespace-pre-wrap bg-muted p-3 rounded-md">{message}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCalendar} className="h-5 w-5" />
                        <span>Timeline</span>
                    </CardTitle>
                    <CardDescription>
                        Record creation and modification history
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
                                <span>Created At</span>
                            </div>
                            <p className="text-lg font-medium">{createdAt}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
                                <span>Updated At</span>
                            </div>
                            <p className="text-lg font-medium">{updatedAt}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
