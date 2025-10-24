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
      } else if (user.baseRole) {
        // Redirect based on baseRole
        console.log(`🔄 Redirecting ${user.baseRole} to appropriate layout...`);
        const redirectPath = getRedirectPath(user.baseRole);
        router.push(redirectPath);
      } else {
        // Fallback to patient layout if no baseRole
        console.log('🔄 No baseRole found, redirecting to patient layout...');
        router.push('/patient');
      }
    }
  }, [isAuthenticated, user, isLoading, router, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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

/**
 * Helper function: Get redirect path based on baseRole
 */
export const getRedirectPath = (baseRole: string): string => {
  switch (baseRole) {
    case 'admin':
      return '/admin';
    case 'employee':
      return '/employee';
    case 'patient':
      return '/patient';
    default:
      return '/patient';
  }
};

