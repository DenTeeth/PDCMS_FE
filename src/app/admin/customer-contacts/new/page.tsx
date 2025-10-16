"use client";

import { useRouter } from 'next/navigation';
import ContactForm from '@/components/receptionist/ContactForm';
import { useCreateContact } from '@/hooks/contactHooks';
import { toast } from 'sonner';

export default function AdminCreateCustomerContact() {
    const router = useRouter();
    const create = useCreateContact();

    const onSubmit = async (values: any) => {
        try {
            await create.mutateAsync(values);
            toast.success('Customer contact created (admin test)');
            router.push('/admin');
        } catch (err: any) {
            toast.error(err.message || 'Create failed');
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Admin - Create Customer Contact (Temp)</h1>
                        <p className="text-sm text-muted-foreground">Temporary page to test contact creation from admin area</p>
                    </div>
                    <div>
                        <button className="btn-outline" onClick={() => router.push('/admin')}>Back</button>
                    </div>
                </div>

                <ContactForm onSubmit={onSubmit} />
            </div>
        </div>
    );
}
