'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { EMPLOYEE_NAVIGATION } from '@/constants/permissions';
import { Role } from '@/types/permission';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Block ADMIN và PATIENT, cho phép tất cả roles khác
      if (user?.roles) {
        if (user.roles.includes(Role.ADMIN)) {
          console.warn('⚠️ Admin cannot access employee pages');
          router.push('/admin');
          return;
        }
        if (user.roles.includes(Role.PATIENT)) {
          console.warn('⚠️ Patient cannot access employee pages');
          router.push('/user');
          return;
        }
        // Allow: ROLE_EMPLOYEE, ROLE_DOCTOR, ROLE_RECEPTIONIST, và tất cả roles khác
        console.log('✅ Employee access granted');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if admin or patient
  if (user?.roles) {
    if (user.roles.includes(Role.ADMIN) || user.roles.includes(Role.PATIENT)) {
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DynamicSidebar navigationConfig={EMPLOYEE_NAVIGATION} />
        <main className="flex-1 ml-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
