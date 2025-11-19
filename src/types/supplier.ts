/**
 * Supplier API V1 Types
 * Backend: http://localhost:8080/api/v1/suppliers
 * Authentication: Bearer Token required
 */

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  error?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

// ============================================
// SUPPLIER SUMMARY (GET /api/v1/suppliers)
// ============================================

export interface SupplierSummaryResponse {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phoneNumber: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// ============================================
// SUPPLIER DETAIL (GET /api/v1/suppliers/{id})
// ============================================

export interface SuppliedItemSummary {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  totalQuantitySupplied: number;
  lastSuppliedDate: string; // ISO 8601: "2025-11-19T15:30:00"
}

export interface SupplierDetailResponse {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phoneNumber: string;
  email: string;
  address: string;
  notes: string;
  contactPerson: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  suppliedItems: SuppliedItemSummary[];
}

// ============================================
// SUPPLIED ITEMS (GET /api/v1/suppliers/{id}/supplied-items)
// ============================================

export interface SuppliedItemResponse {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  batchId: number;
  lotNumber: string;
  quantitySupplied: number;
  importPrice: number;
  suppliedDate: string; // ISO 8601
  expiryDate?: string; // ISO 8601 (optional for non-cold items)
}

// ============================================
// CREATE SUPPLIER (POST /api/v1/suppliers)
// ============================================

export interface CreateSupplierRequest {
  supplierCode: string;
  supplierName: string;
  phoneNumber: string;
  email: string;
  address: string;
  contactPerson: string;
  notes?: string;
}

// ============================================
// UPDATE SUPPLIER (PUT /api/v1/suppliers/{id})
// ============================================

export interface UpdateSupplierRequest {
  supplierCode?: string;
  supplierName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================
// SUPPLIER RESPONSE (CREATE/UPDATE)
// ============================================

export interface SupplierResponse {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phoneNumber: string;
  email: string;
  address: string;
  contactPerson: string;
  notes: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================
// QUERY PARAMS
// ============================================

export interface SupplierQueryParams {
  page?: number; // Default: 0
  size?: number; // Default: 10
  sort?: string; // Format: "field,direction" (e.g., "supplierName,asc")
  search?: string; // Multi-field search (name, code, phone, email)
}
