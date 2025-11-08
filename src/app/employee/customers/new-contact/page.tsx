"use client";

import { useRouter } from 'next/navigation';
import ContactForm from '@/app/employee/customers/components/ContactForm';
import { useCreateContact } from '@/hooks/contactHooks';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function NewCustomerContactPage() {
    const router = useRouter();
    const create = useCreateContact();

    const onSubmit = async (values: any) => {
        try {
            await create.mutateAsync(values);
            toast.success('Customer contact created successfully');
            router.push('/employee/customer-contacts');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create contact');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
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
                    <h1 className="text-3xl font-bold text-foreground">New Customer Contact</h1>
                    <p className="text-muted-foreground mt-2">
                        Add a new customer inquiry or contact record
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5" />
                        <span>Contact Information</span>
                    </CardTitle>
                    <CardDescription>
                        Fill in the customer contact details below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactForm onSubmit={onSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
