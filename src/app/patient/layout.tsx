import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermissions={['VIEW_PATIENT', 'VIEW_APPOINTMENT']} requireAll={false}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DynamicSidebar title="Patient Portal" />
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

