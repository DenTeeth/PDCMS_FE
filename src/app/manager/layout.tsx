'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DynamicSidebar from '@/components/layout/NewDynamicSidebar';
import { MANAGER_NAVIGATION } from '@/constants/permissions';

export default function ManagerLayout({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (user && !user.roles.includes('MANAGER')) {
            router.push('/unauthorized');
        }
        setIsChecking(false);
    }, [user, router]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                <DynamicSidebar navigationConfig={MANAGER_NAVIGATION} />
                <main className="flex-1 ml-64">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
