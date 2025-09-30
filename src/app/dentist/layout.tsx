import { Metadata } from 'next';
import DentistSidebar from '@/components/dentist/DentistSidebar';

export const metadata: Metadata = {
  title: 'Dental Practice Management - PDCMS',
  description: 'Comprehensive dental practice management system for dentists',
};

export default function DentistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <DentistSidebar />
        <main className="flex-1 ml-64">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

