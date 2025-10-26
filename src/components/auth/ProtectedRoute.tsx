'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Role } from '@/types/permission';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: (string | Role)[];      // Support both string and Role enum
  requiredBaseRole?: string;              // ✅ NEW: Check theo baseRole (admin, employee, patient)
  requiredPermissions?: string[];         // ✅ NEW: Check theo permissions (RBAC)
  requireAll?: boolean;                   // ✅ NEW: true = cần ALL permissions, false = cần ANY permission
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredBaseRole,
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/login',
}) => {
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole,
    getHomePath 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      // ✅ Priority 1: Check baseRole (Recommended for layout protection)
      if (requiredBaseRole) {
        if (user?.baseRole !== requiredBaseRole) {
          console.warn(`Access denied. Required baseRole: ${requiredBaseRole}, current: ${user?.baseRole}`);
          router.push('/unauthorized');
          return;
        }
      }
      // ✅ Priority 2: Check permissions (RBAC - Recommended for feature protection)
      else if (requiredPermissions.length > 0) {
        const hasRequiredPermission = requireAll
          ? hasAllPermissions(requiredPermissions)
          : hasAnyPermission(requiredPermissions);
        
        if (!hasRequiredPermission) {
          console.warn(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
          router.push('/unauthorized');
          return;
        }
      }
      // ⚠️ Priority 3: Fallback to roles check (Legacy support)
      else if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => hasRole(role as string));
        
        if (!hasRequiredRole) {
          console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [isAuthenticated, user, isLoading, requiredRoles, requiredBaseRole, requiredPermissions, requireAll, router, fallbackPath]);

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

  // ✅ Check baseRole (Recommended for layout protection)
  if (requiredBaseRole) {
    if (user?.baseRole !== requiredBaseRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Required baseRole: {requiredBaseRole}</p>
            <button 
              onClick={() => router.push(getHomePath())}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }
  // ✅ Check permissions (RBAC - Recommended for feature protection)
  else if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Required: {requiredPermissions.join(', ')}</p>
            <button 
              onClick={() => router.push(getHomePath())}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }
  // ⚠️ Fallback: Check roles (Legacy support)
  else if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role as string));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have the required role to access this page.</p>
            <p className="text-sm text-gray-500">Required role: {requiredRoles.join(', ')}</p>
            <button 
              onClick={() => router.push(getHomePath())}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
