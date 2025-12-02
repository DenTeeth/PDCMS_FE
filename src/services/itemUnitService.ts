import { apiClient } from '@/lib/api';
import { extractApiResponse, extractErrorMessage, createApiError } from '@/utils/apiResponse';
import type { ItemUnitResponse, GetItemUnitsResponse, ConversionRequest, ConversionResponse } from '@/types/warehouse';

const api = apiClient.getAxiosInstance();
const BASE_PATH = '/warehouse/items';

export const itemUnitService = {
  /**
   * API 6.11 - GET /api/v1/warehouse/items/{itemMasterId}/units?status=active
   * Get unit hierarchy for an item (for dropdown selection in import/export forms)
   * 
   * @param itemMasterId - Item master ID
   * @param status - Filter units by status: 'active' (default), 'inactive', or 'all'
   * @returns GetItemUnitsResponse with itemMaster, baseUnit, and units array
   */
  getItemUnits: async (itemMasterId: number, status: 'active' | 'inactive' | 'all' = 'active'): Promise<GetItemUnitsResponse> => {
    try {
      const response = await api.get<GetItemUnitsResponse>(`${BASE_PATH}/${itemMasterId}/units`, {
        params: { status },
      });
      console.log(`✅ Get item units for item ${itemMasterId}:`, response.data);
      return extractApiResponse(response);
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `${BASE_PATH}/${itemMasterId}/units`,
        method: 'GET',
        params: { status },
      });
      
      console.error(`❌ Get item units error for item ${itemMasterId}:`, {
        message: enhancedError.message,
        status: enhancedError.status,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * GET /api/v1/warehouse/items/{itemMasterId}/units
   * Legacy method - Trả về toàn bộ hệ thống đơn vị cho vật tư (Hộp → Vỉ → Viên)
   * @deprecated Use getItemUnits() instead for better structure
   */
  getUnits: async (itemMasterId: number): Promise<ItemUnitResponse[]> => {
    try {
      const response = await itemUnitService.getItemUnits(itemMasterId, 'active');
      return response.units.map(unit => ({
        unitId: unit.unitId,
        unitName: unit.unitName,
        conversionRate: unit.conversionRate,
        isBaseUnit: unit.isBaseUnit,
        displayOrder: unit.displayOrder,
        isActive: unit.isActive,
        description: unit.description,
      }));
    } catch (error: any) {
      console.error('❌ Get units error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/warehouse/items/{itemMasterId}/units/base
   * Trả về đơn vị cơ sở (nhỏ nhất) cho vật tư
   */
  getBaseUnit: async (itemMasterId: number): Promise<ItemUnitResponse> => {
    try {
      const response = await api.get<ItemUnitResponse>(`${BASE_PATH}/${itemMasterId}/units/base`);
      console.log(`✅ Get base unit for item ${itemMasterId}:`, response.data);
      return extractApiResponse(response);
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `${BASE_PATH}/${itemMasterId}/units/base`,
        method: 'GET',
      });
      
      console.error(`❌ Get base unit error for item ${itemMasterId}:`, {
        message: enhancedError.message,
        status: enhancedError.status,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 6.12 - POST /api/v1/warehouse/items/units/convert
   * Convert item quantities between units (Batch support)
   * 
   * @param request - ConversionRequest with conversions array and rounding mode
   * @returns ConversionResponse with results and formulas
   */
  convertUnits: async (request: ConversionRequest): Promise<ConversionResponse> => {
    try {
      const response = await api.post<ConversionResponse>(`${BASE_PATH}/units/convert`, request);
      console.log('✅ Convert units:', response.data);
      return extractApiResponse(response);
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `${BASE_PATH}/units/convert`,
        method: 'POST',
        params: request,
      });
      
      console.error('❌ Convert units error:', {
        message: enhancedError.message,
        code: enhancedError.code,
        status: enhancedError.status,
        endpoint: enhancedError.endpoint,
        request,
        originalError: error,
      });
      
      throw enhancedError;
    }
  },

  /**
   * API 6.12 - GET /api/v1/warehouse/items/units/convert (Simple conversion)
   * Convert quantity between two units (simple single conversion)
   * 
   * @param fromUnitId - Source unit ID
   * @param toUnitId - Target unit ID
   * @param quantity - Amount to convert
   * @returns Converted quantity (integer)
   */
  convertQuantity: async (fromUnitId: number, toUnitId: number, quantity: number): Promise<number> => {
    try {
      const response = await api.get<number>(`${BASE_PATH}/units/convert`, {
        params: { fromUnitId, toUnitId, quantity },
      });
      console.log(`✅ Convert quantity: ${quantity} from unit ${fromUnitId} to ${toUnitId} = ${response.data}`);
      return extractApiResponse(response);
    } catch (error: any) {
      const enhancedError = createApiError(error, {
        endpoint: `${BASE_PATH}/units/convert`,
        method: 'GET',
        params: { fromUnitId, toUnitId, quantity },
      });
      
      console.error('❌ Convert quantity error:', {
        message: enhancedError.message,
        status: enhancedError.status,
        params: { fromUnitId, toUnitId, quantity },
        originalError: error,
      });
      
      throw enhancedError;
    }
  },
};

export default itemUnitService;

