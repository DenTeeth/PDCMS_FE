'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AuthRedirect = ({ children, redirectTo }: AuthRedirectProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // User is already authenticated, redirect to appropriate page
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Redirect based on user role (với prefix ROLE_)
        if (user.roles.includes('ROLE_ADMIN')) {
          router.push('/admin');
        } else if (user.roles.includes('ROLE_RECEPTIONIST')) {
          router.push('/receptionist');
        } else if (user.roles.includes('ROLE_DOCTOR')) {
          router.push('/dentist');
        } else if (user.roles.includes('ROLE_INVENTORY_MANAGER')) {
          router.push('/manager');
        } else if (user.roles.includes('ROLE_ACCOUNTANT')) {
          router.push('/accountant');
        } else if (user.roles.includes('ROLE_NURSE')) {
          router.push('/nurse');
        } else if (user.roles.includes('ROLE_PATIENT')) {
          router.push('/user');
        } else if (user.roles.includes('ROLE_WAREHOUSE_MANAGER')) {
          router.push('/warehouse');
        } else {
          // Fallback nếu role không khớp
          router.push('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, user, isLoading, router, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authenticated, don't render children (will redirect)
  if (isAuthenticated && user) {
    return null;
  }

  // If not authenticated, render children (login form)
  return <>{children}</>;
};

