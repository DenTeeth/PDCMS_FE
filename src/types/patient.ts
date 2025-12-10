/**
 * Patient Type Definitions
 * 
 * Based on API_DOCUMENTATION.md - Section 3: Patient Management APIs
 * Last updated: October 9, 2025
 */

import { PaginatedResponse } from './employee';

/**
 * Patient entity returned from API
 */
export interface Patient {
  patientId: string;
  patientCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  hasAccount: boolean;
  accountStatus?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'LOCKED' | 'INACTIVE'; // Account verification status (BE: 2025-01-25)
  // Blacklist fields (BE: 2025-12-10)
  // Booking Block Status (Updated: Dec 10, 2025 - BE refactored)
  isBookingBlocked?: boolean;
  bookingBlockReason?: string | null; // Enum: BookingBlockReason
  bookingBlockNotes?: string | null;
  blockedBy?: string | null;
  blockedAt?: string | null;
  consecutiveNoShows?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request payload for creating a new patient WITH account
 * Patient can login to system
 * 
 * NOTE (2025-01-26): BE automatically creates account when email is provided
 * - username: Optional (BE auto-generates from email if not provided)
 * - password: NOT REQUIRED (BE generates temporary password, patient sets via email)
 * - email: Required to create account (BE sends password setup email)
 */
export interface CreatePatientWithAccountRequest {
  username?: string; // Optional - BE auto-generates from email if not provided
  email: string; // Required - BE uses this to create account and send password setup email
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

/**
 * Request payload for creating a new patient WITHOUT account
 * Simple patient record (cannot login)
 */
export interface CreatePatientWithoutAccountRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

/**
 * Union type for creating patient (with or without account)
 */
export type CreatePatientRequest = CreatePatientWithAccountRequest | CreatePatientWithoutAccountRequest;

/**
 * Request payload for updating patient (PATCH - partial update)
 * All fields are optional for partial updates
 * NOTE: Account fields (username, password) are NOT supported in update endpoint
 * Account can only be created when creating patient, not updated separately
 * Email is part of patient record, not account
 */
export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive?: boolean;
  isBookingBlocked?: boolean;
  bookingBlockReason?: string;
  bookingBlockNotes?: string;
}

/**
 * Query parameters for fetching patients
 */
export interface PatientQueryParams {
  page?: number;
  size?: number;
  sortBy?: 'patientCode' | 'firstName' | 'lastName' | 'createdAt';
  sortDirection?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

/**
 * Export PaginatedResponse for convenience
 */
export type PaginatedPatientResponse = PaginatedResponse<Patient>;
