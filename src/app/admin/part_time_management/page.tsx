'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PartTimeManagementRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/registrations');
  }, [router]);

  return null;
}
