/**
 * Warehouse Management Types (Unified V3)
 * For Cold Storage and Normal Storage
 * Includes: Item Master, Batch Management, FEFO, Loss Tracking
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

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
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
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phoneNumber: string;
  email?: string;
  address: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  isActive: boolean;
  status?: SupplierStatus; // Keep for backward compatibility
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phoneNumber: string;
  email?: string;
  address: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
}

export interface UpdateSupplierDto {
  supplierName?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  isActive?: boolean;
  status?: SupplierStatus;
}

// ============================================
// CATEGORY (Danh mục/Nhóm vật tư) - V3 Enhanced
// ============================================

export interface Category {
  id?: string; // Old format compatibility
  category_id?: number; // V3 format
  name?: string; // Old format
  category_name?: string; // V3 format
  parent_category_id?: number; // V3: Support nested categories
  description?: string;
  warehouseType?: WarehouseType; // Old format
  warehouse_type?: 'COLD' | 'NORMAL'; // V3 format
  sub_categories?: Category[]; // V3: Support nested
  createdAt?: string; // Old format
  updatedAt?: string; // Old format
  created_at?: string; // V3 format
  updated_at?: string; // V3 format
}

export interface CreateCategoryDto {
  name?: string;
  category_name?: string;
  description?: string;
  warehouseType?: WarehouseType;
  warehouse_type?: 'COLD' | 'NORMAL';
  parent_category_id?: number;
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
  category_id?: number; // V3 format
  search?: string;
  itemName?: string; // Search keyword
  lowStock?: boolean; // Lọc vật tư sắp hết
  expiringSoon?: boolean; // Lọc vật tư sắp hết hạn (kho lạnh)
  is_expiring_soon?: boolean; // V3 format
  stock_status?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  page?: number;
  size?: number;
  sortBy?: 'itemName' | 'unitPrice' | 'stockQuantity' | 'createdAt' | 'updatedAt' | 'item_code' | 'item_name' | 'total_quantity';
  sort_by?: string; // V3 format
  sortDirection?: 'ASC' | 'DESC';
  sort_direction?: 'ASC' | 'DESC'; // V3 format
}

// ============================================
// V3 ENHANCED TYPES (Item Master + Batch Management)
// ============================================

export interface ItemMaster {
  item_master_id: number;
  item_code: string; // e.g., "LIDO_2P"
  item_name: string;
  unit_of_measure: string; // 'ống', 'cái', 'hộp', 'lọ'
  warehouse_type: 'COLD' | 'NORMAL';
  min_stock_level: number;
  max_stock_level: number;
  category_id: number;
  category?: Category; // Joined data
  total_quantity: number; // Calculated from item_batches (SUM)
  total_quantity_on_hand: number; // Alias for UI (same as total_quantity)
  stock_status: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  is_tool: boolean; // true = Dụng cụ (no expiry needed)
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemBatch {
  batch_id: number;
  item_master_id: number;
  item_code?: string; // For display
  item_name?: string; // For display (joined from item_master)
  item_master?: ItemMaster; // Joined data
  lot_number: string; // e.g., "LIDO-A-101"
  quantity_on_hand: number;
  import_price: number; // Price when imported (for loss calculation)
  expiry_date?: string; // YYYY-MM-DD (null for tools)
  supplier_id?: number;
  supplier_name?: string; // Joined from suppliers
  import_date: string;
  created_at: string;
  updated_at: string;
}

export interface StorageTransactionV3 {
  transaction_id: number;
  transaction_code: string; // e.g., "PN-2025-001", "PX-2025-001"
  transaction_type: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'DESTROY';
  transaction_date: string; // YYYY-MM-DD
  supplier_id?: number; // For IMPORT only
  supplier_name?: string; // Joined data
  reference_code?: string; // External reference (invoice, etc.)
  total_value: number; // Total transaction value
  notes?: string;
  performed_by: number; // User ID
  performed_by_name?: string; // Joined from users
  items: StorageTransactionItemV3[]; // Line items
  created_at: string;
  updated_at: string;
}

export interface StorageTransactionItemV3 {
  transaction_item_id: number;
  transaction_id: number;
  batch_id: number;
  item_master_id: number;
  item_code?: string; // Joined data
  item_name?: string; // Joined data
  lot_number?: string; // Joined data
  quantity_change: number; // Positive for IMPORT/ADJUST+, Negative for EXPORT/DESTROY
  unit_price: number;
  total_price: number; // quantity * unit_price
  expiry_date?: string; // For IMPORT (new batch)
  notes?: string;
}

export interface SupplierItem {
  supplier_id: number;
  item_master_id: number;
  item_code: string;
  item_name: string;
  last_import_price?: number;
  last_import_date?: string;
}

// ============================================
// STATISTICS & ANALYTICS (V3)
// ============================================

export interface InventoryStats {
  total_items: number; // Total item_master count
  low_stock_count: number; // Items below min_stock_level
  expiring_soon_count: number; // Items expiring in 30 days
  monthly_loss_value: number; // Total value of DESTROY/ADJUST- this month
  total_inventory_value: number; // SUM(quantity * import_price) across all batches
}

export interface StorageStats {
  monthly_import_value: number; // Total IMPORT value this month
  monthly_export_value: number; // Total EXPORT value this month
  import_growth_percent: number; // % change vs last month
  export_growth_percent: number; // % change vs last month
  total_transactions_count: number;
}

export interface ExpiringBatch {
  batch_id: number;
  item_code: string;
  item_name: string;
  lot_number: string;
  quantity_on_hand: number;
  expiry_date: string;
  days_until_expiry: number; // Calculated
  estimated_loss_value: number; // quantity * import_price
}

export interface LossRecord {
  transaction_id: number;
  transaction_code: string;
  transaction_type: 'DESTROY' | 'ADJUST';
  transaction_date: string;
  item_name: string;
  lot_number: string;
  quantity_lost: number;
  loss_value: number;
  reason: string; // From notes
  performed_by_name: string;
}

// ============================================
// DTOs (V3)
// ============================================

export interface CreateItemMasterDto {
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  warehouse_type: 'COLD' | 'NORMAL';
  category_id: number;
  min_stock_level: number;
  max_stock_level: number;
  is_tool: boolean;
  notes?: string;
}

export interface UpdateItemMasterDto extends Partial<CreateItemMasterDto> {
  stock_status?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
}

export interface CreateImportTransactionDto {
  transaction_date: string;
  supplier_id: number;
  reference_code?: string;
  notes?: string;
  items: CreateImportItemDto[];
}

export interface CreateImportItemDto {
  item_master_id: number;
  lot_number: string;
  quantity: number;
  import_price: number;
  expiry_date?: string; // Required for non-tools in COLD storage
}

export interface CreateExportTransactionDto {
  transaction_date: string;
  notes?: string;
  items: CreateExportItemDto[];
}

export interface CreateExportItemDto {
  batch_id: number; // FEFO: Must select specific batch
  quantity: number;
}

export interface CreateAdjustmentDto {
  transaction_date: string;
  transaction_type: 'ADJUST' | 'DESTROY';
  reason: string; // notes
  items: CreateAdjustmentItemDto[];
}

export interface CreateAdjustmentItemDto {
  batch_id: number;
  quantity_change: number; // Positive or negative
  reason?: string;
}

export interface BatchFilter {
  item_master_id: number;
  warehouse_type?: 'COLD' | 'NORMAL';
  expiring_soon?: boolean;
  sort_by?: 'expiry_date' | 'quantity_on_hand'; // FEFO: sort by expiry_date ASC
}

export interface ItemMasterFilter {
  search?: string; // Search in item_code, item_name
  warehouse_type?: 'COLD' | 'NORMAL';
  category_id?: number;
  stock_status?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  is_expiring_soon?: boolean; // Has batches expiring in 30 days
  page?: number;
  size?: number;
  sort_by?: 'item_code' | 'item_name' | 'total_quantity' | 'created_at';
  sort_direction?: 'ASC' | 'DESC';
}

export interface StorageTransactionFilter {
  transaction_type?: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'DESTROY';
  start_date?: string;
  end_date?: string;
  supplier_id?: number;
  item_master_id?: number;
  search?: string; // Search in transaction_code, notes
  page?: number;
  size?: number;
}

// ============================================
// UI STATE HELPERS (V3)
// ============================================

export interface InventoryTabState {
  activeFilter: 'ALL' | 'COLD' | 'NORMAL' | 'LOW_STOCK' | 'EXPIRING_SOON';
  searchQuery: string;
  selectedCategory?: number;
}

export interface StorageTabState {
  activeTab: 'import' | 'export' | 'reports';
  dateRange: {
    start: string;
    end: string;
  };
}

// Batch selection for FEFO export
export interface BatchSelectionItem extends ItemBatch {
  selected: boolean;
  quantity_to_export?: number;
  is_suggested?: boolean; // Auto-selected by FEFO logic
  warning?: 'EXPIRING_SOON' | 'EXPIRED' | 'LOW_STOCK';
}


