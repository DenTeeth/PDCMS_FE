// constants/permissionMapping.ts
// Map old FE permissions to new BE permissions (Dec 2025)
export const PERMISSION_MAPPING = {
    // Work Shifts - Dùng MANAGE cho cả view và edit
    'VIEW_WORK_SHIFTS': 'MANAGE_WORK_SHIFTS',
    'CREATE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
    'UPDATE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',
    'DELETE_WORK_SHIFT': 'MANAGE_WORK_SHIFTS',

    // Work Slots - Tương tự
    'VIEW_WORK_SLOT': 'MANAGE_WORK_SLOTS',
    'CREATE_WORK_SLOT': 'MANAGE_WORK_SLOTS',
    'UPDATE_WORK_SLOT': 'MANAGE_WORK_SLOTS',
    'DELETE_WORK_SLOT': 'MANAGE_WORK_SLOTS',

    // Employee Schedule - Dùng VIEW_SCHEDULE_ALL/OWN
    'VIEW_SHIFTS_ALL': 'VIEW_SCHEDULE_ALL',
    'VIEW_SHIFTS_OWN': 'VIEW_SCHEDULE_OWN',

    // Part-time Registration
    'VIEW_REGISTRATION_ALL': 'MANAGE_PART_TIME_REGISTRATIONS',
    'VIEW_REGISTRATION_OWN': 'VIEW_SCHEDULE_OWN',
    'CREATE_REGISTRATION': 'MANAGE_PART_TIME_REGISTRATIONS',

    // Fixed Registration
    'VIEW_FIXED_REGISTRATIONS_ALL': 'MANAGE_FIXED_REGISTRATIONS',
    'VIEW_FIXED_REGISTRATIONS_OWN': 'VIEW_SCHEDULE_OWN',
    'CREATE_FIXED_REGISTRATION': 'MANAGE_FIXED_REGISTRATIONS',

    // Leave/Time-off - Dùng CREATE_TIME_OFF và APPROVE_TIME_OFF
    'VIEW_LEAVE_TYPE': 'APPROVE_TIME_OFF',
    'MANAGE_LEAVE_TYPE': 'APPROVE_TIME_OFF',
    'VIEW_LEAVE_BALANCE': 'VIEW_TIME_OFF_ALL',
    'ADJUST_LEAVE_BALANCE': 'APPROVE_TIME_OFF',

    // Renewal - KHÔNG CÒN TRONG BE (removed module)
    'VIEW_RENEWAL_OWN': null,
    'RESPOND_RENEWAL_OWN': null,
};

export function checkPermission(
    userPermissions: string[],
    requiredPermission: string
): boolean {
    // Admin bypass
    if (userPermissions.includes('ROLE_ADMIN')) return true;

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

    // Admin bypass
    if (userPermissions.includes('ROLE_ADMIN')) {
        return true;
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

    // Admin bypass
    if (userPermissions.includes('ROLE_ADMIN')) {
        return true;
    }

    // Check if user has all required permissions
    return requiredPermissions.every(permission => checkPermission(userPermissions, permission));
}
