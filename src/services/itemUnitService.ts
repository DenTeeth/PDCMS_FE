import { apiClient } from '@/lib/api';
import type { ItemUnitResponse } from '@/types/warehouse';

const api = apiClient.getAxiosInstance();
const BASE_PATH = '/warehouse/items';

export const itemUnitService = {
  /**
   * GET /api/v1/warehouse/items/{itemMasterId}/units
   * Trả về toàn bộ hệ thống đơn vị cho vật tư (Hộp → Vỉ → Viên)
   */
  getUnits: async (itemMasterId: number): Promise<ItemUnitResponse[]> => {
    const response = await api.get<ItemUnitResponse[]>(`${BASE_PATH}/${itemMasterId}/units`);
    return response.data;
  },

  /**
   * GET /api/v1/warehouse/items/{itemMasterId}/units/base
   * Trả về đơn vị cơ sở (nhỏ nhất) cho vật tư
   */
  getBaseUnit: async (itemMasterId: number): Promise<ItemUnitResponse> => {
    const response = await api.get<ItemUnitResponse>(`${BASE_PATH}/${itemMasterId}/units/base`);
    return response.data;
  },
};

export default itemUnitService;

