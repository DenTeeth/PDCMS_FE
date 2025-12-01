'use client';

/**
 * Redirect page for old employee treatment plans URL
 * Redirects to /employee/treatment-plans
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EmployeeTreatmentPlansRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve query params if any
    const patientCode = searchParams.get('patientCode');
    let redirectUrl = '/employee/treatment-plans';
    if (patientCode) {
      redirectUrl += `?patientCode=${patientCode}`;
    }
    
    // Redirect to correct path
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    </div>
  );
}
