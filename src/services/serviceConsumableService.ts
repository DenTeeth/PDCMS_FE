/**
 * Service Consumable Service - API 6.17
 * Backend: http://localhost:8080/api/v1/warehouse/consumables
 * Authentication: Bearer Token required
 */

import { apiClient } from '@/lib/api';
import { extractApiResponse, createApiError } from '@/utils/apiResponse';
import {
  ServiceConsumablesResponse,
} from '@/types/serviceConsumable';

const axios = apiClient.getAxiosInstance();

export const serviceConsumableService = {
  /**
   * API 6.17 - GET /api/v1/warehouse/consumables/services/{serviceId}
   * Get consumable items (Bill of Materials) required for a service
   * with real-time stock availability and cost information
   * 
   * RBAC: Price fields (unitPrice, totalCost, totalConsumableCost) are
   * conditionally returned based on VIEW_WAREHOUSE_COST permission
   */
  getServiceConsumables: async (
    serviceId: number
  ): Promise<ServiceConsumablesResponse> => {
    try {
      const response = await axios.get(
        `/warehouse/consumables/services/${serviceId}`
      );
      
      console.log('Service Consumables API Response:', response.data);
      
      // Handle both response formats
      const data = extractApiResponse(response);
      
      if (!data) {
        throw new Error('Invalid response from service consumables API');
      }
      
      return data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/warehouse/consumables/services/${serviceId}`,
        method: 'GET',
      });
      
      console.error('❌ Error fetching service consumables:', {
        serviceId,
        message: enhancedError.message,
        status: enhancedError.status,
        endpoint: enhancedError.endpoint,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },
};

export default serviceConsumableService;

