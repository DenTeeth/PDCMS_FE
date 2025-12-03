/**
 * Tooth Status Service - API V1
 * Handles API calls for tooth status management (Trạng thái răng - Odontogram)
 * 
 * APIs:
 * - API 8.9: GET /api/v1/patients/{patientId}/tooth-status
 * - API 8.10: PUT /api/v1/patients/{patientId}/tooth-status
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse, createApiError } from '@/utils/apiResponse';
import {
  ToothStatusResponse,
  UpdateToothStatusRequest,
} from '@/types/clinicalRecord';

const api = apiClient.getAxiosInstance();

// ============================================================================
// Service
// ============================================================================

export const toothStatusService = {
  /**
   * API 8.9: GET /api/v1/patients/{patientId}/tooth-status
   * Get all tooth statuses for a patient (Odontogram data)
   * 
   * Authorization:
   * - ROLE_ADMIN: Full access
   * - VIEW_PATIENT: View patient tooth status (Doctor, Nurse, Receptionist)
   * 
   * Returns:
   * - 200 OK: Array of tooth statuses (empty array if no abnormal conditions)
   * - 400 BAD_REQUEST: Patient not found
   * - 403 FORBIDDEN: Access denied
   * 
   * Note: Only teeth with abnormal conditions are returned.
   * Teeth not in the response are considered HEALTHY.
   */
  getToothStatus: async (patientId: number): Promise<ToothStatusResponse[]> => {
    try {
      const response = await api.get<ToothStatusResponse[]>(
        `/patients/${patientId}/tooth-status`
      );
      
      console.log('🦷 [TOOTH STATUS] Get tooth status:', {
        patientId,
        count: Array.isArray(response.data) ? response.data.length : 0,
      });
      
      const data = extractApiResponse(response) || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/patients/${patientId}/tooth-status`,
        method: 'GET',
      });
      
      console.error('❌ [TOOTH STATUS] Error fetching tooth status:', {
        patientId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.10: PUT /api/v1/patients/{patientId}/tooth-status
   * Update tooth status for a patient
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Admin)
   * 
   * Business Rules:
   * - If tooth status already exists, it will be updated
   * - If tooth status doesn't exist, it will be created
   * - If status is HEALTHY, the record will be deleted (tooth returns to healthy state)
   * 
   * Returns:
   * - 200 OK: Tooth status updated successfully
   * - 400 BAD_REQUEST: Patient not found or validation error
   * - 403 FORBIDDEN: Access denied
   * 
   * Note: According to documentation, endpoint is PUT /api/v1/patients/{patientId}/tooth-status
   * The toothNumber should be in the request body, not in the path.
   */
  updateToothStatus: async (
    patientId: number,
    request: UpdateToothStatusRequest
  ): Promise<ToothStatusResponse> => {
    try {
      // According to API 8.10 documentation: PUT /api/v1/patients/{patientId}/tooth-status
      // toothNumber should be in the request body
      const response = await api.put<ToothStatusResponse>(
        `/patients/${patientId}/tooth-status`,
        {
          toothNumber: request.toothNumber,
          status: request.status,
          notes: request.notes,
        }
      );
      
      console.log('✅ [TOOTH STATUS] Updated tooth status:', {
        patientId,
        toothNumber: request.toothNumber,
        status: request.status,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/patients/${patientId}/tooth-status`,
        method: 'PUT',
      });
      
      console.error('❌ [TOOTH STATUS] Error updating tooth status:', {
        patientId,
        toothNumber: request.toothNumber,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },
};

export default toothStatusService;

