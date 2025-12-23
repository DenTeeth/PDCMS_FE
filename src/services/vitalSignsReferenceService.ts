/**
 * Vital Signs Reference Service
 * Handles API calls for vital signs reference ranges
 * 
 * APIs:
 * - GET /api/v1/vital-signs-reference - Get all active reference ranges
 * - GET /api/v1/vital-signs-reference/by-age/{age} - Get reference ranges by age
 */

import { apiClient } from '@/lib/api';
import { VitalSignsReferenceResponse } from '@/types/clinicalRecord';

const api = apiClient.getAxiosInstance();
const BASE_URL = '/vital-signs-reference';

export const vitalSignsReferenceService = {
  /**
   * Get all active vital signs reference ranges
   * GET /api/v1/vital-signs-reference
   * 
   * Required Permission: VIEW_VITAL_SIGNS_REFERENCE or WRITE_CLINICAL_RECORD
   * 
   * @returns List of all active reference ranges
   */
  getAllActiveReferences: async (): Promise<VitalSignsReferenceResponse[]> => {
    const response = await api.get<VitalSignsReferenceResponse[]>(BASE_URL);
    return response.data;
  },

  /**
   * Get vital signs reference ranges by patient age
   * GET /api/v1/vital-signs-reference/by-age/{age}
   * 
   * Required Permission: VIEW_VITAL_SIGNS_REFERENCE or WRITE_CLINICAL_RECORD
   * 
   * @param age Patient age in years
   * @returns List of reference ranges applicable for the given age
   */
  getReferencesByAge: async (age: number): Promise<VitalSignsReferenceResponse[]> => {
    const response = await api.get<VitalSignsReferenceResponse[]>(`${BASE_URL}/by-age/${age}`);
    return response.data;
  },
};

