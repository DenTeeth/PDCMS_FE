'use client';

/**
 * Redirect page for old employee treatment plan detail URL
 * Redirects to /employee/treatment-plans/[planCode]
 */

import { useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EmployeeTreatmentPlanDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    const planCode = params?.planCode as string;
    const patientCode = searchParams.get('patientCode');

    // Build redirect URL
    let redirectUrl = `/employee/treatment-plans/${planCode}`;
    if (patientCode) {
      redirectUrl += `?patientCode=${patientCode}`;
    }

    // Redirect to correct path
    router.replace(redirectUrl);
  }, [router, params, searchParams]);

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
