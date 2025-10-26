'use client';

import DynamicSidebar from '@/components/layout/NewDynamicSidebar';
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
          <DynamicSidebar />
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
