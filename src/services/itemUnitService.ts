import { ApiClient } from '@/lib/api';
import type { ItemUnitResponse } from '@/types/warehouse';

const API_V1_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
const API_V3_BASE = API_V1_BASE.replace('/api/v1', '/api/v3');

const apiV3Client = new ApiClient(API_V3_BASE);
const apiV3 = apiV3Client.getAxiosInstance();

export const itemUnitService = {
  /**
   * GET /api/v3/warehouse/items/{itemMasterId}/units
   * Trả về toàn bộ hệ thống đơn vị cho vật tư (Hộp → Vỉ → Viên)
   */
  getUnits: async (itemMasterId: number): Promise<ItemUnitResponse[]> => {
    const response = await apiV3.get<ItemUnitResponse[]>(
      `/warehouse/items/${itemMasterId}/units`
    );
    return response.data;
  },

  /**
   * GET /api/v3/warehouse/items/{itemMasterId}/units/base
   * Trả về đơn vị cơ sở (nhỏ nhất) cho vật tư
   */
  getBaseUnit: async (itemMasterId: number): Promise<ItemUnitResponse> => {
    const response = await apiV3.get<ItemUnitResponse>(
      `/warehouse/items/${itemMasterId}/units/base`
    );
    return response.data;
  },
};

export default itemUnitService;

