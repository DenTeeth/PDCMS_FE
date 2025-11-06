'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeePartTimeManagementRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/employee/registrations');
  }, [router]);

  return null;
}
