import { Metadata } from 'next';
import AccountantSidebar from '@/components/accountant/AccountantSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Financial Management - PDCMS',
  description: 'Dental clinic financial management and accounting system',
};

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={['ACCOUNTANT']}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <AccountantSidebar />
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
