"use client";

import { useRouter } from 'next/navigation';
import ContactForm from '@/app/employee/customers/components/ContactForm';
import { useCreateContact } from '@/hooks/contactHooks';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function AdminCreateCustomerContact() {
    const router = useRouter();
    const create = useCreateContact();

    const onSubmit = async (values: any) => {
        try {
            await create.mutateAsync(values);
            toast.success('Tạo liên hệ khách hàng thành công');
            router.push('/admin/customer-contacts');
        } catch (err: any) {
            toast.error(err.message || 'Tạo mới thất bại');
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center space-x-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/customer-contacts')}
                    className="flex items-center space-x-2"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                    <span>Quay lại</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tạo mới liên hệ khách hàng</h1>
                    <p className="text-muted-foreground mt-2">Thêm thông tin liên hệ khách hàng mới vào hệ thống</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5" />
                        <span>Thông tin liên hệ</span>
                    </CardTitle>
                    <CardDescription>Điền thông tin liên hệ khách hàng bên dưới</CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactForm onSubmit={onSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
