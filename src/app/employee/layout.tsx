'use client';

import DynamicSidebar from '@/components/layout/DynamicSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermissions={['VIEW_REGISTRATION_OWN', 'VIEW_TIME_OFF_OWN']} requireAll={false}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DynamicSidebar title="Employee Portal" />
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
