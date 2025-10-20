import { Metadata } from 'next';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EMPLOYEE_NAVIGATION } from '@/constants/permissions';
import { Role } from '@/types/permission';

export const metadata: Metadata = {
  title: 'Employee Dashboard - PDCMS',
  description: 'Dental clinic management system for employees',
};

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={[Role.EMPLOYEE]}>
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
    </ProtectedRoute>
  );
}
