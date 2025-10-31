import { Metadata } from 'next';
import ModernSidebar from '@/components/layout/ModernSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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
    <ProtectedRoute requiredBaseRole="admin">
      <div className="min-h-screen bg-background">
        <div className="flex">
          <ModernSidebar />
          <main className="flex-1 transition-all duration-300 ease-out lg:ml-64">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

