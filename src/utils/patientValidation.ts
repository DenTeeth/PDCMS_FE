/**
 * Patient Validation Utilities
 * Handles age-based validation rules for patient creation
 */

/**
 * Calculate age in years from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate age in months from date of birth
 */
export function calculateAgeInMonths(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months += today.getMonth() - birthDate.getMonth();
  
  // Adjust for day of month
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }
  
  return months;
}

/**
 * Validation rules for patient age
 */
export const PATIENT_AGE_RULES = {
  MIN_AGE_MONTHS: 6, // Minimum 6 months old for dental examination
  EMERGENCY_CONTACT_REQUIRED_AGE: 16, // Under 16 requires emergency contact
};

/**
 * Validate patient date of birth
 * Returns error message if invalid, null if valid
 */
export function validatePatientDateOfBirth(
  dateOfBirth: string | undefined,
  emergencyContactPhone?: string
): string | null {
  // If no date of birth provided, skip validation
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  // Check if date is in the future
  if (birthDate > today) {
    return 'Ngày sinh không thể là ngày trong tương lai';
  }

  // Check minimum age (6 months)
  const ageInMonths = calculateAgeInMonths(dateOfBirth);
  if (ageInMonths < PATIENT_AGE_RULES.MIN_AGE_MONTHS) {
    return `Bệnh nhân phải từ ${PATIENT_AGE_RULES.MIN_AGE_MONTHS} tháng tuổi trở lên mới được khám răng`;
  }

  // Check emergency contact requirement for under 16
  const ageInYears = calculateAge(dateOfBirth);
  if (ageInYears < PATIENT_AGE_RULES.EMERGENCY_CONTACT_REQUIRED_AGE) {
    if (!emergencyContactPhone || emergencyContactPhone.trim() === '') {
      return `Bệnh nhân dưới ${PATIENT_AGE_RULES.EMERGENCY_CONTACT_REQUIRED_AGE} tuổi bắt buộc phải nhập số điện thoại người giám hộ`;
    }
  }

  return null;
}

/**
 * Check if patient requires emergency contact based on age
 */
export function requiresEmergencyContact(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false;
  
  const age = calculateAge(dateOfBirth);
  return age < PATIENT_AGE_RULES.EMERGENCY_CONTACT_REQUIRED_AGE;
}

/**
 * Get age display string (e.g., "2 năm 3 tháng" or "8 tháng")
 */
export function getAgeDisplayString(dateOfBirth: string): string {
  const ageInYears = calculateAge(dateOfBirth);
  const ageInMonths = calculateAgeInMonths(dateOfBirth);
  
  if (ageInYears < 2) {
    // For children under 2, show in months
    return `${ageInMonths} tháng`;
  } else {
    // For 2 years and above, show years and months
    const remainingMonths = ageInMonths % 12;
    if (remainingMonths === 0) {
      return `${ageInYears} tuổi`;
    } else {
      return `${ageInYears} tuổi ${remainingMonths} tháng`;
    }
  }
}

/**
 * Format validation errors for display
 */
export interface PatientValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive patient form validation
 */
export function validatePatientForm(data: {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
}): PatientValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.email) errors.push('Email là bắt buộc');
  if (!data.firstName) errors.push('Họ là bắt buộc');
  if (!data.lastName) errors.push('Tên là bắt buộc');

  // Date of birth validation
  if (data.dateOfBirth) {
    const dobError = validatePatientDateOfBirth(
      data.dateOfBirth,
      data.emergencyContactPhone
    );
    if (dobError) {
      errors.push(dobError);
    }

    // Check if emergency contact info is complete for minors
    const age = calculateAge(data.dateOfBirth);
    if (age < PATIENT_AGE_RULES.EMERGENCY_CONTACT_REQUIRED_AGE) {
      if (!data.emergencyContactName || data.emergencyContactName.trim() === '') {
        warnings.push('Nên nhập tên người giám hộ cho bệnh nhân dưới 16 tuổi');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
