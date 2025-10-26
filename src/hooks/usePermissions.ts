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
 */
export const useSidebar = () => {
  const { getSidebarItems } = useAuth();
  return getSidebarItems();
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
 */
export const useCommonPermissions = () => {
  const { hasPermission } = useAuth();
  
  return {
    // Employee management
    canViewEmployees: hasPermission('VIEW_EMPLOYEE'),
    canCreateEmployees: hasPermission('CREATE_EMPLOYEE'),
    canUpdateEmployees: hasPermission('UPDATE_EMPLOYEE'),
    canDeleteEmployees: hasPermission('DELETE_EMPLOYEE'),
    
    // Registration management
    canViewAllRegistrations: hasPermission('VIEW_REGISTRATION_ALL'),
    canViewOwnRegistrations: hasPermission('VIEW_REGISTRATION_OWN'),
    canCreateRegistrations: hasPermission('CREATE_REGISTRATION'),
    canUpdateRegistrations: hasPermission('UPDATE_REGISTRATION'),
    canDeleteRegistrations: hasPermission('DELETE_REGISTRATION'),
    
    // Account management
    canViewAccounts: hasPermission('VIEW_ACCOUNT'),
    canCreateAccounts: hasPermission('CREATE_ACCOUNT'),
    canUpdateAccounts: hasPermission('UPDATE_ACCOUNT'),
    canDeleteAccounts: hasPermission('DELETE_ACCOUNT'),
    
    // Work shifts
    canViewWorkShifts: hasPermission('VIEW_WORK_SHIFTS'),
    canCreateWorkShifts: hasPermission('CREATE_WORK_SHIFTS'),
    canUpdateWorkShifts: hasPermission('UPDATE_WORK_SHIFTS'),
    canDeleteWorkShifts: hasPermission('DELETE_WORK_SHIFTS'),
  };
};
