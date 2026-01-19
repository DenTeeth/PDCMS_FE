'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // Single permission check
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // No permission specified, render children
  return <>{children}</>;
};
