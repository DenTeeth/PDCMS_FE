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
          description: 'Manage patient accounts',
        },
        {
          name: 'Employee Accounts',
          href: '/admin/accounts/employees',
          icon: faUserTie,
          description: 'Manage staff accounts',
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
      description: 'Define work shift templates',
    },
    {
      name: 'Part-Time Management',
      href: '/admin/part_time_management',
      icon: faClock,
      description: 'Manage part-time employee shift registrations',
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
      description: 'Manage patient records',
      requiredPermissions: [Permission.VIEW_PATIENT],
    },
    {
      name: 'Treatments',
      href: '/employee/treatments',
      icon: faTeeth,
      description: 'Manage treatments',
      requiredPermissions: [Permission.VIEW_TREATMENT],
    },
    {
      name: 'CustomerContact',
      href: '/employee/customer-contacts',
      icon: faCalendarAlt,
      description: 'Manage customer contacts',
      requiredPermissions: [Permission.VIEW_CONTACT_HISTORY],
    },
    {
      name: 'Follow-ups',
      href: '/employee/followups',
      icon: faClipboardList,
      description: 'Patient follow-ups',
      requiredPermissions: [Permission.VIEW_PATIENT, Permission.VIEW_TREATMENT],
      requireAll: false, // Chỉ cần 1 trong 2 permissions
    },
    {
      name: 'Stages',
      href: '/employee/stages',
      icon: faProcedures,
      description: 'Treatment stages',
      requiredPermissions: [Permission.VIEW_TREATMENT],
    },
    {
      name: 'My Schedule',
      href: '/employee/schedule',
      icon: faCalendarAlt,
      description: 'View my work schedule',
      requiredPermissions: [Permission.VIEW_WORK_SHIFTS],
    },
    {
      name: 'My Shift Registrations',
      href: '/employee/part_time_management',
      icon: faClock,
      description: 'Manage my part-time shift registrations',
      requiredPermissions: [Permission.VIEW_REGISTRATION_OWN, Permission.CREATE_REGISTRATION],
      requireAll: false, // Chỉ cần 1 trong 2 permissions
    },
    
    // Receptionist features
    {
      name: 'Appointments',
      href: '/employee/appointments',
      icon: faCalendarAlt,
      description: 'Manage appointments',
      requiredPermissions: [Permission.VIEW_APPOINTMENT],
    },
    {
      name: 'Create Account',
      href: '/employee/create-account',
      icon: faUserPlus,
      description: 'Register new patients',
      requiredPermissions: [Permission.CREATE_ACCOUNT],
    },
    {
      name: 'Customers',
      href: '/employee/customers',
      icon: faUsers,
      description: 'Customer management',
      requiredPermissions: [Permission.VIEW_PATIENT],
    },
    {
      name: 'Patient Records',
      href: '/employee/patient-records',
      icon: faFolderOpen,
      description: 'Medical records',
      requiredPermissions: [Permission.VIEW_PATIENT],
    },
    {
      name: 'KPI',
      href: '/employee/kpi',
      icon: faChartLine,
      description: 'Performance metrics',
      requiredPermissions: [Permission.VIEW_APPOINTMENT, Permission.VIEW_PATIENT],
      requireAll: false,
    },
    
    // Manager features
    {
      name: 'Analytics',
      href: '/employee/analytics',
      icon: faChartLine,
      description: 'Business analytics',
      requiredPermissions: [Permission.VIEW_EMPLOYEE, Permission.VIEW_APPOINTMENT],
      requireAll: false,
    },
    {
      name: 'Employees',
      href: '/employee/employees',
      icon: faUsersCog,
      description: 'Staff management',
      requiredPermissions: [Permission.VIEW_EMPLOYEE],
    },
    
    // Accountant features
    {
      name: 'Performance',
      href: '/employee/performance',
      icon: faMoneyBillWave,
      description: 'Financial performance',
      requiredPermissions: [Permission.VIEW_ACCOUNT],
    },
    
    // Warehouse features
    {
      name: 'Inventory',
      href: '/employee/inventory',
      icon: faBoxes,
      description: 'Inventory management',
      requiredPermissions: [Permission.VIEW_EMPLOYEE], // Tạm thời dùng permission này
    },
    {
      name: 'Add Product',
      href: '/employee/add-product',
      icon: faPlus,
      description: 'Add new products',
      requiredPermissions: [Permission.CREATE_EMPLOYEE], // Tạm thời dùng permission này
    },
    {
      name: 'Statistics',
      href: '/employee/statistics',
      icon: faChartLine,
      description: 'Warehouse statistics',
      requiredPermissions: [Permission.VIEW_EMPLOYEE],
    },
    
    // Common features
    {
      name: 'Settings',
      href: '/employee/settings',
      icon: faCog,
      description: 'Account settings',
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
      description: 'View and manage appointments',
    },
    {
      name: 'Medical Records',
      href: '/user/records',
      icon: faFolderOpen,
      description: 'Your treatment history',
    },
    {
      name: 'Billing',
      href: '/user/billing',
      icon: faReceipt,
      description: 'Invoices and payments',
    },
    {
      name: 'Notifications',
      href: '/user/notifications',
      icon: faBell,
      description: 'Important updates',
    },
    {
      name: 'Profile',
      href: '/user/profile',
      icon: faUserCircle,
      description: 'Personal information',
    },
    {
      name: 'Settings',
      href: '/user/settings',
      icon: faCog,
      description: 'Account settings',
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
