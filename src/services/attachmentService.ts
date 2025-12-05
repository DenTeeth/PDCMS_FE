/**
 * Attachment Service - API V1
 * Handles API calls for clinical record attachments (File đính kèm)
 * 
 * APIs:
 * - API 8.11: POST /api/v1/clinical-records/{recordId}/attachments
 * - API 8.12: GET /api/v1/clinical-records/{recordId}/attachments
 * - API 8.13: DELETE /api/v1/attachments/{attachmentId}
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse, createApiError } from '@/utils/apiResponse';
import {
  AttachmentResponse,
  AttachmentType,
} from '@/types/clinicalRecord';

const api = apiClient.getAxiosInstance();

// ============================================================================
// Request Types
// ============================================================================

export interface UploadAttachmentRequest {
  file: File;
  attachmentType: AttachmentType;
}

// ============================================================================
// Service
// ============================================================================

export const attachmentService = {
  /**
   * API 8.11: POST /api/v1/clinical-records/{recordId}/attachments
   * Upload an attachment to a clinical record
   * 
   * Authorization: UPLOAD_ATTACHMENT (Doctor, Admin)
   * 
   * Content-Type: multipart/form-data
   * 
   * Returns:
   * - 201 CREATED: Attachment uploaded successfully
   * - 404 NOT_FOUND: Clinical record not found
   * - 400 BAD_REQUEST: Invalid file or validation error
   * - 403 FORBIDDEN: Access denied
   */
  upload: async (
    recordId: number,
    file: File,
    attachmentType: AttachmentType
  ): Promise<AttachmentResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachmentType', attachmentType);
      
      const response = await api.post<AttachmentResponse>(
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
        fileType: attachmentType,
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
        fileSize: file.size,
        fileType: attachmentType,
        message: enhancedError.message,
        status: enhancedError.status,
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 8.12: GET /api/v1/clinical-records/{recordId}/attachments
   * Get all attachments for a clinical record
   * 
   * Authorization:
   * - ROLE_ADMIN: Full access
   * - VIEW_ATTACHMENT: View attachments (Doctor, Admin)
   * 
   * Returns:
   * - 200 OK: Array of attachments (empty array if none)
   * - 404 NOT_FOUND: Clinical record not found
   * - 403 FORBIDDEN: Access denied
   */
  getAttachments: async (recordId: number): Promise<AttachmentResponse[]> => {
    try {
      const response = await api.get<AttachmentResponse[]>(
        `/clinical-records/${recordId}/attachments`
      );
      
      console.log('� [ATTACHMENT] Get attachments:', {
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
   * Delete an attachment
   * 
   * Authorization: DELETE_ATTACHMENT (Doctor, Admin)
   * 
   * Returns:
   * - 200 OK: Attachment deleted successfully
   * - 404 NOT_FOUND: Attachment not found
   * - 403 FORBIDDEN: Access denied
   */
  delete: async (attachmentId: number): Promise<void> => {
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
        errorCode: error.response?.data?.errorCode,
      });
      
      throw enhancedError;
    }
  },
};

export default attachmentService;

