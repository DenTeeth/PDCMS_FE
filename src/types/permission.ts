import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

/**
 * Permissions trong hệ thống
 */
export enum Permission {
  // Treatment permissions
  CREATE_TREATMENT = 'CREATE_TREATMENT',
  VIEW_TREATMENT = 'VIEW_TREATMENT',
  UPDATE_TREATMENT = 'UPDATE_TREATMENT',
  
  // Appointment permissions
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  VIEW_APPOINTMENT = 'VIEW_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT = 'DELETE_APPOINTMENT',
  
  // Account permissions
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  VIEW_ACCOUNT = 'VIEW_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  
  // Patient permissions
  CREATE_PATIENT = 'CREATE_PATIENT',
  VIEW_PATIENT = 'VIEW_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',
  
  // Employee permissions
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  VIEW_EMPLOYEE = 'VIEW_EMPLOYEE',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE = 'DELETE_EMPLOYEE',
  
  // Work shifts permissions
  CREATE_WORK_SHIFTS = 'CREATE_WORK_SHIFTS',
  VIEW_WORK_SHIFTS = 'VIEW_WORK_SHIFTS',
  UPDATE_WORK_SHIFTS = 'UPDATE_WORK_SHIFTS',
  DELETE_WORK_SHIFTS = 'DELETE_WORK_SHIFTS',
  
  // Contact permissions
  CREATE_CONTACT = 'CREATE_CONTACT',
  VIEW_CONTACT = 'VIEW_CONTACT',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  DELETE_CONTACT = 'DELETE_CONTACT',
  
  // Contact history permissions
  CREATE_CONTACT_HISTORY = 'CREATE_CONTACT_HISTORY',
  VIEW_CONTACT_HISTORY = 'VIEW_CONTACT_HISTORY',
  UPDATE_CONTACT_HISTORY = 'UPDATE_CONTACT_HISTORY',
  DELETE_CONTACT_HISTORY = 'DELETE_CONTACT_HISTORY',
  
  // Shift Registration permissions
  VIEW_REGISTRATION_ALL = 'VIEW_REGISTRATION_ALL',
  VIEW_REGISTRATION_OWN = 'VIEW_REGISTRATION_OWN',
  CREATE_REGISTRATION = 'CREATE_REGISTRATION',
  UPDATE_REGISTRATION_ALL = 'UPDATE_REGISTRATION_ALL',
  UPDATE_REGISTRATION_OWN = 'UPDATE_REGISTRATION_OWN',
  DELETE_REGISTRATION_ALL = 'DELETE_REGISTRATION_ALL',
  DELETE_REGISTRATION_OWN = 'DELETE_REGISTRATION_OWN',
  
  // Overtime Request permissions (match BE naming)
  VIEW_OT_ALL = 'VIEW_OT_ALL',
  VIEW_OT_OWN = 'VIEW_OT_OWN',
  CREATE_OT = 'CREATE_OT',
  CREATE_OVERTIME = 'CREATE_OVERTIME', // BE uses this
  APPROVE_OT = 'APPROVE_OT',
  REJECT_OT = 'REJECT_OT',
  CANCEL_OT_OWN = 'CANCEL_OT_OWN',
  CANCEL_OVERTIME_OWN = 'CANCEL_OVERTIME_OWN', // BE uses this
  CANCEL_OT_PENDING = 'CANCEL_OT_PENDING',
  
  // Time Off permissions (from BE response)
  CREATE_TIME_OFF = 'CREATE_TIME_OFF',
  CANCEL_TIME_OFF_OWN = 'CANCEL_TIME_OFF_OWN',
  VIEW_LEAVE_OWN = 'VIEW_LEAVE_OWN',
  
  // Renewal permissions (from BE response)
  VIEW_RENEWAL_OWN = 'VIEW_RENEWAL_OWN',
  RESPOND_RENEWAL_OWN = 'RESPOND_RENEWAL_OWN',
  
  // Employee Shift permissions
  VIEW_EMPLOYEE_SHIFT_ALL = 'VIEW_EMPLOYEE_SHIFT_ALL',
  VIEW_EMPLOYEE_SHIFT_OWN = 'VIEW_EMPLOYEE_SHIFT_OWN',
  
  // Time Off Type permissions
  VIEW_TIME_OFF_TYPE = 'VIEW_TIME_OFF_TYPE',
  CREATE_TIME_OFF_TYPE = 'CREATE_TIME_OFF_TYPE',
  UPDATE_TIME_OFF_TYPE = 'UPDATE_TIME_OFF_TYPE',
  DELETE_TIME_OFF_TYPE = 'DELETE_TIME_OFF_TYPE',
  
  // Time Off Request permissions
  VIEW_TIME_OFF_ALL = 'VIEW_TIME_OFF_ALL',
  VIEW_TIME_OFF_OWN = 'VIEW_TIME_OFF_OWN',
  APPROVE_TIME_OFF = 'APPROVE_TIME_OFF',
  REJECT_TIME_OFF = 'REJECT_TIME_OFF',
  CANCEL_TIME_OFF_PENDING = 'CANCEL_TIME_OFF_PENDING',
}

/**
 * Roles trong hệ thống (3 roles chính)
 */
export enum Role {
  ADMIN = 'ROLE_ADMIN',
  EMPLOYEE = 'ROLE_EMPLOYEE',
  PATIENT = 'ROLE_PATIENT',
}

/**
 * Menu item trong sidebar
 */
export interface MenuItem {
  name: string;
  href?: string;
  icon: IconDefinition;
  description?: string;
  
  // Permission yêu cầu để hiển thị menu item
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true = cần tất cả permissions, false = chỉ cần 1 trong số đó
  
  // Role yêu cầu (optional, ưu tiên dùng permissions)
  requiredRoles?: Role[];
  
  // Submenu
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
}

/**
 * Navigation config cho từng context (admin, employee, patient)
 */
export interface NavigationConfig {
  role: Role;
  title: string;
  menuItems: MenuItem[];
}
