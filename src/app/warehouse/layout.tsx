import { Metadata } from 'next';
import WarehouseSidebar from '@/components/warehouse/WarehouseSidebar';

export const metadata: Metadata = {
  title: 'Warehouse Management - PDCMS',
  description: 'Dental clinic inventory management system',
};

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <WarehouseSidebar />
        <main className="flex-1 ml-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
