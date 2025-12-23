/**
 * Vital Signs Assessment Utility
 * Provides client-side assessment logic similar to BE VitalSignsReferenceService.assessVitalSign()
 */

import { VitalSignsReferenceResponse, VitalSignAssessment } from '@/types/clinicalRecord';

/**
 * Assess a vital sign value against reference ranges
 * Similar to BE VitalSignsReferenceService.assessVitalSign()
 * 
 * @param vitalType Vital sign type (e.g., "BLOOD_PRESSURE_SYSTOLIC", "HEART_RATE")
 * @param value Vital sign value to assess
 * @param references List of reference ranges (should be filtered by age already)
 * @returns Assessment result with status and message
 */
export function assessVitalSign(
  vitalType: string,
  value: number,
  references: VitalSignsReferenceResponse[]
): VitalSignAssessment | null {
  // Don't assess if no references provided
  if (!references || references.length === 0) {
    return null;
  }

  // Find reference for this vital type
  const reference = references.find(ref => ref.vitalType === vitalType);

  if (!reference) {
    // Return null instead of UNKNOWN when reference not found
    // This allows the UI to handle it gracefully (e.g., show nothing or show a different message)
    return null;
  }

  const { normalMin, normalMax, unit } = reference;
  let status: VitalSignAssessment['status'];
  let message: string;

  // Compare value with normal range
  if (value < normalMin) {
    status = 'BELOW_NORMAL';
    message = `Dưới mức bình thường (bình thường: ${normalMin}-${normalMax} ${unit})`;
  } else if (value > normalMax) {
    status = 'ABOVE_NORMAL';
    message = `Trên mức bình thường (bình thường: ${normalMin}-${normalMax} ${unit})`;
  } else {
    status = 'NORMAL';
    message = `Bình thường (${normalMin}-${normalMax} ${unit})`;
  }

  return {
    vitalType,
    value,
    unit,
    status,
    normalMin,
    normalMax,
    message,
  };
}

/**
 * Map FE field names to BE vital type names
 */
export const VITAL_TYPE_MAP: Record<string, string> = {
  bloodPressure: 'BLOOD_PRESSURE_SYSTOLIC', // Will need to parse "120/80"
  blood_pressure: 'BLOOD_PRESSURE_SYSTOLIC',
  heartRate: 'HEART_RATE',
  heart_rate: 'HEART_RATE',
  temperature: 'TEMPERATURE',
  oxygenSaturation: 'OXYGEN_SATURATION',
  oxygen_saturation: 'OXYGEN_SATURATION',
  respiratoryRate: 'RESPIRATORY_RATE',
  respiratory_rate: 'RESPIRATORY_RATE',
  bloodGlucose: 'BLOOD_GLUCOSE',
  blood_glucose: 'BLOOD_GLUCOSE',
  weight: 'WEIGHT',
  height: 'HEIGHT',
  bmi: 'BMI',
};

/**
 * Parse blood pressure string "120/80" into systolic and diastolic
 */
export function parseBloodPressure(bp: string): { systolic: number; diastolic: number } | null {
  const parts = bp.split('/');
  if (parts.length !== 2) return null;
  
  const systolic = parseFloat(parts[0].trim());
  const diastolic = parseFloat(parts[1].trim());
  
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  
  return { systolic, diastolic };
}

/**
 * Calculate patient age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

