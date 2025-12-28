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
 * - API 8.7: GET /api/v1/clinical-records/procedures/{procedureId}/materials
 * - API 8.8: PUT /api/v1/clinical-records/procedures/{procedureId}/materials
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
  PrescriptionDTO,
  SavePrescriptionRequest,
  AttachmentResponse,
  AttachmentType,
  UploadAttachmentResponse,
  ProcedureMaterialsResponse,
  UpdateProcedureMaterialsRequest,
  UpdateProcedureMaterialsResponse,
  UpdateMaterialQuantityRequest,
  UpdateMaterialQuantityResponse,
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
   * - 200 OK with record data: Clinical record found
   * - 200 OK with null/empty body: No clinical record exists (frontend shows CREATE form)
   * - 404 APPOINTMENT_NOT_FOUND: Appointment doesn't exist
   * - 403 FORBIDDEN: Access denied
   * 
   * Note: BE now returns HTTP 200 with null/empty body instead of 404 when no record exists
   * (Issue #37 fix - allows retroactive creation for COMPLETED appointments)
   */
  getByAppointmentId: async (appointmentId: number): Promise<ClinicalRecordResponse | null> => {
    try {
      const response = await api.get<ClinicalRecordResponse | null>(
        `/appointments/${appointmentId}/clinical-record`
      );
      
      // Handle empty response (Content-Length: 0) or null data
      // BE returns HTTP 200 with null/empty body when no record exists
      const record = extractApiResponse(response) || response.data;
      
      // If response is null, undefined, or empty, return null (no record exists)
      if (!record) {
        console.log(' [CLINICAL RECORD] No record found for appointment ID:', appointmentId);
        return null;
      }
      
      console.log(' [CLINICAL RECORD] Get by appointment ID:', {
        appointmentId,
        clinicalRecordId: record?.clinicalRecordId,
        hasFollowUpDate: !!record?.followUpDate,
        followUpDate: record?.followUpDate,
      });
      
      return record;
    } catch (error: any) {
      // Only throw error for actual errors (404 for appointment not found, 403 for access denied, etc.)
      // Not for missing clinical record (which now returns 200 with null)
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/${appointmentId}/clinical-record`,
        method: 'GET',
      });
      
      console.error(' [CLINICAL RECORD] Error fetching clinical record:', {
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
   * - 400 BAD_REQUEST: Validation error
   * - 404 NOT_FOUND: Appointment not found
   * 
   * Note: BE now allows creation for all appointment statuses (Issue #37 fix)
   * Previously only allowed IN_PROGRESS or CHECKED_IN, now supports retroactive creation
   */
  create: async (
    request: CreateClinicalRecordRequest
  ): Promise<CreateClinicalRecordResponse> => {
    try {
      const response = await api.post<CreateClinicalRecordResponse>(
        '/clinical-records',
        request
      );
      
      console.log(' [CLINICAL RECORD] Created:', {
        clinicalRecordId: response.data?.clinicalRecordId,
        appointmentId: request.appointmentId,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: '/clinical-records',
        method: 'POST',
      });
      
      console.error(' [CLINICAL RECORD] Error creating clinical record:', {
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
      
      console.log(' [CLINICAL RECORD] Updated:', {
        clinicalRecordId: recordId,
        updatedAt: response.data?.updatedAt,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/${recordId}`,
        method: 'PUT',
      });
      
      console.error(' [CLINICAL RECORD] Error updating clinical record:', {
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
      
      console.log(' [PROCEDURES] Get procedures:', {
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
      
      console.error(' [PROCEDURES] Error fetching procedures:', {
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
      
      console.log(' [PROCEDURES] Added procedure:', {
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
      
      console.error(' [PROCEDURES] Error adding procedure:', {
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
      
      console.log(' [PROCEDURES] Updated procedure:', {
        procedureId,
        recordId,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/procedures/${procedureId}`,
        method: 'PUT',
      });
      
      console.error(' [PROCEDURES] Error updating procedure:', {
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
      
      console.log(' [PROCEDURES] Deleted procedure:', {
        procedureId,
        recordId,
      });
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/procedures/${procedureId}`,
        method: 'DELETE',
      });
      
      console.error(' [PROCEDURES] Error deleting procedure:', {
        procedureId,
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  // ============================================================================
  // Prescription APIs (API 8.14, 8.15, 8.16)
  // ============================================================================

  /**
   * API 8.14: GET /api/v1/appointments/clinical-records/{recordId}/prescription
   * Get prescription for a clinical record
   * 
   * Authorization:
   * - ROLE_ADMIN: Full access
   * - VIEW_APPOINTMENT_ALL: Access all records
   * - VIEW_APPOINTMENT_OWN: Access only related records
   * 
   * Returns:
   * - 200 OK: Prescription found with all items
   * - 404 PRESCRIPTION_NOT_FOUND: No prescription created yet
   * - 404 RECORD_NOT_FOUND: Clinical record doesn't exist
   */
  getPrescription: async (recordId: number): Promise<PrescriptionDTO> => {
    try {
      const response = await api.get<PrescriptionDTO>(
        `/appointments/clinical-records/${recordId}/prescription`
      );
      
      console.log(' [PRESCRIPTION] Get prescription:', {
        recordId,
        prescriptionId: response.data?.prescriptionId,
        itemsCount: response.data?.items?.length || 0,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/prescription`,
        method: 'GET',
      });
      
      // 404 is expected when no prescription exists yet - don't log as error
      if (error.response?.status === 404) {
        console.log(' [PRESCRIPTION] No prescription found (expected):', {
          recordId,
          status: 404,
        });
      } else {
        // Log other errors as actual errors
        console.error(' [PRESCRIPTION] Error fetching prescription:', {
          recordId,
          message: enhancedError.message,
          status: enhancedError.status,
          errorCode: error.response?.data?.errorCode,
        });
      }
      
      throw enhancedError;
    }
  },

  /**
   * API 8.15: POST /api/v1/appointments/clinical-records/{recordId}/prescription
   * Save prescription (Create/Update with Replace Strategy)
   * 
   * Replace Strategy:
   * - If prescription exists: Updates notes and replaces all items
   * - If prescription doesn't exist: Creates new prescription with items
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Assistant, Admin)
   * 
   * Business Rules:
   * - items: Must contain at least one item (use DELETE API to remove prescription)
   * - itemName: Required for all items
   * - itemMasterId: Optional (NULL for medications not in inventory)
   * 
   * Returns:
   * - 200 OK: Prescription saved successfully
   * - 404 RECORD_NOT_FOUND: Clinical record doesn't exist
   * - 404 ITEM_NOT_FOUND: itemMasterId doesn't exist in warehouse
   * - 400 VALIDATION_ERROR: Empty items array or invalid field values
   */
  savePrescription: async (
    recordId: number,
    request: SavePrescriptionRequest
  ): Promise<PrescriptionDTO> => {
    try {
      const response = await api.post<PrescriptionDTO>(
        `/appointments/clinical-records/${recordId}/prescription`,
        request
      );
      
      console.log(' [PRESCRIPTION] Saved prescription:', {
        recordId,
        prescriptionId: response.data?.prescriptionId,
        itemsCount: request.items.length,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/prescription`,
        method: 'POST',
      });
      
      console.error(' [PRESCRIPTION] Error saving prescription:', {
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.16: DELETE /api/v1/appointments/clinical-records/{recordId}/prescription
   * Delete prescription for a clinical record
   * 
   * Authorization: WRITE_CLINICAL_RECORD (Doctor, Assistant, Admin)
   * 
   * Returns:
   * - 204 NO_CONTENT: Prescription deleted successfully
   * - 404 NOT_FOUND: Prescription or clinical record not found
   */
  deletePrescription: async (recordId: number): Promise<void> => {
    try {
      await api.delete(
        `/appointments/clinical-records/${recordId}/prescription`
      );
      
      console.log(' [PRESCRIPTION] Deleted prescription:', {
        recordId,
      });
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/appointments/clinical-records/${recordId}/prescription`,
        method: 'DELETE',
      });
      
      console.error(' [PRESCRIPTION] Error deleting prescription:', {
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  // ============================================================================
  // Attachment APIs (API 8.11, 8.12, 8.13)
  // ============================================================================

  /**
   * API 8.11: POST /api/v1/clinical-records/{recordId}/attachments
   * Upload attachment to clinical record
   * 
   * Authorization: UPLOAD_ATTACHMENT (Doctor, Assistant, Admin)
   * 
   * File Validation:
   * - Max size: 10 MB
   * - Allowed types: JPEG, PNG, GIF, PDF
   * 
   * Returns:
   * - 201 CREATED: File uploaded successfully
   * - 400 BAD_REQUEST: Invalid file (size/type)
   * - 404 RECORD_NOT_FOUND: Clinical record doesn't exist
   */
  uploadAttachment: async (
    recordId: number,
    file: File,
    attachmentType: AttachmentType,
    description?: string
  ): Promise<UploadAttachmentResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachmentType', attachmentType);
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post<UploadAttachmentResponse>(
        `/clinical-records/${recordId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log(' [ATTACHMENT] Uploaded attachment:', {
        attachmentId: response.data?.attachmentId,
        recordId,
        fileName: file.name,
        attachmentType,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/${recordId}/attachments`,
        method: 'POST',
      });
      
      console.error(' [ATTACHMENT] Error uploading attachment:', {
        recordId,
        fileName: file.name,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.12: GET /api/v1/clinical-records/{recordId}/attachments
   * Get all attachments for a clinical record
   * 
   * Authorization: VIEW_ATTACHMENT (Doctor, Nurse, Admin, Patient)
   * 
   * Returns:
   * - 200 OK: List of attachments (empty array if none)
   * - 404 RECORD_NOT_FOUND: Clinical record doesn't exist
   */
  getAttachments: async (recordId: number): Promise<AttachmentResponse[]> => {
    try {
      const response = await api.get<AttachmentResponse[]>(
        `/clinical-records/${recordId}/attachments`
      );
      
      console.log(' [ATTACHMENT] Get attachments:', {
        recordId,
        count: Array.isArray(response.data) ? response.data.length : 0,
      });
      
      const data = extractApiResponse(response) || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/${recordId}/attachments`,
        method: 'GET',
      });
      
      console.error(' [ATTACHMENT] Error fetching attachments:', {
        recordId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.13: DELETE /api/v1/attachments/{attachmentId}
   * Delete attachment
   * 
   * Authorization: DELETE_ATTACHMENT (Doctor, Assistant, Admin)
   * Business Rule: Can only delete own uploads (except Admin)
   * 
   * Returns:
   * - 204 NO_CONTENT: Attachment deleted successfully
   * - 404 ATTACHMENT_NOT_FOUND: Attachment doesn't exist
   * - 403 DELETE_DENIED: Not the uploader (non-admin)
   */
  deleteAttachment: async (attachmentId: number): Promise<void> => {
    try {
      await api.delete(`/attachments/${attachmentId}`);
      
      console.log(' [ATTACHMENT] Deleted attachment:', {
        attachmentId,
      });
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/attachments/${attachmentId}`,
        method: 'DELETE',
      });
      
      console.error(' [ATTACHMENT] Error deleting attachment:', {
        attachmentId,
        message: enhancedError.message,
        status: enhancedError.status,
      });
      
      throw enhancedError;
    }
  },

  // ============================================================================
  // Procedure Materials APIs (API 8.7, 8.8)
  // ============================================================================

  /**
   * API 8.7: GET /api/v1/clinical-records/procedures/{procedureId}/materials
   * Get all materials used in a specific procedure with planned/actual/variance quantities
   * 
   * Authorization: VIEW_APPOINTMENT_ALL, VIEW_APPOINTMENT_OWN, or WRITE_CLINICAL_RECORD
   * Note: VIEW_CLINICAL_RECORD permission does not exist in seed data.
   * BE should use VIEW_APPOINTMENT_* permissions (consistent with other clinical record APIs).
   * Cost data: Only visible if user has VIEW_WAREHOUSE_COST permission
   * 
   * Returns:
   * - 200 OK: Procedure materials with all details
   * - 404 NOT_FOUND: Procedure not found
   * - 403 FORBIDDEN: Access denied
   */
  getProcedureMaterials: async (procedureId: number): Promise<ProcedureMaterialsResponse> => {
    try {
      const response = await api.get<ProcedureMaterialsResponse>(
        `/clinical-records/procedures/${procedureId}/materials`
      );
      
      console.log(' [PROCEDURE MATERIALS] Get materials:', {
        procedureId,
        materialsCount: response.data?.materials?.length || 0,
        materialsDeducted: response.data?.materialsDeducted,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/procedures/${procedureId}/materials`,
        method: 'GET',
      });
      
      console.error(' [PROCEDURE MATERIALS] Error fetching materials:', {
        procedureId,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.8: PUT /api/v1/clinical-records/procedures/{procedureId}/materials
   * Update actual material quantities used during procedure
   * 
   * Authorization: WRITE_CLINICAL_RECORD
   * Business Rule: Adjusts warehouse stock if actual differs from planned
   * 
   * Returns:
   * - 200 OK: Materials updated successfully with stock adjustments
   * - 404 NOT_FOUND: Procedure not found
   * - 400 BAD_REQUEST: Validation error (invalid quantity, etc.)
   * - 403 FORBIDDEN: Access denied
   */
  updateProcedureMaterials: async (
    procedureId: number,
    request: UpdateProcedureMaterialsRequest
  ): Promise<UpdateProcedureMaterialsResponse> => {
    try {
      const response = await api.put<UpdateProcedureMaterialsResponse>(
        `/clinical-records/procedures/${procedureId}/materials`,
        request
      );
      
      console.log(' [PROCEDURE MATERIALS] Updated materials:', {
        procedureId,
        materialsUpdated: response.data?.materialsUpdated,
        stockAdjustmentsCount: response.data?.stockAdjustments?.length || 0,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/procedures/${procedureId}/materials`,
        method: 'PUT',
      });
      
      console.error(' [PROCEDURE MATERIALS] Error updating materials:', {
        procedureId,
        materialsCount: request.materials.length,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.9: PATCH /api/v1/clinical-records/procedures/{procedureId}/materials/{usageId}/quantity
   * Update editable quantity BEFORE warehouse deduction
   * 
   * Authorization: WRITE_CLINICAL_RECORD
   * Business Rule: Can only edit quantity before materials are deducted (materialsDeducted = false)
   * 
   * Returns:
   * - 200 OK: Material quantity updated successfully
   * - 400 BAD_REQUEST: Cannot update after deduction or invalid quantity
   * - 404 NOT_FOUND: Procedure or usage record not found
   * - 403 FORBIDDEN: Access denied
   */
  updateMaterialQuantity: async (
    procedureId: number,
    usageId: number,
    request: { usageId: number; quantity: number }
  ): Promise<ProcedureMaterialItem> => {
    try {
      const response = await api.patch<ProcedureMaterialItem>(
        `/clinical-records/procedures/${procedureId}/materials/${usageId}/quantity`,
        request
      );
      
      console.log(' [PROCEDURE MATERIALS] Updated quantity:', {
        procedureId,
        usageId,
        newQuantity: request.quantity,
      });
      
      return extractApiResponse(response) || response.data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/clinical-records/procedures/${procedureId}/materials/${usageId}/quantity`,
        method: 'PATCH',
      });
      
      console.error(' [PROCEDURE MATERIALS] Error updating quantity:', {
        procedureId,
        usageId,
        quantity: request.quantity,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },
};

export default clinicalRecordService;

