import UserSidebar from '@/components/user/UserSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={['USER']}>
      <div className="min-h-screen bg-background">
        <UserSidebar />
        <div className="lg:pl-64">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

