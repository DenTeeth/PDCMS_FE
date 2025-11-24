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
  createdAt: string;
  updatedAt?: string;
}

/**
 * Request payload for creating a new patient WITH account
 * Patient can login to system
 */
export interface CreatePatientWithAccountRequest {
  username: string;
  password: string;
  email: string;
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
