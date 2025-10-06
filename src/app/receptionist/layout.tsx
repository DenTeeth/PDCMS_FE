import { Metadata } from 'next';
import ReceptionistSidebar from '@/components/receptionist/ReceptionistSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Receptionist Dashboard - PDCMS',
  description: 'Dental clinic receptionist management system',
};

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={['RECEPTIONIST']}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <ReceptionistSidebar />
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
