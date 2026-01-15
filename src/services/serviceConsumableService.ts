

import { apiClient } from '@/lib/api';
import { extractApiResponse, createApiError } from '@/utils/apiResponse';
import {
  ServiceConsumablesResponse,
} from '@/types/serviceConsumable';

const axios = apiClient.getAxiosInstance();

export const serviceConsumableService = {

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
        throw new Error('Phản hồi không hợp lệ từ API vật tư tiêu hao dịch vụ');
      }
      
      return data;
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `/warehouse/consumables/services/${serviceId}`,
        method: 'GET',
      });
      
      console.error(' Error fetching service consumables:', {
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

