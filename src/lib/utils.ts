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
 * Decode JWT token to get payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): any | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ [decodeJWT] Invalid JWT format');
      return null;
    }

    // Decode base64url payload (second part)
    const payload = parts[1];

    // Base64URL decode: replace - with +, _ with /, add padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const decoded = JSON.parse(atob(padded));
    console.log('✅ [decodeJWT] Decoded payload:', decoded);
    return decoded;
  } catch (error) {
    console.error('❌ [decodeJWT] Failed to decode token:', error);
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
    console.log('🔍 [getEmployeeIdFromToken] Decoding token...');
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn('⚠️ [getEmployeeIdFromToken] Failed to decode token payload');
      return null;
    }

    console.log('📋 [getEmployeeIdFromToken] Token payload keys:', Object.keys(payload));
    console.log('📋 [getEmployeeIdFromToken] Full payload:', payload);

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
      console.log('✅ [getEmployeeIdFromToken] Found employeeId:', employeeIdStr, '(type:', typeof employeeId, ')');
      return employeeIdStr;
    } else {
      console.warn('⚠️ [getEmployeeIdFromToken] No employeeId found in token payload. Available fields:', Object.keys(payload));
      console.warn('⚠️ [getEmployeeIdFromToken] Payload values:', payload);
      return null;
    }
  } catch (error) {
    console.error('❌ [getEmployeeIdFromToken] Failed to extract employeeId:', error);
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

