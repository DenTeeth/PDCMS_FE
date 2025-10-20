'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/permission';

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
        // Redirect based on user role (3 roles chính)
        // Priority: Admin > Employee > Patient
        if (user.roles.includes(Role.ADMIN)) {
          console.log('🔄 Redirecting to admin dashboard...');
          router.push('/admin');
        } else if (user.roles.includes(Role.EMPLOYEE)) {
          console.log('🔄 Redirecting to employee dashboard...');
          router.push('/employee');
        } else if (user.roles.includes(Role.PATIENT)) {
          console.log('🔄 Redirecting to patient dashboard...');
          router.push('/user');
        } else {
          // Fallback if role doesn't match
          console.warn('⚠️ Unknown role, redirecting to unauthorized...');
          router.push('/unauthorized');
        }
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
 * Helper function: Get redirect path based on user roles
 */
export const getRedirectPath = (roles: string[]): string => {
  if (roles.includes(Role.ADMIN)) {
    return '/admin';
  } else if (roles.includes(Role.EMPLOYEE)) {
    return '/employee';
  } else if (roles.includes(Role.PATIENT)) {
    return '/user';
  } else {
    return '/unauthorized';
  }
};

