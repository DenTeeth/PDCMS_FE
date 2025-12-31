import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

/**
 * Permissions trong hệ thống
 * ✅ SYNCED WITH BE SEED DATA (2025-01-XX)
 * 
 * BE Pattern: MANAGE_* covers CREATE/UPDATE/DELETE
 * FE Pattern: Keep both for backward compatibility
 */
export enum Permission {
  // ==================== ACCOUNT MANAGEMENT ====================
  VIEW_ACCOUNT = 'VIEW_ACCOUNT',
  MANAGE_ACCOUNT = 'MANAGE_ACCOUNT', // BE: Covers create/update/delete
  // Legacy FE permissions (map to MANAGE_ACCOUNT)
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',

  // ==================== EMPLOYEE MANAGEMENT ====================
  VIEW_EMPLOYEE = 'VIEW_EMPLOYEE',
  MANAGE_EMPLOYEE = 'MANAGE_EMPLOYEE', // BE: Covers create/update
  DELETE_EMPLOYEE = 'DELETE_EMPLOYEE', // BE: Separate permission
  // Legacy FE permissions
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  UPDATE_EMPLOYEE = 'UPDATE_EMPLOYEE',
  // BE additional
  READ_ALL_EMPLOYEES = 'READ_ALL_EMPLOYEES',
  READ_EMPLOYEE_BY_CODE = 'READ_EMPLOYEE_BY_CODE',

  // ==================== PATIENT MANAGEMENT ====================
  VIEW_PATIENT = 'VIEW_PATIENT',
  MANAGE_PATIENT = 'MANAGE_PATIENT', // BE: Covers create/update
  DELETE_PATIENT = 'DELETE_PATIENT', // BE: Separate permission
  // Legacy FE permissions
  CREATE_PATIENT = 'CREATE_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',

  // ==================== APPOINTMENT MANAGEMENT ====================
  VIEW_APPOINTMENT_ALL = 'VIEW_APPOINTMENT_ALL', // BE: View all clinic appointments
  VIEW_APPOINTMENT_OWN = 'VIEW_APPOINTMENT_OWN', // BE: View own appointments
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  MANAGE_APPOINTMENT = 'MANAGE_APPOINTMENT', // BE: Covers update/delete
  UPDATE_APPOINTMENT_STATUS = 'UPDATE_APPOINTMENT_STATUS', // BE: Change status
  DELAY_APPOINTMENT = 'DELAY_APPOINTMENT', // BE: Delay within same day
  RESCHEDULE_APPOINTMENT = 'RESCHEDULE_APPOINTMENT', // BE: Cancel and rebook
  CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT', // BE: Cancel appointment
  // Legacy FE permissions
  VIEW_APPOINTMENT = 'VIEW_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT = 'DELETE_APPOINTMENT',

  // ==================== CLINICAL RECORDS ====================
  WRITE_CLINICAL_RECORD = 'WRITE_CLINICAL_RECORD', // BE: Write clinical records
  VIEW_VITAL_SIGNS_REFERENCE = 'VIEW_VITAL_SIGNS_REFERENCE', // BE: View vital signs

  // ==================== ATTACHMENTS ====================
  VIEW_ATTACHMENT = 'VIEW_ATTACHMENT',
  MANAGE_ATTACHMENTS = 'MANAGE_ATTACHMENTS', // BE: Covers create/update/delete

  // ==================== PATIENT IMAGES ====================
  PATIENT_IMAGE_READ = 'PATIENT_IMAGE_READ',
  MANAGE_PATIENT_IMAGES = 'MANAGE_PATIENT_IMAGES',
  DELETE_PATIENT_IMAGES = 'DELETE_PATIENT_IMAGES',

  // ==================== NOTIFICATIONS ====================
  VIEW_NOTIFICATION = 'VIEW_NOTIFICATION',
  DELETE_NOTIFICATION = 'DELETE_NOTIFICATION',
  MANAGE_NOTIFICATION = 'MANAGE_NOTIFICATION',

  // ==================== HOLIDAY ====================
  VIEW_HOLIDAY = 'VIEW_HOLIDAY',
  MANAGE_HOLIDAY = 'MANAGE_HOLIDAY',

  // ==================== SERVICE MANAGEMENT ====================
  VIEW_SERVICE = 'VIEW_SERVICE',
  MANAGE_SERVICE = 'MANAGE_SERVICE', // BE: Covers create/update/delete
  // Legacy FE permissions
  CREATE_SERVICE = 'CREATE_SERVICE',
  UPDATE_SERVICE = 'UPDATE_SERVICE',
  DELETE_SERVICE = 'DELETE_SERVICE',

  // ==================== ROOM MANAGEMENT ====================
  VIEW_ROOM = 'VIEW_ROOM',
  MANAGE_ROOM = 'MANAGE_ROOM', // BE: Covers create/update/delete
  UPDATE_ROOM_SERVICES = 'UPDATE_ROOM_SERVICES', // BE: V16 - Assign services to rooms
  // Legacy FE permissions
  CREATE_ROOM = 'CREATE_ROOM',
  UPDATE_ROOM = 'UPDATE_ROOM',
  DELETE_ROOM = 'DELETE_ROOM',

  // ==================== WAREHOUSE MANAGEMENT ====================
  VIEW_WAREHOUSE = 'VIEW_WAREHOUSE', // BE: View inventory summary and batches
  VIEW_ITEMS = 'VIEW_ITEMS', // BE: View items
  VIEW_MEDICINES = 'VIEW_MEDICINES', // BE: View medicines
  VIEW_WAREHOUSE_COST = 'VIEW_WAREHOUSE_COST', // BE: View cost information
  MANAGE_WAREHOUSE = 'MANAGE_WAREHOUSE', // BE: Manage warehouse
  MANAGE_SUPPLIERS = 'MANAGE_SUPPLIERS', // BE: Manage suppliers
  IMPORT_ITEMS = 'IMPORT_ITEMS', // BE: Import items
  EXPORT_ITEMS = 'EXPORT_ITEMS', // BE: Export items
  DISPOSE_ITEMS = 'DISPOSE_ITEMS', // BE: Dispose items
  APPROVE_TRANSACTION = 'APPROVE_TRANSACTION', // BE: Approve transactions
  // Legacy FE permissions
  CREATE_WAREHOUSE = 'CREATE_WAREHOUSE',
  UPDATE_WAREHOUSE = 'UPDATE_WAREHOUSE',
  DELETE_WAREHOUSE = 'DELETE_WAREHOUSE',

  // ==================== SCHEDULE MANAGEMENT ====================
  // ✅ BE naming (use these)
  VIEW_SCHEDULE_ALL = 'VIEW_SCHEDULE_ALL', // BE: View all schedules
  VIEW_SCHEDULE_OWN = 'VIEW_SCHEDULE_OWN', // BE: View own schedule
  MANAGE_WORK_SHIFTS = 'MANAGE_WORK_SHIFTS', // BE: Manage work shifts
  MANAGE_WORK_SLOTS = 'MANAGE_WORK_SLOTS', // BE: Manage work slots
  MANAGE_PART_TIME_REGISTRATIONS = 'MANAGE_PART_TIME_REGISTRATIONS', // BE: Manage part-time registrations
  MANAGE_FIXED_REGISTRATIONS = 'MANAGE_FIXED_REGISTRATIONS', // BE: Manage fixed registrations
  // Legacy FE permissions (map to BE)
  VIEW_SHIFTS_ALL = 'VIEW_SCHEDULE_ALL', // @deprecated - Use VIEW_SCHEDULE_ALL
  VIEW_SHIFTS_OWN = 'VIEW_SCHEDULE_OWN', // @deprecated - Use VIEW_SCHEDULE_OWN
  VIEW_SHIFTS_SUMMARY = 'VIEW_SHIFTS_SUMMARY',
  CREATE_SHIFTS = 'CREATE_SHIFTS',
  UPDATE_SHIFTS = 'UPDATE_SHIFTS',
  DELETE_SHIFTS = 'DELETE_SHIFTS',
  CREATE_WORK_SHIFTS = 'CREATE_WORK_SHIFTS',
  VIEW_WORK_SHIFTS = 'VIEW_WORK_SHIFTS',
  UPDATE_WORK_SHIFTS = 'UPDATE_WORK_SHIFTS',
  DELETE_WORK_SHIFTS = 'DELETE_WORK_SHIFTS',
  VIEW_AVAILABLE_SLOTS = 'VIEW_AVAILABLE_SLOTS',

  // ==================== SHIFT REGISTRATION ====================
  VIEW_REGISTRATION_ALL = 'VIEW_REGISTRATION_ALL',
  VIEW_REGISTRATION_OWN = 'VIEW_REGISTRATION_OWN',
  CREATE_REGISTRATION = 'CREATE_REGISTRATION',
  UPDATE_REGISTRATION_ALL = 'UPDATE_REGISTRATION_ALL',
  UPDATE_REGISTRATION_OWN = 'UPDATE_REGISTRATION_OWN',
  DELETE_REGISTRATION_ALL = 'DELETE_REGISTRATION_ALL',
  DELETE_REGISTRATION_OWN = 'DELETE_REGISTRATION_OWN',

  // ==================== FIXED REGISTRATION ====================
  VIEW_FIXED_REGISTRATIONS_ALL = 'VIEW_FIXED_REGISTRATIONS_ALL',
  VIEW_FIXED_REGISTRATIONS_OWN = 'VIEW_FIXED_REGISTRATIONS_OWN',

  // ==================== EMPLOYEE SHIFT ====================
  VIEW_EMPLOYEE_SHIFT_ALL = 'VIEW_EMPLOYEE_SHIFT_ALL',
  VIEW_EMPLOYEE_SHIFT_OWN = 'VIEW_EMPLOYEE_SHIFT_OWN',

  // ==================== RENEWAL ====================
  VIEW_RENEWAL_OWN = 'VIEW_RENEWAL_OWN',
  RESPOND_RENEWAL_OWN = 'RESPOND_RENEWAL_OWN',
  VIEW_RENEWAL_ALL = 'VIEW_RENEWAL_ALL', // BE: View all renewal requests (Admin/Manager)

  // ==================== LEAVE/TIME-OFF MANAGEMENT ====================
  // ✅ BE naming (use these)
  VIEW_LEAVE_ALL = 'VIEW_LEAVE_ALL', // BE: View all leave requests
  VIEW_LEAVE_OWN = 'VIEW_LEAVE_OWN', // BE: View own leave requests
  CREATE_TIME_OFF = 'CREATE_TIME_OFF', // BE: Create time off request
  APPROVE_TIME_OFF = 'APPROVE_TIME_OFF', // BE: Approve time off
  // Legacy FE permissions
  VIEW_TIMEOFF_ALL = 'VIEW_TIMEOFF_ALL',
  VIEW_TIMEOFF_OWN = 'VIEW_TIMEOFF_OWN',
  CREATE_TIMEOFF = 'CREATE_TIMEOFF',
  APPROVE_TIMEOFF = 'APPROVE_TIMEOFF',
  REJECT_TIMEOFF = 'REJECT_TIMEOFF',
  CANCEL_TIMEOFF_OWN = 'CANCEL_TIMEOFF_OWN',
  CANCEL_TIMEOFF_PENDING = 'CANCEL_TIMEOFF_PENDING',
  CANCEL_TIME_OFF = 'CANCEL_TIME_OFF',
  CANCEL_TIME_OFF_OWN = 'CANCEL_TIME_OFF_OWN',
  REJECT_TIME_OFF = 'REJECT_TIME_OFF',
  VIEW_TIME_OFF_ALL = 'VIEW_TIME_OFF_ALL',
  VIEW_TIME_OFF_OWN = 'VIEW_TIME_OFF_OWN',
  CANCEL_TIME_OFF_PENDING = 'CANCEL_TIME_OFF_PENDING',

  // ==================== LEAVE TYPE ====================
  VIEW_LEAVE_TYPE = 'VIEW_LEAVE_TYPE',
  MANAGE_LEAVE_TYPE = 'MANAGE_LEAVE_TYPE',
  // Legacy
  VIEW_TIME_OFF_TYPE = 'VIEW_LEAVE_TYPE',
  CREATE_TIME_OFF_TYPE = 'MANAGE_LEAVE_TYPE',
  UPDATE_TIME_OFF_TYPE = 'MANAGE_LEAVE_TYPE',
  DELETE_TIME_OFF_TYPE = 'MANAGE_LEAVE_TYPE',
  VIEW_TIMEOFF_TYPE_ALL = 'VIEW_LEAVE_TYPE',

  // ==================== LEAVE BALANCE ====================
  VIEW_LEAVE_BALANCE = 'VIEW_LEAVE_BALANCE',
  ADJUST_LEAVE_BALANCE = 'ADJUST_LEAVE_BALANCE',
  VIEW_LEAVE_BALANCE_ALL = 'VIEW_LEAVE_BALANCE',

  // ==================== OVERTIME MANAGEMENT ====================
  // ✅ BE naming (use these)
  VIEW_OT_ALL = 'VIEW_OT_ALL', // BE: View all overtime requests
  VIEW_OT_OWN = 'VIEW_OT_OWN', // BE: View own overtime requests
  CREATE_OVERTIME = 'CREATE_OVERTIME', // BE: Create overtime request
  APPROVE_OVERTIME = 'APPROVE_OVERTIME', // BE: Approve overtime
  // Legacy FE permissions
  VIEW_OVERTIME_ALL = 'VIEW_OVERTIME_ALL',
  VIEW_OVERTIME_OWN = 'VIEW_OVERTIME_OWN',
  REJECT_OVERTIME = 'REJECT_OVERTIME',
  CANCEL_OVERTIME_OWN = 'CANCEL_OVERTIME_OWN',
  CANCEL_OVERTIME_PENDING = 'CANCEL_OVERTIME_PENDING',
  CREATE_OT = 'CREATE_OVERTIME',
  APPROVE_OT = 'APPROVE_OVERTIME',
  REJECT_OT = 'REJECT_OVERTIME',
  CANCEL_OT_OWN = 'CANCEL_OVERTIME_OWN',
  CANCEL_OT_PENDING = 'CANCEL_OVERTIME_PENDING',

  // ==================== TREATMENT PLAN ====================
  VIEW_TREATMENT_PLAN_ALL = 'VIEW_TREATMENT_PLAN_ALL', // BE: View all plans
  VIEW_TREATMENT_PLAN_OWN = 'VIEW_TREATMENT_PLAN_OWN', // BE: View own plans
  MANAGE_TREATMENT_PLAN = 'MANAGE_TREATMENT_PLAN', // BE: Manage plans
  APPROVE_TREATMENT_PLAN = 'APPROVE_TREATMENT_PLAN', // ⚠️ DEPRECATED: BE uses MANAGE_TREATMENT_PLAN for approve/reject
  MANAGE_PLAN_PRICING = 'MANAGE_PLAN_PRICING', // BE: V21.4 - Finance adjusts prices
  // Legacy FE permissions
  CREATE_TREATMENT_PLAN = 'CREATE_TREATMENT_PLAN',
  UPDATE_TREATMENT_PLAN = 'UPDATE_TREATMENT_PLAN',
  DELETE_TREATMENT_PLAN = 'DELETE_TREATMENT_PLAN',
  VIEW_ALL_TREATMENT_PLANS = 'VIEW_ALL_TREATMENT_PLANS',

  // ==================== TREATMENT ====================
  VIEW_TREATMENT = 'VIEW_TREATMENT',
  MANAGE_TREATMENT = 'MANAGE_TREATMENT', // BE: Covers create/update
  // Legacy FE permissions
  CREATE_TREATMENT = 'CREATE_TREATMENT',
  UPDATE_TREATMENT = 'UPDATE_TREATMENT',

  // ==================== ROLE & PERMISSION ====================
  VIEW_ROLE = 'VIEW_ROLE',
  MANAGE_ROLE = 'MANAGE_ROLE',
  VIEW_PERMISSION = 'VIEW_PERMISSION',
  MANAGE_PERMISSION = 'MANAGE_PERMISSION',

  // ==================== SPECIALIZATION ====================
  VIEW_SPECIALIZATION = 'VIEW_SPECIALIZATION',
  MANAGE_SPECIALIZATION = 'MANAGE_SPECIALIZATION', // BE: Covers create/update/delete
  // Legacy FE permissions
  CREATE_SPECIALIZATION = 'CREATE_SPECIALIZATION',

  // ==================== CUSTOMER CONTACT ====================
  VIEW_CUSTOMER_CONTACT = 'VIEW_CUSTOMER_CONTACT',
  MANAGE_CUSTOMER_CONTACT = 'MANAGE_CUSTOMER_CONTACT', // BE: Covers create/update/delete
  // Legacy FE permissions
  CREATE_CONTACT = 'CREATE_CONTACT',
  VIEW_CONTACT = 'VIEW_CONTACT',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  DELETE_CONTACT = 'DELETE_CONTACT',
  CREATE_CONTACT_HISTORY = 'CREATE_CONTACT_HISTORY',
  VIEW_CONTACT_HISTORY = 'VIEW_CONTACT_HISTORY',
  UPDATE_CONTACT_HISTORY = 'UPDATE_CONTACT_HISTORY',
  DELETE_CONTACT_HISTORY = 'DELETE_CONTACT_HISTORY',
}

/**
 * Roles trong hệ thống
 * ✅ SYNCED WITH BE SEED DATA
 */
export enum Role {
  ADMIN = 'ROLE_ADMIN',
  EMPLOYEE = 'ROLE_EMPLOYEE',
  PATIENT = 'ROLE_PATIENT',
  // Additional roles from BE
  DENTIST = 'ROLE_DENTIST',
  NURSE = 'ROLE_NURSE',
  DENTIST_INTERN = 'ROLE_DENTIST_INTERN',
  RECEPTIONIST = 'ROLE_RECEPTIONIST',
  MANAGER = 'ROLE_MANAGER',
  ACCOUNTANT = 'ROLE_ACCOUNTANT',
  INVENTORY_MANAGER = 'ROLE_INVENTORY_MANAGER',
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
