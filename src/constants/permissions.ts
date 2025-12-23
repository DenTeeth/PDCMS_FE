// constants/permissions.ts - ĐỒNG BỘ 100% VỚI BE SEED DATA
export const BE_PERMISSIONS = {
  // MODULE 1: ACCOUNT (2)
  VIEW_ACCOUNT: 'VIEW_ACCOUNT',
  MANAGE_ACCOUNT: 'MANAGE_ACCOUNT',
  // MODULE 2: EMPLOYEE (3)
  VIEW_EMPLOYEE: 'VIEW_EMPLOYEE',
  MANAGE_EMPLOYEE: 'MANAGE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  // MODULE 3: PATIENT (3)
  VIEW_PATIENT: 'VIEW_PATIENT',
  MANAGE_PATIENT: 'MANAGE_PATIENT',
  DELETE_PATIENT: 'DELETE_PATIENT',
  // MODULE 4: APPOINTMENT (5)
  VIEW_APPOINTMENT_ALL: 'VIEW_APPOINTMENT_ALL',
  VIEW_APPOINTMENT_OWN: 'VIEW_APPOINTMENT_OWN',
  CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
  MANAGE_APPOINTMENT: 'MANAGE_APPOINTMENT',
  UPDATE_APPOINTMENT_STATUS: 'UPDATE_APPOINTMENT_STATUS',
  // MODULE 5: CLINICAL_RECORDS (4)
  WRITE_CLINICAL_RECORD: 'WRITE_CLINICAL_RECORD',
  VIEW_VITAL_SIGNS_REFERENCE: 'VIEW_VITAL_SIGNS_REFERENCE',
  VIEW_ATTACHMENT: 'VIEW_ATTACHMENT',
  MANAGE_ATTACHMENTS: 'MANAGE_ATTACHMENTS',
  // MODULE 6: PATIENT_IMAGES (3)
  PATIENT_IMAGE_READ: 'PATIENT_IMAGE_READ',
  MANAGE_PATIENT_IMAGES: 'MANAGE_PATIENT_IMAGES',
  DELETE_PATIENT_IMAGES: 'DELETE_PATIENT_IMAGES',
  // MODULE 7: NOTIFICATION (3)
  VIEW_NOTIFICATION: 'VIEW_NOTIFICATION',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  MANAGE_NOTIFICATION: 'MANAGE_NOTIFICATION',
  // MODULE 8: HOLIDAY (2)
  VIEW_HOLIDAY: 'VIEW_HOLIDAY',
  MANAGE_HOLIDAY: 'MANAGE_HOLIDAY',
  // MODULE 9: SERVICE (2)
  VIEW_SERVICE: 'VIEW_SERVICE',
  MANAGE_SERVICE: 'MANAGE_SERVICE',
  // MODULE 10: ROOM (2)
  VIEW_ROOM: 'VIEW_ROOM',
  MANAGE_ROOM: 'MANAGE_ROOM',
  // MODULE 11: WAREHOUSE (10)
  VIEW_WAREHOUSE: 'VIEW_WAREHOUSE',
  VIEW_ITEMS: 'VIEW_ITEMS',
  VIEW_MEDICINES: 'VIEW_MEDICINES',
  VIEW_WAREHOUSE_COST: 'VIEW_WAREHOUSE_COST',
  MANAGE_WAREHOUSE: 'MANAGE_WAREHOUSE',
  MANAGE_SUPPLIERS: 'MANAGE_SUPPLIERS',
  IMPORT_ITEMS: 'IMPORT_ITEMS',
  EXPORT_ITEMS: 'EXPORT_ITEMS',
  DISPOSE_ITEMS: 'DISPOSE_ITEMS',
  APPROVE_TRANSACTION: 'APPROVE_TRANSACTION',
  // MODULE 12: SCHEDULE_MANAGEMENT (6)
  VIEW_SCHEDULE_ALL: 'VIEW_SCHEDULE_ALL',
  VIEW_SCHEDULE_OWN: 'VIEW_SCHEDULE_OWN',
  MANAGE_WORK_SHIFTS: 'MANAGE_WORK_SHIFTS',
  MANAGE_WORK_SLOTS: 'MANAGE_WORK_SLOTS',
  MANAGE_PART_TIME_REGISTRATIONS: 'MANAGE_PART_TIME_REGISTRATIONS',
  MANAGE_FIXED_REGISTRATIONS: 'MANAGE_FIXED_REGISTRATIONS',
  // MODULE 13: LEAVE_MANAGEMENT (8)
  VIEW_TIME_OFF_ALL: 'VIEW_TIME_OFF_ALL',
  VIEW_TIME_OFF_OWN: 'VIEW_TIME_OFF_OWN',
  CREATE_TIME_OFF: 'CREATE_TIME_OFF',
  APPROVE_TIME_OFF: 'APPROVE_TIME_OFF',
  VIEW_OVERTIME_ALL: 'VIEW_OVERTIME_ALL',
  VIEW_OVERTIME_OWN: 'VIEW_OVERTIME_OWN',
  CREATE_OVERTIME: 'CREATE_OVERTIME',
  APPROVE_OVERTIME: 'APPROVE_OVERTIME',
  // MODULE 14: TREATMENT_PLAN (3)
  VIEW_TREATMENT_PLAN_ALL: 'VIEW_TREATMENT_PLAN_ALL',
  VIEW_TREATMENT_PLAN_OWN: 'VIEW_TREATMENT_PLAN_OWN',
  MANAGE_TREATMENT_PLAN: 'MANAGE_TREATMENT_PLAN',
  // MODULE 15: SYSTEM_CONFIGURATION (6)
  VIEW_ROLE: 'VIEW_ROLE',
  MANAGE_ROLE: 'MANAGE_ROLE',
  VIEW_PERMISSION: 'VIEW_PERMISSION',
  MANAGE_PERMISSION: 'MANAGE_PERMISSION',
  VIEW_SPECIALIZATION: 'VIEW_SPECIALIZATION',
  MANAGE_SPECIALIZATION: 'MANAGE_SPECIALIZATION',
  // MODULE 16: CUSTOMER_CONTACT (2)
  VIEW_CUSTOMER_CONTACT: 'VIEW_CUSTOMER_CONTACT',
  MANAGE_CUSTOMER_CONTACT: 'MANAGE_CUSTOMER_CONTACT',
  // MODULE 17: TREATMENT (2)
  VIEW_TREATMENT: 'VIEW_TREATMENT',
  MANAGE_TREATMENT: 'MANAGE_TREATMENT',
} as const;
// Total: 70 permissions
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
      name: 'Service Management',
      href: '/admin/services',
      icon: faTeeth,
      requiredPermissions: [Permission.VIEW_SERVICE],
    },
    {
      name: 'Customer Contacts',
      href: '/admin/customer-contacts',
      icon: faComments,
      requiredPermissions: [Permission.VIEW_CONTACT],
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
      name: 'Customer Contacts',
      href: '/employee/customers',
      icon: faComments,
      requiredPermissions: [Permission.VIEW_CONTACT],
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
