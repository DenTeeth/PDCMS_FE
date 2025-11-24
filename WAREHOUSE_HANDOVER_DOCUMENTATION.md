# 📦 WAREHOUSE MODULE - FRONTEND HANDOVER DOCUMENTATION

> **Tài liệu bàn giao Frontend cho Module Quản lý Kho Vật tư Nha khoa**  
> **Dự án:** PDCMS (Private Dental Clinic Management System)  
> **Module:** Warehouse Management (Quản lý Kho)  
> **Tech Stack:** Next.js 15 + React Query v5 + TypeScript + Tailwind CSS  
> **Backend API:** Spring Boot + PostgreSQL  
> **Người viết:** [Tên dev handover]  
> **Ngày bàn giao:** November 24, 2025

---

## 📑 MỤC LỤC

1. [Tổng quan Module](#1-tổng-quan-module)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Database Schema](#3-database-schema)
4. [API Documentation](#4-api-documentation)
5. [Services Layer](#5-services-layer)
6. [Pages & Components](#6-pages--components)
7. [Business Logic & Use Cases](#7-business-logic--use-cases)
8. [Testing Guide](#8-testing-guide)
9. [Known Issues & Todo](#9-known-issues--todo)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. TỔNG QUAN MODULE

### 1.1. Mục đích

Module **Warehouse Management** quản lý toàn bộ vật tư, thiết bị nha khoa của phòng khám, bao gồm:

- ✅ **Quản lý vật tư (Item Masters)** - Định nghĩa tên, mã, đơn vị, tồn kho min/max
- ✅ **Quản lý lô hàng (Batches)** - Tracking theo lô nhập, hạn sử dụng, FEFO algorithm
- ✅ **Phiếu nhập/xuất kho (Storage Transactions)** - Tạo phiếu nhập từ NCC, xuất cho khám
- ✅ **Quản lý nhà cung cấp (Suppliers)** - Thông tin NCC, lịch sử cung ứng
- ✅ **Dashboard & Analytics** - Thống kê tồn kho, cảnh báo LOW_STOCK, hết hạn

### 1.2. Warehouse Types

Hệ thống chia kho thành 2 loại:

| Type     | Mô tả                                       | Ví dụ                                    |
| -------- | ------------------------------------------- | ---------------------------------------- |
| `COLD`   | Kho lạnh, cần theo dõi hạn sử dụng          | Thuốc tê, kháng sinh, vật liệu composite |
| `NORMAL` | Kho thường, không yêu cầu bảo quản đặc biệt | Dụng cụ khám, găng tay, khẩu trang       |

### 1.3. Key Concepts

#### Stock Status (Tự động tính)

```typescript
type StockStatus = "NORMAL" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK";

// Logic tính (Backend tự động):
if (currentStock === 0) return "OUT_OF_STOCK";
if (currentStock < minStockLevel) return "LOW_STOCK";
if (currentStock > maxStockLevel) return "OVERSTOCK";
return "NORMAL";
```

#### FEFO Algorithm (First Expired First Out)

- **Backend tự động sort** batches theo `expiry_date ASC`
- **Frontend chỉ hiển thị** và select batch đầu tiên khi xuất kho
- Đảm bảo vật tư sắp hết hạn được sử dụng trước

#### Expiry Warning

```typescript
// Backend tính isExpiringSoon
const daysUntilExpiry = daysBetween(today, expiryDate);
const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
const isExpired = daysUntilExpiry <= 0;
```

---

## 2. CẤU TRÚC THƯ MỤC

### 2.1. File Structure

```
src/
├── app/admin/warehouse/           # Warehouse pages (Admin role)
│   ├── inventory/                 # Trang Tồn kho
│   │   └── page.tsx              # Main inventory dashboard
│   ├── storage-in-out/           # Trang Nhập/Xuất kho
│   │   └── page.tsx              # Storage transactions page
│   ├── suppliers/                # Trang Nhà cung cấp
│   │   └── page.tsx              # Suppliers management
│   └── components/               # Shared components
│       ├── CreateItemMasterModal.tsx
│       ├── ItemDetailModal.tsx
│       ├── BatchSelectorModal.tsx
│       ├── CreateImportModal.tsx
│       ├── CreateExportModal.tsx
│       ├── EditImportModal.tsx
│       ├── EditExportModal.tsx
│       └── SupplierFormModal.tsx
│
├── services/                      # API services
│   ├── inventoryService.ts       # Item Masters & Batches API
│   ├── storageService.ts         # Import/Export transactions API
│   └── supplierService.ts        # Suppliers API
│
├── types/                         # TypeScript types
│   ├── warehouse.ts              # Warehouse-related types
│   └── supplier.ts               # Supplier types
│
└── constants/                     # Constants
    └── permissions.ts            # Warehouse permissions
```

### 2.2. Navigation

Trong `src/constants/permissions.ts`:

```typescript
// Admin có thể truy cập:
{
  name: 'Warehouse',
  icon: faWarehouse,
  hasSubmenu: true,
  submenu: [
    {
      name: 'Inventory',
      href: '/admin/warehouse/inventory',
      description: 'Quản lý tồn kho vật tư',
    },
    {
      name: 'Import/Export',
      href: '/admin/warehouse/storage-in-out',
      description: 'Phiếu nhập/xuất kho',
    },
    {
      name: 'Suppliers',
      href: '/admin/warehouse/suppliers',
      description: 'Quản lý nhà cung cấp',
    },
  ],
}
```

---

## 3. DATABASE SCHEMA

### 3.1. Core Tables

#### `item_masters` - Định nghĩa Vật tư

```sql
CREATE TABLE item_masters (
  item_master_id SERIAL PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE NOT NULL,      -- Mã vật tư (VD: DRUG_001)
  item_name VARCHAR(200) NOT NULL,            -- Tên (VD: Lidocaine 2%)
  category_id INTEGER REFERENCES categories(id),
  unit_of_measure VARCHAR(50) NOT NULL,       -- Đơn vị (Cái, Hộp, Vỉ, Viên)
  warehouse_type VARCHAR(20) NOT NULL,        -- COLD | NORMAL
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  max_stock_level INTEGER NOT NULL DEFAULT 100,
  is_tool BOOLEAN DEFAULT FALSE,              -- TRUE = thiết bị (không có HSD)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_item_masters_code ON item_masters(item_code);
CREATE INDEX idx_item_masters_warehouse_type ON item_masters(warehouse_type);
CREATE INDEX idx_item_masters_category ON item_masters(category_id);
```

**Sample Data:**

```sql
INSERT INTO item_masters (item_code, item_name, unit_of_measure, warehouse_type, min_stock_level, max_stock_level, is_tool) VALUES
('DRUG_001', 'Lidocaine 2%', 'Chai', 'COLD', 5, 50, FALSE),
('TOOL_001', 'Dao cạo vôi (Scaler)', 'Cái', 'NORMAL', 10, 50, TRUE);
```

---

#### `item_batches` - Lô hàng (Batch Tracking)

```sql
CREATE TABLE item_batches (
  batch_id SERIAL PRIMARY KEY,
  item_master_id INTEGER NOT NULL REFERENCES item_masters(item_master_id),
  lot_number VARCHAR(100) NOT NULL,           -- Số lô (VD: LIDO-C-101)
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(18,2) NOT NULL,
  expiry_date DATE,                           -- NULL nếu is_tool = TRUE
  imported_at TIMESTAMP,                      -- Ngày nhập lô này
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_lot_number UNIQUE(item_master_id, lot_number)
);

-- Indexes
CREATE INDEX idx_batches_item ON item_batches(item_master_id);
CREATE INDEX idx_batches_expiry ON item_batches(expiry_date);
CREATE INDEX idx_batches_lot ON item_batches(lot_number);
```

**FEFO Logic:**

```sql
-- Backend tự động sort theo expiry_date ASC
SELECT * FROM item_batches
WHERE item_master_id = ?
  AND quantity_on_hand > 0
ORDER BY expiry_date ASC NULLS LAST;
```

---

#### `storage_transactions` - Phiếu Nhập/Xuất

```sql
CREATE TABLE storage_transactions (
  transaction_id SERIAL PRIMARY KEY,
  transaction_code VARCHAR(50) UNIQUE NOT NULL, -- PN-YYYYMMDD-XXX | PX-YYYYMMDD-XXX
  transaction_type VARCHAR(20) NOT NULL,        -- IMPORT | EXPORT
  transaction_date DATE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(supplier_id),
  total_amount DECIMAL(18,2) DEFAULT 0,
  notes TEXT,
  performed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transactions_type ON storage_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON storage_transactions(transaction_date);
CREATE INDEX idx_transactions_supplier ON storage_transactions(supplier_id);
```

**Transaction Code Format:**

```
IMPORT:  PN-20251118-001, PN-20251118-002, ...
EXPORT:  PX-20251118-001, PX-20251118-002, ...
```

---

#### `storage_transaction_items` - Chi tiết phiếu

```sql
CREATE TABLE storage_transaction_items (
  transaction_item_id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES storage_transactions(transaction_id),
  batch_id INTEGER REFERENCES item_batches(batch_id),
  item_master_id INTEGER NOT NULL REFERENCES item_masters(item_master_id),
  lot_number VARCHAR(100),
  quantity_change INTEGER NOT NULL,           -- Dương = IMPORT, Âm = EXPORT
  unit_price DECIMAL(18,2) NOT NULL,
  total_price DECIMAL(18,2) NOT NULL,         -- quantity * unit_price
  expiry_date DATE,                           -- For new batches (IMPORT)
  notes TEXT
);

-- Indexes
CREATE INDEX idx_transaction_items_txn ON storage_transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_batch ON storage_transaction_items(batch_id);
CREATE INDEX idx_transaction_items_item ON storage_transaction_items(item_master_id);
```

---

#### `categories` - Danh mục vật tư

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  warehouse_type VARCHAR(20) NOT NULL,        -- COLD | NORMAL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO categories (name, description, warehouse_type) VALUES
('Thuốc tê', 'Các loại thuốc gây tê cục bộ', 'COLD'),
('Vật liệu hàn trám', 'Composite, amalgam, cement', 'COLD'),
('Dụng cụ khám', 'Gương khám, thăm dò, kẹp', 'NORMAL');
```

---

#### `suppliers` - Nhà cung cấp

```sql
CREATE TABLE suppliers (
  supplier_id SERIAL PRIMARY KEY,
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  phone_number VARCHAR(20),
  email VARCHAR(100),
  address TEXT NOT NULL,
  tax_code VARCHAR(50),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
```

---

#### `supplier_items` - Mapping Supplier ↔ Items

```sql
CREATE TABLE supplier_items (
  supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id),
  item_master_id INTEGER NOT NULL REFERENCES item_masters(item_master_id),
  last_import_price DECIMAL(18,2),
  last_import_date DATE,
  PRIMARY KEY (supplier_id, item_master_id)
);

-- Tự động update khi tạo phiếu nhập (IMPORT)
-- Backend triggers hoặc service logic
```

---

### 3.2. Entity Relationships

```
┌──────────────┐         ┌──────────────┐
│  categories  │◄───┐    │   suppliers  │
└──────────────┘    │    └──────────────┘
                    │           │
                    │           │ supplies
                    │           ▼
┌──────────────┐    │    ┌──────────────────┐
│item_masters  │◄───┴────┤ supplier_items   │
└──────────────┘         └──────────────────┘
       │
       │ has batches
       ▼
┌──────────────┐
│item_batches  │
└──────────────┘
       │
       │ used in
       ▼
┌─────────────────────────┐       ┌──────────────────────┐
│storage_transaction_items│◄──────┤storage_transactions  │
└─────────────────────────┘       └──────────────────────┘
```

---

## 4. API DOCUMENTATION

### 4.1. Base URL & Authentication

```
Base URL: http://localhost:8080/api/v1
Auth: Bearer {JWT_TOKEN}
```

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

### 4.2. Inventory APIs

#### GET /inventory/summary

Lấy danh sách tồn kho (Dashboard chính)

**Query Parameters:**

```typescript
{
  warehouseType?: 'COLD' | 'NORMAL',
  stockStatus?: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK',
  categoryId?: number,
  search?: string,
  isExpiringSoon?: boolean
}
```

**Response:**

```json
[
  {
    "itemMasterId": 1,
    "itemCode": "DRUG_001",
    "itemName": "Lidocaine 2%",
    "categoryName": "Thuốc tê",
    "unitOfMeasure": "Chai",
    "warehouseType": "COLD",
    "totalQuantity": 45,
    "minStockLevel": 5,
    "maxStockLevel": 50,
    "stockStatus": "NORMAL",
    "isTool": false,
    "nearestExpiryDate": "2026-01-15"
  }
]
```

**Frontend Usage:**

```typescript
import { inventoryService } from "@/services/inventoryService";
import { useQuery } from "@tanstack/react-query";

const { data: items = [] } = useQuery({
  queryKey: ["inventorySummary", filters],
  queryFn: () => inventoryService.getSummary(filters),
});
```

---

#### GET /inventory/batches/{itemMasterId}

Lấy danh sách lô hàng của 1 vật tư (FEFO sorted)

**Response:**

```json
[
  {
    "batchId": 1,
    "itemMasterId": 1,
    "lotNumber": "LIDO-C-101",
    "quantityOnHand": 25,
    "importPrice": 180000,
    "expiryDate": "2025-12-31",
    "importDate": "2025-01-10"
  },
  {
    "batchId": 2,
    "lotNumber": "LIDO-C-102",
    "quantityOnHand": 20,
    "expiryDate": "2026-03-15",
    "importDate": "2025-02-05"
  }
]
```

**FEFO Logic:**

```typescript
// Backend đã sort theo expiry_date ASC
// Frontend chỉ cần lấy batch đầu tiên khi xuất
const batches = await inventoryService.getBatchesByItemId(itemId);
const batchToExport = batches[0]; // Lô sắp hết hạn nhất
```

---

#### POST /inventory/item-master

Tạo vật tư mới

**Request Body:**

```json
{
  "itemCode": "DRUG_002",
  "itemName": "Articaine 4%",
  "categoryId": 1,
  "unitOfMeasure": "Chai",
  "warehouseType": "COLD",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "isTool": false,
  "notes": "Thuốc tê mạnh, dùng cho ca khó"
}
```

**Validation:**

- ✅ `itemCode` UNIQUE
- ✅ `minStockLevel` <= `maxStockLevel`
- ✅ `categoryId` must exist
- ✅ Both stock levels >= 0

---

#### PUT /inventory/item-master/{id}

Cập nhật vật tư (không update `itemCode`)

**Request Body:**

```json
{
  "itemName": "Articaine 4% (Updated)",
  "minStockLevel": 15,
  "maxStockLevel": 120
}
```

---

#### DELETE /inventory/item-master/{id}

Xóa vật tư

**Error (400):**

```json
{
  "message": "Cannot delete item with existing batches or transactions"
}
```

---

### 4.3. Storage APIs

#### POST /storage/import

Tạo phiếu nhập kho

**Request Body:**

```json
{
  "supplierId": 1,
  "transactionDate": "2025-11-18",
  "notes": "Nhập kho định kỳ tháng 11",
  "items": [
    {
      "itemMasterId": 1,
      "lotNumber": "LIDO-C-103",
      "quantity": 50,
      "importPrice": 180000,
      "expiryDate": "2025-12-31"
    }
  ]
}
```

**Backend Atomic Operations:**

1. Create `storage_transactions` record
2. For each item:
   - Create or update `item_batches`
   - Create `storage_transaction_items`
   - Update `item_masters.current_stock` (calculated field)
   - Update `supplier_items` mapping
3. All wrapped in DB transaction

**Response:**

```json
{
  "transactionId": 25,
  "transactionCode": "PN-20251118-001",
  "transactionType": "IMPORT",
  "transactionDate": "2025-11-18",
  "supplierId": 1,
  "supplierName": "Công ty CP Vật tư Nha khoa Việt Nam",
  "totalAmount": 9000000,
  "items": [
    {
      "transactionItemId": 25,
      "itemMasterId": 1,
      "itemCode": "DRUG_001",
      "itemName": "Lidocaine 2%",
      "lotNumber": "LIDO-C-103",
      "quantityChange": 50,
      "unitPrice": 180000,
      "totalPrice": 9000000,
      "expiryDate": "2025-12-31"
    }
  ],
  "createdAt": "2025-11-18T10:30:00"
}
```

---

#### POST /storage/export

Tạo phiếu xuất kho (Sử dụng FEFO)

**Request Body:**

```json
{
  "transactionDate": "2025-11-18",
  "notes": "Xuất kho cho khám bệnh",
  "items": [
    {
      "batchId": 1,
      "quantity": 5
    }
  ]
}
```

**Backend Validation:**

- ✅ Check `batch.quantityOnHand >= quantity`
- ✅ Update `item_batches.quantity_on_hand -= quantity`
- ✅ Create negative `storage_transaction_items` (quantityChange = -5)

**Response:**

```json
{
  "transactionId": 90,
  "transactionCode": "PX-20251118-001",
  "transactionType": "EXPORT",
  "totalAmount": 900000,
  "items": [
    {
      "transactionItemId": 157,
      "batchId": 1,
      "itemMasterId": 1,
      "itemCode": "DRUG_001",
      "lotNumber": "LIDO-C-101",
      "quantityChange": -5,
      "unitPrice": 180000,
      "totalPrice": 900000
    }
  ]
}
```

---

#### GET /storage

Lấy danh sách phiếu nhập/xuất

**Query Parameters:**

```typescript
{
  transactionType?: 'IMPORT' | 'EXPORT',
  month?: number,
  year?: number,
  search?: string
}
```

**Response:**

```json
[
  {
    "transactionId": 25,
    "transactionCode": "PN-20251118-001",
    "transactionType": "IMPORT",
    "transactionDate": "2025-11-18",
    "supplierName": "Công ty CP Vật tư Nha khoa",
    "totalAmount": 9000000,
    "createdByName": "Admin",
    "createdAt": "2025-11-18T10:30:00"
  }
]
```

---

#### GET /storage/{id}

Chi tiết phiếu nhập/xuất

**Response:** Same as POST response above

---

#### GET /storage/stats

Thống kê import/export theo tháng

**Query Parameters:**

```typescript
{
  month?: number,  // 1-12
  year?: number    // 2025
}
```

**Response:**

```json
{
  "monthlyImportValue": 50000000,
  "monthlyExportValue": 30000000,
  "importGrowthPercent": 15.5,
  "exportGrowthPercent": 8.2,
  "totalImportTransactions": 23,
  "totalExportTransactions": 45
}
```

---

### 4.4. Supplier APIs

#### GET /suppliers

Lấy danh sách nhà cung cấp (Pagination)

**Query Parameters:**

```typescript
{
  page?: number,      // 0-based
  size?: number,      // Default 10
  sort?: string,      // "supplierName,asc"
  search?: string     // Tìm theo tên, phone, email
}
```

**Response:**

```json
{
  "content": [
    {
      "supplierId": 1,
      "supplierCode": "SUP001",
      "supplierName": "Công ty CP Vật tư Nha khoa Việt Nam",
      "contactPerson": "Nguyễn Văn A",
      "phoneNumber": "0901234567",
      "email": "contact@supplier.com",
      "address": "123 Nguyễn Huệ, Q1, TP.HCM",
      "isActive": true,
      "totalSuppliedItems": 15
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 50,
  "totalPages": 5
}
```

---

#### GET /suppliers/{id}/supplied-items

Lấy danh sách vật tư NCC cung cấp

**Response:**

```json
[
  {
    "itemMasterId": 1,
    "itemCode": "DRUG_001",
    "itemName": "Lidocaine 2%",
    "unitOfMeasure": "Chai",
    "lastImportPrice": 180000,
    "lastImportDate": "2025-11-18"
  }
]
```

---

## 5. SERVICES LAYER

### 5.1. inventoryService.ts

**Location:** `src/services/inventoryService.ts`

**Key Methods:**

```typescript
export const inventoryService = {
  // Dashboard - Danh sách tồn kho
  getSummary: (filter?: InventoryFilter) => Promise<InventorySummary[]>,

  // Chi tiết vật tư
  getById: (id: number) => Promise<ItemMasterV1>,

  // Lô hàng (FEFO sorted)
  getBatchesByItemId: (itemId: number) => Promise<ItemBatchV1[]>,

  // Thống kê
  getStats: () => Promise<InventoryStats>,

  // Categories
  getCategories: () => Promise<CategoryV1[]>,

  // CRUD
  create: (data: CreateItemMasterRequest) => Promise<ItemMasterV1>,
  update: (id: number, data: UpdateItemMasterRequest) => Promise<ItemMasterV1>,
  delete: (id: number) => Promise<void>,

  // Category CRUD
  createCategory: (data) => Promise<CategoryV1>,
  updateCategory: (id, data) => Promise<CategoryV1>,
  deleteCategory: (id) => Promise<void>,
};
```

**Usage Example:**

```typescript
import { inventoryService } from "@/services/inventoryService";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const createMutation = useMutation({
  mutationFn: (data: CreateItemMasterRequest) => inventoryService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
    toast.success("Tạo vật tư thành công!");
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
  },
});
```

---

### 5.2. storageService.ts

**Location:** `src/services/storageService.ts`

**Key Methods:**

```typescript
export const storageService = {
  // Import/Export
  createImport: (data: ImportRequest) => Promise<StorageTransaction>,
  createExport: (data: ExportRequest) => Promise<StorageTransaction>,

  // List & Detail
  getAll: (filter?: StorageFilter) => Promise<StorageTransaction[]>,
  getById: (id: number) => Promise<StorageTransaction>,

  // Update/Delete
  updateNotes: (id: number, notes: string) => Promise<StorageTransaction>,
  delete: (id: number) => Promise<void>,

  // Stats
  getStats: (month?: number, year?: number) => Promise<StorageStats>,
};
```

**Usage Example:**

```typescript
const importMutation = useMutation({
  mutationFn: (data: ImportRequest) => storageService.createImport(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["storageTransactions"] });
    queryClient.invalidateQueries({ queryKey: ["inventorySummary"] }); // Update stock
    toast.success("Tạo phiếu nhập thành công!");
  },
});
```

---

### 5.3. supplierService.ts

**Location:** `src/services/supplierService.ts`

**Key Methods:**

```typescript
export const supplierService = {
  // List with pagination
  getAll: (params?: SupplierQueryParams) =>
    Promise<PageResponse<SupplierSummaryResponse>>,

  // Detail
  getById: (id: number) => Promise<SupplierDetailResponse>,
  getSuppliedItems: (id: number) => Promise<SuppliedItemResponse[]>,

  // CRUD
  create: (data: CreateSupplierRequest) => Promise<SupplierResponse>,
  update: (id: number, data: UpdateSupplierRequest) =>
    Promise<SupplierResponse>,
  delete: (id: number) => Promise<void>,
};
```

---

## 6. PAGES & COMPONENTS

### 6.1. Inventory Page (`/admin/warehouse/inventory`)

**File:** `src/app/admin/warehouse/inventory/page.tsx`

**Features:**

- ✅ Tabs: ALL, COLD, NORMAL, LOW_STOCK, EXPIRING_SOON
- ✅ Search, Sort, Pagination (client-side)
- ✅ Create/Edit/Delete Item Master
- ✅ View detail (batches, transaction history)

**Key Components:**

```typescript
<CreateItemMasterModal
  isOpen={isCreateModalOpen}
  onClose={handleCloseModal}
  item={editingItem}
  categories={categories}
  onSuccess={() => refetch()}
/>

<ItemDetailModal
  isOpen={isViewModalOpen}
  onClose={handleCloseViewModal}
  itemId={viewingItemId}
/>
```

**State Management:**

```typescript
const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
const [search, setSearch] = useState("");
const [page, setPage] = useState(0);
const [sortField, setSortField] = useState("itemName");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

// Fetch data
const { data: items = [], isLoading } = useQuery({
  queryKey: ["inventorySummary", { warehouseType, stockStatus, search }],
  queryFn: () => inventoryService.getSummary(filters),
});

// Client-side filtering & sorting
const filteredData = useMemo(() => {
  let result = items;

  if (search) {
    result = result.filter(
      (item) =>
        item.itemName.toLowerCase().includes(search.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(search.toLowerCase())
    );
  }

  result.sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  return result;
}, [items, search, sortField, sortDirection]);
```

---

### 6.2. Storage In/Out Page (`/admin/warehouse/storage-in-out`)

**File:** `src/app/admin/warehouse/storage-in-out/page.tsx`

**Features:**

- ✅ Tabs: ALL, IMPORT, EXPORT
- ✅ Month/Year filter
- ✅ Create Import/Export transaction
- ✅ Edit notes, Delete transaction
- ✅ View detail with items list

**Key Components:**

```typescript
<CreateImportModal
  isOpen={isImportModalOpen}
  onClose={() => setIsImportModalOpen(false)}
  suppliers={suppliers}
  items={allItems}
  onSuccess={() => refetch()}
/>

<CreateExportModal
  isOpen={isExportModalOpen}
  onClose={() => setIsExportModalOpen(false)}
  warehouseType="COLD"
  onSuccess={() => refetch()}
/>

<EditImportModal
  isOpen={isEditImportModalOpen}
  onClose={() => setIsEditImportModalOpen(false)}
  transactionId={editingTransactionId}
/>
```

**Create Export Flow:**

```typescript
// 1. User clicks "Xuất kho"
// 2. Select warehouse type (COLD/NORMAL)
// 3. Open BatchSelectorModal
// 4. User selects item → backend returns FEFO batches
// 5. Auto-select first batch (earliest expiry)
// 6. User enters quantity
// 7. Submit → API POST /storage/export
```

---

### 6.3. Suppliers Page (`/admin/warehouse/suppliers`)

**File:** `src/app/admin/warehouse/suppliers/page.tsx`

**Features:**

- ✅ Server-side pagination
- ✅ Search, Sort
- ✅ Create/Edit/Delete Supplier
- ✅ View supplied items
- ✅ Link to existing items (checkbox selection)

**Pagination:**

```typescript
const { data: pageResponse } = useQuery({
  queryKey: ["suppliers", page, size, sort, search],
  queryFn: () =>
    supplierService.getAll({
      page,
      size,
      sort,
      search,
    }),
  keepPreviousData: true,
});

const suppliers = pageResponse?.content || [];
const totalPages = pageResponse?.totalPages || 0;
```

---

### 6.4. Shared Components

#### CreateItemMasterModal

**Props:**

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: ItemMasterV1; // For edit mode
  categories: CategoryV1[];
  onSuccess: () => void;
}
```

**Form Fields:**

```typescript
const [formData, setFormData] = useState({
  itemCode: "",
  itemName: "",
  unitOfMeasure: "Cái",
  warehouseType: "NORMAL",
  categoryId: 0,
  minStockLevel: 10,
  maxStockLevel: 100,
  isTool: false,
  notes: "",
});
```

**Submit:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (item) {
    // Edit mode
    await updateMutation.mutateAsync({ id: item.id, data: formData });
  } else {
    // Create mode
    await createMutation.mutateAsync(formData);
  }
};
```

---

#### BatchSelectorModal

**Props:**

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (batch: ItemBatch, quantity: number) => void;
  warehouseType: "COLD" | "NORMAL";
}
```

**FEFO Selection:**

```typescript
// Fetch items
const { data: items = [] } = useQuery({
  queryKey: ["itemMasters", warehouseType],
  queryFn: () =>
    inventoryService.getSummary({
      warehouseType,
    }),
});

// Fetch FEFO batches for selected item
const { data: batches = [] } = useQuery({
  queryKey: ["itemBatches", selectedItemId],
  queryFn: () => inventoryService.getBatchesByItemId(selectedItemId!),
  enabled: !!selectedItemId,
});

// Auto-select first batch (FEFO)
const selectedBatch = batches[0];

const handleConfirm = () => {
  if (!selectedBatch) {
    toast.error("Chưa chọn lô hàng!");
    return;
  }

  if (quantity > selectedBatch.quantityOnHand) {
    toast.error("Số lượng vượt quá tồn kho!");
    return;
  }

  onSelect(selectedBatch, quantity);
  onClose();
};
```

---

## 7. BUSINESS LOGIC & USE CASES

### 7.1. Use Case 1: Tạo phiếu NHẬP kho

**Actor:** Admin/Warehouse Staff

**Flow:**

1. Navigate to `/admin/warehouse/storage-in-out`
2. Click "Nhập kho"
3. Select Supplier
4. Add items:
   - Select Item Master
   - Enter Lot Number (VD: LIDO-C-103)
   - Enter Quantity
   - Enter Import Price
   - Select Expiry Date (if not tool)
5. Click Submit

**Backend Processing:**

```
1. Create storage_transactions (IMPORT)
2. For each item:
   a. Find existing batch with same lot_number
   b. If exists: update quantity_on_hand += quantity
   c. If not exists: create new item_batches
   d. Create storage_transaction_items
   e. Update supplier_items mapping
3. Commit transaction
4. Return transaction detail
```

**Frontend Code:**

```typescript
const handleCreateImport = async (data: ImportRequest) => {
  try {
    await storageService.createImport(data);
    toast.success("Tạo phiếu nhập thành công!");
    queryClient.invalidateQueries({ queryKey: ["storageTransactions"] });
    queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
  }
};
```

---

### 7.2. Use Case 2: Tạo phiếu XUẤT kho (FEFO)

**Actor:** Admin/Warehouse Staff

**Flow:**

1. Navigate to `/admin/warehouse/storage-in-out`
2. Click "Xuất kho"
3. Select Warehouse Type (COLD/NORMAL)
4. Open Batch Selector Modal
5. Select Item Master → Backend returns FEFO batches
6. **System auto-selects first batch** (earliest expiry)
7. Enter quantity (validate <= quantityOnHand)
8. Click Add → Can add multiple items
9. Submit

**FEFO Algorithm (Backend):**

```sql
SELECT * FROM item_batches
WHERE item_master_id = ?
  AND quantity_on_hand > 0
ORDER BY
  CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END,  -- NULL last
  expiry_date ASC
LIMIT 10;
```

**Frontend FEFO Selection:**

```typescript
// Backend đã sort, FE chỉ lấy đầu tiên
const { data: batches = [] } = useQuery({
  queryKey: ["itemBatches", itemId],
  queryFn: () => inventoryService.getBatchesByItemId(itemId),
});

const batchToExport = batches[0]; // ✅ Lô sắp hết hạn nhất

// Validation
if (quantity > batchToExport.quantityOnHand) {
  toast.error(`Chỉ còn ${batchToExport.quantityOnHand} sẵn có!`);
  return;
}
```

---

### 7.3. Use Case 3: Cảnh báo vật tư sắp hết hạn

**Actor:** System (Auto daily check)

**Logic:**

```typescript
// Backend tính toán
const isExpiringSoon =
  expiryDate &&
  daysBetween(today, expiryDate) <= 30 &&
  daysBetween(today, expiryDate) > 0;

const isExpired = expiryDate && daysBetween(today, expiryDate) <= 0;
```

**Frontend Display:**

```typescript
// Inventory Page - EXPIRING_SOON tab
const expiringItems = items.filter((item) => item.nearestExpiryDate);

// Badge color
const getExpiryBadge = (expiryDate: string) => {
  const daysLeft = daysBetween(new Date(), new Date(expiryDate));

  if (daysLeft <= 0) {
    return <Badge variant="destructive">Đã hết hạn</Badge>;
  }
  if (daysLeft <= 7) {
    return <Badge variant="destructive">HSD: {daysLeft} ngày</Badge>;
  }
  if (daysLeft <= 30) {
    return <Badge variant="warning">HSD: {daysLeft} ngày</Badge>;
  }
  return <Badge variant="secondary">HSD: {formatDate(expiryDate)}</Badge>;
};
```

---

### 7.4. Use Case 4: Cảnh báo tồn kho thấp

**Logic:**

```typescript
// Backend auto-calculate
const stockStatus = calculateStockStatus(currentStock, minStock, maxStock);

function calculateStockStatus(current, min, max) {
  if (current === 0) return "OUT_OF_STOCK";
  if (current < min) return "LOW_STOCK";
  if (current > max) return "OVERSTOCK";
  return "NORMAL";
}
```

**Frontend Display:**

```typescript
const getStockBadge = (status: StockStatus, quantity: number) => {
  switch (status) {
    case "OUT_OF_STOCK":
      return <Badge variant="destructive">Hết hàng</Badge>;
    case "LOW_STOCK":
      return <Badge variant="warning">Sắp hết ({quantity})</Badge>;
    case "OVERSTOCK":
      return <Badge variant="secondary">Dư thừa ({quantity})</Badge>;
    default:
      return <Badge variant="success">Bình thường</Badge>;
  }
};
```

---

## 8. TESTING GUIDE

### 8.1. Manual Testing Checklist

#### Inventory Page

- [ ] Load inventory list successfully
- [ ] Filter by warehouse type (COLD/NORMAL)
- [ ] Filter by stock status (LOW_STOCK)
- [ ] Search by item name/code
- [ ] Sort by name, quantity, category
- [ ] Create new item → Verify in list
- [ ] Edit item → Verify changes
- [ ] Delete item with batches → Should fail
- [ ] Delete item without batches → Success
- [ ] View item detail → Show batches
- [ ] View item detail → Show transaction history

#### Storage In/Out Page

- [ ] Load transactions list
- [ ] Filter by type (IMPORT/EXPORT)
- [ ] Filter by month/year
- [ ] Create import transaction
  - [ ] Select supplier
  - [ ] Add multiple items
  - [ ] Submit → Verify stock increased
- [ ] Create export transaction
  - [ ] Select item → Backend returns FEFO batches
  - [ ] Verify first batch auto-selected
  - [ ] Enter quantity > available → Should fail
  - [ ] Submit → Verify stock decreased
- [ ] Edit transaction notes
- [ ] Delete transaction → Stock should revert
- [ ] View transaction detail

#### Suppliers Page

- [ ] Load suppliers with pagination
- [ ] Search supplier
- [ ] Create supplier
- [ ] Edit supplier
- [ ] Delete supplier with transactions → Should fail
- [ ] Delete supplier without transactions → Success
- [ ] View supplied items
- [ ] Link existing items to supplier

---

### 8.2. Edge Cases

| Scenario                                | Expected Behavior                         |
| --------------------------------------- | ----------------------------------------- |
| Export quantity > batch stock           | Error: "Số lượng vượt quá tồn kho!"       |
| Import with duplicate lot number        | Update existing batch quantity            |
| Create item with existing code          | Error: "Mã vật tư đã tồn tại!"            |
| Delete item with batches                | Error: "Không thể xóa vật tư có lô hàng!" |
| FEFO with all batches expired           | Show warning, allow selection             |
| Export from tool (no expiry)            | Normal export, no expiry warning          |
| Create import without expiry (non-tool) | Error: "Vật tư này cần nhập hạn sử dụng!" |
| Pagination on last page                 | Disable "Next" button                     |
| Search with no results                  | Show "Không tìm thấy vật tư"              |
| Create supplier with duplicate code     | Error: "Mã nhà cung cấp đã tồn tại!"      |

---

### 8.3. Sample Test Data

**Suppliers:**

```sql
INSERT INTO suppliers VALUES
(1, 'SUP001', 'Công ty CP Vật tư Nha khoa Việt Nam', 'Nguyễn Văn A', '0901234567', 'contact@supplier.com', '123 Nguyễn Huệ, Q1, TP.HCM', '0123456789', '1234567890', 'Vietcombank', NULL, TRUE);
```

**Items:**

```sql
INSERT INTO item_masters VALUES
(1, 'DRUG_001', 'Lidocaine 2%', 1, 'Chai', 'COLD', 5, 50, FALSE),
(21, 'TOOL_001', 'Dao cạo vôi (Scaler)', 3, 'Cái', 'NORMAL', 10, 50, TRUE);
```

**Batches:**

```sql
INSERT INTO item_batches VALUES
(1, 1, 'LIDO-C-101', 25, 180000, '2025-12-31', '2025-01-10'),
(22, 21, 'SCALER-G-2025', 25, 500000, NULL, '2025-01-18');
```

---

## 9. KNOWN ISSUES & TODO

### 9.1. Known Issues

#### 🐛 Critical Issues

1. **Missing Item Code in Transaction Items Response**

   - **Problem:** `storage_transaction_items` không trả về `itemCode`
   - **Impact:** Nhân viên kho không biết bóc vật tư gì
   - **Status:** 🔴 PENDING FIX
   - **Solution:** Update `StorageTransactionItemResponse` DTO to include `itemCode` and `unitOfMeasure`

2. **No Parent-Child Item Relationships**
   - **Problem:** Không quản lý được item cha-con (VD: 1 hộp 10 vỉ)
   - **Impact:** Xuất 2 vỉ không trừ được item cha
   - **Status:** 🔴 PENDING DESIGN
   - **Solution:** Create `item_components` table, implement deduction logic

#### ⚠️ Medium Issues

3. **Unit of Measure Flexibility**

   - **Problem:** `unitOfMeasure` field chưa validation đúng
   - **Impact:** User có thể nhập tùy ý, không consistent
   - **Status:** 🟡 IN PROGRESS
   - **Solution:** Create dropdown with pre-defined units

4. **Expiry Date for Tools**
   - **Problem:** Tools không có expiry nhưng DB schema required
   - **Status:** 🟡 WORKAROUND (using NULL)
   - **Solution:** Add `expiry_tracking_type` column

---

### 9.2. TODO List

#### Phase 1 (Must Have)

- [ ] Fix: Add `itemCode` to transaction items response
- [ ] Fix: Add `unitOfMeasure` validation dropdown
- [ ] Feature: Export transaction to PDF/Excel
- [ ] Feature: Print barcode for batches
- [ ] Feature: Batch merge (combine 2 batches same lot number)

#### Phase 2 (Nice to Have)

- [ ] Feature: Parent-Child item relationships
- [ ] Feature: Item component deduction logic
- [ ] Feature: Unit conversion (Hộp → Vỉ → Viên)
- [ ] Feature: Auto-generate purchase orders when LOW_STOCK
- [ ] Feature: Expiry alert notifications (Email/SMS)
- [ ] Feature: Dashboard charts (Recharts)

#### Phase 3 (Future)

- [ ] Feature: Warehouse locations (Kệ A, Kệ B)
- [ ] Feature: Barcode scanning for export
- [ ] Feature: Inventory audit/stocktake
- [ ] Feature: Supplier performance rating
- [ ] Feature: Integration with accounting module

---

## 10. TROUBLESHOOTING

### 10.1. Common Errors

#### Error: "Unauthorized (401)"

**Cause:** JWT token expired or invalid

**Solution:**

```typescript
// Check token in localStorage
const token = localStorage.getItem("accessToken");
console.log("Token:", token);

// If expired, re-login
window.location.href = "/login";
```

---

#### Error: "Cannot delete item with existing batches"

**Cause:** Item has `item_batches` records

**Solution:**

```typescript
// Check batches first
const batches = await inventoryService.getBatchesByItemId(itemId);
if (batches.length > 0) {
  toast.error("Không thể xóa vật tư có lô hàng!");
  return;
}

// Then delete
await inventoryService.delete(itemId);
```

---

#### Error: "Số lượng vượt quá tồn kho"

**Cause:** Export quantity > `batch.quantityOnHand`

**Solution:**

```typescript
const batch = batches.find((b) => b.batchId === selectedBatchId);

if (quantity > batch.quantityOnHand) {
  toast.error(`Chỉ còn ${batch.quantityOnHand} sẵn có!`);
  return;
}
```

---

### 10.2. React Query Cache Issues

**Symptom:** Data không update sau khi create/edit/delete

**Solution:**

```typescript
// After mutation, invalidate queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["inventorySummary"] });
  queryClient.invalidateQueries({ queryKey: ["storageTransactions"] });
  queryClient.invalidateQueries({ queryKey: ["itemBatches", itemId] });
};
```

---

### 10.3. Pagination Not Working

**Symptom:** Page không đổi khi click Next/Prev

**Solution:**

```typescript
// Ensure page state is updated
const handlePageChange = (newPage: number) => {
  setPage(newPage);
};

// React Query dependency
const { data } = useQuery({
  queryKey: ["suppliers", page, size], // ✅ Include page in queryKey
  queryFn: () => supplierService.getAll({ page, size }),
});
```

---

### 10.4. FEFO Not Working

**Symptom:** Backend không sort batches theo expiry date

**Check:**

```sql
-- Verify batches have expiry_date
SELECT * FROM item_batches WHERE item_master_id = 1 ORDER BY expiry_date ASC NULLS LAST;
```

**Backend Code:**

```java
// Ensure JPA query has ORDER BY
@Query("SELECT b FROM ItemBatch b WHERE b.itemMaster.id = :itemId AND b.quantityOnHand > 0 ORDER BY b.expiryDate ASC NULLS LAST")
List<ItemBatch> findByItemMasterIdOrderByExpiryDate(@Param("itemId") Long itemId);
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation

- [WAREHOUSE_COMPLETE_API_GUIDE.md](./WAREHOUSE_COMPLETE_API_GUIDE.md) - Full API specs
- [WAREHOUSE_FEEDBACK_ANALYSIS.md](./WAREHOUSE_FEEDBACK_ANALYSIS.md) - Mentor feedback & solutions
- [Backend Swagger UI](http://localhost:8080/swagger-ui/index.html) - Live API docs

### External Links

- [React Query v5 Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [PostgreSQL FEFO Implementation](https://wiki.postgresql.org/wiki/First_Expired_First_Out)

---

## 🤝 CONTACT & SUPPORT

**Current Owner:** [Your Name]  
**Email:** [your.email@example.com]  
**Slack:** @yourname  
**Last Update:** November 24, 2025

**New Maintainer:** [Teammate Name]  
**Started:** [Date]

---

## 📝 VERSION HISTORY

| Version | Date       | Changes                                   | Author     |
| ------- | ---------- | ----------------------------------------- | ---------- |
| 1.0.0   | 2025-11-01 | Initial warehouse module implementation   | [You]      |
| 1.1.0   | 2025-11-18 | Added FEFO algorithm, Batch tracking      | [You]      |
| 1.2.0   | 2025-11-24 | Handover documentation, Mentor feedback   | [You]      |
| 2.0.0   | TBD        | Parent-child relationships, Item code fix | [Teammate] |

---

**Chúc bạn làm việc hiệu quả với module Warehouse! 🚀**

Nếu có vấn đề gì không rõ, đọc lại document này hoặc check code examples trong:

- `src/app/admin/warehouse/inventory/page.tsx`
- `src/app/admin/warehouse/storage-in-out/page.tsx`
- `src/services/inventoryService.ts`
