import { Metadata } from 'next';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
    <ProtectedRoute requiredPermissions={['VIEW_ACCOUNT', 'VIEW_EMPLOYEE']} requireAll={false}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DynamicSidebar title="Admin Dashboard" />
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

