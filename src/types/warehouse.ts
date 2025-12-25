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
  IMPORT = 'IMPORT',   // Phiếu nhập
  EXPORT = 'EXPORT', // Phiếu xuất
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

// ============================================
// CATEGORY (Matching BE ItemCategoryResponse)
// ============================================

export interface Category {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  description?: string;
  isActive?: boolean;
  
  // Legacy fields for backward compatibility
  id?: string;
  category_id?: number;
  name?: string;
  category_name?: string;
  parent_category_id?: number;
  warehouseType?: WarehouseType;
  warehouse_type?: 'COLD' | 'NORMAL';
  sub_categories?: Category[];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
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

// ============================================
// STATS (Matching BE WarehouseStatsResponse)
// ============================================

export interface WarehouseStats {
  totalItems: number;
  lowStockItems: number;
  expiringSoonItems: number;
  outOfStockItems: number;
  
  // Legacy fields
  totalValue?: number;
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

// ============================================
// ITEM MASTER (Matching BE ItemMasterSummaryResponse)
// ============================================

export interface ItemMaster {
  itemMasterId: number;
  itemCode: string; // e.g., "LIDO_2P"
  itemName: string;
  categoryName?: string;
  warehouseType: 'COLD' | 'NORMAL';
  unitOfMeasure: string; // 'ống', 'cái', 'hộp', 'lọ'
  totalQuantityOnHand: number; // Calculated by BE
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  isExpiringSoon?: boolean;
  minStockLevel: number;
  maxStockLevel: number;
  isTool: boolean; // Deprecated - all items require expiry
  createdAt?: string;
  updatedAt?: string;
  
  // Legacy fields for backward compatibility
  item_master_id?: number;
  item_code?: string;
  item_name?: string;
  category_id?: number;
  category?: Category;
  total_quantity?: number;
  total_quantity_on_hand?: number;
  stock_status?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  is_tool?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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

// ============================================
// BATCH RESPONSE (Matching BE BatchResponse)
// ============================================

export interface BatchResponse {
  batchId: number;
  lotNumber: string;
  quantityOnHand: number;
  expiryDate: string; // REQUIRED - LocalDate (YYYY-MM-DD)
  importedAt: string; // LocalDateTime
  supplierName?: string;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
}

export interface ItemUnitResponse {
  unitId: number;
  unitName: string;
  conversionRate: number;
  isBaseUnit: boolean;
  displayOrder: number;
  isActive?: boolean;
  description?: string;
}

// API 6.11 - Get Item Units Response
export interface GetItemUnitsResponse {
  itemMaster: {
    itemMasterId: number;
    itemCode: string;
    itemName: string;
    isActive: boolean;
  };
  baseUnit: {
    unitId: number;
    unitName: string;
  };
  units: Array<{
    unitId: number;
    unitName: string;
    conversionRate: number;
    isBaseUnit: boolean;
    displayOrder: number;
    isActive: boolean;
    description: string; // Auto-generated: "1 Hop = 100 Vien"
  }>;
}

// API 6.12 - Convert Quantity Request/Response
export interface ConversionRequest {
  conversions: Array<{
    itemMasterId: number;
    fromUnitId: number;
    toUnitId: number;
    quantity: number;
  }>;
  roundingMode?: 'FLOOR' | 'CEILING' | 'HALF_UP';
}

export interface ConversionResult {
  inputQuantity: number;
  resultQuantity: number;
  resultQuantityDisplay: string;
  formula: string;
  conversionFactor: number;
}

export interface ConversionResponse {
  totalProcessed: number;
  results: ConversionResult[];
}

// ============================================
// STORAGE TRANSACTION (Matching BE TransactionResponse)
// ============================================

export interface StorageTransactionV3 {
  transactionId: number;
  transactionCode: string; // e.g., "PN-2025-001", "PX-2025-001"
  transactionType: 'IMPORT' | 'EXPORT';
  transactionDate: string; // LocalDateTime
  supplierId?: number; // For IMPORT only
  supplierName?: string;
  invoiceNumber?: string;
  exportType?: string;
  notes?: string;
  createdByName?: string;
  createdAt: string;
  // Approval Info (API 6.6 - Issue #16, #17)
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledBy?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  
  // Transaction Summary
  totalItems?: number;
  totalValue?: number;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED'; // TransactionStatus enum
  
  // Payment Info (for IMPORT) - API 6.7 - Issue #17
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  paidAmount?: number; // RBAC: requires VIEW_COST
  remainingDebt?: number; // RBAC: requires VIEW_COST
  dueDate?: string;
  
  // Appointment Info (for EXPORT) - API 6.7 - Issue #17
  relatedAppointmentId?: number;
  relatedAppointmentCode?: string;
  patientName?: string;
  items: StorageTransactionItemV3[];
  
  // Legacy fields
  transaction_id?: number;
  transaction_code?: string;
  transaction_type?: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'DESTROY';
  transaction_date?: string;
  supplier_id?: number;
  supplier_name?: string;
  reference_code?: string;
  total_value?: number;
  performed_by?: number;
  performed_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StorageTransactionItemV3 {
  transactionItemId?: number;
  itemMasterId?: number; // Added for transaction history filtering
  itemCode?: string;
  itemName?: string;
  unitName?: string;
  lotNumber?: string;
  quantityChange: number; // Positive for IMPORT, Negative for EXPORT
  expiryDate?: string; // LocalDate (YYYY-MM-DD) - Added in BE fix for Issue #10
  notes?: string;
  unitPrice?: number;
  totalLineValue?: number;
  
  // Legacy fields
  transaction_item_id?: number;
  transaction_id?: number;
  batch_id?: number;
  item_master_id?: number;
  item_code?: string;
  item_name?: string;
  lot_number?: string;
  quantity_change?: number;
  unit_price?: number;
  total_price?: number;
  expiry_date?: string;
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

// ============================================
// STORAGE STATS (Matching BE StorageStatsResponse)
// ============================================

export interface StorageStats {
  monthlyImportCount: number; // Number of import transactions this month
  monthlyExportCount: number; // Number of export transactions this month
  importGrowthPercent: number; // % change vs last month
  exportGrowthPercent: number; // % change vs last month
  totalTransactionsCount: number;
  expiredItemsCount?: number; // Number of expired items
  
  // Legacy fields
  monthly_import_value?: number;
  monthly_export_value?: number;
  monthly_import_count?: number;
  monthly_export_count?: number;
  import_growth_percent?: number;
  export_growth_percent?: number;
  total_transactions_count?: number;
  expired_items_count?: number;
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

// ============================================
// CREATE/UPDATE ITEM MASTER (Matching BE DTOs)
// ============================================

export interface CreateItemMasterDto {
  itemCode: string;
  itemName: string;
  description?: string;
  categoryId: number;
  unitOfMeasure: string;
  warehouseType: 'COLD' | 'NORMAL';
  minStockLevel: number;
  maxStockLevel: number;
  isTool?: boolean; // Deprecated but kept for backward compatibility
  
  // Legacy fields
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  warehouse_type?: 'COLD' | 'NORMAL';
  category_id?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  is_tool?: boolean;
  notes?: string;
}

export interface UpdateItemMasterDto {
  itemName?: string;
  description?: string;
  categoryId?: number;
  unitOfMeasure?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  isTool?: boolean;
  
  // Legacy fields
  item_name?: string;
  category_id?: number;
  unit_of_measure?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  is_tool?: boolean;
  stock_status?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
}

// ============================================
// IMPORT TRANSACTION (API 6.4)
// ============================================

export interface CreateImportTransactionDto {
  supplierId: number;
  transactionDate: string; // ISO string (LocalDateTime) - e.g., "2025-01-17T10:30:00"
  invoiceNumber: string;
  expectedDeliveryDate?: string; // ISO string (LocalDate) - e.g., "2025-01-20"
  notes?: string;
  items: CreateImportItemDto[];
}

export interface CreateImportItemDto {
  itemMasterId: number;
  lotNumber: string;
  expiryDate: string; // LocalDate (YYYY-MM-DD) - REQUIRED for all items
  quantity: number;
  unitId: number;
  purchasePrice: number; // BigDecimal
  binLocation?: string;
  notes?: string;
}

export interface ImportTransactionResponse {
  transactionId: number;
  transactionCode: string;
  transactionDate: string;
  supplierName: string;
  invoiceNumber: string;
  createdBy: string;
  createdAt: string;
  status: string; // COMPLETED, DRAFT, CANCELLED
  totalItems: number;
  totalValue: number; // BigDecimal
  items: ImportItemResponse[];
  warnings?: ImportWarningDTO[];
}

export interface ImportItemResponse {
  itemCode: string;
  itemName: string;
  batchId: number;
  batchStatus: string; // CREATED | UPDATED
  lotNumber: string;
  expiryDate: string;
  quantityChange: number;
  unitName: string;
  purchasePrice: number;
  totalLineValue: number;
  binLocation?: string;
  currentStock: number;
}

export interface ImportWarningDTO {
  itemCode: string;
  warningType: string; // NEAR_EXPIRY | PRICE_VARIANCE | LOW_STOCK
  message: string;
}

// ============================================
// EXPORT TRANSACTION (API 6.5)
// ============================================

export type ExportType = 'USAGE' | 'DISPOSAL' | 'RETURN';

export interface CreateExportTransactionDto {
  transactionDate: string; // ISO string (LocalDateTime)
  exportType: ExportType;
  referenceCode?: string;
  departmentName?: string;
  requestedBy?: string;
  notes?: string;
  allowExpired?: boolean; // true for DISPOSAL
  items: CreateExportItemDto[];
}

export interface CreateExportItemDto {
  itemMasterId: number;
  quantity: number;
  unitId: number;
  notes?: string;
}

export interface ExportTransactionResponse {
  transactionId: number;
  transactionCode: string;
  transactionDate: string;
  exportType: ExportType;
  referenceCode?: string;
  departmentName?: string;
  requestedBy?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  status?: string; // PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED, COMPLETED
  totalItems?: number;
  totalValue?: number; // COGS
  items: ExportItemResponse[];
  warnings?: ExportWarningDTO[];
}

export interface ExportItemResponse {
  itemCode: string;
  itemName: string;
  batchId: number;
  lotNumber: string;
  expiryDate?: string;
  binLocation?: string;
  quantityChange: number; // Negative value
  unitName?: string;
  unitPrice?: number; // COGS unit price
  totalLineValue?: number; // COGS line total
  unpackingInfo?: UnpackingInfo;
  notes?: string;
}

export interface UnpackingInfo {
  wasUnpacked: boolean;
  parentBatchId?: number;
  parentUnitName?: string;
  remainingInBatch?: number;
}

export interface ExportWarningDTO {
  batchId?: number;
  itemCode?: string;
  warningType?: string; // NEAR_EXPIRY, EXPIRED_USED, LOW_STOCK
  expiryDate?: string;
  daysUntilExpiry?: number;
  message?: string;
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

// ============================================
// API 6.3 - EXPIRING ALERTS
// ============================================

export enum BatchStatus {
  EXPIRED = 'EXPIRED',           // daysRemaining < 0
  CRITICAL = 'CRITICAL',         // 0 <= daysRemaining <= 7
  EXPIRING_SOON = 'EXPIRING_SOON', // 7 < daysRemaining <= 30
}

export interface ExpiringAlert {
  batchId: number;
  itemCode: string;
  itemName: string;
  categoryName?: string;
  warehouseType: 'COLD' | 'NORMAL';
  lotNumber: string;
  binLocation?: string;
  quantityOnHand: number;
  unitName: string;
  expiryDate: string; // ISO date string
  daysRemaining: number; // Can be negative if expired
  status: BatchStatus;
  supplierName?: string;
}

export interface AlertStats {
  totalAlerts: number;
  expiredCount: number;      // < 0 days
  criticalCount: number;      // 0-7 days
  expiringSoonCount: number; // 7-30 days
  totalQuantity: number;     // SUM(quantity_on_hand)
}

export interface ExpiringAlertsResponse {
  reportDate: string; // ISO datetime string
  thresholdDays: number; // Default 30
  stats: AlertStats;
  meta: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
  alerts: ExpiringAlert[];
}

export interface ExpiringAlertsFilter {
  days?: number; // 1-1095, default 30
  categoryId?: number;
  warehouseType?: 'COLD' | 'NORMAL';
  statusFilter?: BatchStatus; // EXPIRED | CRITICAL | EXPIRING_SOON
  page?: number;
  size?: number;
}


