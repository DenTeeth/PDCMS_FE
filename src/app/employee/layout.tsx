'use client';

import ModernSidebar from '@/components/layout/ModernSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@/types/permission';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredBaseRole="employee">
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
