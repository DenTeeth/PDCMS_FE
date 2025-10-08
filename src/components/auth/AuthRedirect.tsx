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
        // Redirect based on user role
        if (user.roles.includes('ADMIN')) {
          router.push('/admin');
        } else if (user.roles.includes('RECEPTIONIST')) {
          router.push('/receptionist');
        } else if (user.roles.includes('DENTIST')) {
          router.push('/dentist');
        } else if (user.roles.includes('MANAGER')) {
          router.push('/manager');
        } else if (user.roles.includes('ACCOUNTANT')) {
          router.push('/accountant');
        } else if (user.roles.includes('WAREHOUSE')) {
          router.push('/warehouse');
        } else {
          router.push('/user');
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

