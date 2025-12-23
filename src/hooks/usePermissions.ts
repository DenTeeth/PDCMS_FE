/**
 * Custom hooks for RBAC permission checking
 * Provides convenient ways to check permissions in components
 */

import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if user has specific permission
 */
export const usePermission = (permission: string) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * Hook to check if user has any of the provided permissions
 */
export const useAnyPermission = (permissions: string[]) => {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
};

/**
 * Hook to check if user has all of the provided permissions
 */
export const useAllPermissions = (permissions: string[]) => {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(permissions);
};

/**
 * Hook to check if user has specific role
 */
export const useRole = (role: string) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

/**
 * Hook to get permissions for a specific group/domain
 */
export const usePermissionGroup = (group: string) => {
  const { getPermissionsByGroup, hasPermissionInGroup } = useAuth();
  
  return {
    permissions: getPermissionsByGroup(group),
    hasPermission: (permission: string) => hasPermissionInGroup(group, permission),
  };
};

/**
 * Hook to get sidebar navigation items
 * Note: This hook is deprecated - use navigationConfig directly
 */
export const useSidebar = () => {
  // Deprecated: Sidebar items are now managed via navigationConfig
  // This hook is kept for backward compatibility but returns empty array
  return [];
};

/**
 * Hook to get user's home path
 */
export const useHomePath = () => {
  const { getHomePath } = useAuth();
  return getHomePath();
};

/**
 * Hook to check employment type
 */
export const useEmploymentType = () => {
  const { isEmployee, isPartTimeEmployee, user } = useAuth();
  
  return {
    isEmployee: isEmployee(),
    isPartTimeEmployee: isPartTimeEmployee(),
    employmentType: user?.employmentType,
    baseRole: user?.baseRole,
  };
};

/**
 * Hook for common permission patterns
 * ✅ Updated to use new BE permissions (MANAGE_X pattern)
 * Backward compatibility: Old permissions are automatically mapped via checkPermission
 */
export const useCommonPermissions = () => {
  const { hasPermission } = useAuth();
  
  return {
    // Employee management
    canViewEmployees: hasPermission('VIEW_EMPLOYEE'),
    canCreateEmployees: hasPermission('MANAGE_EMPLOYEE'), // ✅ BE: MANAGE_EMPLOYEE covers create/update
    canUpdateEmployees: hasPermission('MANAGE_EMPLOYEE'), // ✅ BE: MANAGE_EMPLOYEE covers create/update
    canDeleteEmployees: hasPermission('DELETE_EMPLOYEE'), // ✅ BE: Separate permission
    
    // Registration management
    canViewAllRegistrations: hasPermission('MANAGE_PART_TIME_REGISTRATIONS'), // ✅ BE: MANAGE_PART_TIME_REGISTRATIONS
    canViewOwnRegistrations: hasPermission('VIEW_REGISTRATION_OWN'), // ✅ BE: VIEW_REGISTRATION_OWN
    canCreateRegistrations: hasPermission('CREATE_REGISTRATION'), // ✅ BE: CREATE_REGISTRATION
    canUpdateRegistrations: hasPermission('MANAGE_PART_TIME_REGISTRATIONS'), // ✅ BE: MANAGE_PART_TIME_REGISTRATIONS
    canDeleteRegistrations: hasPermission('MANAGE_PART_TIME_REGISTRATIONS'), // ✅ BE: MANAGE_PART_TIME_REGISTRATIONS
    
    // Account management
    canViewAccounts: hasPermission('VIEW_ACCOUNT'),
    canCreateAccounts: hasPermission('MANAGE_ACCOUNT'), // ✅ BE: MANAGE_ACCOUNT covers create/update/delete
    canUpdateAccounts: hasPermission('MANAGE_ACCOUNT'), // ✅ BE: MANAGE_ACCOUNT covers create/update/delete
    canDeleteAccounts: hasPermission('MANAGE_ACCOUNT'), // ✅ BE: MANAGE_ACCOUNT covers create/update/delete
    
    // Work shifts
    canViewWorkShifts: hasPermission('MANAGE_WORK_SHIFTS'), // ✅ BE: MANAGE_WORK_SHIFTS covers view/create/update/delete
    canCreateWorkShifts: hasPermission('MANAGE_WORK_SHIFTS'), // ✅ BE: MANAGE_WORK_SHIFTS
    canUpdateWorkShifts: hasPermission('MANAGE_WORK_SHIFTS'), // ✅ BE: MANAGE_WORK_SHIFTS
    canDeleteWorkShifts: hasPermission('MANAGE_WORK_SHIFTS'), // ✅ BE: MANAGE_WORK_SHIFTS
  };
};
