/**
 * Clinical Record Service - API V1
 * Handles API calls for clinical records management (Bệnh án)
 * 
 * APIs:
 * - API 8.1: GET /api/v1/appointments/{appointmentId}/clinical-record
 * - API 8.2: POST /api/v1/clinical-records
 * - API 8.3: PUT /api/v1/clinical-records/{recordId}
 * - API 8.4: GET /api/v1/appointments/clinical-records/{recordId}/procedures
 * - API 8.5: POST /api/v1/appointments/clinical-records/{recordId}/procedures
 * - API 8.6: PUT /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}
 * - API 8.7: DELETE /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse, createApiError } from '@/utils/apiResponse';
import {
  ClinicalRecordResponse,
  CreateClinicalRecordRequest,
  UpdateClinicalRecordRequest,
  ProcedureDTO,
  AddProcedureRequest,
  UpdateProcedureRequest,
} from '@/types/clinicalRecord';

const api = apiClient.getAxiosInstance();

// ============================================================================
// Response Types
// ============================================================================

export interface CreateClinicalRecordResponse {
  clinicalRecordId: number;
  appointmentId: number;
  createdAt: string;
}

export interface UpdateClinicalRecordResponse {
  clinicalRecordId: number;
  updatedAt: string;
  examinationFindings?: string;
  treatmentNotes?: string;
  followUpDate?: string;
}

export interface AddProcedureResponse {
  procedureId: number;
  clinicalRecordId: number;
  serviceId: number;
  serviceName: string;
  serviceCode: string;
  patientPlanItemId?: number;
  toothNumber?: string;
  procedureDescription: string;
  notes?: string;
  createdAt: string;
}

export interface UpdateProcedureResponse {
  procedureId: number;
  clinicalRecordId: number;
  serviceId?: number;
  serviceName?: string;
  serviceCode?: string;
  toothNumber?: string;
  procedureDescription?: string;
  notes?: string;
  updatedAt: string;
}

// ============================================================================
// Service
// ============================================================================

export const clinicalRecordService = {
  /**
   * API 8.1: GET /api/v1/appointments/{appointmentId}/clinical-record
   * Get clinical record for an appointment
   * 
   * Authorization:
   * - ROLE_ADMIN: Full access
   * - VIEW_APPOINTMENT_ALL: Access all records
   * - VIEW_APPOINTMENT_OWN: Access only related records
   * 
   * Returns:
   * - 200 OK: Clinical record found
   * - 404 RECORD_NOT_FOUND: No clinical record (frontend shows CREATE form)
   * - 404 APPOINTMENT_NOT_FOUND: Appointment doesn't exist
   * - 403 FORBIDDEN: Access denied
   */
  getByAppointmentId: async (appointmentId: number): Promise<ClinicalRecordResponse> => {
    try {
      const response = await api.get<ClinicalRecordResponse>(
        `/appointments/${appointmentId}/clinical-record`
      );
      
      const record = extractApiResponse(response) || response.data;
      
      console.log('📋 [CLINICAL RECORD] Get by appointment ID:', {
        appointmentId,
        clinicalRecordId: record?.clinicalRecordId,
        hasFollowUpDate: !!record?.followUpDate,
        followUpDate: record?.followUpDate,
      });
      
      return record;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/${appointmentId}/clinical-record`,
        method: 'GET',
      });
      
      console.error('❌ [CLINICAL RECORD] Error fetching clinical record:', {
        appointmentId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.2: POST /api/v1/clinical-records
   * Create a new clinical record
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Admin)
   * 
   * Returns:
   * - 201 CREATED: Clinical record created successfully
   * - 409 CONFLICT: Record already exists for this appointment
   * - 400 BAD_REQUEST: Invalid appointment status or validation error
   * - 404 NOT_FOUND: Appointment not found
   */
  create: async (
    request: CreateClinicalRecordRequest
  ): Promise<CreateClinicalRecordResponse> => {
    try {
      const response = await api.post<CreateClinicalRecordResponse>(
        '/clinical-records',
        request
      );
      
      console.log('✅ [CLINICAL RECORD] Created:', {
        clinicalRecordId: response.data?.clinicalRecordId,
        appointmentId: request.appointmentId,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: '/clinical-records',
        method: 'POST',
      });
      
      console.error('❌ [CLINICAL RECORD] Error creating clinical record:', {
        appointmentId: request.appointmentId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
        conflict: error.response?.status === 409,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.3: PUT /api/v1/clinical-records/{recordId}
   * Update an existing clinical record
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Admin)
   * 
   * Note: Partial update - only provided fields are updated
   * Immutable fields: appointmentId, chiefComplaint, diagnosis
   * 
   * Returns:
   * - 200 OK: Clinical record updated successfully
   * - 404 NOT_FOUND: Record not found
   * - 400 BAD_REQUEST: Validation error
   */
  update: async (
    recordId: number,
    request: UpdateClinicalRecordRequest
  ): Promise<UpdateClinicalRecordResponse> => {
    try {
      const response = await api.put<UpdateClinicalRecordResponse>(
        `/clinical-records/${recordId}`,
        request
      );
      
      console.log('✅ [CLINICAL RECORD] Updated:', {
        clinicalRecordId: recordId,
        updatedAt: response.data?.updatedAt,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/${recordId}`,
        method: 'PUT',
      });
      
      console.error('❌ [CLINICAL RECORD] Error updating clinical record:', {
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.4: GET /api/v1/appointments/clinical-records/{recordId}/procedures
   * Get all procedures for a clinical record
   * 
   * Authorization:
   * - ROLE_ADMIN: Full access
   * - VIEW_APPOINTMENT_ALL: Access all records
   * - VIEW_APPOINTMENT_OWN: Access only related records
   * 
   * Returns:
   * - 200 OK: List of procedures (empty array if none)
   * - 404 NOT_FOUND: Clinical record not found
   */
  getProcedures: async (recordId: number): Promise<ProcedureDTO[]> => {
    try {
      const response = await api.get<ProcedureDTO[]>(
        `/appointments/clinical-records/${recordId}/procedures`
      );
      
      console.log('📋 [PROCEDURES] Get procedures:', {
        recordId,
        count: Array.isArray(response.data) ? response.data.length : 0,
      });
      
      const data = extractApiResponse(response) || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/procedures`,
        method: 'GET',
      });
      
      console.error('❌ [PROCEDURES] Error fetching procedures:', {
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.5: POST /api/v1/appointments/clinical-records/{recordId}/procedures
   * Add a procedure to a clinical record
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Admin)
   * 
   * Returns:
   * - 201 CREATED: Procedure added successfully
   * - 404 NOT_FOUND: Clinical record or service not found
   * - 400 BAD_REQUEST: Validation error
   */
  addProcedure: async (
    recordId: number,
    request: AddProcedureRequest
  ): Promise<AddProcedureResponse> => {
    try {
      const response = await api.post<AddProcedureResponse>(
        `/appointments/clinical-records/${recordId}/procedures`,
        request
      );
      
      console.log('✅ [PROCEDURES] Added procedure:', {
        procedureId: response.data?.procedureId,
        recordId,
        serviceId: request.serviceId,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/procedures`,
        method: 'POST',
      });
      
      console.error('❌ [PROCEDURES] Error adding procedure:', {
        recordId,
        serviceId: request.serviceId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.6: PUT /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}
   * Update a procedure in a clinical record
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Admin)
   * 
   * Returns:
   * - 200 OK: Procedure updated successfully
   * - 404 NOT_FOUND: Procedure or clinical record not found
   * - 400 BAD_REQUEST: Validation error
   */
  updateProcedure: async (
    recordId: number,
    procedureId: number,
    request: UpdateProcedureRequest
  ): Promise<UpdateProcedureResponse> => {
    try {
      const response = await api.put<UpdateProcedureResponse>(
        `/appointments/clinical-records/${recordId}/procedures/${procedureId}`,
        request
      );
      
      console.log('✅ [PROCEDURES] Updated procedure:', {
        procedureId,
        recordId,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/procedures/${procedureId}`,
        method: 'PUT',
      });
      
      console.error('❌ [PROCEDURES] Error updating procedure:', {
        procedureId,
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.7: DELETE /api/v1/appointments/clinical-records/{recordId}/procedures/{procedureId}
   * Delete a procedure from a clinical record
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Admin)
   * 
   * Returns:
   * - 200 OK: Procedure deleted successfully
   * - 404 NOT_FOUND: Procedure or clinical record not found
   */
  deleteProcedure: async (
    recordId: number,
    procedureId: number
  ): Promise<void> => {
    try {
      await api.delete(
        `/appointments/clinical-records/${recordId}/procedures/${procedureId}`
      );
      
      console.log('✅ [PROCEDURES] Deleted procedure:', {
        procedureId,
        recordId,
      });
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/procedures/${procedureId}`,
        method: 'DELETE',
      });
      
      console.error('❌ [PROCEDURES] Error deleting procedure:', {
        procedureId,
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },
};

export default clinicalRecordService;

