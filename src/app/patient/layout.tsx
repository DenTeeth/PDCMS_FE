'use client';

import ModernSidebar from '@/components/layout/ModernSidebar';
import Navbar from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredBaseRole="patient">
      <div className="min-h-screen bg-background">
        <ModernSidebar />
        <Navbar />
        <div className="flex">
          <main className="flex-1 transition-all duration-300 ease-out min-h-screen w-full overflow-x-hidden pt-16">
            <div className="p-3 sm:p-4 md:p-6 pb-20 w-full">
              <div className="max-w-[1600px] mx-auto w-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

