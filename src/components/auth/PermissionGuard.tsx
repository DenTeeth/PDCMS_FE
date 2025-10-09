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

/**
 * PermissionGuard Component
 * 
 * Conditionally render children based on user permissions
 * 
 * @example Single permission
 * <PermissionGuard permission="CREATE_EMPLOYEE">
 *   <Button>Add Employee</Button>
 * </PermissionGuard>
 * 
 * @example Multiple permissions (OR logic)
 * <PermissionGuard permissions={['CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE']}>
 *   <Button>Manage Employee</Button>
 * </PermissionGuard>
 * 
 * @example Multiple permissions (AND logic)
 * <PermissionGuard permissions={['VIEW_EMPLOYEE', 'DELETE_EMPLOYEE']} requireAll>
 *   <Button>Advanced Actions</Button>
 * </PermissionGuard>
 * 
 * @example With fallback
 * <PermissionGuard 
 *   permission="CREATE_EMPLOYEE" 
 *   fallback={<p>You don't have permission to create employees</p>}
 * >
 *   <Button>Add Employee</Button>
 * </PermissionGuard>
 */
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
