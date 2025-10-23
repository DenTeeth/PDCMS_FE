/**
 * Routing Service
 * 
 * Handles automatic redirection based on baseRole after login
 * Ensures users land in the correct layout context
 * 
 * Only 3 baseRoles exist in database: admin, employee, patient
 */

import { NavigationService } from './pathMappingService';

export class RoutingService {
  /**
   * Redirect user to appropriate layout after login
   * @param baseRole User's base role (admin | employee | patient)
   * @param router Next.js router instance
   */
  static redirectToLayout(baseRole: string, router: any) {
    const layoutType = NavigationService.getLayoutType(baseRole);
    const homePath = NavigationService.getHomePath(baseRole);
    
    console.log(`🔄 Redirecting ${baseRole} to ${layoutType} layout: ${homePath}`);
    router.push(homePath);
  }

  /**
   * Check if current path matches user's role context
   * @param currentPath Current URL path
   * @param baseRole User's base role (admin | employee | patient)
   * @returns True if path matches role context
   */
  static isValidPathForRole(currentPath: string, baseRole: string): boolean {
    const layoutType = NavigationService.getLayoutType(baseRole);
    
    switch (layoutType) {
      case 'admin':
        return currentPath.startsWith('/admin');
      case 'employee':
        return currentPath.startsWith('/employee');
      case 'patient':
        return currentPath.startsWith('/patient');
      default:
        return false;
    }
  }

  /**
   * Get redirect path if user is in wrong layout
   * @param currentPath Current URL path
   * @param baseRole User's base role (admin | employee | patient)
   * @returns Redirect path or null if current path is valid
   */
  static getRedirectPath(currentPath: string, baseRole: string): string | null {
    if (this.isValidPathForRole(currentPath, baseRole)) {
      return null; // Current path is valid
    }
    
    // User is in wrong layout, redirect to their home
    return NavigationService.getHomePath(baseRole);
  }

  /**
   * Handle route protection based on permissions
   * @param requiredPermissions Required permissions for the route
   * @param userPermissions User's permissions
   * @param baseRole User's base role (admin | employee | patient)
   * @returns Object with access status and redirect path
   */
  static checkRouteAccess(
    requiredPermissions: string[], 
    userPermissions: string[], 
    baseRole: string
  ): { hasAccess: boolean; redirectPath?: string } {
    
    // Check if user has required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return {
        hasAccess: false,
        redirectPath: '/unauthorized'
      };
    }
    
    return { hasAccess: true };
  }
}
