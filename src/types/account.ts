/**
 * Account Types
 * Types for account-related data structures
 */

export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  accountStatus: string;
  roles: string[];
  
  // Personal info
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  specializationName?: string; // Single specialization (legacy)
  specializationNames?: string[]; // List of specializations (preferred)
  
  // Meta info
  createdAt?: string;
}

