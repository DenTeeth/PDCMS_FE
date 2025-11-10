/**
 * Service Category Type Definitions
 * 
 * Based on ServiceCategory.md - Service Category Management API (V17)
 * Last updated: January 2025
 */

/**
 * Service Category entity returned from API
 */
export interface ServiceCategory {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Brief version of Service Category (for public/internal APIs)
 */
export interface ServiceCategoryBrief {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
}

/**
 * Request payload for creating a new service category
 */
export interface CreateServiceCategoryRequest {
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  description?: string;
}

/**
 * Request payload for updating an existing service category (partial update)
 */
export interface UpdateServiceCategoryRequest {
  categoryCode?: string;
  categoryName?: string;
  displayOrder?: number;
  description?: string;
  isActive?: boolean;
}

/**
 * Request payload for reordering service categories (bulk operation)
 */
export interface ReorderServiceCategoriesRequest {
  orders: CategoryOrder[];
}

/**
 * Category order item for reorder request
 */
export interface CategoryOrder {
  categoryId: number;
  displayOrder: number;
}

/**
 * Error codes for service category operations
 */
export enum ServiceCategoryErrorCode {
  CATEGORY_CODE_EXISTS = 'CATEGORY_CODE_EXISTS',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_HAS_ACTIVE_SERVICES = 'CATEGORY_HAS_ACTIVE_SERVICES',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_REQUEST = 'INVALID_REQUEST'
}

