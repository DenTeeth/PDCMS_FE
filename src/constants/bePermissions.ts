/**
 * ✅ BACKEND PERMISSIONS - SYNCED WITH BE SEED DATA (2025-12-23)
 * 
 * Backend đã giảm từ 200+ xuống 70 permissions theo chiến lược CONSOLIDATION:
 * - MANAGE_* pattern covers CREATE/UPDATE/DELETE operations
 * - VIEW_*_ALL / VIEW_*_OWN pattern for RBAC
 * - Removed 125 unused permissions
 * 
 * ⚠️ CRITICAL: Đây là SINGLE SOURCE OF TRUTH cho permissions
 * Frontend KHÔNG ĐƯỢC tự tạo permissions không có trong danh sách này
 */

export const BE_PERMISSIONS = {
    // ==================== MODULE 1: ACCOUNT (2) ====================
    VIEW_ACCOUNT: 'VIEW_ACCOUNT',
    MANAGE_ACCOUNT: 'MANAGE_ACCOUNT', // Covers create/update/delete

    // ==================== MODULE 2: EMPLOYEE (3) ====================
    VIEW_EMPLOYEE: 'VIEW_EMPLOYEE',
    MANAGE_EMPLOYEE: 'MANAGE_EMPLOYEE', // Covers create/update
    DELETE_EMPLOYEE: 'DELETE_EMPLOYEE', // Separate permission

    // ==================== MODULE 3: PATIENT (3) ====================
    VIEW_PATIENT: 'VIEW_PATIENT',
    MANAGE_PATIENT: 'MANAGE_PATIENT', // Covers create/update
    DELETE_PATIENT: 'DELETE_PATIENT', // Separate permission

    // ==================== MODULE 4: APPOINTMENT (5) ====================
    VIEW_APPOINTMENT_ALL: 'VIEW_APPOINTMENT_ALL',
    VIEW_APPOINTMENT_OWN: 'VIEW_APPOINTMENT_OWN',
    CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
    MANAGE_APPOINTMENT: 'MANAGE_APPOINTMENT', // Covers update/delete
    UPDATE_APPOINTMENT_STATUS: 'UPDATE_APPOINTMENT_STATUS',

    // ==================== MODULE 5: CLINICAL_RECORDS (4) ====================
    WRITE_CLINICAL_RECORD: 'WRITE_CLINICAL_RECORD',
    VIEW_VITAL_SIGNS_REFERENCE: 'VIEW_VITAL_SIGNS_REFERENCE',
    VIEW_ATTACHMENT: 'VIEW_ATTACHMENT',
    MANAGE_ATTACHMENTS: 'MANAGE_ATTACHMENTS',

    // ==================== MODULE 6: PATIENT_IMAGES (3) ====================
    PATIENT_IMAGE_READ: 'PATIENT_IMAGE_READ',
    MANAGE_PATIENT_IMAGES: 'MANAGE_PATIENT_IMAGES',
    DELETE_PATIENT_IMAGES: 'DELETE_PATIENT_IMAGES',

    // ==================== MODULE 7: NOTIFICATION (3) ====================
    VIEW_NOTIFICATION: 'VIEW_NOTIFICATION',
    DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
    MANAGE_NOTIFICATION: 'MANAGE_NOTIFICATION',

    // ==================== MODULE 8: HOLIDAY (2) ====================
    VIEW_HOLIDAY: 'VIEW_HOLIDAY',
    MANAGE_HOLIDAY: 'MANAGE_HOLIDAY',

    // ==================== MODULE 9: SERVICE (2) ====================
    VIEW_SERVICE: 'VIEW_SERVICE',
    MANAGE_SERVICE: 'MANAGE_SERVICE',

    // ==================== MODULE 10: ROOM (2) ====================
    VIEW_ROOM: 'VIEW_ROOM',
    MANAGE_ROOM: 'MANAGE_ROOM',

    // ==================== MODULE 11: WAREHOUSE (10) ====================
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

    // ==================== MODULE 12: SCHEDULE_MANAGEMENT (6) - GIẢM TỪ 27! ====================
    VIEW_SCHEDULE_ALL: 'VIEW_SCHEDULE_ALL', // View all schedules (Manager)
    VIEW_SCHEDULE_OWN: 'VIEW_SCHEDULE_OWN', // View own schedule
    MANAGE_WORK_SHIFTS: 'MANAGE_WORK_SHIFTS', // Create/Update/Delete work shifts
    MANAGE_WORK_SLOTS: 'MANAGE_WORK_SLOTS', // Create/Update/Delete work slots
    MANAGE_PART_TIME_REGISTRATIONS: 'MANAGE_PART_TIME_REGISTRATIONS', // Manage part-time registrations
    MANAGE_FIXED_REGISTRATIONS: 'MANAGE_FIXED_REGISTRATIONS', // Manage fixed registrations

    // ==================== MODULE 13: LEAVE_MANAGEMENT (8) - GIẢM TỪ 35! ====================
    VIEW_TIME_OFF_ALL: 'VIEW_TIME_OFF_ALL', // View all time-off requests
    VIEW_TIME_OFF_OWN: 'VIEW_TIME_OFF_OWN', // View own time-off requests
    CREATE_TIME_OFF: 'CREATE_TIME_OFF', // Create time-off request
    APPROVE_TIME_OFF: 'APPROVE_TIME_OFF', // Approve/Reject time-off (Manager/HR)
    VIEW_OVERTIME_ALL: 'VIEW_OVERTIME_ALL', // View all overtime requests
    VIEW_OVERTIME_OWN: 'VIEW_OVERTIME_OWN', // View own overtime requests
    CREATE_OVERTIME: 'CREATE_OVERTIME', // Create overtime request
    APPROVE_OVERTIME: 'APPROVE_OVERTIME', // Approve/Reject overtime (Manager/HR)

    // ==================== MODULE 14: TREATMENT_PLAN (5) ====================
    VIEW_TREATMENT_PLAN_ALL: 'VIEW_TREATMENT_PLAN_ALL',
    VIEW_TREATMENT_PLAN_OWN: 'VIEW_TREATMENT_PLAN_OWN',
    MANAGE_TREATMENT_PLAN: 'MANAGE_TREATMENT_PLAN',

    // ==================== MODULE 15: SYSTEM_CONFIGURATION (6) ====================
    VIEW_ROLE: 'VIEW_ROLE',
    MANAGE_ROLE: 'MANAGE_ROLE',
    VIEW_PERMISSION: 'VIEW_PERMISSION',
    MANAGE_PERMISSION: 'MANAGE_PERMISSION',
    VIEW_SPECIALIZATION: 'VIEW_SPECIALIZATION',
    MANAGE_SPECIALIZATION: 'MANAGE_SPECIALIZATION',

    // ==================== MODULE 16: CUSTOMER_CONTACT (2) ====================
    VIEW_CUSTOMER_CONTACT: 'VIEW_CUSTOMER_CONTACT',
    MANAGE_CUSTOMER_CONTACT: 'MANAGE_CUSTOMER_CONTACT',

    // ==================== MODULE 17: TREATMENT (2) ====================
    VIEW_TREATMENT: 'VIEW_TREATMENT',
    MANAGE_TREATMENT: 'MANAGE_TREATMENT',
} as const;

/**
 * Total: 70 permissions (giảm từ 200+)
 */
export type BEPermission = typeof BE_PERMISSIONS[keyof typeof BE_PERMISSIONS];
