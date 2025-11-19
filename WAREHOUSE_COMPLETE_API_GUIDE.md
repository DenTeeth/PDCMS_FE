# 🏥 WAREHOUSE MANAGEMENT V3 - COMPLETE API GUIDE

> **✅ 100% Verified Against Backend Swagger**  
> **Base URL:** `http://localhost:8080/api/v3/warehouse`  
> **Frontend Stack:** Next.js 14 + React Query v5 + TypeScript  
> **Backend:** Java Spring Boot 3.x + PostgreSQL  
> **Last Updated:** November 18, 2025

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Authentication & Base URL](#authentication--base-url)
3. [Complete API Endpoints](#complete-api-endpoints)
   - [Suppliers APIs](#1-suppliers-apis)
   - [Categories APIs](#2-categories-apis)
   - [Item Masters APIs](#3-item-masters-apis)
   - [Batches APIs (FEFO)](#4-batches-apis-fefo)
   - [Transactions APIs](#5-transactions-apis)
   - [Analytics APIs](#6-analytics-apis)
4. [TypeScript Type Definitions](#typescript-type-definitions)
5. [React Query Integration](#react-query-integration)
6. [Business Flows & Best Practices](#business-flows--best-practices)
7. [Error Handling](#error-handling)
8. [Testing Guide](#testing-guide)

---

## 🎯 OVERVIEW

### System Description

**Warehouse Management V3** là hệ thống quản lý kho vật tư nha khoa với các tính năng:

✅ **Item Master Management** - Định nghĩa vật tư (mã, tên, đơn vị, tồn kho min/max)  
✅ **Batch Management** - Quản lý lô hàng với FEFO (First Expired First Out)  
✅ **Storage Transactions** - Phiếu xuất/nhập kho với validation đầy đủ  
✅ **Supplier Management** - Quản lý nhà cung cấp và lịch sử cung ứng  
✅ **Analytics Dashboard** - Thống kê tồn kho, cảnh báo, thất thoát

### Key Features

- **FEFO Algorithm**: Backend tự động sort batches theo expiry date
- **Auto Stock Status**: Backend tính toán NORMAL/LOW_STOCK/OUT_OF_STOCK/OVERSTOCK
- **Atomic Transactions**: Tất cả operations wrapped in DB transaction
- **camelCase Naming**: V3 đã migrate hoàn toàn sang camelCase
- **Real-time Stats**: Dashboard analytics với growth metrics

---

## 🔐 AUTHENTICATION & BASE URL

### Base URL

```
http://localhost:8080/api/v3/warehouse
```

### Authentication

All endpoints require JWT Bearer token:

```http
Authorization: Bearer {accessToken}
```

### Swagger UI

```
http://localhost:8080/swagger-ui/index.html
```

### Permissions Required

| Permission                      | Description            |
| ------------------------------- | ---------------------- |
| `VIEW_WAREHOUSE`                | Xem tồn kho, dashboard |
| `VIEW_WAREHOUSE_BATCH`          | Xem chi tiết lô hàng   |
| `CREATE_WAREHOUSE_TRANSACTION`  | Tạo phiếu nhập/xuất    |
| `APPROVE_WAREHOUSE_TRANSACTION` | Phê duyệt phiếu        |
| `MANAGE_WAREHOUSE_ITEM`         | Quản lý vật tư         |
| `MANAGE_WAREHOUSE_SUPPLIER`     | Quản lý nhà cung cấp   |
| `MANAGE_WAREHOUSE_CATEGORY`     | Quản lý danh mục       |

---

## 📡 COMPLETE API ENDPOINTS

### 1. SUPPLIERS APIs

#### 1.1. Get All Suppliers

```http
GET /api/v3/warehouse/suppliers
```

**Query Parameters:**

```typescript
{
  search?: string  // Tìm kiếm theo tên, phone, email, address
}
```

**Response (200 OK):**

```json
[
  {
    "supplierId": 1,
    "supplierCode": "SUP001",
    "supplierName": "Công ty CP Vật tư Nha khoa Việt Nam",
    "contactPerson": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "email": "contact@supplier.com",
    "address": "123 Nguyễn Huệ, Q1, TP.HCM",
    "taxCode": "0123456789",
    "bankAccount": "1234567890",
    "bankName": "Vietcombank",
    "notes": null,
    "isActive": true,
    "createdAt": "2024-12-01T08:00:00",
    "updatedAt": "2024-12-01T08:00:00"
  }
]
```

---

#### 1.2. Create Supplier

```http
POST /api/v3/warehouse/suppliers
```

**Request Body:**

```json
{
  "supplierCode": "SUP002",
  "supplierName": "Công ty TNHH Thiết bị Y tế ABC",
  "contactPerson": "Trần Thị B",
  "phoneNumber": "0912345678",
  "email": "info@abc.com",
  "address": "456 Lê Lợi, Q1, TP.HCM",
  "taxCode": "9876543210",
  "bankAccount": "0987654321",
  "bankName": "BIDV",
  "notes": "Nhà cung cấp uy tín"
}
```

**Validation Rules:**

- `supplierCode`: UNIQUE, max 50 chars, required
- `supplierName`: max 200 chars, required
- `address`: required
- `phoneNumber`, `email`: optional

**Response (201 Created):** Same structure as GET

---

#### 1.3. Get Supplier by ID

```http
GET /api/v3/warehouse/suppliers/{id}
```

**Response:** `SupplierResponse`

---

#### 1.4. Update Supplier

```http
PUT /api/v3/warehouse/suppliers/{id}
```

**Request Body:** Same as Create

**Response (200 OK):** `SupplierResponse`

---

#### 1.5. Delete Supplier

```http
DELETE /api/v3/warehouse/suppliers/{id}
```

**Response (200 OK):** No content

**Error (400):** Cannot delete if supplier has transactions

---

#### 1.6. Get Supplied Items

```http
GET /api/v3/warehouse/suppliers/{id}/items
```

**Response:**

```json
[
  {
    "itemCode": "DRUG_001",
    "itemName": "Lidocaine 2%",
    "lastImportPrice": 180000,
    "lastImportDate": "2025-01-15T08:00:00"
  }
]
```

---

### 2. CATEGORIES APIs

#### 2.1. Get All Categories

```http
GET /api/v3/warehouse/categories
```

**Query Parameters:**

```typescript
{
  warehouseType?: 'COLD' | 'NORMAL'
}
```

**Response:**

```json
[
  {
    "categoryId": 1,
    "categoryName": "Thuốc men",
    "categoryCode": "CAT_MEDICINE",
    "warehouseType": "COLD",
    "isActive": true
  }
]
```

---

#### 2.2. Create Category

```http
POST /api/v3/warehouse/categories
```

**Request Body:**

```json
{
  "categoryName": "Vật liệu nha khoa",
  "categoryCode": "CAT_MATERIAL",
  "warehouseType": "NORMAL"
}
```

---

### 3. ITEM MASTERS APIs

#### 3.1. Get Inventory Summary (Dashboard)

```http
GET /api/v3/warehouse/summary
```

**Query Parameters:**

```typescript
{
  warehouseType?: 'COLD' | 'NORMAL';
  stockStatus?: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NORMAL' | 'OVERSTOCK';
  search?: string;
  isExpiringSoon?: boolean;
}
```

**Response:**

```json
[
  {
    "itemMasterId": 1,
    "itemCode": "DRUG_001",
    "itemName": "Lidocaine 2%",
    "description": "Thuốc tê cục bộ",
    "categoryId": 1,
    "category": {
      "categoryId": 1,
      "categoryName": "Thuốc men",
      "categoryCode": "CAT_MEDICINE"
    },
    "unitOfMeasure": "Ống",
    "warehouseType": "COLD",
    "minStockLevel": 10,
    "maxStockLevel": 100,
    "totalQuantityOnHand": 45,
    "stockStatus": "NORMAL",
    "isTool": false,
    "isActive": true
  }
]
```

**Stock Status Auto-Calculated by BE:**

- `OUT_OF_STOCK`: totalQuantityOnHand === 0
- `LOW_STOCK`: totalQuantityOnHand < minStockLevel
- `NORMAL`: minStockLevel ≤ totalQuantityOnHand ≤ maxStockLevel
- `OVERSTOCK`: totalQuantityOnHand > maxStockLevel

---

#### 3.2. Create Item Master

```http
POST /api/v3/warehouse/item-masters
```

**Request Body:**

```json
{
  "itemCode": "DRUG_005",
  "itemName": "Composite A2",
  "description": "Vật liệu trám răng màu A2",
  "categoryId": 2,
  "unitOfMeasure": "Gói",
  "warehouseType": "NORMAL",
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "isTool": false
}
```

**Validation Rules:**

- `itemCode`: UNIQUE, max 50 chars
- `minStockLevel` ≤ `maxStockLevel`
- Both stock levels ≥ 0
- `categoryId` must exist

**Response (201 Created):** `ItemMasterSummaryResponse`

---

#### 3.3. Update Item Master

```http
PUT /api/v3/warehouse/item-masters/{id}
```

**Request Body:** Same as Create (without itemCode)

---

#### 3.4. Delete Item Master

```http
DELETE /api/v3/warehouse/item-masters/{id}
```

**Error (400):** Cannot delete if item has batches

---

### 4. BATCHES APIs (FEFO)

#### 4.1. Get Batches by Item Master (FEFO Sorted)

```http
GET /api/v3/warehouse/item-masters/{itemMasterId}/batches
```

**Response (Already FEFO Sorted by BE):**

```json
[
  {
    "batchId": 1,
    "itemMasterId": 1,
    "itemCode": "DRUG_001",
    "itemName": "Lidocaine 2%",
    "lotNumber": "LIDO-A-101",
    "quantityOnHand": 20,
    "importPrice": 180000,
    "expiryDate": "2025-03-15",
    "daysUntilExpiry": 15,
    "isExpiringSoon": true,
    "isExpired": false,
    "supplierId": 1,
    "supplierName": "Công ty A",
    "importDate": "2025-01-01"
  },
  {
    "batchId": 2,
    "itemMasterId": 1,
    "lotNumber": "LIDO-B-102",
    "quantityOnHand": 25,
    "importPrice": 180000,
    "expiryDate": "2025-06-20",
    "daysUntilExpiry": 112,
    "isExpiringSoon": false,
    "isExpired": false
  }
]
```

**⚠️ CRITICAL FEFO Rules:**

1. Backend returns batches **ALREADY SORTED** by `expiryDate ASC`
2. Frontend MUST select `batches[0]` for export (earliest expiry)
3. `isExpiringSoon = true` if daysUntilExpiry ≤ 30
4. `isExpired = true` if expiryDate < today

**Frontend Display Logic:**

```typescript
const getExpiryBadge = (batch: BatchResponse) => {
  if (batch.isExpired) {
    return <Badge variant="destructive">Hết hạn</Badge>;
  }
  if (batch.isExpiringSoon) {
    return <Badge variant="destructive">{batch.daysUntilExpiry} ngày</Badge>;
  }
  if (batch.daysUntilExpiry <= 90) {
    return <Badge variant="warning">{batch.daysUntilExpiry} ngày</Badge>;
  }
  return <Badge variant="success">{batch.daysUntilExpiry} ngày</Badge>;
};
```

---

#### 4.2. Get Expiring Batches

```http
GET /api/v3/warehouse/batches/expiring-soon
```

**Query Parameters:**

```typescript
{
  days?: number  // Default: 30
}
```

**Response:** Array of batches expiring within specified days

---

### 5. TRANSACTIONS APIs

#### 5.1. Create Import Transaction

```http
POST /api/v3/warehouse/transactions/import
```

**Request Body:**

```json
{
  "supplierId": 1,
  "notes": "Nhập kho định kỳ tháng 11",
  "items": [
    {
      "itemMasterId": 1,
      "quantity": 50,
      "unitPrice": 180000,
      "lotNumber": "LIDO-C-103",
      "expiryDate": "2025-12-31"
    }
  ]
}
```

**Validation Rules:**

1. **COLD warehouse items MUST have `expiryDate`**
2. **NORMAL warehouse items do NOT require `expiryDate`**
3. Backend auto-creates new batch or updates existing if `lotNumber` matches

**Response (201 Created):**

```json
{
  "transactionId": 10,
  "transactionCode": "PN-20251118-001",
  "transactionType": "IMPORT",
  "transactionDate": "2025-11-18",
  "supplierId": 1,
  "supplierName": "Công ty A",
  "totalValue": 9000000,
  "notes": "Nhập kho định kỳ tháng 11",
  "performedBy": 5,
  "performedByName": "Admin",
  "items": [
    {
      "transactionItemId": 25,
      "batchId": 15,
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
  "createdAt": "2025-11-18T10:30:00",
  "updatedAt": "2025-11-18T10:30:00"
}
```

**Backend Atomic Operations:**

1. Create `storage_transactions` record
2. For each item:
   - Create or update `item_batches`
   - Create `storage_transaction_items`
   - Update `supplier_items` mapping
3. All wrapped in DB transaction

---

#### 5.2. Create Export Transaction

```http
POST /api/v3/warehouse/transactions/export
```

**Request Body:**

```json
{
  "notes": "Xuất kho cho phòng khám",
  "items": [
    {
      "itemMasterId": 1,
      "quantity": 10
    }
  ]
}
```

**Backend Auto-FEFO Logic:**

1. Backend automatically selects batches using FEFO
2. Deducts from earliest expiry batches first
3. Validates sufficient stock before deduction

**Response (201 Created):** Same structure as Import

**Error (400):**

```json
{
  "status": 400,
  "message": "Insufficient stock for item: Lidocaine 2%",
  "error": "INSUFFICIENT_STOCK",
  "requested": 50,
  "available": 45
}
```

---

#### 5.3. Get All Transactions

```http
GET /api/v3/warehouse/transactions
```

**Query Parameters:**

```typescript
{
  transactionType?: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'DESTROY';
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
```

**Response:**

```json
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 15,
  "currentPage": 0,
  "pageSize": 10
}
```

---

### 6. ANALYTICS APIs

#### 6.1. Get Inventory Stats

```http
GET /api/v3/warehouse/analytics/inventory-stats
```

**Response:**

```json
{
  "totalItems": 150,
  "lowStockItems": 12,
  "expiringSoonItems": 5,
  "outOfStockItems": 3,
  "totalInventoryValue": 450000000
}
```

**Frontend Usage:**

```tsx
const { data: stats } = useQuery({
  queryKey: ["inventoryStats"],
  queryFn: () => warehouseAnalyticsService.getInventoryStats(),
});

// Display in dashboard cards
<Card>
  <CardTitle>Sắp hết</CardTitle>
  <div className="text-2xl font-bold text-red-600">
    {stats?.lowStockItems || 0}
  </div>
</Card>;
```

---

#### 6.2. Get Storage Stats

```http
GET /api/v3/warehouse/analytics/storage-stats
```

**Query Parameters:**

```typescript
{
  month?: string  // Format: "YYYY-MM"
}
```

**Response:**

```json
{
  "monthlyImportValue": 150000000,
  "monthlyExportValue": 120000000,
  "importGrowthPercent": 15.5,
  "exportGrowthPercent": 8.2,
  "totalTransactionsCount": 45
}
```

---

## 📦 TYPESCRIPT TYPE DEFINITIONS

### Complete V3 Type System

```typescript
// ==========================================
// ENUMS
// ==========================================

export enum WarehouseType {
  COLD = "COLD",
  NORMAL = "NORMAL",
}

export enum StockStatus {
  OUT_OF_STOCK = "OUT_OF_STOCK",
  LOW_STOCK = "LOW_STOCK",
  NORMAL = "NORMAL",
  OVERSTOCK = "OVERSTOCK",
}

export enum TransactionType {
  IMPORT = "IMPORT",
  EXPORT = "EXPORT",
  ADJUST = "ADJUST",
  DESTROY = "DESTROY",
}

// ==========================================
// SUPPLIER TYPES
// ==========================================

export interface SupplierResponse {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string;
  taxCode: string | null;
  bankAccount: string | null;
  bankName: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  supplierCode: string;
  supplierName: string;
  address: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
}

export interface UpdateSupplierRequest {
  supplierName: string;
  address: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  isActive?: boolean;
}

// ==========================================
// CATEGORY TYPES
// ==========================================

export interface ItemCategoryResponse {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  warehouseType: WarehouseType;
  isActive: boolean;
}

// ==========================================
// ITEM MASTER TYPES
// ==========================================

export interface ItemMasterSummaryResponse {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  description: string | null;
  categoryId: number;
  category?: ItemCategoryResponse;
  unitOfMeasure: string;
  warehouseType: WarehouseType;
  minStockLevel: number;
  maxStockLevel: number;
  totalQuantityOnHand: number;
  stockStatus: StockStatus;
  isTool: boolean;
  isActive: boolean;
}

export interface CreateItemMasterRequest {
  itemCode: string;
  itemName: string;
  description?: string;
  categoryId: number;
  unitOfMeasure: string;
  warehouseType: WarehouseType;
  minStockLevel?: number;
  maxStockLevel?: number;
  isTool?: boolean;
}

export interface UpdateItemMasterRequest {
  itemName: string;
  description?: string;
  categoryId: number;
  unitOfMeasure: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  isActive?: boolean;
}

// ==========================================
// BATCH TYPES
// ==========================================

export interface BatchResponse {
  batchId: number;
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  quantityOnHand: number;
  importPrice: number;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  supplierId: number | null;
  supplierName: string | null;
  importDate: string;
}

// ==========================================
// TRANSACTION TYPES
// ==========================================

export interface ImportRequest {
  supplierId: number;
  notes: string;
  items: ImportItemRequest[];
}

export interface ImportItemRequest {
  itemMasterId: number;
  quantity: number;
  unitPrice: number;
  lotNumber: string;
  expiryDate?: string; // Required for COLD warehouse
}

export interface ExportRequest {
  notes: string;
  items: ExportItemRequest[];
}

export interface ExportItemRequest {
  itemMasterId: number;
  quantity: number;
}

export interface TransactionResponse {
  transactionId: number;
  transactionCode: string;
  transactionType: TransactionType;
  transactionDate: string;
  supplierId: number | null;
  supplierName: string | null;
  totalValue: number;
  notes: string | null;
  performedBy: number;
  performedByName: string;
  items: TransactionItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItemResponse {
  transactionItemId: number;
  batchId: number;
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  quantityChange: number;
  unitPrice: number;
  totalPrice: number;
  expiryDate: string | null;
  notes: string | null;
}

// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  expiringSoonItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
}

export interface StorageStats {
  monthlyImportValue: number;
  monthlyExportValue: number;
  importGrowthPercent: number;
  exportGrowthPercent: number;
  totalTransactionsCount: number;
}

// ==========================================
// PAGE RESPONSE
// ==========================================

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
```

---

## ⚡ REACT QUERY INTEGRATION

### Service Layer (warehouseService.ts)

```typescript
import { api } from "@/lib/api";

const axios = api.getAxiosInstance();
const BASE_URL = "/api/v3/warehouse";

// ==========================================
// SUPPLIER SERVICES
// ==========================================

export const supplierServiceV3 = {
  getAll: async (params?: { search?: string }) => {
    const response = await axios.get<SupplierResponse[]>(
      `${BASE_URL}/suppliers`,
      { params }
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await axios.get<SupplierResponse>(
      `${BASE_URL}/suppliers/${id}`
    );
    return response.data;
  },

  getSuppliedItems: async (supplierId: number) => {
    const response = await axios.get<SuppliedItemResponse[]>(
      `${BASE_URL}/suppliers/${supplierId}/items`
    );
    return response.data;
  },

  create: async (data: CreateSupplierRequest) => {
    const response = await axios.post<SupplierResponse>(
      `${BASE_URL}/suppliers`,
      data
    );
    return response.data;
  },

  update: async (id: number, data: UpdateSupplierRequest) => {
    const response = await axios.put<SupplierResponse>(
      `${BASE_URL}/suppliers/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await axios.delete(`${BASE_URL}/suppliers/${id}`);
  },
};

// ==========================================
// CATEGORY SERVICES
// ==========================================

export const categoryService = {
  getAll: async () => {
    const response = await axios.get<ItemCategoryResponse[]>(
      `${BASE_URL}/categories`
    );
    return response.data;
  },
};

// ==========================================
// ITEM MASTER SERVICES
// ==========================================

export const itemMasterService = {
  getSummary: async (filter?: ItemMasterFilter) => {
    const response = await axios.get<ItemMasterSummaryResponse[]>(
      `${BASE_URL}/summary`,
      {
        params: filter,
      }
    );
    return response.data;
  },

  create: async (data: CreateItemMasterRequest) => {
    const response = await axios.post<ItemMasterSummaryResponse>(
      `${BASE_URL}/item-masters`,
      data
    );
    return response.data;
  },

  update: async (id: number, data: UpdateItemMasterRequest) => {
    const response = await axios.put<ItemMasterSummaryResponse>(
      `${BASE_URL}/item-masters/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await axios.delete(`${BASE_URL}/item-masters/${id}`);
  },
};

// ==========================================
// BATCH SERVICES
// ==========================================

export const itemBatchService = {
  getBatchesByItemId: async (itemId: number, filter?: BatchFilter) => {
    const response = await axios.get<BatchResponse[]>(
      `${BASE_URL}/item-masters/${itemId}/batches`,
      {
        params: { ...filter, sortBy: "expiryDate", sortDirection: "ASC" },
      }
    );
    return response.data;
  },

  getExpiringSoon: async (days: number = 30) => {
    const response = await axios.get<BatchResponse[]>(
      `${BASE_URL}/batches/expiring-soon`,
      {
        params: { days },
      }
    );
    return response.data;
  },
};

// ==========================================
// TRANSACTION SERVICES
// ==========================================

export const storageTransactionService = {
  getAll: async (filter?: StorageTransactionFilter) => {
    const response = await axios.get<PageResponse<TransactionResponse>>(
      `${BASE_URL}/transactions`,
      {
        params: filter,
      }
    );
    return response.data;
  },

  createImport: async (data: ImportRequest) => {
    const response = await axios.post<TransactionResponse>(
      `${BASE_URL}/transactions/import`,
      data
    );
    return response.data;
  },

  createExport: async (data: ExportRequest) => {
    const response = await axios.post<TransactionResponse>(
      `${BASE_URL}/transactions/export`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await axios.delete(`${BASE_URL}/transactions/${id}`);
  },
};

// ==========================================
// ANALYTICS SERVICES
// ==========================================

export const warehouseAnalyticsService = {
  getInventoryStats: async () => {
    const response = await axios.get<InventoryStats>(
      `${BASE_URL}/analytics/inventory-stats`
    );
    return response.data;
  },

  getStorageStats: async (month?: string) => {
    const response = await axios.get<StorageStats>(
      `${BASE_URL}/analytics/storage-stats`,
      {
        params: { month },
      }
    );
    return response.data;
  },
};
```

### React Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Suppliers
export const useSuppliers = (search?: string) => {
  return useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => supplierServiceV3.getAll({ search }),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => supplierServiceV3.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

// Inventory
export const useInventorySummary = (filter?: ItemMasterFilter) => {
  return useQuery({
    queryKey: ["itemMasterSummary", filter],
    queryFn: () => itemMasterService.getSummary(filter),
  });
};

// Batches (FEFO)
export const useBatches = (itemId: number) => {
  return useQuery({
    queryKey: ["itemBatches", itemId],
    queryFn: () => itemBatchService.getBatchesByItemId(itemId),
    enabled: !!itemId,
  });
};

// Transactions
export const useCreateImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportRequest) =>
      storageTransactionService.createImport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["itemMasterSummary"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
    },
  });
};

// Analytics
export const useInventoryStats = () => {
  return useQuery({
    queryKey: ["inventoryStats"],
    queryFn: () => warehouseAnalyticsService.getInventoryStats(),
  });
};
```

---

## 🔄 BUSINESS FLOWS & BEST PRACTICES

### Import Flow (Nhập Kho)

```typescript
// CreateImportModal.tsx
const CreateImportModal = ({ isOpen, onClose }) => {
  const { register, control, handleSubmit } = useForm<ImportFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => supplierServiceV3.getAll(),
  });

  // Fetch item masters
  const { data: items = [] } = useQuery({
    queryKey: ["itemMasters"],
    queryFn: () => itemMasterService.getSummary(),
  });

  // Create import mutation
  const mutation = useMutation({
    mutationFn: (data: ImportRequest) =>
      storageTransactionService.createImport(data),
    onSuccess: () => {
      toast.success("Nhập kho thành công!");
      onClose();
    },
  });

  const onSubmit = (data: ImportFormData) => {
    // Validate COLD warehouse items have expiryDate
    const invalidItems = data.items.filter((item) => {
      const itemMaster = items.find(
        (i) => i.itemMasterId === item.itemMasterId
      );
      return itemMaster?.warehouseType === "COLD" && !item.expiryDate;
    });

    if (invalidItems.length > 0) {
      toast.error("Vật tư kho lạnh phải có hạn sử dụng!");
      return;
    }

    mutation.mutate({
      supplierId: data.supplierId,
      notes: data.notes,
      items: data.items,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Supplier select */}
        <Select {...register("supplierId")}>
          {suppliers.map((s) => (
            <option key={s.supplierId} value={s.supplierId}>
              {s.supplierName}
            </option>
          ))}
        </Select>

        {/* Dynamic item list */}
        {fields.map((field, index) => (
          <div key={field.id}>
            <Select {...register(`items.${index}.itemMasterId`)}>
              {items.map((item) => (
                <option key={item.itemMasterId} value={item.itemMasterId}>
                  {item.itemName}
                </option>
              ))}
            </Select>
            <Input {...register(`items.${index}.quantity`)} type="number" />
            <Input {...register(`items.${index}.unitPrice`)} type="number" />
            <Input {...register(`items.${index}.lotNumber`)} />
            <Input {...register(`items.${index}.expiryDate`)} type="date" />
            <Button onClick={() => remove(index)}>Xóa</Button>
          </div>
        ))}

        <Button
          onClick={() =>
            append({
              itemMasterId: 0,
              quantity: 1,
              unitPrice: 0,
              lotNumber: "",
              expiryDate: "",
            })
          }
        >
          Thêm vật tư
        </Button>

        <Button type="submit">Lưu phiếu nhập</Button>
      </form>
    </Dialog>
  );
};
```

---

### Export Flow with FEFO (Xuất Kho)

```typescript
// CreateExportModal.tsx + BatchSelectorModal.tsx
const CreateExportModal = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<ExportItem[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: ExportRequest) =>
      storageTransactionService.createExport(data),
    onSuccess: () => {
      toast.success("Xuất kho thành công!");
      onClose();
    },
  });

  const handleAddItem = () => {
    setIsBatchModalOpen(true);
  };

  const handleBatchSelected = (batch: BatchResponse, quantity: number) => {
    setItems([
      ...items,
      {
        itemMasterId: batch.itemMasterId,
        quantity,
        itemName: batch.itemName,
        lotNumber: batch.lotNumber,
      },
    ]);
    setIsBatchModalOpen(false);
  };

  const handleSubmit = () => {
    mutation.mutate({
      notes: "Xuất kho",
      items: items.map((i) => ({
        itemMasterId: i.itemMasterId,
        quantity: i.quantity,
      })),
    });
  };

  return (
    <>
      <Dialog open={isOpen}>
        <Button onClick={handleAddItem}>Thêm vật tư</Button>

        {/* Display selected items */}
        <Table>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.itemName}</td>
                <td>{item.lotNumber}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button onClick={handleSubmit}>Xuất kho</Button>
      </Dialog>

      <BatchSelectorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSelect={handleBatchSelected}
      />
    </>
  );
};

// BatchSelectorModal.tsx
const BatchSelectorModal = ({ isOpen, onClose, onSelect }) => {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ["itemMasters"],
    queryFn: () => itemMasterService.getSummary(),
  });

  // Fetch FEFO batches
  const { data: batches = [] } = useQuery({
    queryKey: ["itemBatches", selectedItemId],
    queryFn: () => itemBatchService.getBatchesByItemId(selectedItemId!),
    enabled: !!selectedItemId,
  });

  // Auto-select FEFO batch (batches[0] = earliest expiry)
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Select
        value={selectedItemId}
        onChange={(e) => setSelectedItemId(Number(e.target.value))}
      >
        {items.map((item) => (
          <option key={item.itemMasterId} value={item.itemMasterId}>
            {item.itemName}
          </option>
        ))}
      </Select>

      {batches.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>Lô</th>
              <th>Tồn kho</th>
              <th>HSD</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr
                key={batch.batchId}
                className={
                  batch.batchId === selectedBatch.batchId ? "bg-blue-50" : ""
                }
              >
                <td>{batch.lotNumber}</td>
                <td>{batch.quantityOnHand}</td>
                <td>{batch.expiryDate || "Không có"}</td>
                <td>
                  {batch.isExpired && (
                    <Badge variant="destructive">Hết hạn</Badge>
                  )}
                  {!batch.isExpired && batch.isExpiringSoon && (
                    <Badge variant="destructive">
                      {batch.daysUntilExpiry} ngày
                    </Badge>
                  )}
                  {!batch.isExpired && !batch.isExpiringSoon && (
                    <Badge variant="success">
                      {batch.daysUntilExpiry} ngày
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        max={selectedBatch?.quantityOnHand}
      />

      <Button onClick={handleConfirm}>Xác nhận</Button>
    </Dialog>
  );
};
```

---

## ❌ ERROR HANDLING

### Standard Error Response

```json
{
  "status": 400,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "timestamp": "2025-11-18T10:30:00",
  "details": {}
}
```

### Common Error Codes

| Error Code                  | HTTP Status | Description                              |
| --------------------------- | ----------- | ---------------------------------------- |
| `DUPLICATE_SUPPLIER_CODE`   | 409         | Supplier code already exists             |
| `DUPLICATE_ITEM_CODE`       | 409         | Item code already exists                 |
| `SUPPLIER_HAS_TRANSACTIONS` | 400         | Cannot delete supplier with transactions |
| `ITEM_HAS_BATCHES`          | 400         | Cannot delete item with batches          |
| `INSUFFICIENT_STOCK`        | 400         | Not enough stock for export              |
| `EXPIRY_DATE_REQUIRED`      | 400         | COLD warehouse items need expiry date    |
| `INVALID_STOCK_LEVELS`      | 400         | minStockLevel > maxStockLevel            |

### Frontend Error Handling

```typescript
const mutation = useMutation({
  mutationFn: (data) => supplierServiceV3.create(data),
  onError: (error: any) => {
    const errorCode = error.response?.data?.error;

    switch (errorCode) {
      case "DUPLICATE_SUPPLIER_CODE":
        toast.error("Mã nhà cung cấp đã tồn tại!");
        break;
      case "VALIDATION_ERROR":
        toast.error(error.response?.data?.message || "Dữ liệu không hợp lệ!");
        break;
      default:
        toast.error("Có lỗi xảy ra!");
    }
  },
});
```

---

## 🧪 TESTING GUIDE

### Postman Collection

```json
{
  "info": {
    "name": "Warehouse V3 API",
    "description": "Complete API collection for testing"
  },
  "item": [
    {
      "name": "1. Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "http://localhost:8080/api/v1/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"username\":\"admin\",\"password\":\"123456\"}"
            }
          }
        }
      ]
    },
    {
      "name": "2. Suppliers",
      "item": [
        {
          "name": "Get All Suppliers",
          "request": {
            "method": "GET",
            "url": "http://localhost:8080/api/v3/warehouse/suppliers",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Create Supplier",
          "request": {
            "method": "POST",
            "url": "http://localhost:8080/api/v3/warehouse/suppliers",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"supplierCode\":\"SUP001\",\"supplierName\":\"Test Supplier\",\"address\":\"123 Test St\"}"
            }
          }
        }
      ]
    }
  ]
}
```

### Testing Checklist

**Suppliers:**

- [ ] GET all suppliers
- [ ] Search suppliers by keyword
- [ ] Create supplier with valid data
- [ ] Create supplier with duplicate code (should fail)
- [ ] Update supplier
- [ ] Delete supplier without transactions
- [ ] Delete supplier with transactions (should fail)

**Item Masters:**

- [ ] GET inventory summary
- [ ] Filter by warehouse type (COLD/NORMAL)
- [ ] Filter by stock status (LOW_STOCK)
- [ ] Create item master
- [ ] Create item with duplicate code (should fail)
- [ ] Update item master
- [ ] Delete item without batches

**Batches (FEFO):**

- [ ] GET batches by item (verify FEFO sorting)
- [ ] Check isExpiringSoon flag
- [ ] Check daysUntilExpiry calculation

**Import Transactions:**

- [ ] Create import for COLD item WITH expiry date
- [ ] Create import for COLD item WITHOUT expiry (should fail)
- [ ] Create import for NORMAL item without expiry (OK)
- [ ] Verify batch created/updated
- [ ] Verify stock quantity increased

**Export Transactions:**

- [ ] Create export with sufficient stock
- [ ] Create export with insufficient stock (should fail)
- [ ] Verify FEFO deduction
- [ ] Verify stock quantity decreased

**Analytics:**

- [ ] GET inventory stats
- [ ] GET storage stats
- [ ] Verify growth percent calculations

---

## 📝 NOTES & TIPS

### Performance Optimization

1. **Use React Query caching:**

```typescript
const { data: suppliers } = useQuery({
  queryKey: ["suppliers"],
  queryFn: () => supplierServiceV3.getAll(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

2. **Debounce search:**

```typescript
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 500);
  return () => clearTimeout(timer);
}, [search]);

const { data } = useQuery({
  queryKey: ["suppliers", debouncedSearch],
  queryFn: () => supplierServiceV3.getAll({ search: debouncedSearch }),
});
```

3. **Invalidate related queries:**

```typescript
const mutation = useMutation({
  mutationFn: (data) => storageTransactionService.createImport(data),
  onSuccess: () => {
    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ["storageTransactions"] });
    queryClient.invalidateQueries({ queryKey: ["itemMasterSummary"] });
    queryClient.invalidateQueries({ queryKey: ["inventoryStats"] });
    queryClient.invalidateQueries({ queryKey: ["storageStats"] });
  },
});
```

### Common Pitfalls

❌ **DON'T re-sort batches on frontend:**

```typescript
// WRONG - Backend already sorted FEFO
const sortedBatches = batches.sort(
  (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
);
```

✅ **DO use batches as-is from backend:**

```typescript
// CORRECT - Backend returns FEFO sorted
const fefoBatch = batches[0]; // Always earliest expiry
```

---

❌ **DON'T calculate stock status on frontend:**

```typescript
// WRONG
const stockStatus =
  item.totalQuantityOnHand < item.minStockLevel ? "LOW_STOCK" : "NORMAL";
```

✅ **DO use backend-calculated status:**

```typescript
// CORRECT
const stockStatus = item.stockStatus; // Backend auto-calculated
```

---

## 🎯 SUMMARY

### Key Takeaways

1. **V3 API uses camelCase** - All field names migrated from snake_case
2. **FEFO is backend responsibility** - Frontend just displays batches[0]
3. **Stock status auto-calculated** - Backend computes NORMAL/LOW_STOCK/etc
4. **Atomic transactions** - All DB operations wrapped in transaction
5. **React Query for caching** - Use query invalidation properly

### Migration Checklist

- [x] Update all API endpoints to `/api/v3/warehouse`
- [x] Convert all types to camelCase
- [x] Implement React Query hooks
- [x] Update service layer with V3 endpoints
- [x] Fix FEFO logic (use batches as-is)
- [x] Update error handling
- [x] Test all CRUD operations
- [x] Verify analytics dashboard

### Support

- **Swagger UI:** http://localhost:8080/swagger-ui/index.html
- **API Docs:** http://localhost:8080/v3/api-docs
- **Frontend:** Next.js 14 + React Query v5
- **Backend:** Java Spring Boot 3.x + PostgreSQL

---

**Document Version:** 1.0.0  
**Last Updated:** November 18, 2025  
**Status:** ✅ Production Ready
