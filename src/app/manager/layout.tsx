import { Metadata } from 'next'
import ManagerSidebar from '@/components/manager/ManagerSidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export const metadata: Metadata = {
  title: 'Manager Dashboard - PDCMS',
  description: 'Dental clinic management system',
}

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRoles={['MANAGER']}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <ManagerSidebar />
          <main className="flex-1 ml-64">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}