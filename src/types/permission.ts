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
