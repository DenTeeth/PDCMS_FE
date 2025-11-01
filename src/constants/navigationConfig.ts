import { 
  faTachometerAlt,
  faUsers,
  faFileAlt,
  faCalendarAlt,
  faCog,
  faShieldAlt,
  faKey,
  faUser,
  faUserTie,
  faUserMd,
  faStethoscope,
  faTeeth,
  faProcedures,
  faHospitalUser,
  faClipboardList,
  faUserPlus,
  faUsersCog,
  faChartLine,
  faBoxes,
  faWarehouse,
  faPlus,
  faClipboard,
  faBell,
  faReceipt,
  faFolderOpen,
  faUserCircle,
  faClockRotateLeft,
  faMoneyBillWave,
  faListAlt,
  faUserCheck,
  faClock,
  faPhone,
  faCalendarCheck,
  faBusinessTime,
  faClockFour,
  faCalendarDays,
  faUmbrellaBeach,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { GroupedPermissions } from '@/types/auth';

export interface NavigationItem {
  name: string;
  href?: string; // Optional for submenu parents
  icon: IconDefinition;
  requiredPermissionGroup?: string; // Tên nhóm permission
  requiredPermissions?: string[]; // Specific permissions cần thiết
  requireAll?: boolean; // true = cần tất cả permissions, false = chỉ cần 1
  hasSubmenu?: boolean;
  submenu?: NavigationItem[];
}

export interface NavigationConfig {
  title: string;
  items: NavigationItem[];
}

/**
 * ADMIN NAVIGATION CONFIG
 * Dựa trên groupedPermissions từ BE
 */
export const ADMIN_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'PDCMS Admin',
  items: [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: faTachometerAlt,
    },
    {
      name: 'Account Management',
      icon: faUsers,
      hasSubmenu: true,
      requiredPermissionGroup: 'ACCOUNT',
      submenu: [
        {
          name: 'User Accounts',
          href: '/admin/accounts/users',
          icon: faUser,
          requiredPermissions: ['VIEW_ACCOUNT'],
        },
        {
          name: 'Employee Accounts',
          href: '/admin/accounts/employees',
          icon: faUserTie,
          requiredPermissionGroup: 'EMPLOYEE',
        },
      ],
    },
    {
      name: 'Blog Management',
      href: '/admin/blogs',
      icon: faFileAlt,
    },
    {
      name: 'Appointments',
      href: '/admin/appointments',
      icon: faCalendarAlt,
      requiredPermissionGroup: 'APPOINTMENT',
    },
    {
      name: 'System Configuration',
      icon: faCog,
      hasSubmenu: true,
      requiredPermissionGroup: 'SYSTEM_CONFIGURATION',
      submenu: [
        {
          name: 'Role Management',
          href: '/admin/roles',
          icon: faShieldAlt,
          requiredPermissions: ['VIEW_ROLE'],
        },
        {
          name: 'Permission Management',
          href: '/admin/permissions',
          icon: faKey,
          requiredPermissions: ['VIEW_PERMISSION'],
        },
        {
          name: 'Specializations',
          href: '/admin/specializations',
          icon: faStethoscope,
          requiredPermissions: ['VIEW_SPECIALIZATION'],
        },
      ],
    },
    {
      name: 'Schedule Management',
      icon: faCalendarCheck,
      hasSubmenu: true,
      requiredPermissionGroup: 'SCHEDULE_MANAGEMENT',
      submenu: [
        {
          name: 'Work Shifts',
          href: '/admin/work-shifts',
          icon: faBusinessTime,
          requiredPermissions: ['VIEW_WORK_SHIFTS'],
        },
        {
          name: 'Work Slots',
          href: '/admin/work-slots',
          icon: faClock,
          requiredPermissions: ['VIEW_WORK_SHIFTS'],
        },
        {
          name: 'Shift Registrations',
          href: '/admin/registrations',
          icon: faCalendarCheck,
          requiredPermissions: ['VIEW_REGISTRATION_ALL', 'VIEW_FIXED_REGISTRATIONS_ALL'],
          requireAll: false, // Show if user has either permission
        },
        {
          name: 'Employee Shifts',
          href: '/admin/employee-shifts',
          icon: faCalendarDays,
          requiredPermissions: ['VIEW_SHIFTS_ALL'],
        },
        {
          name: 'Shift Calendar',
          href: '/admin/shift-calendar',
          icon: faCalendarAlt,
          requiredPermissions: ['VIEW_SHIFTS_ALL'],
        },
      ],
    },
    {
      name: 'Leave Management',
      icon: faUmbrellaBeach,
      hasSubmenu: true,
      requiredPermissionGroup: 'LEAVE_MANAGEMENT',
      submenu: [
        {
          name: 'Overtime Requests',
          href: '/admin/overtime-requests',
          icon: faClockFour,
          requiredPermissions: ['VIEW_OT_ALL'],
        },
        {
          name: 'Time Off Requests',
          href: '/admin/time-off-requests',
          icon: faUmbrellaBeach,
          requiredPermissions: ['VIEW_TIMEOFF_ALL'],
        },
        {
          name: 'Time Off Types',
          href: '/admin/time-off-types',
          icon: faListAlt,
          requiredPermissions: ['VIEW_TIMEOFF_TYPE'],
        },
      ],
    },
    {
      name: 'Customer Contacts',
      href: '/admin/customer-contacts',
      icon: faPhone,
      requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: faCog,
    },
  ],
};

/**
 * EMPLOYEE NAVIGATION CONFIG
 * Dựa trên groupedPermissions từ BE
 */
export const EMPLOYEE_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'PDCMS Employee',
  items: [
    {
      name: 'Dashboard',
      href: '/employee',
      icon: faTachometerAlt,
    },
    // Patient & Treatment Management
    {
      name: 'Patients',
      href: '/employee/patients',
      icon: faHospitalUser,
      requiredPermissionGroup: 'PATIENT',
    },
    {
      name: 'Treatments',
      href: '/employee/treatments',
      icon: faStethoscope,
      requiredPermissionGroup: 'TREATMENT',
    },
    {
      name: 'Customer Contacts',
      href: '/employee/customer-contacts',
      icon: faPhone,
      requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
    },
    {
      name: 'Customers',
      href: '/employee/customers',
      icon: faUsers,
      requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
    },
    // Appointments
    {
      name: 'Appointments',
      href: '/employee/appointments',
      icon: faCalendarAlt,
      requiredPermissionGroup: 'APPOINTMENT',
    },
    // Schedule Management
    {
      name: 'My Work Schedule',
      href: '/employee/schedule',
      icon: faCalendarAlt,
      requiredPermissions: ['VIEW_WORK_SHIFTS'],
    },
    {
      name: 'My Registrations',
      href: '/employee/registrations',
      icon: faCalendarCheck,
      requiredPermissions: ['VIEW_REGISTRATION_OWN', 'VIEW_FIXED_REGISTRATIONS_OWN'],
      requireAll: false, // Show if user has either permission
    },
    {
      name: 'Overtime Requests',
      href: '/employee/overtime-requests',
      icon: faClockFour,
      requiredPermissionGroup: 'LEAVE_MANAGEMENT',
    },
    {
      name: 'Time Off Requests',
      href: '/employee/time-off-requests',
      icon: faUmbrellaBeach,
      requiredPermissionGroup: 'LEAVE_MANAGEMENT',
    },
    {
      name: 'Shift Renewals',
      href: '/employee/shift-renewals',
      icon: faClockRotateLeft,
      requiredPermissionGroup: 'SCHEDULE_MANAGEMENT',
    },
    {
      name: 'Shift Calendar',
      href: '/employee/shift-calendar',
      icon: faCalendarDays,
      requiredPermissions: ['VIEW_SHIFTS_OWN', 'VIEW_SHIFTS_ALL'],
      requireAll: false,
    },
    // Settings
    {
      name: 'Settings',
      href: '/employee/settings',
      icon: faCog,
    },
  ],
};

/**
 * PATIENT NAVIGATION CONFIG
 */
export const PATIENT_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'PDCMS Patient',
  items: [
    {
      name: 'Dashboard',
      href: '/patient',
      icon: faTachometerAlt,
    },
    {
      name: 'My Appointments',
      href: '/patient/appointments',
      icon: faCalendarAlt,
    },
    {
      name: 'Medical Records',
      href: '/patient/records',
      icon: faFolderOpen,
    },
    {
      name: 'Billing',
      href: '/patient/billing',
      icon: faReceipt,
    },
    {
      name: 'Notifications',
      href: '/patient/notifications',
      icon: faBell,
    },
    {
      name: 'Profile',
      href: '/patient/profile',
      icon: faUserCircle,
    },
    {
      name: 'Settings',
      href: '/patient/settings',
      icon: faCog,
    },
  ],
};

/**
 * Helper function: Check if user has permission group
 */
export const hasPermissionGroup = (
  groupedPermissions: GroupedPermissions | undefined,
  requiredGroup: string
): boolean => {
  if (!groupedPermissions) return false;
  return groupedPermissions[requiredGroup] && groupedPermissions[requiredGroup].length > 0;
};

/**
 * Helper function: Check if user has specific permissions
 */
export const hasPermissions = (
  userPermissions: string[],
  requiredPermissions: string[],
  requireAll: boolean = false
): boolean => {
  if (requireAll) {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  } else {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }
};

/**
 * Helper function: Filter navigation items based on user permissions
 */
export const filterNavigationItems = (
  items: NavigationItem[],
  userPermissions: string[] | undefined,
  groupedPermissions: GroupedPermissions | undefined
): NavigationItem[] => {
  return items.filter(item => {
    // Check permission group
    if (item.requiredPermissionGroup) {
      if (!hasPermissionGroup(groupedPermissions, item.requiredPermissionGroup)) {
        return false;
      }
    }

    // Check specific permissions
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (!userPermissions || !hasPermissions(userPermissions, item.requiredPermissions, item.requireAll)) {
        return false;
      }
    }

    // Filter submenu items
    if (item.hasSubmenu && item.submenu) {
      const filteredSubmenu = filterNavigationItems(item.submenu, userPermissions, groupedPermissions);
      if (filteredSubmenu.length === 0) {
        return false; // Hide parent if no submenu items are visible
      }
      item.submenu = filteredSubmenu;
    }

    return true;
  });
};

/**
 * Helper function: Get navigation config by role
 */
export const getNavigationConfigByRole = (roles: string[]): NavigationConfig => {
  if (roles.includes('ROLE_ADMIN')) {
    return ADMIN_NAVIGATION_CONFIG;
  } else if (roles.includes('ROLE_EMPLOYEE') || roles.includes('ROLE_RECEPTIONIST') || roles.includes('ROLE_DOCTOR')) {
    return EMPLOYEE_NAVIGATION_CONFIG;
  } else if (roles.includes('ROLE_PATIENT')) {
    return PATIENT_NAVIGATION_CONFIG;
  }
  
  return PATIENT_NAVIGATION_CONFIG; // Default fallback
};

/**
 * Generate dynamic navigation config based on groupedPermissions
 */
export const generateNavigationConfig = (
  baseRole: string,
  groupedPermissions: GroupedPermissions | undefined
): NavigationConfig => {
  const baseConfig = getNavigationConfigByRole([`ROLE_${baseRole.toUpperCase()}`]);
  
  if (!groupedPermissions) {
    return baseConfig;
  }

  // Filter items based on groupedPermissions
  const filteredItems = baseConfig.items.filter(item => {
    if (!item.requiredPermissionGroup) {
      return true; // Always show items without permission requirements
    }
    
    return hasPermissionGroup(groupedPermissions, item.requiredPermissionGroup);
  });

  return {
    ...baseConfig,
    items: filteredItems
  };
};

/**
 * Helper function: Get base path by baseRole
 */
export const getBasePathByBaseRole = (baseRole: string): string => {
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

/**
 * Helper function: Get base path by role (legacy support)
 */
export const getBasePathByRole = (roles: string[]): string => {
  if (roles.includes('ROLE_ADMIN')) {
    return '/admin';
  } else if (roles.includes('ROLE_EMPLOYEE') || roles.includes('ROLE_RECEPTIONIST') || roles.includes('ROLE_DOCTOR')) {
    return '/employee';
  } else if (roles.includes('ROLE_PATIENT')) {
    return '/patient';
  }
  
  return '/patient'; // Default fallback
};
