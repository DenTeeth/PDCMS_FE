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
  faChartBar,
  faBoxes,
  faWarehouse,
  faPlus,
  faClipboard,
  faBell,
  faReceipt,
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
import { checkPermission } from '@/constants/permissions';

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
  requiredRoles?: string[]; // Require user to have specific roles (e.g., ROLE_DENTIST, ROLE_NURSE for CBCT viewer)
}

export interface NavigationConfig {
  title: string;
  items: NavigationItem[];
}

/**
 * SHARED NAVIGATION ITEMS - Base structure used by both Admin and Employee
 * Paths will be dynamically replaced based on baseRole (admin/employee)
 * RBAC handles visibility - items shown/hidden based on user permissions
 */

const SHARED_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'Tổng quan',
    href: '/{baseRole}',
    icon: faTachometerAlt,
  },
  {
    name: 'Thống kê',
    href: '/{baseRole}/statistics',
    icon: faChartBar,
    requiredRoles: ['ROLE_ADMIN', 'ROLE_MANAGER'], // Only show for admin and managers
    // No permission required - accessible to all authenticated users
  },
  {
    name: 'Quản lý tài khoản',
    icon: faUsers,
    hasSubmenu: true,
    requiredPermissionGroup: 'ACCOUNT',
    submenu: [
      {
        name: 'Tài khoản bệnh nhân',
        href: '/{baseRole}/accounts/users',
        icon: faUser,
        requiredPermissions: ['VIEW_ACCOUNT'],
      },
      {
        name: 'Tài khoản nhân viên',
        href: '/{baseRole}/accounts/employees',
        icon: faUserTie,
        requiredPermissions: ['VIEW_EMPLOYEE'],
      },
    ],
  },
  {
    name: 'Cấu hình hệ thống',
    icon: faCog,
    hasSubmenu: true,
    requiredPermissionGroup: 'SYSTEM_CONFIGURATION',
    submenu: [
      {
        name: 'Quản lý vai trò',
        href: '/{baseRole}/roles',
        icon: faShieldAlt,
        requiredPermissions: ['VIEW_ROLE'],
      },
      {
        name: 'Quản lý quyền',
        href: '/{baseRole}/permissions',
        icon: faKey,
        requiredPermissions: ['VIEW_PERMISSION'],
      },
      {
        name: 'Chuyên khoa',
        href: '/{baseRole}/specializations',
        icon: faStethoscope,
        requiredPermissions: ['VIEW_SPECIALIZATION'],
      },
    ],
  },
  {
    name: 'Quản lý lịch làm việc',
    icon: faCalendarCheck,
    hasSubmenu: true,
    requiredPermissionGroup: 'SCHEDULE_MANAGEMENT',
    submenu: [
      {
        name: 'Ca làm việc',
        href: '/{baseRole}/work-shifts',
        icon: faBusinessTime,
        requiredPermissions: ['MANAGE_WORK_SHIFTS'],
      },
      {
        name: 'Khung giờ làm việc',
        href: '/{baseRole}/work-slots',
        icon: faClock,
        requiredPermissions: ['MANAGE_WORK_SLOTS'],
      },
      {
        name: 'Đăng ký ca làm',
        href: '/{baseRole}/registrations',
        icon: faCalendarCheck,
        requiredPermissions: ['VIEW_SCHEDULE_OWN', 'VIEW_SCHEDULE_ALL'],
        requireAll: false,
      },
      {
        name: 'Lịch làm việc của tôi',
        href: '/{baseRole}/my-schedule',
        icon: faCalendarDays,
        requiredPermissions: ['VIEW_SCHEDULE_OWN'],
        employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED', 'PART_TIME_FLEX'], // Only full-time and fixed part-time
        // Note: This page is for employees only (requires VIEW_SCHEDULE_OWN)
        // Admin/Managers typically have VIEW_SCHEDULE_ALL and use /shift-calendar instead
      },
      {
        name: 'Lịch làm việc nhân viên',
        href: '/{baseRole}/shift-calendar',
        icon: faUsersCog,
        requiredPermissions: ['VIEW_SCHEDULE_ALL'],
        requiredRoles: ['ROLE_ADMIN', 'ROLE_MANAGER'], // Only show for admin and managers
      },
      {
        name: 'Ngày lễ',
        href: '/{baseRole}/holidays',
        icon: faFileAlt,
        requiredPermissions: ['MANAGE_HOLIDAY', 'VIEW_HOLIDAY'],
      },
      {
        name: 'Quản lí loại nghỉ phép',
        href: '/{baseRole}/time-off-types',
        icon: faUserTie,
        requiredPermissions: ['VIEW_LEAVE_TYPE'],
      }
    ],
  },
  {
    name: 'Quản lý yêu cầu',
    icon: faClipboardList,
    hasSubmenu: true,
    submenu: [
      {
        name: 'Yêu cầu làm thêm giờ',
        href: '/{baseRole}/overtime-requests',
        icon: faClockFour,
        requiredPermissions: ['VIEW_OVERTIME_OWN', 'VIEW_OVERTIME_ALL', 'APPROVE_OVERTIME', 'CREATE_OVERTIME'],
        requireAll: false,
        employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED', 'PART_TIME_FLEX'],
      },
      {
        name: 'Yêu cầu nghỉ phép',
        href: '/{baseRole}/time-off-requests',
        icon: faUmbrellaBeach,
        requiredPermissions: ['VIEW_TIME_OFF_OWN', 'VIEW_TIME_OFF_ALL', 'CREATE_TIME_OFF'],
        requireAll: false,
        employmentTypes: ['FULL_TIME', 'PART_TIME_FIXED', 'PART_TIME_FLEX'],
      },
      {
        name: 'Yêu cầu đăng ký ca',
        href: '/{baseRole}/registration-requests',
        icon: faUserCheck,
        requiredPermissions: ['MANAGE_PART_TIME_REGISTRATIONS', 'VIEW_AVAILABLE_SLOTS'],
        requireAll: false, // Chỉ cần 1 trong các quyền
      },
    ],
  },
  {
    name: 'Quản lý điều trị',
    icon: faClipboardList,
    hasSubmenu: true,
    submenu: [
      {
        name: 'Phòng khám',
        href: '/{baseRole}/booking/rooms',
        icon: faHospitalUser,
        requiredPermissionGroup: 'ROOM_MANAGEMENT',
      },
      {
        name: 'Dịch vụ',
        href: '/{baseRole}/booking/services',
        icon: faTeeth,
        requiredPermissionGroup: 'SERVICE_MANAGEMENT',
      },
      {
        name: 'Lịch hẹn',
        href: '/{baseRole}/booking/appointments',
        icon: faCalendarAlt,
        requiredPermissions: ['VIEW_APPOINTMENT_OWN', 'VIEW_APPOINTMENT_ALL'],
        requireAll: false,
      },
      {
        name: 'Kế hoạch điều trị',
        href: '/{baseRole}/treatment-plans',
        icon: faListCheck,
        requiredPermissions: ['VIEW_TREATMENT_PLAN_ALL', 'VIEW_TREATMENT_PLAN_OWN'],
        requireAll: false,
      },
      {
        name: 'Hóa đơn',
        href: '/{baseRole}/invoices',
        icon: faReceipt,
        requiredPermissions: ['VIEW_INVOICE_ALL', 'VIEW_INVOICE_OWN'],
        requireAll: false,
      },
    ],
  },
  {
    name: 'Quản lý kho',
    icon: faWarehouse,
    hasSubmenu: true,
    submenu: [
      {
        name: 'Tổng quan kho',
        href: '/{baseRole}/warehouse',
        icon: faTachometerAlt,
        requiredPermissions: ['MANAGE_WAREHOUSE'],
      },
      {
        name: 'Quản lý vật tư',
        href: '/{baseRole}/warehouse/inventory',
        icon: faBoxes,
        requiredPermissions: ['MANAGE_WAREHOUSE'],
      },
      {
        name: 'Nhập/Xuất kho',
        href: '/{baseRole}/warehouse/storage',
        icon: faClipboard,
        requiredPermissions: ['MANAGE_WAREHOUSE'],
      },
      {
        name: 'Nhà cung cấp',
        href: '/{baseRole}/warehouse/suppliers',
        icon: faUsers,
        requiredPermissions: ['MANAGE_WAREHOUSE'],
      },
      {
        name: 'Báo cáo & thống kê',
        href: '/{baseRole}/warehouse/reports',
        icon: faChartLine,
        requiredPermissions: ['MANAGE_WAREHOUSE'],
      },
    ],
  },
  {
    name: 'Xem CBCT',
    href: '/{baseRole}/nii-viewer',
    icon: faImage,
    requiredPermissions: ['PATIENT_IMAGE_READ'],
    requiredRoles: ['ROLE_DENTIST', 'ROLE_NURSE'], // ✅ Only show for dentists and nurses
  },
];

/**
 * Helper function to replace {baseRole} placeholder in navigation items
 */
const replaceBaseRolePlaceholder = (items: NavigationItem[], baseRole: string): NavigationItem[] => {
  return items.map(item => {
    const newItem = { ...item };

    // Replace href placeholder
    if (newItem.href) {
      newItem.href = newItem.href.replace('{baseRole}', baseRole);
    }

    // Recursively replace in submenu
    if (newItem.submenu) {
      newItem.submenu = replaceBaseRolePlaceholder(newItem.submenu, baseRole);
    }

    return newItem;
  });
};

/**
 * ADMIN NAVIGATION CONFIG
 * Uses shared navigation items with admin paths
 */
export const ADMIN_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'DENTEETH',
  items: replaceBaseRolePlaceholder(SHARED_NAVIGATION_ITEMS, 'admin'),
};

/**
 * EMPLOYEE NAVIGATION CONFIG  
 * Uses shared navigation items with employee paths
 * 🔄 SYNCHRONIZED WITH ADMIN CONFIG - RBAC will handle visibility
 */
export const EMPLOYEE_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'DENTEETH',
  items: replaceBaseRolePlaceholder(SHARED_NAVIGATION_ITEMS, 'employee'),
};

export const PATIENT_NAVIGATION_CONFIG: NavigationConfig = {
  title: 'DENTEETH',
  items: [
    {
      name: 'Tổng quan',
      href: '/patient',
      icon: faTachometerAlt,
    },
    {
      name: 'Lịch hẹn của tôi',
      href: '/patient/appointments',
      icon: faCalendarAlt,
    },
    {
      name: 'Kế hoạch điều trị',
      href: '/patient/treatment-plans',
      icon: faListCheck,
      requiredPermissions: ['VIEW_TREATMENT_PLAN_OWN', 'VIEW_TREATMENT_PLAN_ALL'],
      requireAll: false,
    },
    {
      name: 'Lịch sử thanh toán',
      href: '/patient/payment-history',
      icon: faMoneyBillWave,
      requiredPermissions: ['VIEW_INVOICE_OWN'],
    },
    {
      name: 'Xem CBCT',
      href: '/patient/nii-viewer',
      icon: faImage,
      requiredPermissions: ['PATIENT_IMAGE_READ'],
    },
    {
      name: 'Thông báo',
      href: '/patient/notifications',
      icon: faBell,
    },
    {
      name: 'Hồ sơ cá nhân',
      href: '/patient/profile',
      icon: faUserCircle,
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
 * ✅ Uses checkPermission for backward compatibility with permission mapping
 */
export const hasPermissions = (
  userPermissions: string[],
  requiredPermissions: string[],
  requireAll: boolean = false
): boolean => {
  if (!userPermissions || userPermissions.length === 0) return false;

  if (requireAll) {
    return requiredPermissions.every(permission => checkPermission(userPermissions, permission));
  } else {
    return requiredPermissions.some(permission => checkPermission(userPermissions, permission));
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

  // Admin should have VIEW_WAREHOUSE permission in seed data
  // No bypass - check permissions only
  return false;
};

/**
 * Helper function: Filter navigation items based on user permissions, roles, and employment type
 */
export const filterNavigationItems = (
  items: NavigationItem[],
  userPermissions: string[] | undefined,
  groupedPermissions: GroupedPermissions | undefined,
  userRoles?: string[], // Add userRoles parameter to check ROLE_ADMIN and requiredRoles
  employmentType?: string // Add employmentType for employment type filtering
): NavigationItem[] => {
  return items.filter(item => {
    // Check employment type restriction
    if (item.employmentTypes && item.employmentTypes.length > 0 && employmentType) {
      if (!item.employmentTypes.includes(employmentType)) {
        return false;
      }
    }

    // ✅ Check required roles (for CBCT viewer - ROLE_DENTIST or ROLE_NURSE)
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      if (!userRoles || !item.requiredRoles.some(role => userRoles.includes(role))) {
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
