import { Metadata } from 'next';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ADMIN_NAVIGATION } from '@/constants/permissions';
import { Role } from '@/types/permission';

export const metadata: Metadata = {
  title: 'Admin Dashboard - PDCMS',
  description: 'Dental clinic management system',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DynamicSidebar navigationConfig={ADMIN_NAVIGATION} />
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

