/**
 * Patient Service
 * 
 * Based on API_DOCUMENTATION.md - Section 3: Patient Management APIs
 * Last updated: October 9, 2025
 */

import { apiClient } from '@/lib/api';
import {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientQueryParams,
  PaginatedPatientResponse
} from '@/types/patient';

/**
 * Patient Service Class
 * Handles all patient-related API operations
 */
class PatientService {
  private readonly endpoint = '/patients';

  /**
   * Fetch all patients with pagination and filters
   * @param params Query parameters (page, size, sortBy, sortDirection, search, isActive)
   * @returns Paginated list of patients
   */
  async getPatients(params: PatientQueryParams = {}): Promise<PaginatedPatientResponse> {
    const {
      page = 0,
      size = 12,
      sortBy = 'patientCode',
      sortDirection = 'ASC',
      ...filters
    } = params;

    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ statusCode: number; message: string; data: PaginatedPatientResponse }>(`${this.endpoint}/admin/all`, {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
        ...filters
      }
    });

    return response.data.data; // Extract data from nested response
  }

  /**
   * Fetch a single patient by code
   * @param patientCode Unique patient code (e.g., "PT001")
   * @returns Patient details
   */
  async getPatientByCode(patientCode: string): Promise<Patient> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get<{ statusCode: number; message: string; data: Patient }>(`${this.endpoint}/admin/${patientCode}`);
    return response.data.data;
  }

  /**
   * Create a new patient (with or without account)
   * If username/password/email provided → creates account (patient can login)
   * If not → simple patient record (cannot login)
   * 
   * @param data Patient creation data
   * @returns Created patient
   */
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post<Patient>(this.endpoint, data);
    return response.data;
  }

  /**
   * Update an existing patient (PATCH - partial update)
   * @param patientCode Patient code to update
   * @param data Updated patient data (only fields to change)
   * @returns Updated patient
   */
  async updatePatient(patientCode: string, data: UpdatePatientRequest): Promise<Patient> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.patch<Patient>(`${this.endpoint}/${patientCode}`, data);
    return response.data;
  }

  /**
   * Delete a patient (soft delete - marks as inactive)
   * @param patientCode Patient code to delete
   * @returns Success message
   */
  async deletePatient(patientCode: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.delete<{ message: string }>(`${this.endpoint}/${patientCode}`);
    return response.data;
  }
}

// Export singleton instance
export const patientService = new PatientService();
