import { Permission, Role, MenuItem, NavigationConfig } from '@/types/permission';
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
  faUserCheck,
  faClock,
  faComments,
  faBrain,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';

/**
 * ADMIN NAVIGATION
 * Admin có tất cả quyền, nên không cần check permissions
 */
export const ADMIN_NAVIGATION: NavigationConfig = {
  role: Role.ADMIN,
  title: 'PDCMS Admin',
  menuItems: [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: faTachometerAlt,
      requiredRoles: [Role.ADMIN],
    },
    {
      name: 'Account Management',
      icon: faUsers,
      hasSubmenu: true,
      requiredRoles: [Role.ADMIN],
      submenu: [
        {
          name: 'User Accounts',
          href: '/admin/accounts/users',
          icon: faUser,
        },
        {
          name: 'Employee Accounts',
          href: '/admin/accounts/employees',
          icon: faUserTie,
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
    },
    {
      name: 'Role Management',
      href: '/admin/roles',
      icon: faShieldAlt,
    },
    {
      name: 'Permission Management',
      href: '/admin/permissions',
      icon: faKey,
    },
    {
      name: 'Specializations',
      href: '/admin/specializations',
      icon: faCog,
    },
    {
      name: 'Work Shifts',
      href: '/admin/work-shifts',
      icon: faCalendarAlt,
    },
    {
      name: 'Part-Time Management',
      href: '/admin/part_time_management',
      icon: faClock,
    },
    {
      name: 'Room Management',
      href: '/admin/rooms',
      icon: faHospitalUser,
      requiredPermissions: [Permission.VIEW_ROOM],
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: faCog,
    },
  ],
};

/**
 * EMPLOYEE NAVIGATION
 * Hiển thị menu dựa trên permissions của employee
 */
export const EMPLOYEE_NAVIGATION: NavigationConfig = {
  role: Role.EMPLOYEE,
  title: 'PDCMS Employee',
  menuItems: [
    {
      name: 'Dashboard',
      href: '/employee',
      icon: faTachometerAlt,
      requiredRoles: [Role.EMPLOYEE],
    },
    // Dentist features
    {
      name: 'Patients',
      href: '/employee/patients',
      icon: faHospitalUser,
      requiredPermissions: [Permission.VIEW_PATIENT],
    },
    {
      name: 'Treatments',
      href: '/employee/treatments',
      icon: faTeeth,
      requiredPermissions: [Permission.VIEW_TREATMENT],
    },
    {
      name: 'CustomerContact',
      href: '/employee/customer-contacts',
      icon: faCalendarAlt,
      requiredPermissions: [Permission.VIEW_CONTACT_HISTORY],
    },
    {
      name: 'Follow-ups',
      href: '/employee/followups',
      icon: faClipboardList,
      requiredPermissions: [Permission.VIEW_PATIENT, Permission.VIEW_TREATMENT],
      requireAll: false, // Chỉ cần 1 trong 2 permissions
    },
    {
      name: 'Stages',
      href: '/employee/stages',
      icon: faProcedures,
      requiredPermissions: [Permission.VIEW_TREATMENT],
    },
    {
      name: 'My Schedule',
      href: '/employee/schedule',
      icon: faCalendarAlt,
      requiredPermissions: [Permission.VIEW_WORK_SHIFTS],
    },
    {
      name: 'My Shift Registrations',
      href: '/employee/part_time_management',
      icon: faClock,
      requiredPermissions: [Permission.VIEW_REGISTRATION_OWN, Permission.CREATE_REGISTRATION],
      requireAll: false, // Chỉ cần 1 trong 2 permissions
    },

    // Receptionist features
    {
      name: 'Appointments',
      href: '/employee/appointments',
      icon: faCalendarAlt,
      requiredPermissions: [Permission.VIEW_APPOINTMENT],
    },
    {
      name: 'Create Account',
      href: '/employee/create-account',
      icon: faUserPlus,
      requiredPermissions: [Permission.CREATE_ACCOUNT],
    },
    {
      name: 'Customers',
      href: '/employee/customers',
      icon: faUsers,
      requiredPermissions: [Permission.VIEW_PATIENT],
    },
    {
      name: 'Patient Records',
      href: '/employee/patient-records',
      icon: faFolderOpen,
      requiredPermissions: [Permission.VIEW_PATIENT],
    },
    {
      name: 'KPI',
      href: '/employee/kpi',
      icon: faChartLine,
      requiredPermissions: [Permission.VIEW_APPOINTMENT, Permission.VIEW_PATIENT],
      requireAll: false,
    },

    // Manager features
    {
      name: 'Analytics',
      href: '/employee/analytics',
      icon: faChartLine,
      requiredPermissions: [Permission.VIEW_EMPLOYEE, Permission.VIEW_APPOINTMENT],
      requireAll: false,
    },
    {
      name: 'Employees',
      href: '/employee/employees',
      icon: faUsersCog,
      requiredPermissions: [Permission.VIEW_EMPLOYEE],
    },

    // Accountant features
    {
      name: 'Performance',
      href: '/employee/performance',
      icon: faMoneyBillWave,
      requiredPermissions: [Permission.VIEW_ACCOUNT],
    },

    // Warehouse features
    {
      name: 'Inventory',
      href: '/employee/inventory',
      icon: faBoxes,
      requiredPermissions: [Permission.VIEW_EMPLOYEE], // Tạm thời dùng permission này
    },
    {
      name: 'Add Product',
      href: '/employee/add-product',
      icon: faPlus,
      requiredPermissions: [Permission.CREATE_EMPLOYEE], // Tạm thời dùng permission này
    },
    {
      name: 'Statistics',
      href: '/employee/statistics',
      icon: faChartLine,
      requiredPermissions: [Permission.VIEW_EMPLOYEE],
    },

    // Common features
    {
      name: 'Settings',
      href: '/employee/settings',
      icon: faCog,
      requiredRoles: [Role.EMPLOYEE],
    },
  ],
};

/**
 * PATIENT NAVIGATION
 * Menu cho bệnh nhân
 */
export const PATIENT_NAVIGATION: NavigationConfig = {
  role: Role.PATIENT,
  title: 'PDCMS Patient',
  menuItems: [
    {
      name: 'Dashboard',
      href: '/user',
      icon: faTachometerAlt,
      requiredRoles: [Role.PATIENT],
    },
    {
      name: 'My Appointments',
      href: '/user/appointments',
      icon: faCalendarAlt,
    },
    {
      name: 'Medical Records',
      href: '/user/records',
      icon: faFolderOpen,
    },
    {
      name: 'Billing',
      href: '/user/billing',
      icon: faReceipt,
    },
    {
      name: 'Notifications',
      href: '/user/notifications',
      icon: faBell,
    },
    {
      name: 'Profile',
      href: '/user/profile',
      icon: faUserCircle,
    },
    {
      name: 'Settings',
      href: '/user/settings',
      icon: faCog,
    },
  ],
};

/**
 * MANAGER NAVIGATION
 * Dành cho Manager role - quản lý feedback, analytics, staff
 */
export const MANAGER_NAVIGATION: NavigationConfig = {
  role: Role.EMPLOYEE, // Dùng EMPLOYEE role vì sidebar động không phân quyền manager riêng
  title: 'PDCMS Manager',
  menuItems: [
    {
      name: 'Dashboard',
      href: '/employee',
      icon: faTachometerAlt,
      requiredRoles: [Role.EMPLOYEE],
    },
    {
      name: 'Feedback & Reviews',
      href: '/employee/customers/feedback',
      icon: faComments,
      requiredRoles: [Role.EMPLOYEE],
    },
    {
      name: 'Analytics',
      href: '/employee/analytics',
      icon: faChartLine,
      requiredRoles: [Role.EMPLOYEE],
    },
    {
      name: 'Staff Management',
      href: '/employee/staff',
      icon: faUsersCog,
      requiredRoles: [Role.EMPLOYEE],
    },
    {
      name: 'Appointments',
      href: '/employee/appointments',
      icon: faCalendarAlt,
      requiredRoles: [Role.EMPLOYEE],
    },
    {
      name: 'Financial Reports',
      href: '/employee/financial',
      icon: faDollarSign,
      requiredRoles: [Role.EMPLOYEE],
    },
    {
      name: 'Settings',
      href: '/employee/settings',
      icon: faCog,
      requiredRoles: [Role.EMPLOYEE],
    },
  ],
};

/**
 * Helper function: Get navigation config by role
 */
export const getNavigationByRole = (role: Role): NavigationConfig => {
  switch (role) {
    case Role.ADMIN:
      return ADMIN_NAVIGATION;
    case Role.EMPLOYEE:
      return EMPLOYEE_NAVIGATION;
    case Role.PATIENT:
      return PATIENT_NAVIGATION;
    default:
      return PATIENT_NAVIGATION;
  }
};

/**
 * Helper function: Get base path by role
 */
export const getBasePathByRole = (role: Role): string => {
  switch (role) {
    case Role.ADMIN:
      return '/admin';
    case Role.EMPLOYEE:
      return '/employee';
    case Role.PATIENT:
      return '/user';
    default:
      return '/user';
  }
};
