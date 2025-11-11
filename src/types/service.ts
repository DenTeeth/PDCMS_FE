// Service Management Types
export interface Service {
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultBufferMinutes: number;
  price: number;
  specializationId?: number;
  specializationName?: string;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  displayOrder?: number; // Display order within category
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceFilters {
  keyword?: string;
  isActive?: string; // "true", "false", or empty string for "all"
  specializationId?: string; // "1", "2", or empty string for "all"
  categoryId?: string; // "1", "2", or empty string for "all"
  sortBy?: string; // Default: "serviceName"
  sortDirection?: 'ASC' | 'DESC'; // Backend uses uppercase
  page?: number; // Default: 0
  size?: number; // Default: 10
}

export interface CreateServiceRequest {
  serviceCode: string;
  serviceName: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultBufferMinutes: number;
  price: number;
  specializationId?: number;
  categoryId?: number;
  displayOrder?: number; // Display order within category
  isActive: boolean;
}

export interface UpdateServiceRequest {
  serviceName?: string;
  description?: string;
  defaultDurationMinutes?: number;
  defaultBufferMinutes?: number;
  price?: number;
  specializationId?: number;
  categoryId?: number;
  displayOrder?: number; // Display order within category
  isActive?: boolean;
}

// Pagination types (same as Room)
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface ServiceListResponse {
  content: Service[];
  pageable: Pageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: Sort;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// Specialization types
export interface Specialization {
  specializationId: number;
  specializationName: string;
  description?: string;
  isActive: boolean;
}

// Error codes
export enum ServiceErrorCode {
  SERVICE_CODE_EXISTS = 'SERVICE_CODE_EXISTS',
  SPECIALIZATION_NOT_FOUND = 'SPECIALIZATION_NOT_FOUND',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST'
}
