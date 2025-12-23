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
    VIEW_LEAVE_ALL: 'VIEW_LEAVE_ALL', // ✅ BE: View all leave/time-off requests (BE controller line 52, 87)
    VIEW_LEAVE_OWN: 'VIEW_LEAVE_OWN', // ✅ BE: View own leave/time-off requests
    CREATE_TIME_OFF: 'CREATE_TIME_OFF', // ✅ BE: Create time-off request
    APPROVE_TIME_OFF: 'APPROVE_TIME_OFF', // ✅ BE: Approve/Reject time-off (Manager/HR)
    VIEW_OT_ALL: 'VIEW_OT_ALL', // ✅ BE: View all overtime requests (BE service line 76, 110)
    VIEW_OT_OWN: 'VIEW_OT_OWN', // ✅ BE: View own overtime requests
    CREATE_OVERTIME: 'CREATE_OVERTIME', // ✅ BE: Create overtime request
    APPROVE_OVERTIME: 'APPROVE_OVERTIME', // ✅ BE: Approve/Reject overtime (Manager/HR)

    // ==================== MODULE 14: TREATMENT_PLAN (5) ====================
    VIEW_TREATMENT_PLAN_ALL: 'VIEW_TREATMENT_PLAN_ALL',
    VIEW_TREATMENT_PLAN_OWN: 'VIEW_TREATMENT_PLAN_OWN',
    MANAGE_TREATMENT_PLAN: 'MANAGE_TREATMENT_PLAN',
    VIEW_TREATMENT: 'VIEW_TREATMENT',
    MANAGE_TREATMENT: 'MANAGE_TREATMENT',

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
} as const;

/**
 * Total: 70 permissions (giảm từ 200+)
 */
export type BEPermission = typeof BE_PERMISSIONS[keyof typeof BE_PERMISSIONS];

/**
 * ============================================================================
 * PERMISSION MAPPING - Map old FE permissions to new BE permissions
 * ============================================================================
 * 
 * Backward Compatibility: Map old granular permissions to new consolidated permissions
 * This allows existing code to continue working while migrating to new permission structure
 * 
 * ✅ SYNCED WITH BE SEED DATA - 70 permissions optimized
 */
export const PERMISSION_MAPPING: Record<string, string | null> = {
    // ==================== ACCOUNT ====================
    'CREATE_ACCOUNT': 'MANAGE_ACCOUNT',
    'UPDATE_ACCOUNT': 'MANAGE_ACCOUNT',
    'DELETE_ACCOUNT': 'MANAGE_ACCOUNT',

    // ==================== EMPLOYEE ====================
    'CREATE_EMPLOYEE': 'MANAGE_EMPLOYEE',
    'UPDATE_EMPLOYEE': 'MANAGE_EMPLOYEE',
    'READ_ALL_EMPLOYEES': 'VIEW_EMPLOYEE', // BE không có, dùng VIEW_EMPLOYEE
    'READ_EMPLOYEE_BY_CODE': 'VIEW_EMPLOYEE', // BE không có, dùng VIEW_EMPLOYEE

    // ==================== PATIENT ====================
    'CREATE_PATIENT': 'MANAGE_PATIENT',
    'UPDATE_PATIENT': 'MANAGE_PATIENT',

    // ==================== APPOINTMENT ====================
    'VIEW_APPOINTMENT': 'VIEW_APPOINTMENT_ALL', // Default to ALL, pages should use specific ALL/OWN
    'UPDATE_APPOINTMENT': 'MANAGE_APPOINTMENT',
    'DELETE_APPOINTMENT': 'MANAGE_APPOINTMENT',
    'DELAY_APPOINTMENT': 'MANAGE_APPOINTMENT',
    'CANCEL_APPOINTMENT': 'MANAGE_APPOINTMENT',
    'RESCHEDULE_APPOINTMENT': 'MANAGE_APPOINTMENT',

    // ==================== SERVICE ====================
    'CREATE_SERVICE': 'MANAGE_SERVICE',
    'UPDATE_SERVICE': 'MANAGE_SERVICE',
    'DELETE_SERVICE': 'MANAGE_SERVICE',

    // ==================== ROOM ====================
    'CREATE_ROOM': 'MANAGE_ROOM',
    'UPDATE_ROOM': 'MANAGE_ROOM',
    'DELETE_ROOM': 'MANAGE_ROOM',
    'UPDATE_ROOM_SERVICES': 'MANAGE_ROOM', // BE gộp vào MANAGE_ROOM

    // ==================== HOLIDAY ====================
    'CREATE_HOLIDAY': 'MANAGE_HOLIDAY',
    'UPDATE_HOLIDAY': 'MANAGE_HOLIDAY',
    'DELETE_HOLIDAY': 'MANAGE_HOLIDAY',

    // ==================== WAREHOUSE ====================
    'CREATE_WAREHOUSE': 'MANAGE_WAREHOUSE',
    'UPDATE_WAREHOUSE': 'MANAGE_WAREHOUSE',
    'DELETE_WAREHOUSE': 'MANAGE_WAREHOUSE',

    // ==================== SCHEDULE_MANAGEMENT ====================
    // Work Shifts - Dùng MANAGE cho cả view và edit
    'VIEW_WORK_SHIFTS': 'MANAGE_WORK_SHIFTS',
    'CREATE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
    'UPDATE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
    'DELETE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
    'CREATE_WORK_SHIFTS': 'MANAGE_WORK_SHIFTS',
    'UPDATE_WORK_SHIFTS': 'MANAGE_WORK_SHIFTS',
    'DELETE_WORK_SHIFTS': 'MANAGE_WORK_SHIFTS',

    // Work Slots - Tương tự
    'VIEW_WORK_SLOT': 'MANAGE_WORK_SLOTS',
    'CREATE_WORK_SLOT': 'MANAGE_WORK_SLOTS',
    'UPDATE_WORK_SLOT': 'MANAGE_WORK_SLOTS',
    'DELETE_WORK_SLOT': 'MANAGE_WORK_SLOTS',

    // Employee Schedule - Dùng VIEW_SCHEDULE_ALL/OWN
    'VIEW_SHIFTS_ALL': 'VIEW_SCHEDULE_ALL',
    'VIEW_SHIFTS_OWN': 'VIEW_SCHEDULE_OWN',
    'VIEW_SHIFTS_SUMMARY': 'VIEW_SCHEDULE_ALL', // BE không có, dùng VIEW_SCHEDULE_ALL
    'CREATE_SHIFTS': 'MANAGE_WORK_SHIFTS', // BE không có, dùng MANAGE_WORK_SHIFTS
    'UPDATE_SHIFTS': 'MANAGE_WORK_SHIFTS', // BE không có, dùng MANAGE_WORK_SHIFTS
    'DELETE_SHIFTS': 'MANAGE_WORK_SHIFTS', // BE không có, dùng MANAGE_WORK_SHIFTS

    // Part-time Registration
    'VIEW_REGISTRATION_ALL': 'MANAGE_PART_TIME_REGISTRATIONS',
    'VIEW_REGISTRATION_OWN': 'VIEW_REGISTRATION_OWN', // BE có permission này
    'UPDATE_REGISTRATION_ALL': 'MANAGE_PART_TIME_REGISTRATIONS',
    'UPDATE_REGISTRATION_OWN': 'VIEW_REGISTRATION_OWN', // Employee chỉ có thể update own
    'DELETE_REGISTRATION_ALL': 'MANAGE_PART_TIME_REGISTRATIONS',
    'DELETE_REGISTRATION_OWN': 'VIEW_REGISTRATION_OWN', // Employee chỉ có thể delete own

    // Fixed Registration
    'VIEW_FIXED_REGISTRATIONS_ALL': 'MANAGE_FIXED_REGISTRATIONS',
    'VIEW_FIXED_REGISTRATIONS_OWN': 'VIEW_SCHEDULE_OWN',
    'CREATE_FIXED_REGISTRATION': 'MANAGE_FIXED_REGISTRATIONS',

    // Employee Shift
    'VIEW_EMPLOYEE_SHIFT_ALL': 'VIEW_SCHEDULE_ALL',
    'VIEW_EMPLOYEE_SHIFT_OWN': 'VIEW_SCHEDULE_OWN',

    // Renewal - KHÔNG CÒN TRONG BE (removed module)
    'VIEW_RENEWAL_OWN': null,
    'RESPOND_RENEWAL_OWN': null,

    // ==================== LEAVE_MANAGEMENT ====================
    // Time-off - ✅ BE dùng VIEW_LEAVE_ALL/OWN, CREATE_TIME_OFF, APPROVE_TIME_OFF
    'VIEW_TIMEOFF_ALL': 'VIEW_LEAVE_ALL',
    'VIEW_TIMEOFF_OWN': 'VIEW_LEAVE_OWN',
    'CREATE_TIMEOFF': 'CREATE_TIME_OFF',
    'APPROVE_TIMEOFF': 'APPROVE_TIME_OFF',
    'REJECT_TIMEOFF': 'APPROVE_TIME_OFF', // BE dùng APPROVE_TIME_OFF cho cả approve/reject
    'CANCEL_TIMEOFF_OWN': 'VIEW_LEAVE_OWN', // Employee chỉ có thể cancel own
    'CANCEL_TIMEOFF_PENDING': 'VIEW_LEAVE_OWN',
    'CANCEL_TIME_OFF': 'VIEW_LEAVE_OWN',
    'CANCEL_TIME_OFF_OWN': 'VIEW_LEAVE_OWN',
    'CANCEL_TIME_OFF_PENDING': 'VIEW_LEAVE_OWN',
    'REJECT_TIME_OFF': 'APPROVE_TIME_OFF',
    'VIEW_TIME_OFF_ALL': 'VIEW_LEAVE_ALL', // ✅ Map to BE: VIEW_LEAVE_ALL
    'VIEW_TIME_OFF_OWN': 'VIEW_LEAVE_OWN', // ✅ Map to BE: VIEW_LEAVE_OWN

    // Leave Type - BE KHÔNG CÓ permissions riêng, dùng APPROVE_TIME_OFF
    'VIEW_LEAVE_TYPE': 'APPROVE_TIME_OFF', // BE không có, dùng APPROVE_TIME_OFF
    'MANAGE_LEAVE_TYPE': 'APPROVE_TIME_OFF', // BE không có, dùng APPROVE_TIME_OFF
    'VIEW_TIME_OFF_TYPE': 'APPROVE_TIME_OFF',
    'CREATE_TIME_OFF_TYPE': 'APPROVE_TIME_OFF',
    'UPDATE_TIME_OFF_TYPE': 'APPROVE_TIME_OFF',
    'DELETE_TIME_OFF_TYPE': 'APPROVE_TIME_OFF',
    'VIEW_TIMEOFF_TYPE_ALL': 'APPROVE_TIME_OFF',

    // Leave Balance - BE KHÔNG CÓ permissions riêng
    'VIEW_LEAVE_BALANCE': 'VIEW_LEAVE_ALL', // BE không có, dùng VIEW_LEAVE_ALL
    'VIEW_LEAVE_BALANCE_ALL': 'VIEW_LEAVE_ALL', // BE không có, dùng VIEW_LEAVE_ALL
    'ADJUST_LEAVE_BALANCE': 'APPROVE_TIME_OFF', // BE không có, dùng APPROVE_TIME_OFF

    // Overtime - ✅ BE dùng VIEW_OT_ALL/OWN, CREATE_OVERTIME, APPROVE_OVERTIME (BE service line 76, 110)
    'VIEW_OVERTIME_ALL': 'VIEW_OT_ALL', // ✅ Map to BE: VIEW_OT_ALL
    'VIEW_OVERTIME_OWN': 'VIEW_OT_OWN', // ✅ Map to BE: VIEW_OT_OWN
    'REJECT_OVERTIME': 'APPROVE_OVERTIME', // BE dùng APPROVE_OVERTIME cho cả approve/reject
    'CANCEL_OVERTIME_OWN': 'VIEW_OT_OWN',
    'CANCEL_OVERTIME_PENDING': 'VIEW_OT_OWN',
    'CREATE_OT': 'CREATE_OVERTIME',
    'APPROVE_OT': 'APPROVE_OVERTIME',
    'REJECT_OT': 'APPROVE_OVERTIME',
    'CANCEL_OT_OWN': 'VIEW_OT_OWN',
    'CANCEL_OT_PENDING': 'VIEW_OT_OWN',

    // ==================== TREATMENT_PLAN ====================
    'CREATE_TREATMENT_PLAN': 'MANAGE_TREATMENT_PLAN',
    'UPDATE_TREATMENT_PLAN': 'MANAGE_TREATMENT_PLAN',
    'DELETE_TREATMENT_PLAN': 'MANAGE_TREATMENT_PLAN',
    'VIEW_ALL_TREATMENT_PLANS': 'VIEW_TREATMENT_PLAN_ALL',
    'ASSIGN_DOCTOR_TO_ITEM': 'MANAGE_TREATMENT', // BE gộp vào MANAGE_TREATMENT

    // ==================== TREATMENT ====================
    'CREATE_TREATMENT': 'MANAGE_TREATMENT',
    'UPDATE_TREATMENT': 'MANAGE_TREATMENT',

    // ==================== CLINICAL_RECORDS ====================
    'UPLOAD_ATTACHMENT': 'MANAGE_ATTACHMENTS',
    'DELETE_ATTACHMENT': 'MANAGE_ATTACHMENTS',

    // ==================== PATIENT_IMAGES ====================
    'PATIENT_IMAGE_CREATE': 'MANAGE_PATIENT_IMAGES',
    'PATIENT_IMAGE_UPDATE': 'MANAGE_PATIENT_IMAGES',
    'PATIENT_IMAGE_DELETE': 'MANAGE_PATIENT_IMAGES',
    'PATIENT_IMAGE_COMMENT_CREATE': 'MANAGE_PATIENT_IMAGES',
    'PATIENT_IMAGE_COMMENT_UPDATE': 'MANAGE_PATIENT_IMAGES',
    'PATIENT_IMAGE_COMMENT_DELETE': 'MANAGE_PATIENT_IMAGES',
    'VIEW_PATIENT_IMAGES': 'PATIENT_IMAGE_READ', // BE dùng PATIENT_IMAGE_READ

    // ==================== SYSTEM_CONFIGURATION ====================
    'CREATE_ROLE': 'MANAGE_ROLE',
    'UPDATE_ROLE': 'MANAGE_ROLE',
    'DELETE_ROLE': 'MANAGE_ROLE',
    'CREATE_PERMISSION': 'MANAGE_PERMISSION',
    'UPDATE_PERMISSION': 'MANAGE_PERMISSION',
    'DELETE_PERMISSION': 'MANAGE_PERMISSION',
    'CREATE_SPECIALIZATION': 'MANAGE_SPECIALIZATION',
    'UPDATE_SPECIALIZATION': 'MANAGE_SPECIALIZATION',
    'DELETE_SPECIALIZATION': 'MANAGE_SPECIALIZATION',

    // ==================== CUSTOMER_CONTACT ====================
    'CREATE_CONTACT': 'MANAGE_CUSTOMER_CONTACT',
    'VIEW_CONTACT': 'VIEW_CUSTOMER_CONTACT',
    'UPDATE_CONTACT': 'MANAGE_CUSTOMER_CONTACT',
    'DELETE_CONTACT': 'MANAGE_CUSTOMER_CONTACT',
    'CREATE_CONTACT_HISTORY': 'MANAGE_CUSTOMER_CONTACT',
    'VIEW_CONTACT_HISTORY': 'VIEW_CUSTOMER_CONTACT',
    'UPDATE_CONTACT_HISTORY': 'MANAGE_CUSTOMER_CONTACT',
    'DELETE_CONTACT_HISTORY': 'MANAGE_CUSTOMER_CONTACT',
};

/**
 * ============================================================================
 * PERMISSION CHECK HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Check if user has a specific permission (with backward compatibility mapping)
 * 
 * @param userPermissions - Array of permissions from user object
 * @param requiredPermission - Permission to check (will be mapped if old permission)
 * @returns true if user has the permission, false otherwise
 */
export function checkPermission(
    userPermissions: string[],
    requiredPermission: string
): boolean {
    // Map old permission to new
    const mappedPermission = PERMISSION_MAPPING[requiredPermission] || requiredPermission;

    // If mapped to null (removed feature)
    if (mappedPermission === null) return false;

    // Check mapped permission
    return userPermissions.includes(mappedPermission);
}

/**
 * Helper function: Check if user has ANY of the required permissions
 * 
 * @param userPermissions - Array of permissions from user object
 * @param requiredPermissions - Array of permissions to check (OR logic)
 * @returns true if user has at least one permission, false otherwise
 */
export function checkAnyPermission(
    userPermissions: string[] | undefined,
    requiredPermissions: string[]
): boolean {
    if (!userPermissions || userPermissions.length === 0) {
        return false;
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => checkPermission(userPermissions, permission));
}

/**
 * Helper function: Check if user has ALL of the required permissions
 * 
 * @param userPermissions - Array of permissions from user object
 * @param requiredPermissions - Array of permissions to check (AND logic)
 * @returns true if user has all permissions, false otherwise
 */
export function checkAllPermissions(
    userPermissions: string[] | undefined,
    requiredPermissions: string[]
): boolean {
    if (!userPermissions || userPermissions.length === 0) {
        return false;
    }

    // Check if user has all required permissions
    return requiredPermissions.every(permission => checkPermission(userPermissions, permission));
}
