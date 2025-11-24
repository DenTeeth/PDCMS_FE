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
  MANAGE_WORK_SLOTS = 'MANAGE_WORK_SLOTS',
  VIEW_AVAILABLE_SLOTS = 'VIEW_AVAILABLE_SLOTS',
  
  // Employee shift permissions (BE-307)
  VIEW_SHIFTS_ALL = 'VIEW_SHIFTS_ALL',
  VIEW_SHIFTS_OWN = 'VIEW_SHIFTS_OWN',
  VIEW_SHIFTS_SUMMARY = 'VIEW_SHIFTS_SUMMARY',
  CREATE_SHIFTS = 'CREATE_SHIFTS',
  UPDATE_SHIFTS = 'UPDATE_SHIFTS',
  DELETE_SHIFTS = 'DELETE_SHIFTS',

  // Room management permissions (Booking P1)
  VIEW_ROOM = 'VIEW_ROOM',
  CREATE_ROOM = 'CREATE_ROOM',
  UPDATE_ROOM = 'UPDATE_ROOM',
  DELETE_ROOM = 'DELETE_ROOM',
  
  // Service management permissions (Booking P2)
  VIEW_SERVICE = 'VIEW_SERVICE',
  CREATE_SERVICE = 'CREATE_SERVICE',
  UPDATE_SERVICE = 'UPDATE_SERVICE',
  DELETE_SERVICE = 'DELETE_SERVICE',
  
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
  
  // Fixed Shift Registration permissions (FE-303v2)
  MANAGE_FIXED_REGISTRATIONS = 'MANAGE_FIXED_REGISTRATIONS',
  VIEW_FIXED_REGISTRATIONS_ALL = 'VIEW_FIXED_REGISTRATIONS_ALL',
  VIEW_FIXED_REGISTRATIONS_OWN = 'VIEW_FIXED_REGISTRATIONS_OWN',
  
  // Treatment Plan permissions (BE-5)
  VIEW_TREATMENT_PLAN_ALL = 'VIEW_TREATMENT_PLAN_ALL',
  VIEW_TREATMENT_PLAN_OWN = 'VIEW_TREATMENT_PLAN_OWN',
  CREATE_TREATMENT_PLAN = 'CREATE_TREATMENT_PLAN',
  UPDATE_TREATMENT_PLAN = 'UPDATE_TREATMENT_PLAN',
  DELETE_TREATMENT_PLAN = 'DELETE_TREATMENT_PLAN', // ✅ Added from BE
  APPROVE_TREATMENT_PLAN = 'APPROVE_TREATMENT_PLAN', // Phase 3.5: Manager approval workflow
  VIEW_ALL_TREATMENT_PLANS = 'VIEW_ALL_TREATMENT_PLANS', // ✅ Added from BE - Manager view all plans across patients
  MANAGE_PLAN_PRICING = 'MANAGE_PLAN_PRICING', // ✅ Added from BE - V21.4: Finance/Accountant adjusts prices
  
  // Additional BE permissions missing in FE
  VIEW_APPOINTMENT_ALL = 'VIEW_APPOINTMENT_ALL', // ✅ Added - View all clinic appointments
  VIEW_APPOINTMENT_OWN = 'VIEW_APPOINTMENT_OWN', // ✅ Added - View own appointments
  UPDATE_APPOINTMENT_STATUS = 'UPDATE_APPOINTMENT_STATUS', // ✅ Added - Change appointment status
  DELAY_APPOINTMENT = 'DELAY_APPOINTMENT', // ✅ Added - Delay within same day
  RESCHEDULE_APPOINTMENT = 'RESCHEDULE_APPOINTMENT', // ✅ Added - Cancel and rebook
  CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT', // ✅ Added - Cancel appointment
  
  VIEW_SPECIALIZATION = 'VIEW_SPECIALIZATION', // ✅ Added
  CREATE_SPECIALIZATION = 'CREATE_SPECIALIZATION', // ✅ Added
  
  UPDATE_ROOM_SERVICES = 'UPDATE_ROOM_SERVICES', // ✅ Added - V16: Assign services to rooms
  
  VIEW_TIMEOFF_ALL = 'VIEW_TIMEOFF_ALL', // ✅ Added - BE uses TIMEOFF (not TIME_OFF)
  VIEW_TIMEOFF_OWN = 'VIEW_TIMEOFF_OWN', // ✅ Added
  CREATE_TIMEOFF = 'CREATE_TIMEOFF', // ✅ Added
  APPROVE_TIMEOFF = 'APPROVE_TIMEOFF', // ✅ Added
  REJECT_TIMEOFF = 'REJECT_TIMEOFF', // ✅ Added
  CANCEL_TIMEOFF_OWN = 'CANCEL_TIMEOFF_OWN', // ✅ Added
  CANCEL_TIMEOFF_PENDING = 'CANCEL_TIMEOFF_PENDING', // ✅ Added
  
  VIEW_TIMEOFF_TYPE_ALL = 'VIEW_TIMEOFF_TYPE_ALL', // ✅ Added
  
  VIEW_LEAVE_BALANCE_ALL = 'VIEW_LEAVE_BALANCE_ALL', // ✅ Added
  ADJUST_LEAVE_BALANCE = 'ADJUST_LEAVE_BALANCE', // ✅ Added
  
  // Employee related (BE uses different naming)
  READ_ALL_EMPLOYEES = 'READ_ALL_EMPLOYEES', // ✅ Added - BE uses READ instead of VIEW
  READ_EMPLOYEE_BY_CODE = 'READ_EMPLOYEE_BY_CODE', // ✅ Added
  
  // Warehouse Management permissions (V23 - NEW MODULE)
  VIEW_WAREHOUSE = 'VIEW_WAREHOUSE', // ✅ Added - View inventory summary and batches
  CREATE_WAREHOUSE = 'CREATE_WAREHOUSE', // ✅ Added - Create item masters, import items
  UPDATE_WAREHOUSE = 'UPDATE_WAREHOUSE', // ✅ Added - Update item masters, export items
  DELETE_WAREHOUSE = 'DELETE_WAREHOUSE', // ✅ Added - Delete item masters
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
