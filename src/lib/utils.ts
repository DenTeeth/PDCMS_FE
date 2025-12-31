import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { EmploymentType } from "@/types/employee"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if employee type can use Fixed Shift Registration
 * @param employeeType Employment type to check
 * @returns true if employee can use fixed registration (FULL_TIME or PART_TIME_FIXED)
 */
export function canUseFixedRegistration(employeeType: EmploymentType): boolean {
  return employeeType === EmploymentType.FULL_TIME ||
    employeeType === EmploymentType.PART_TIME_FIXED;
}

/**
 * Decode base64 string to UTF-8 string properly
 * Handles Vietnamese and other UTF-8 characters correctly
 * @param base64 Base64 encoded string
 * @returns UTF-8 decoded string
 */
function base64ToUtf8(base64: string): string {
  // Decode base64 to binary string
  const binaryString = atob(base64);
  
  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Decode UTF-8 bytes to string using TextDecoder
  // This properly handles multi-byte UTF-8 characters (Vietnamese, Chinese, etc.)
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * Decode JWT token to get payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): any | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error(' [decodeJWT] Invalid JWT format');
      return null;
    }

    // Decode base64url payload (second part)
    const payload = parts[1];

    // Base64URL decode: replace - with +, _ with /, add padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // Decode base64 to UTF-8 string properly
    // This handles Vietnamese characters correctly
    const utf8String = base64ToUtf8(padded);
    
    const decoded = JSON.parse(utf8String);
    console.log(' [decodeJWT] Decoded payload:', decoded);
    return decoded;
  } catch (error) {
    console.error(' [decodeJWT] Failed to decode token:', error);
    return null;
  }
}

/**
 * Extract employeeId from JWT token
 * Backend typically includes employeeId in token claims (sub, employeeId, or employee_id)
 * @param token JWT token string
 * @returns employeeId as string or null if not found
 */
export function getEmployeeIdFromToken(token: string): string | null {
  try {
    console.log(' [getEmployeeIdFromToken] Decoding token...');
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn(' [getEmployeeIdFromToken] Failed to decode token payload');
      return null;
    }

    console.log(' [getEmployeeIdFromToken] Token payload keys:', Object.keys(payload));
    console.log(' [getEmployeeIdFromToken] Full payload:', payload);

    // Try different possible field names for employeeId
    // Note: sub might be username, not employeeId, so check other fields first
    const employeeId =
      payload.employeeId ||           // employeeId (most common)
      payload.employee_id ||          // employee_id (snake_case)
      payload.empId ||                // empId (short form)
      payload.employee?.id ||         // nested employee.id
      payload.sub ||                  // subject (might be username, but try as fallback)
      payload.userId ||               // userId
      payload.id ||                   // id
      null;

    if (employeeId) {
      const employeeIdStr = String(employeeId).trim();
      console.log(' [getEmployeeIdFromToken] Found employeeId:', employeeIdStr, '(type:', typeof employeeId, ')');
      return employeeIdStr;
    } else {
      console.warn(' [getEmployeeIdFromToken] No employeeId found in token payload. Available fields:', Object.keys(payload));
      console.warn(' [getEmployeeIdFromToken] Payload values:', payload);
      return null;
    }
  } catch (error) {
    console.error(' [getEmployeeIdFromToken] Failed to extract employeeId:', error);
    return null;
  }
}

/**
 * Extract patientCode from JWT token
 * Backend now includes patient_code in token claims (Issue 3.3 - FIXED)
 * @param token JWT token string
 * @returns patientCode as string or null if not found
 */
export function getPatientCodeFromToken(token: string): string | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn(' [getPatientCodeFromToken] Failed to decode token payload');
      return null;
    }

    // Backend now includes patient_code in JWT claims (snake_case)
    // Also check camelCase for backward compatibility
    const patientCode = payload.patient_code || payload.patientCode || null;

    if (patientCode) {
      const patientCodeStr = String(patientCode).trim();
      console.log(' [getPatientCodeFromToken] Found patientCode:', patientCodeStr);
      return patientCodeStr;
    } else {
      console.warn(' [getPatientCodeFromToken] No patientCode found in token payload. Available fields:', Object.keys(payload));
      return null;
    }
  } catch (error) {
    console.error(' [getPatientCodeFromToken] Failed to extract patientCode:', error);
    return null;
  }
}

/**
 * Extract employeeCode from JWT token
 * Backend now includes employee_code in token claims (Issue 3.3 - FIXED)
 * @param token JWT token string
 * @returns employeeCode as string or null if not found
 */
export function getEmployeeCodeFromToken(token: string): string | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn(' [getEmployeeCodeFromToken] Failed to decode token payload');
      return null;
    }

    // Backend now includes employee_code in JWT claims (snake_case)
    // Also check camelCase for backward compatibility
    const employeeCode = payload.employee_code || payload.employeeCode || null;

    if (employeeCode) {
      const employeeCodeStr = String(employeeCode).trim();
      console.log(' [getEmployeeCodeFromToken] Found employeeCode:', employeeCodeStr);
      return employeeCodeStr;
    } else {
      console.warn(' [getEmployeeCodeFromToken] No employeeCode found in token payload. Available fields:', Object.keys(payload));
      return null;
    }
  } catch (error) {
    console.error(' [getEmployeeCodeFromToken] Failed to extract employeeCode:', error);
    return null;
  }
}

/**
 * Extract userId (thực chất là account_id) from JWT token
 * BE (NotificationController) dùng claim `account_id` làm userId cho notifications:
 *   - REST: lấy từ JWT -> getUserIdFromToken(authentication)
 *   - WebSocket: push tới /topic/notifications/{userId}
 */
export function getUserIdFromToken(token: string): number | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn(' [getUserIdFromToken] Failed to decode token payload');
      return null;
    }

    // Ưu tiên account_id (chuẩn mới từ BE cho notification), sau đó đến các field dự phòng
    const rawUserId =
      (payload as any).account_id ??
      (payload as any).user_id ??
      (payload as any).userId ??
      (payload as any).sub;

    if (rawUserId != null) {
      const userIdNum = Number.parseInt(String(rawUserId), 10);
      if (!Number.isNaN(userIdNum)) {
        console.log(' [getUserIdFromToken] Found userId for notifications:', userIdNum, '(from claim)', {
          has_account_id: 'account_id' in payload,
          has_user_id: 'user_id' in payload,
          has_userId: 'userId' in payload,
          has_sub: 'sub' in payload,
        });
        return userIdNum;
      }
    }

    console.warn(
      ' [getUserIdFromToken] No numeric userId found in token payload. Available fields:',
      Object.keys(payload),
    );
    return null;
  } catch (error) {
    console.error(' [getUserIdFromToken] Failed to extract userId:', error);
    return null;
  }
}

/**
 * Extract full name from JWT token
 * Backend includes full_name in token claims
 * @param token JWT token string
 * @returns Full name as string or null if not found
 */
export function getFullNameFromToken(token: string): string | null {
  try {
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn(' [getFullNameFromToken] Failed to decode token payload');
      return null;
    }

    // Try different possible field names for full name
    const fullName = payload.full_name || payload.fullName || payload.name || null;

    if (fullName) {
      const fullNameStr = String(fullName).trim();
      console.log(' [getFullNameFromToken] Found fullName:', fullNameStr);
      return fullNameStr;
    } else {
      console.warn(' [getFullNameFromToken] full_name not found in JWT token');
      return null;
    }
  } catch (error) {
    console.error(' [getFullNameFromToken] Failed to extract fullName:', error);
    return null;
  }
}

/**
 * Format time string to HH:mm (remove seconds)
 * @param time Time string in HH:mm:ss or HH:mm format
 * @returns Formatted time string HH:mm
 * @example formatTimeToHHMM("08:30:00") => "08:30"
 * @example formatTimeToHHMM("08:30") => "08:30"
 */
export function formatTimeToHHMM(time: string): string {
  if (!time) return '';

  // If already in HH:mm format (no seconds), return as is
  if (time.length === 5 && time.match(/^\d{2}:\d{2}$/)) {
    return time;
  }

  // If in HH:mm:ss format, remove seconds
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time.substring(0, 5);
  }

  // Fallback: return as is
  return time;
}
