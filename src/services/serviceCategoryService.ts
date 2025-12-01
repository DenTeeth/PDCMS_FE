import { 
  ServiceCategory, 
  CreateServiceCategoryRequest, 
  UpdateServiceCategoryRequest,
  ReorderServiceCategoriesRequest
} from '@/types/serviceCategory';
import { apiClient } from '@/lib/api';

/**
 * Service Category Management Service
 * Maps to V17 Service Category API (ServiceCategoryController.java)
 * Created: 2025-01-26
 */
export class ServiceCategoryService {
  private static readonly BASE_URL = 'service-categories';

  /**
   * Get all service categories (including inactive)
   * GET /api/v1/service-categories
   * Permission: VIEW_SERVICE
   */
  static async getCategories(): Promise<ServiceCategory[]> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<ServiceCategory[]>(`${this.BASE_URL}`);
    return response.data;
  }

  /**
   * Get active categories only (for dropdown filters)
   */
  static async getActiveCategories(): Promise<ServiceCategory[]> {
    const all = await this.getCategories();
    return all.filter(cat => cat.isActive);
  }

  /**
   * Get category by ID
   * GET /api/v1/service-categories/{categoryId}
   * Permission: VIEW_SERVICE
   */
  static async getCategoryById(categoryId: number): Promise<ServiceCategory> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<ServiceCategory>(`${this.BASE_URL}/${categoryId}`);
    return response.data;
  }

  /**
   * Create new service category
   * POST /api/v1/service-categories
   * Permission: CREATE_SERVICE
   */
  static async createCategory(data: CreateServiceCategoryRequest): Promise<ServiceCategory> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.post<ServiceCategory>(`${this.BASE_URL}`, data);
    return response.data;
  }

  /**
   * Update existing service category (partial update)
   * PATCH /api/v1/service-categories/{categoryId}
   * Permission: UPDATE_SERVICE
   */
  static async updateCategory(categoryId: number, data: UpdateServiceCategoryRequest): Promise<ServiceCategory> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.patch<ServiceCategory>(`${this.BASE_URL}/${categoryId}`, data);
    return response.data;
  }

  /**
   * Delete service category (soft delete - sets isActive=false)
   * DELETE /api/v1/service-categories/{categoryId}
   * Permission: DELETE_SERVICE
   * 
   * Note: Will fail (409 Conflict) if category has active services
   */
  static async deleteCategory(categoryId: number): Promise<void> {
    const axios = apiClient.getAxiosInstance();
    await axios.delete(`${this.BASE_URL}/${categoryId}`);
  }

  /**
   * Reorder service categories (bulk operation for drag-drop UX)
   * POST /api/v1/service-categories/reorder
   * Permission: UPDATE_SERVICE
   */
  static async reorderCategories(orders: ReorderServiceCategoriesRequest): Promise<void> {
    const axios = apiClient.getAxiosInstance();
    await axios.post(`${this.BASE_URL}/reorder`, orders);
  }
}
