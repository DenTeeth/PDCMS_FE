/**
 * Role formatting utilities
 * Converts role codes (ROLE_MANAGER) to display names (Quản lý)
 */

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
    'ROLE_MANAGER': 'Quản lý',
    'ROLE_DENTIST': 'Bác sĩ nha khoa',
    'ROLE_DENTIST_INTERN': 'Bác sĩ nha khoa thực tập',
    'ROLE_DOCTOR': 'Bác sĩ',
    'ROLE_NURSE': 'Y tá',
    'ROLE_RECEPTIONIST': 'Lễ tân',
    'ROLE_ACCOUNTANT': 'Kế toán',
    'ROLE_INVENTORY_MANAGER': 'Quản lý kho',
    'ROLE_ADMIN': 'Quản trị viên',
    'ROLE_EMPLOYEE': 'Nhân viên',
    'ROLE_ASSISTANT': 'Trợ lý',
    'ROLE_PATIENT': 'Bệnh nhân',
};

/**
 * Get display name for a role
 * @param roleCode The role code (e.g., 'ROLE_MANAGER')
 * @returns The display name (e.g., 'Quản lý') or the original code if not found
 */
export function getRoleDisplayName(roleCode: string | undefined | null): string {
    if (!roleCode) return '';

    // Return the display name if found, otherwise return the original code
    return ROLE_DISPLAY_NAMES[roleCode] || roleCode;
}

/**
 * Extract description from a full role description
 * E.g., "Quản lý - Quản lý và vận hành và nhân sự" -> "Quản lý"
 * @param description Full role description
 * @returns The short name part before the dash
 */
export function extractRoleShortName(description: string | undefined | null): string {
    if (!description) return '';

    const dashIndex = description.indexOf(' - ');
    if (dashIndex > 0) {
        return description.substring(0, dashIndex).trim();
    }

    return description;
}
