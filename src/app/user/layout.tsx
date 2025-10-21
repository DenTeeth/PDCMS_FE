import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PATIENT_NAVIGATION } from '@/constants/permissions';
import { Role } from '@/types/permission';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={[Role.PATIENT]}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DynamicSidebar navigationConfig={PATIENT_NAVIGATION} />
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

