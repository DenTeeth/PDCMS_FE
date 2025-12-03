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
  faWallet,
  faComments,
  faImage,
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
  employmentTypes?: string[]; // Restrict to specific employment types (FULL_TIME, PART_TIME_FIXED, PART_TIME_FLEX)
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
          name: 'Shift Calendar',
          href: '/admin/shift-calendar',
          icon: faCalendarAlt,
          requiredPermissions: ['VIEW_SHIFTS_ALL'],
        },
      ],
    },
    {
      name: 'Request Management',
      icon: faClipboardList,
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
          name: 'Registration Requests',
          href: '/admin/registration-requests',
          icon: faClipboard,
          requiredPermissions: ['VIEW_REGISTRATION_ALL'],
        },
      ],
    },
    {
      name: 'Leave Management',
      icon: faListAlt,
      hasSubmenu: true,
      requiredPermissionGroup: 'LEAVE_MANAGEMENT',
      submenu: [
        {
          name: 'Time Off Types',
          href: '/admin/time-off-types',
          icon: faListAlt,
          requiredPermissions: ['VIEW_TIMEOFF_TYPE'],
        },
      ],
    },
    {
      name: 'Warehouse Management',
      icon: faWarehouse,
      hasSubmenu: true,
      // Access Control: RBAC-based - Check VIEW_WAREHOUSE permission first
      // Fallback: ROLE_ADMIN (has all permissions in seed data)
      // This menu will show if user has VIEW_WAREHOUSE permission OR is ROLE_ADMIN
      // Logic is handled in filterNavigationItems function using canAccessWarehouse()
      submenu: [
        {
          name: 'Tổng Quan Kho',
          href: '/admin/warehouse',
          icon: faTachometerAlt,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Quản Lý Vật Tư',
          href: '/admin/warehouse/inventory',
          icon: faBoxes,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Nhập/Xuất Kho',
          href: '/admin/warehouse/storage',
          icon: faClipboard,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Nhà Cung Cấp',
          href: '/admin/warehouse/suppliers',
          icon: faUsers,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Báo Cáo & Thống Kê',
          href: '/admin/warehouse/reports',
          icon: faChartLine,
          requiredPermissions: ['VIEW_WAREHOUSE'],
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
      name: 'Booking Management',
      icon: faClipboardList,
      hasSubmenu: true,
      // Parent menu visibility is determined by submenu items - if user has permission for any submenu item, show parent
      // No requiredPermissions on parent - logic handled in filterNavigationItems
      submenu: [
        {
          name: 'Rooms',
          href: '/admin/booking/rooms',
          icon: faHospitalUser,
          requiredPermissionGroup: 'ROOM_MANAGEMENT',
        },
        {
          name: 'Services',
          href: '/admin/booking/services',
          icon: faTeeth,
          requiredPermissionGroup: 'SERVICE_MANAGEMENT',
        },
        {
          name: 'Appointments',
          href: '/admin/booking/appointments',
          icon: faCalendarAlt,
          requiredPermissionGroup: 'APPOINTMENT',
        },
        {
          name: 'Treatment Plans',
          href: '/admin/treatment-plans',
          icon: faListCheck,
          requiredPermissions: ['VIEW_TREATMENT_PLAN_ALL'],
        },
      ],
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
 * Tổ chức theo nhóm chức năng
 */
export const EMPLOYEE_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'PDCMS Employee',
  items: [
    {
      name: 'Dashboard',
      href: '/employee',
      icon: faTachometerAlt,
    },
    // Booking Management
    {
      name: 'Booking Management',
      icon: faClipboardList,
      hasSubmenu: true,
      requiredPermissions: ['VIEW_APPOINTMENT_OWN', 'VIEW_APPOINTMENT_ALL'],
      requireAll: false,
      submenu: [
        {
          name: 'Appointments',
          href: '/employee/appointments',
          icon: faCalendarAlt,
          requiredPermissions: ['VIEW_APPOINTMENT_OWN', 'VIEW_APPOINTMENT_ALL'],
          requireAll: false,
        },
      ],
    },
    // Treatment Plans (separate from Booking Management)
    {
      name: 'Treatment Plans',
      href: '/employee/treatment-plans',
      icon: faListCheck,
      requiredPermissions: ['VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_OWN'],
      requireAll: false, // Accept ANY permission (Employee can have VIEW_TREATMENT_PLAN_OWN)
    },
    // Schedule Management
    {
      name: 'Schedule Management',
      icon: faCalendarCheck,
      hasSubmenu: true,
      requiredPermissions: ['VIEW_SHIFTS_OWN', 'VIEW_REGISTRATION_OWN', 'VIEW_FIXED_REGISTRATIONS_OWN'],
      requireAll: false,
      submenu: [
        {
          name: 'My Registrations',
          href: '/employee/registrations',
          icon: faCalendarCheck,
          requiredPermissions: ['VIEW_REGISTRATION_OWN', 'VIEW_FIXED_REGISTRATIONS_OWN'],
          requireAll: false,
          // Show for all employment types (has tabs inside)
        },
        {
          name: 'Shift Calendar',
          href: '/employee/shift-calendar',
          icon: faCalendarAlt,
          requiredPermissions: ['VIEW_SHIFTS_OWN'],
          // Show for all employment types
        },
        {
          name: 'My Calendar',
          href: '/employee/my-calendar',
          icon: faCalendarDays,
          requiredPermissions: ['VIEW_SHIFTS_OWN', 'VIEW_APPOINTMENT_OWN'],
          requireAll: false,
          employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED'], // Only for Full-time & Part-time Fixed
        },
        {
          name: 'Fixed Registrations',
          href: '/employee/fixed-registrations',
          icon: faListCheck,
          requiredPermissions: ['VIEW_FIXED_REGISTRATIONS_OWN'],
          employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED'], // Only for Full-time & Part-time Fixed
        },
        {
          name: 'Shift Renewals',
          href: '/employee/renewals',
          icon: faClockRotateLeft,
          requiredPermissionGroup: 'SCHEDULE_MANAGEMENT',
          employmentTypes: ['PART_TIME_FLEX'], // Only for Part-time Flex
        },
      ],
    },
    // Request Management
    {
      name: 'Request Management',
      icon: faClipboardList,
      hasSubmenu: true,
      requiredPermissionGroup: 'LEAVE_MANAGEMENT',
      submenu: [
        {
          name: 'Overtime Requests',
          href: '/employee/overtime-requests',
          icon: faClockFour,
          requiredPermissionGroup: 'LEAVE_MANAGEMENT',
          employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED'], // Only for Full-time & Part-time Fixed
        },
        {
          name: 'Time Off Requests',
          href: '/employee/time-off-requests',
          icon: faUmbrellaBeach,
          requiredPermissionGroup: 'LEAVE_MANAGEMENT',
          employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED'], // Only for Full-time & Part-time Fixed
        },
      ],
    },
    // Customer Management
    {
      name: 'Customer Management',
      icon: faUsers,
      hasSubmenu: true,
      requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
      submenu: [
        {
          name: 'Customers',
          href: '/employee/customers',
          icon: faUsers,
          requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
        },
        {
          name: 'Customer Contacts',
          href: '/employee/customer-contacts',
          icon: faPhone,
          requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
        },
        {
          name: 'Customer Feedback',
          href: '/employee/customers/feedback',
          icon: faComments,
          requiredPermissionGroup: 'CUSTOMER_MANAGEMENT',
        },
      ],
    },
    // Warehouse Management (for employee roles with VIEW_WAREHOUSE permission)
    {
      name: 'Warehouse Management',
      icon: faWarehouse,
      hasSubmenu: true,
      // Access Control: RBAC-based - Check VIEW_WAREHOUSE permission first
      // Fallback: ROLE_ADMIN (has all permissions in seed data)
      // This menu will show if user has VIEW_WAREHOUSE permission OR is ROLE_ADMIN
      // Logic is handled in filterNavigationItems function using canAccessWarehouse()
      submenu: [
        {
          name: 'Tổng Quan Kho',
          href: '/employee/warehouse',
          icon: faTachometerAlt,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Quản Lý Vật Tư',
          href: '/employee/warehouse/inventory',
          icon: faBoxes,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Nhập/Xuất Kho',
          href: '/employee/warehouse/storage',
          icon: faClipboard,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Nhà Cung Cấp',
          href: '/employee/warehouse/suppliers',
          icon: faUsers,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Báo Cáo & Thống Kê',
          href: '/employee/warehouse/reports',
          icon: faChartLine,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
      ],
    },
    // Analytics
    {
      name: 'Analytics',
      href: '/employee/analytics',
      icon: faChartLine,
      requiredPermissionGroup: 'ANALYTICS', // Adjust based on actual permission group
    },
    // NII Image Viewer
    {
      name: 'CBCT Viewer',
      href: '/employee/nii-viewer',
      icon: faImage,
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
 * Includes menu items based on permissions (RBAC)
 * Patient role can have admin/employee permissions, so we show menu items based on actual permissions
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
      name: 'Treatment Plans',
      href: '/patient/treatment-plans',
      icon: faListCheck,
      requiredPermissions: ['VIEW_TREATMENT_PLAN_OWN', 'VIEW_TREATMENT_PLAN_ALL'],
      requireAll: false,
    },
    // Booking Management - Show if user has any booking-related permissions
    {
      name: 'Booking Management',
      icon: faClipboardList,
      hasSubmenu: true,
      // Parent menu visibility is determined by submenu items
      submenu: [
        {
          name: 'Rooms',
          href: '/admin/booking/rooms',
          icon: faHospitalUser,
          requiredPermissions: ['VIEW_ROOM'],
        },
        {
          name: 'Services',
          href: '/admin/booking/services',
          icon: faTeeth,
          requiredPermissions: ['VIEW_SERVICE'],
        },
        {
          name: 'Appointments',
          href: '/admin/booking/appointments',
          icon: faCalendarAlt,
          requiredPermissions: ['VIEW_APPOINTMENT', 'VIEW_APPOINTMENT_ALL', 'VIEW_APPOINTMENT_OWN'],
          requireAll: false,
        },
        {
          name: 'Treatment Plans',
          href: '/admin/treatment-plans',
          icon: faListCheck,
          requiredPermissions: ['VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_OWN'],
          requireAll: false,
        },
      ],
    },
    // System Configuration - Show if user has system config permissions
    {
      name: 'System Configuration',
      icon: faCog,
      hasSubmenu: true,
      // Parent menu visibility is determined by submenu items
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
    // Warehouse Management - Show if user has VIEW_WAREHOUSE permission
    {
      name: 'Warehouse Management',
      icon: faWarehouse,
      hasSubmenu: true,
      // Access Control: RBAC-based - Check VIEW_WAREHOUSE permission first
      // Fallback: ROLE_ADMIN (has all permissions in seed data)
      // This menu will show if user has VIEW_WAREHOUSE permission OR is ROLE_ADMIN
      // Logic is handled in filterNavigationItems function using canAccessWarehouse()
      submenu: [
        {
          name: 'Tổng Quan Kho',
          href: '/admin/warehouse',
          icon: faTachometerAlt,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Quản Lý Vật Tư',
          href: '/admin/warehouse/inventory',
          icon: faBoxes,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Nhập/Xuất Kho',
          href: '/admin/warehouse/storage',
          icon: faClipboard,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Nhà Cung Cấp',
          href: '/admin/warehouse/suppliers',
          icon: faUsers,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
        {
          name: 'Báo Cáo & Thống Kê',
          href: '/admin/warehouse/reports',
          icon: faChartLine,
          requiredPermissions: ['VIEW_WAREHOUSE'],
        },
      ],
    },
    {
      name: 'Medical Records',
      href: '/patient/records',
      icon: faFolderOpen,
    },
    {
      name: 'CBCT Viewer',
      href: '/patient/nii-viewer',
      icon: faImage,
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
 * Helper function: Check if user can access warehouse (RBAC-based)
 * Priority: Check permissions first (RBAC), ROLE_ADMIN as fallback only
 * BE Pattern: hasRole('ADMIN') or hasAuthority('VIEW_WAREHOUSE')
 * Note: ROLE_ADMIN has all permissions in seed data, but we prioritize permission check
 */
export const canAccessWarehouse = (
  userRoles?: string[],
  userPermissions?: string[]
): boolean => {
  // Priority 1: Check if user has VIEW_WAREHOUSE permission (RBAC)
  const hasViewWarehouse = userPermissions?.includes('VIEW_WAREHOUSE') || false;
  if (hasViewWarehouse) {
    return true;
  }

  // Priority 2: Fallback - Check if user is ROLE_ADMIN (has all permissions)
  // Note: This is a fallback only, as ROLE_ADMIN should have VIEW_WAREHOUSE permission
  const isAdmin = userRoles?.includes('ROLE_ADMIN') || false;
  return isAdmin;
};

/**
 * Helper function: Filter navigation items based on user permissions, roles, and employment type
 */
export const filterNavigationItems = (
  items: NavigationItem[],
  userPermissions: string[] | undefined,
  groupedPermissions: GroupedPermissions | undefined,
  userRoles?: string[], // Add userRoles parameter to check ROLE_ADMIN
  employmentType?: string // Add employmentType for employment type filtering
): NavigationItem[] => {
  return items.filter(item => {
    // Check employment type restriction
    if (item.employmentTypes && item.employmentTypes.length > 0 && employmentType) {
      if (!item.employmentTypes.includes(employmentType)) {
        return false;
      }
    }

    // Special handling for Warehouse Management menu
    // RBAC-based: Check VIEW_WAREHOUSE permission first, ROLE_ADMIN as fallback
    if (item.name === 'Warehouse Management') {
      // Check warehouse access (prioritizes permissions, ROLE_ADMIN as fallback)
      const canAccess = canAccessWarehouse(userRoles, userPermissions);

      if (!canAccess) {
        return false;
      }

      // Filter submenu items based on permissions
      if (item.hasSubmenu && item.submenu) {
        const filteredSubmenu = item.submenu.filter(subItem => {
          // Check if submenu item requires specific permissions
          if (subItem.requiredPermissions && subItem.requiredPermissions.length > 0) {
            // Use normal permission check (RBAC-based)
            if (!userPermissions || !hasPermissions(userPermissions, subItem.requiredPermissions, subItem.requireAll)) {
              return false;
            }
          }
          return true;
        });

        if (filteredSubmenu.length === 0) {
          return false; // Hide parent if no submenu items are visible
        }
        item.submenu = filteredSubmenu;
      }
      return true;
    }

    // Special handling for menus with submenu: Check submenu items first
    // If user has permission for any submenu item, show parent menu
    // This applies to menus like "Booking Management" where parent visibility depends on submenu permissions
    if (item.hasSubmenu && item.submenu) {
      // Filter submenu items first
      const filteredSubmenu = filterNavigationItems(item.submenu, userPermissions, groupedPermissions, userRoles, employmentType);

      // If no submenu items are visible, hide parent
      if (filteredSubmenu.length === 0) {
        return false;
      }

      // If parent has no requiredPermissions/requiredPermissionGroup, 
      // visibility is determined by submenu items (already checked above)
      // Otherwise, check parent permissions
      if (!item.requiredPermissionGroup && (!item.requiredPermissions || item.requiredPermissions.length === 0)) {
        // Parent visibility is determined by submenu items - if we have visible submenu items, show parent
        item.submenu = filteredSubmenu;
        return true;
      }

      // Parent has permissions - check them
      item.submenu = filteredSubmenu;
    }

    // Check permission group (for parent menu)
    if (item.requiredPermissionGroup) {
      if (!hasPermissionGroup(groupedPermissions, item.requiredPermissionGroup)) {
        return false;
      }
    }

    // Check specific permissions (for parent menu)
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (!userPermissions || !hasPermissions(userPermissions, item.requiredPermissions, item.requireAll)) {
        return false;
      }
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
