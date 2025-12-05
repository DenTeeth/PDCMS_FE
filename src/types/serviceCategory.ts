// Service Category Types
//  Match V17 Service Category API (service/controller/ServiceCategoryController.java)
// Created: 2025-01-26

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

export interface CreateServiceCategoryRequest {
  categoryCode: string; // Required, max 50 chars, unique (e.g., "GEN", "COS", "ORTH")
  categoryName: string; // Required, max 255 chars (e.g., "A. General Dentistry")
  displayOrder: number; // Required, min 0 (for ordering in UI)
  description?: string; // Optional, max 1000 chars
}

export interface UpdateServiceCategoryRequest {
  categoryCode?: string; // Optional - can change code
  categoryName?: string; // Optional - can change name
  displayOrder?: number; // Optional - can reorder
  description?: string; // Optional - can update description
}

export interface ReorderServiceCategoriesRequest {
  orders: Array<{
    categoryId: number;
    displayOrder: number;
  }>;
}

// Error codes
export enum ServiceCategoryErrorCode {
  CATEGORY_CODE_EXISTS = 'CATEGORY_CODE_EXISTS',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_HAS_ACTIVE_SERVICES = 'CATEGORY_HAS_ACTIVE_SERVICES', // Cannot delete category with active services
  INVALID_REQUEST = 'INVALID_REQUEST'
}
