/**
 * Warehouse Management Types
 * For Cold Storage and Normal Storage
 */

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============================================
// ENUMS
// ============================================

export enum WarehouseType {
  COLD = 'COLD',
  NORMAL = 'NORMAL',
}

export enum TransactionType {
  IN = 'IN',   // Phiếu nhập
  OUT = 'OUT', // Phiếu xuất
}

export enum UnitType {
  CAI = 'CAI',     // Cái
  HOP = 'HOP',     // Hộp
  LO = 'LO',       // Lọ
  GOI = 'GOI',     // Gói
  CHAI = 'CHAI',   // Chai
  THUNG = 'THUNG', // Thùng
}

export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

// ============================================
// SUPPLIER (Nhà cung cấp)
// ============================================

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface Supplier {
  supplierId: number;
  supplierName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  status: SupplierStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  supplierName: string;
  phoneNumber: string;
  email?: string;
  address: string;
  notes?: string;
}

export interface UpdateSupplierDto {
  supplierName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  status?: SupplierStatus;
  notes?: string;
}

// ============================================
// CATEGORY (Danh mục/Nhóm vật tư)
// ============================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  warehouseType: WarehouseType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  warehouseType: WarehouseType;
}

// ============================================
// INVENTORY (Vật tư - New structure matching BE)
// ============================================

export interface Inventory {
  inventoryId: number;
  supplierId: number;
  itemName: string;
  warehouseType: WarehouseType;
  category?: string;
  supplierName?: string; // From BE response
  supplierPhone?: string; // From BE response
  supplierEmail?: string; // From BE response
  supplierAddress?: string; // From BE response
  unitPrice: number;
  unitOfMeasure: UnitType;
  stockQuantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  expiryDate?: string; // YYYY-MM-DD
  isCertified: boolean;
  certificationDate?: string; // YYYY-MM-DD
  status: InventoryStatus;
  notes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateInventoryDto {
  supplierId: number;
  itemName: string;
  warehouseType: WarehouseType;
  category?: string;
  unitPrice: number;
  unitOfMeasure: UnitType;
  stockQuantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  expiryDate?: string;
  isCertified?: boolean;
  certificationDate?: string;
  status?: InventoryStatus;
  notes?: string;
}

export interface UpdateInventoryDto {
  supplierId?: number;
  itemName?: string;
  warehouseType?: WarehouseType;
  category?: string;
  unitPrice?: number;
  unitOfMeasure?: UnitType;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  expiryDate?: string;
  isCertified?: boolean;
  certificationDate?: string;
  status?: InventoryStatus;
  notes?: string;
}

export interface InventoryFilter {
  page?: number;
  size?: number;
  sortBy?: 'itemName' | 'unitPrice' | 'stockQuantity' | 'createdAt' | 'updatedAt';
  sortDirection?: 'ASC' | 'DESC';
  warehouseType?: WarehouseType;
  itemName?: string; // Search keyword
}

// ============================================
// ITEM (Vật tư - Old structure, keep for backward compatibility)
// ============================================

export interface InventoryItem {
  id: string;
  code: string; // Mã vật tư
  name: string;
  categoryId: string;
  categoryName?: string;
  unitPrice: number;
  unit: UnitType;
  currentStock: number; // Tồn kho hiện tại
  minStock?: number; // Mức tồn kho tối thiểu (cảnh báo)
  warehouseType: WarehouseType;
  expiryDate?: string; // Hạn sử dụng (bắt buộc với kho lạnh)
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemDto {
  name: string;
  categoryId: string;
  unitPrice: number;
  unit: UnitType;
  minStock?: number;
  warehouseType: WarehouseType;
  expiryDate?: string; // Required for COLD storage
}

export interface UpdateInventoryItemDto extends Partial<CreateInventoryItemDto> {}

// ============================================
// STORAGE TRANSACTION (Phiếu xuất/nhập)
// ============================================

export interface TransactionItem {
  itemId: string;
  itemName?: string;
  quantity: number;
  unitPrice: number;
  expiryDate?: string; // Hạn sử dụng (cho phiếu nhập kho lạnh)
  totalPrice?: number; // quantity * unitPrice
}

export interface StorageTransaction {
  id: string;
  code: string; // Mã phiếu
  type: TransactionType;
  warehouseType: WarehouseType;
  supplierId?: string; // Chỉ có cho phiếu nhập
  supplierName?: string;
  transactionDate: string;
  items: TransactionItem[];
  totalCost: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  warehouseType: WarehouseType;
  supplierId?: string; // Required for IN transactions
  transactionDate: string;
  items: TransactionItem[];
  notes?: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}

// ============================================
// RESPONSE TYPES
// ============================================

export interface WarehouseStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiringSoonItems?: number; // Chỉ có cho kho lạnh
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ============================================
// FILTER/QUERY PARAMS
// ============================================

export interface TransactionFilter {
  type?: TransactionType;
  warehouseType?: WarehouseType;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface InventoryFilter {
  warehouseType?: WarehouseType;
  categoryId?: string;
  search?: string;
  lowStock?: boolean; // Lọc vật tư sắp hết
  expiringSoon?: boolean; // Lọc vật tư sắp hết hạn (kho lạnh)
  page?: number;
  size?: number;
}
