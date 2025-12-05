"use client";

import { useParams, useRouter } from 'next/navigation';
import ContactForm from '@/app/employee/customers/components/ContactForm';
import { useContact, useUpdateContact, useSoftDeleteContact } from '@/hooks/contactHooks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function EditContactPage() {
    const { contactId } = useParams() as { contactId: string };
    const router = useRouter();
    const { data: contact, isLoading, error } = useContact(contactId);
    const update = useUpdateContact();
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
                        <span>Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa liên hệ</h1>
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
                        <span>Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa liên hệ</h1>
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

    const defaultValues = {
        fullName: contact.fullName,
        phone: contact.phone,
        email: contact.email,
        source: contact.source || undefined,
        serviceInterested: contact._raw?.serviceInterested || '',
        message: contact._raw?.message || '',
    };

    const onSubmit = async (values: any) => {
        try {
            await update.mutateAsync({ id: contactId, payload: values });
            toast.success('Contact updated successfully');
            router.push('/employee/customers');
        } catch (err: any) {
            console.error('Update failed', err);
            toast.error(err?.message || 'Failed to update contact');
        }
    };

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
                        <span>Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa liên hệ</h1>
                        <p className="text-muted-foreground mt-2">
                            Update contact information for {contact.fullName}
                        </p>
                    </div>
                </div>
                {canDelete && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                        <span>Delete</span>
                    </Button>
                )}
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                        <span>Contact Information</span>
                    </CardTitle>
                    <CardDescription>
                        Update the customer contact details below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactForm defaultValues={defaultValues} onSubmit={onSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
