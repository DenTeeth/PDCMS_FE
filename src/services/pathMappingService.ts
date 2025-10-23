/**
 * Navigation Service
 * 
 * Generates navigation structure based on baseRole + permissions
 * BE no longer provides paths - FE handles all navigation logic
 */

export class NavigationService {
  // ✅ NEW APPROACH: Role-based layout + Permission-based navigation
  // Generate paths dynamically based on baseRole context
  
  /**
   * Get navigation structure for a user based on their role and permissions
   * @param baseRole User's base role (admin, employee, user)
   * @param permissions Array of user permissions
   * @returns Navigation structure grouped by domain
   */
  static getNavigationForUser(baseRole: string, permissions: string[]) {
    const navigation: Record<string, Array<{title: string, path: string, permission: string}>> = {};
    
    // Build navigation based on permissions, with paths determined by baseRole
    permissions.forEach(permission => {
      const navItem = this.getNavigationItem(baseRole, permission);
      if (navItem) {
        const domain = this.getPermissionDomain(permission);
        if (!navigation[domain]) navigation[domain] = [];
        
        navigation[domain].push(navItem);
      }
    });
    
    return navigation;
  }

  /**
   * Generate navigation item based on role context and permission
   * @param baseRole User's base role
   * @param permission User permission
   * @returns Navigation item or null
   */
  private static getNavigationItem(baseRole: string, permission: string): {title: string, path: string, permission: string} | null {
    const pathPrefix = this.getPathPrefix(baseRole);
    
    // Generate path based on permission type and role context
    switch (permission) {
      // Account Management
      case 'VIEW_ACCOUNT':
        return { title: permission, path: `${pathPrefix}/accounts`, permission };
      case 'VIEW_EMPLOYEE':
        return { title: permission, path: `${pathPrefix}/accounts/employees`, permission };
      case 'VIEW_PATIENT':
        if (baseRole === 'admin') return { title: permission, path: `${pathPrefix}/accounts/users`, permission };
        if (baseRole === 'employee') return { title: permission, path: `${pathPrefix}/patients`, permission };
        if (baseRole === 'patient') return { title: permission, path: `${pathPrefix}/profile`, permission };
        break;
        
      // Appointments
      case 'VIEW_APPOINTMENT':
        return { title: permission, path: `${pathPrefix}/appointments`, permission };
        
      // Treatments
      case 'VIEW_TREATMENT':
        if (baseRole === 'admin') return { title: permission, path: `${pathPrefix}/treatments`, permission };
        if (baseRole === 'employee') return { title: permission, path: `${pathPrefix}/treatments`, permission };
        if (baseRole === 'patient') return { title: permission, path: `${pathPrefix}/records`, permission };
        break;
        
      // Contact Management
      case 'VIEW_CONTACT':
        if (baseRole === 'admin') return { title: permission, path: `${pathPrefix}/customer-contacts`, permission };
        if (baseRole === 'employee') return { title: permission, path: `${pathPrefix}/customers`, permission };
        break;
      case 'VIEW_CONTACT_HISTORY':
        return { title: permission, path: `${pathPrefix}/customer-contacts`, permission };
        
      // Work Shifts
      case 'VIEW_WORK_SHIFTS':
        return { title: permission, path: `${pathPrefix}/work-shifts`, permission };
        
      // Registration Management
      case 'VIEW_REGISTRATION_ALL':
        return { title: permission, path: `${pathPrefix}/part_time_management`, permission };
      case 'VIEW_REGISTRATION_OWN':
        return { title: permission, path: `${pathPrefix}/part_time_management`, permission };
        
      // Time Off Management
      case 'VIEW_TIME_OFF_ALL':
        return { title: permission, path: `${pathPrefix}/time-off-requests`, permission };
      case 'VIEW_TIME_OFF_OWN':
        return { title: permission, path: `${pathPrefix}/time-off`, permission };
      case 'VIEW_TIMEOFF_TYPE_ALL':
        return { title: permission, path: `${pathPrefix}/time-off-types`, permission };
      case 'VIEW_LEAVE_BALANCE_ALL':
        return { title: permission, path: `${pathPrefix}/leave-balances`, permission };
        
      // Overtime Management
      case 'VIEW_OT_ALL':
        return { title: permission, path: `${pathPrefix}/overtime-requests`, permission };
      case 'VIEW_OT_OWN':
        return { title: permission, path: `${pathPrefix}/overtime`, permission };
        
      // Shift Renewal
      case 'VIEW_RENEWAL_OWN':
        return { title: permission, path: `${pathPrefix}/shift-renewals`, permission };
        
      default:
        return null;
    }
    
    return null;
  }

  /**
   * Get path prefix based on base role
   * Only 3 baseRoles exist in database: admin, employee, patient
   * @param baseRole User's base role (admin | employee | patient)
   * @returns Path prefix
   */
  private static getPathPrefix(baseRole: string): string {
    switch (baseRole.toLowerCase()) {
      case 'admin':
        return '/admin';
      case 'employee':
        return '/employee';
      case 'patient':
        return '/patient';
      default:
        return '/patient'; // Fallback to patient
    }
  }

  // Legacy PERMISSION_PATH_MAPPING for backward compatibility
  private static readonly PERMISSION_PATH_MAPPING: Record<string, string> = {
    // Account Management
    'VIEW_ACCOUNT': '/admin/accounts',
    'VIEW_EMPLOYEE': '/admin/accounts/employees',
    'VIEW_PATIENT': '/admin/accounts/users',
    
    // Treatment & Appointments  
    'VIEW_TREATMENT': '/app/treatments',
    'VIEW_APPOINTMENT': '/admin/appointments',
    
    // Contact Management
    'VIEW_CONTACT': '/app/contacts',
    'VIEW_CONTACT_HISTORY': '/admin/contact-history',
    
    // Work Management
    'VIEW_WORK_SHIFTS': '/app/work-shifts',
    
    // Registration Management
    'VIEW_REGISTRATION_ALL': '/admin/registrations',
    'VIEW_REGISTRATION_OWN': '/app/my-registrations',
    
    // Time Off Management
    'VIEW_TIME_OFF_ALL': '/admin/time-off-requests',
    'VIEW_TIME_OFF_OWN': '/admin/my-time-off',
    'VIEW_TIMEOFF_TYPE_ALL': '/admin/time-off-types',
    'VIEW_LEAVE_BALANCE_ALL': '/admin/leave-balances',
    
    // Overtime Management
    'VIEW_OT_ALL': '/admin/overtime-requests',
    'VIEW_OT_OWN': '/app/my-overtime',
    
    // Shift Renewal
    'VIEW_RENEWAL_OWN': '/admin/shift-renewals',
  };

  // Map Backend paths to Frontend paths
  private static readonly BE_TO_FE_MAPPING: Record<string, string> = {
    // Account Management - already match FE structure
    '/admin/accounts': '/admin/accounts',
    '/admin/accounts/employees': '/admin/accounts/employees',
    '/admin/accounts/users': '/admin/accounts/users',
    
    // Treatment & Appointments
    '/app/treatments': '/employee/treatments',
    '/admin/appointments': '/admin/appointments',
    
    // Contact Management  
    '/app/contacts': '/employee/customer-contacts',
    '/admin/contact-history': '/admin/customer-contacts',
    
    // Work Management
    '/app/work-shifts': '/admin/work-shifts',
    
    // Registration Management
    '/admin/registrations': '/admin/part_time_management',
    '/app/my-registrations': '/employee/part_time_management',
    
    // Time Off Management
    '/admin/time-off-requests': '/admin/time-off-requests',
    '/admin/my-time-off': '/employee/time-off',
    '/admin/time-off-types': '/admin/time-off-types',
    '/admin/leave-balances': '/admin/leave-balances',
    
    // Overtime Management
    '/admin/overtime-requests': '/admin/overtime-requests',
    '/app/my-overtime': '/employee/overtime',
    
    // Shift Renewal
    '/admin/shift-renewals': '/admin/shift-renewals',
  };

  // Reverse mapping (Frontend -> Backend)
  private static readonly FE_TO_BE_MAPPING: Record<string, string> = 
    Object.entries(NavigationService.BE_TO_FE_MAPPING)
      .reduce((acc, [be, fe]) => ({ ...acc, [fe]: be }), {});

  /**
   * Map Backend path to Frontend path
   * @param bePath Backend path from RBAC sidebar
   * @returns Frontend route path
   */
  static mapBackendPathToFrontend(bePath: string): string {
    return this.BE_TO_FE_MAPPING[bePath] || bePath;
  }

  /**
   * Map Frontend path to Backend path
   * @param fePath Frontend route path
   * @returns Backend RBAC path
   */
  static mapFrontendPathToBackend(fePath: string): string {
    return this.FE_TO_BE_MAPPING[fePath] || fePath;
  }

  /**
   * Check if a backend path has a frontend mapping
   * @param bePath Backend path
   * @returns boolean
   */
  static hasMapping(bePath: string): boolean {
    return bePath in this.BE_TO_FE_MAPPING;
  }

  /**
   * Get home path based on base role
   * @param baseRole User's base role
   * @returns Home path for the role
   */
  static getHomePath(baseRole: string): string {
    const pathPrefix = this.getPathPrefix(baseRole);
    return `${pathPrefix}/`;
  }

  /**
   * Determine which layout to use based on base role
   * Only 3 baseRoles exist in database: admin, employee, patient
   * @param baseRole User's base role (admin | employee | patient)
   * @returns Layout type
   */
  static getLayoutType(baseRole: string): 'admin' | 'employee' | 'patient' {
    switch (baseRole.toLowerCase()) {
      case 'admin':
        return 'admin';
      case 'employee':
        return 'employee';
      case 'patient':
        return 'patient';
      default:
        return 'patient'; // Fallback to patient
    }
  }

  /**
   * @deprecated Use getNavigationForUser instead
   * Kept for backward compatibility
   */
  static getNavigationForPermissions(permissions: string[]) {
    console.warn('getNavigationForPermissions is deprecated. Use getNavigationForUser instead.');
    // Fallback to admin layout for backward compatibility
    return this.getNavigationForUser('admin', permissions);
  }

  /**
   * @deprecated Use getNavigationForPermissions instead
   * Kept for backward compatibility
   */
  static getNavigationForRole(userRoles: string[], permissions: string[]) {
    console.warn('getNavigationForRole is deprecated. Use getNavigationForPermissions instead.');
    return this.getNavigationForPermissions(permissions);
  }

  /**
   * Get primary role based on hierarchy
   * @param roles Array of user roles
   * @returns Primary role string
   */
  private static getPrimaryRole(roles: string[]): string {
    const rolePriority = [
      'ROLE_ADMIN', 
      'ROLE_MANAGER', 
      'ROLE_DOCTOR', 
      'ROLE_NURSE', 
      'ROLE_RECEPTIONIST', 
      'ROLE_ACCOUNTANT',
      'ROLE_INVENTORY_MANAGER',
      'ROLE_PATIENT'
    ];
    return rolePriority.find(role => roles.includes(role)) || roles[0] || 'ROLE_PATIENT';
  }
  
  /**
   * Extract domain from permission name
   * @param permission Permission string
   * @returns Domain name
   */
  private static getPermissionDomain(permission: string): string {
    // Account Management
    if (permission.includes('ACCOUNT') || permission.includes('EMPLOYEE') || permission.includes('PATIENT')) {
      return 'ACCOUNT_MANAGEMENT';
    }
    
    // Time Off (includes both TIME_OFF and TIMEOFF_TYPE, LEAVE_BALANCE)
    if (permission.includes('TIME_OFF') || permission.includes('TIMEOFF') || permission.includes('LEAVE_BALANCE')) {
      return 'TIME_OFF_MANAGEMENT';
    }
    
    // Other domains
    if (permission.includes('APPOINTMENT')) return 'APPOINTMENT';
    if (permission.includes('REGISTRATION')) return 'REGISTRATION';
    if (permission.includes('OT')) return 'OVERTIME';
    if (permission.includes('WORK_SHIFTS')) return 'WORK_SHIFTS';
    if (permission.includes('CONTACT')) return 'CONTACT';
    if (permission.includes('TREATMENT')) return 'TREATMENT';
    if (permission.includes('RENEWAL')) return 'SHIFT_RENEWAL';
    
    return 'OTHER';
  }

  /**
   * Get all mapped paths for debugging
   * @returns Object with all mappings
   */
  static getAllMappings() {
    return {
      backendToFrontend: this.BE_TO_FE_MAPPING,
      frontendToBackend: this.FE_TO_BE_MAPPING,
      permissionMapping: this.PERMISSION_PATH_MAPPING,
    };
  }

  /**
   * Context-aware path mapping based on user role
   * Maps the same backend path to different frontend paths based on user context
   * @param bePath Backend path
   * @param userBaseRole User's base role (admin, employee, user)
   * @returns Contextual frontend path
   */
  static mapWithContext(bePath: string, userBaseRole?: string): string {
    // Handle context-specific mappings
    const contextMappings: Record<string, Record<string, string>> = {
      '/app/appointments': {
        'admin': '/admin/appointments',
        'employee': '/employee/appointments',
        'patient': '/patient/appointments',
      },
      '/app/patients': {
        'admin': '/admin/accounts/users',
        'employee': '/employee/patients',
        'patient': '/patient/profile', // Patients see their own profile
      },
      '/app/contacts': {
        'admin': '/admin/customer-contacts',
        'employee': '/employee/customers',
      },
    };

    if (contextMappings[bePath] && userBaseRole && contextMappings[bePath][userBaseRole]) {
      return contextMappings[bePath][userBaseRole];
    }

    // Fallback to regular mapping
    return this.mapBackendPathToFrontend(bePath);
  }
}
