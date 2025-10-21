'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Role } from '@/types/permission';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: (string | Role)[];      // Support both string and Role enum
  requiredPermissions?: string[];         // ✅ NEW: Check theo permissions (RBAC)
  requireAll?: boolean;                   // ✅ NEW: true = cần ALL permissions, false = cần ANY permission
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      // ✅ Priority 1: Check permissions (RBAC - Recommended)
      if (requiredPermissions.length > 0 && user?.permissions) {
        const hasPermission = requireAll
          ? requiredPermissions.every(permission => user.permissions.includes(permission))
          : requiredPermissions.some(permission => user.permissions.includes(permission));
        
        if (!hasPermission) {
          console.warn(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
          router.push('/unauthorized');
          return;
        }
      }
      // ⚠️ Priority 2: Fallback to roles check (Legacy support)
      else if (requiredRoles.length > 0 && user?.roles) {
        const hasRequiredRole = requiredRoles.some(role => 
          user.roles.includes(role as string)
        );
        
        if (!hasRequiredRole) {
          console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRoles, requiredPermissions, requireAll, router, fallbackPath]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // ✅ Check permissions (RBAC - Recommended)
  if (requiredPermissions.length > 0 && user?.permissions) {
    const hasPermission = requireAll
      ? requiredPermissions.every(permission => user.permissions.includes(permission))
      : requiredPermissions.some(permission => user.permissions.includes(permission));
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Required: {requiredPermissions.join(', ')}</p>
          </div>
        </div>
      );
    }
  }
  // ⚠️ Fallback: Check roles (Legacy support)
  else if (requiredRoles.length > 0 && user?.roles) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles.includes(role as string)
    );
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have the required role to access this page.</p>
            <p className="text-sm text-gray-500">Required role: {requiredRoles.join(', ')}</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
