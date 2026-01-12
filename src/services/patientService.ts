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
import { PaginatedResponse } from '@/types/employee';

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
    const response = await axiosInstance.get(`${this.endpoint}/admin/all`, {
      params: {
        page,
        size,
        sortBy,
        sortDirection,
        ...filters
      }
    });

    // BE có thể trả về trực tiếp hoặc wrapped trong { data }
    // Check if response has nested structure
    if (response.data?.data) {
      return response.data.data;
    }
    
    // Nếu BE trả về trực tiếp pagination object
    return response.data;
  }

  /**
   * Fetch a single patient by code
   * @param patientCode Unique patient code (e.g., "PT001")
   * @returns Patient details
   */
  async getPatientByCode(patientCode: string): Promise<Patient> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/admin/${patientCode}`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Get current patient profile (for logged-in patient)
   * GET /api/v1/patients/me/profile
   * @returns Patient details for current user
   */
  async getCurrentPatientProfile(): Promise<Patient> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.get(`${this.endpoint}/me/profile`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Create a new patient (with or without account)
   * If email provided → BE automatically creates account with PENDING_VERIFICATION status
   * If not → simple patient record (cannot login)
   * 
   * @param data Patient creation data
   * @returns Created patient
   */
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post(this.endpoint, data);
    
    // Log full response for debugging
    console.log('� Full BE Response:', {
      status: response.status,
      data: response.data,
      hasAccount: response.data?.hasAccount,
      accountStatus: response.data?.accountStatus,
      note: 'Nếu hasAccount/accountStatus là undefined → BE chưa trả về các field này',
    });
    
    if (response.data?.data) {
      return response.data.data;
    }
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
    const response = await axiosInstance.patch(`${this.endpoint}/${patientCode}`, data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Delete a patient (soft delete - marks as inactive)
   * @param patientCode Patient code to delete
   * @returns Success message
   */
  async deletePatient(patientCode: string): Promise<{ message: string }> {
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.delete(`${this.endpoint}/${patientCode}`);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Unban a blacklisted patient
   * @param patientId Patient ID to unban (can be string or number, will be converted to number)
   * @param reason Reason for unbanning (minimum 10 characters)
   * @returns Unban result with unban record
   */
  async unbanPatient(patientId: string | number, reason: string): Promise<{
    message: string;
    patientId: string;
    patientCode: string;
    unbanRecord: {
      id: number;
      unbannedBy: {
        employeeId: number;
        fullName: string;
        employeeCode: string;
      };
      unbannedAt: string;
      reason: string;
      previousNoShowCount: number;
    };
  }> {
    const axiosInstance = apiClient.getAxiosInstance();
    // Convert to number if string (API expects number)
    const patientIdNum = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
    const response = await axiosInstance.post(`${this.endpoint}/${patientIdNum}/unban`, { reason });
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Get unban history for a patient
   * @param patientId Patient ID (can be string or number, will be converted to number)
   * @param params Query parameters (page, size, sortBy, sortDir)
   * @returns Paginated list of unban records
   */
  async getUnbanHistory(
    patientId: string | number,
    params: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<{
    id: number;
    patientId: number;
    unbannedBy: {
      employeeId: number;
      fullName: string;
      employeeCode: string;
    };
    unbannedAt: string;
    reason: string;
    previousNoShowCount: number;
  }>> {
    const axiosInstance = apiClient.getAxiosInstance();
    // Convert to number if string (API expects number)
    const patientIdNum = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
    const response = await axiosInstance.get(`${this.endpoint}/${patientIdNum}/unban-history`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sortBy: params.sortBy ?? 'unbannedAt',
        sortDir: params.sortDir ?? 'desc',
      },
    });
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  /**
   * Search patients by name or phone
   * ⚠️ TEMPORARY WORKAROUND - BE endpoint /search does not exist yet
   * Using /admin/all with client-side filtering until BE implements proper search
   * TODO: Replace with direct /search call when BE adds endpoint
   * See: docs/api-guide/PATIENT_SEARCH_API_MISSING.md
   * 
   * @param params Query parameters (query string, size)
   * @returns Array of matching patients
   */
  async searchPatients(params: { query: string; size?: number }): Promise<Patient[]> {
    try {
      // ⚠️ WORKAROUND: Use /admin/all and filter client-side
      const axiosInstance = apiClient.getAxiosInstance();
      const response = await axiosInstance.get(`${this.endpoint}/admin/all`, {
        params: {
          page: 0,
          size: 100, // Fetch more to allow client-side filtering
          sortBy: 'patientCode',
          sortDirection: 'DESC'
        }
      });
      
      // Extract patients from paginated response
      const allPatients = response.data.content || response.data.data?.content || [];
      const query = params.query.toLowerCase().trim();
      
      // Client-side filtering by name or phone
      const filtered = allPatients.filter((p: Patient) => 
        p.fullName?.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query)
      );
      
      // Return up to specified size
      return filtered.slice(0, params.size || 10);
      
    } catch (error) {
      console.error('Patient search error (using workaround):', error);
      return [];
    }
  }

  /**
   * Get patient statistics (total, active, inactive counts)
   * GET /api/v1/patients/stats
   * @returns Patient stats with totalPatients, activePatients, inactivePatients
   */
  async getPatientStats(): Promise<{
    totalPatients: number;
    activePatients: number;
    inactivePatients: number;
  }> {
    try {
      const axiosInstance = apiClient.getAxiosInstance();
      const endpoint = `${this.endpoint}/stats`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Fetching patient stats from:', endpoint);
      }
      
      const response = await axiosInstance.get(endpoint);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Patient stats response:', response.data);
      }
      
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      // Log detailed error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to fetch patient stats:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          endpoint: `${this.endpoint}/stats`,
          message: error.message,
        });
      }
      // Re-throw to let caller handle (they have fallback logic)
      throw error;
    }
  }
}

// Export singleton instance
export const patientService = new PatientService();
