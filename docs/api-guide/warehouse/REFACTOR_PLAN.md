# Warehouse Module Refactor Plan

**Date:** 2025-11-30  
**Status:** 🟡 IN PROGRESS

## 📋 Overview

Refactor warehouse module để:
- Align với BE API documentation
- Standardize API endpoints và response handling
- Consolidate types và remove duplicates
- Improve error handling consistency
- Optimize service layer structure

---

## 🔍 Issues Identified

### 1. API Endpoint Inconsistencies

**Problem:**
- Mix giữa `/warehouse/...` và `/inventory/...` endpoints
- Không rõ khi nào dùng endpoint nào

**BE Structure:**
- `/api/v1/warehouse/...` - Advanced endpoints (WarehouseV3Controller)
  - `/warehouse/summary` - Advanced inventory summary (API 6.1)
  - `/warehouse/batches/{id}` - Advanced batch details (API 6.2)
  - `/warehouse/alerts/expiring` - Expiring alerts (API 6.3)
  - `/warehouse/import` - Import transaction (API 6.4)
  - `/warehouse/items` - Item master CRUD (API 6.9, 6.10)
  - `/warehouse/items/{id}/units` - Get units (API 6.11)
  - `/warehouse/items/units/convert` - Convert units (API 6.12)
  - `/warehouse/suppliers` - Supplier CRUD (API 6.13-6.16)
  - `/warehouse/consumables/services/{id}` - Service consumables (API 6.17)
  - `/warehouse/transactions` - Transaction history (API 6.6, 6.7)

- `/api/v1/inventory/...` - Simple endpoints (InventoryController)
  - `/inventory/summary` - Simple inventory summary
  - `/inventory/{id}` - Item detail
  - `/inventory/batches/{id}` - Simple batch list
  - `/inventory/stats` - Stats
  - `/inventory/categories` - Categories
  - `/inventory/export` - Export transaction (API 6.5)

**Solution:**
- Use `/warehouse/...` for advanced features (recommended)
- Use `/inventory/...` only for simple/legacy endpoints
- Document endpoint choice rationale

---

### 2. Response Handling Inconsistencies

**Problem:**
- Some services extract `response.data.data`
- Some extract `response.data`
- Some handle both cases

**Current Pattern:**
```typescript
// Pattern 1: Direct extraction
const data = response.data;

// Pattern 2: Nested extraction
const data = response.data.data || response.data;

// Pattern 3: extractPayload helper
const payload = extractPayload(response);
```

**Solution:**
- Standardize response extraction
- Create utility function `extractApiResponse<T>(response)`
- Handle BE response wrapper consistently

---

### 3. Type Definitions Scattered

**Problem:**
- Types defined in multiple files:
  - `src/types/warehouse.ts` - Main types
  - `src/types/supplier.ts` - Supplier types
  - `src/types/serviceConsumable.ts` - Service consumable types
  - `src/services/inventoryService.ts` - Inline types (ItemMasterV1, CategoryV1, etc.)
  - `src/services/storageService.ts` - Inline types

**Solution:**
- Consolidate all warehouse-related types into `src/types/warehouse.ts`
- Remove duplicate type definitions
- Keep supplier and serviceConsumable types separate (different domain)

---

### 4. Service Layer Structure

**Problem:**
- `inventoryService` quá lớn (754 lines)
- Mix nhiều responsibilities:
  - Item master CRUD
  - Batch management
  - Category management
  - Expiring alerts
  - Import/Export transactions

**Solution:**
- Split into focused services:
  - `itemMasterService.ts` - Item master CRUD (API 6.9, 6.10)
  - `batchService.ts` - Batch operations (API 6.2)
  - `expiringAlertsService.ts` - Expiring alerts (API 6.3)
  - Keep `inventoryService.ts` for summary/stats only
  - Keep `storageService.ts` for transactions (API 6.6, 6.7)
  - Keep `supplierService.ts` as is
  - Keep `itemUnitService.ts` as is
  - Keep `serviceConsumableService.ts` as is

---

### 5. Error Handling Inconsistencies

**Problem:**
- Some services have detailed error logging
- Some have minimal error handling
- Error messages not standardized

**Solution:**
- Create `WarehouseError` class
- Standardize error logging format
- Add error context (endpoint, params, user info)

---

## 🎯 Refactor Strategy

### Phase 1: Standardize API Endpoints ✅

**Tasks:**
1. ✅ Document endpoint mapping (BE docs → FE services)
2. ✅ Update services to use correct endpoints
3. ✅ Remove deprecated endpoint usage

**Files to Update:**
- `src/services/inventoryService.ts` - Switch to `/warehouse/...` where appropriate
- `src/services/storageService.ts` - Verify endpoints match BE docs

---

### Phase 2: Consolidate Types ✅

**Tasks:**
1. ✅ Move inline types from services to `src/types/warehouse.ts`
2. ✅ Remove duplicate type definitions
3. ✅ Update imports across codebase

**Files to Update:**
- `src/types/warehouse.ts` - Add missing types
- `src/services/inventoryService.ts` - Remove inline types, import from types
- `src/services/storageService.ts` - Remove inline types, import from types

---

### Phase 3: Standardize Response Handling ✅

**Tasks:**
1. ✅ Create `extractApiResponse` utility
2. ✅ Update all services to use utility
3. ✅ Handle BE response wrapper consistently

**Files to Create:**
- `src/utils/apiResponse.ts` - Response extraction utility

**Files to Update:**
- All service files

---

### Phase 4: Refactor Service Structure ✅

**Tasks:**
1. ✅ Split `inventoryService` into focused services
2. ✅ Update components to use new services
3. ✅ Remove deprecated service methods

**Files to Create:**
- `src/services/itemMasterService.ts`
- `src/services/batchService.ts`
- `src/services/expiringAlertsService.ts`

**Files to Update:**
- `src/services/inventoryService.ts` - Keep only summary/stats
- All components using inventoryService

---

### Phase 5: Standardize Error Handling ✅

**Tasks:**
1. ✅ Create `WarehouseError` class
2. ✅ Update all services to use standardized error handling
3. ✅ Add error context logging

**Files to Create:**
- `src/utils/warehouseErrors.ts`

**Files to Update:**
- All service files

---

## 📝 Implementation Checklist

### Phase 1: API Endpoints
- [ ] Document endpoint mapping
- [ ] Update `inventoryService.getSummary()` - Use `/warehouse/summary` (API 6.1)
- [ ] Update `inventoryService.getBatchesByItemId()` - Use `/warehouse/batches/{id}` (API 6.2)
- [ ] Update `inventoryService.getExpiringAlerts()` - Verify `/warehouse/alerts/expiring` (API 6.3)
- [ ] Update `inventoryService.createImportTransaction()` - Verify `/warehouse/import` (API 6.4)
- [ ] Update `inventoryService.createExportTransaction()` - Verify `/inventory/export` (API 6.5) or `/warehouse/export`
- [ ] Verify `storageService` endpoints match API 6.6, 6.7

### Phase 2: Types
- [ ] Move `ItemMasterV1` to `warehouse.ts`
- [ ] Move `CategoryV1` to `warehouse.ts`
- [ ] Move `InventorySummary` to `warehouse.ts`
- [ ] Move `InventoryFilter` to `warehouse.ts`
- [ ] Remove duplicates
- [ ] Update all imports

### Phase 3: Response Handling
- [ ] Create `extractApiResponse` utility
- [ ] Update `inventoryService`
- [ ] Update `storageService`
- [ ] Update `supplierService`
- [ ] Update `itemUnitService`
- [ ] Update `serviceConsumableService`

### Phase 4: Service Structure
- [ ] Create `itemMasterService.ts`
- [ ] Create `batchService.ts`
- [ ] Create `expiringAlertsService.ts`
- [ ] Refactor `inventoryService.ts` (keep only summary/stats)
- [ ] Update components

### Phase 5: Error Handling
- [ ] Create `WarehouseError` class
- [ ] Update all services
- [ ] Add error context

---

## 🔗 API Endpoint Mapping

### Inventory & Items

| API | Endpoint | Controller | Service Method |
|-----|----------|------------|----------------|
| 6.1 | `GET /warehouse/summary` | WarehouseV3Controller | `inventoryService.getSummary()` |
| 6.2 | `GET /warehouse/batches/{id}` | WarehouseV3Controller | `batchService.getBatches()` |
| 6.3 | `GET /warehouse/alerts/expiring` | WarehouseV3Controller | `expiringAlertsService.getAlerts()` |
| 6.8 | `GET /warehouse/items` | ItemMasterController | `itemMasterService.getAll()` |
| 6.9 | `POST /warehouse/items` | ItemMasterController | `itemMasterService.create()` |
| 6.10 | `PUT /warehouse/items/{id}` | ItemMasterController | `itemMasterService.update()` |
| 6.11 | `GET /warehouse/items/{id}/units` | ItemMasterController | `itemUnitService.getItemUnits()` |
| 6.12 | `POST /warehouse/items/units/convert` | ItemMasterController | `itemUnitService.convertUnits()` |

### Transactions

| API | Endpoint | Controller | Service Method |
|-----|----------|------------|----------------|
| 6.4 | `POST /warehouse/import` | InventoryController | `inventoryService.createImportTransaction()` |
| 6.5 | `POST /inventory/export` | InventoryController | `inventoryService.createExportTransaction()` |
| 6.6 | `GET /warehouse/transactions` | TransactionHistoryController | `storageService.getAll()` |
| 6.7 | `GET /warehouse/transactions/{id}` | TransactionHistoryController | `storageService.getById()` |

### Suppliers

| API | Endpoint | Controller | Service Method |
|-----|----------|------------|----------------|
| 6.13 | `GET /warehouse/suppliers/list` | SupplierController | `supplierService.getSuppliersWithMetrics()` |
| 6.14 | `POST /warehouse/suppliers` | SupplierController | `supplierService.create()` |
| 6.15 | `PUT /warehouse/suppliers/{id}` | SupplierController | `supplierService.update()` |
| 6.16 | `DELETE /warehouse/suppliers/{id}` | SupplierController | `supplierService.delete()` |

### Service Consumables

| API | Endpoint | Controller | Service Method |
|-----|----------|------------|----------------|
| 6.17 | `GET /warehouse/consumables/services/{id}` | ServiceConsumableController | `serviceConsumableService.getServiceConsumables()` |

---

## 📊 Current vs Target Structure

### Current Structure

```
src/services/
├── inventoryService.ts (754 lines) - Too large, mixed responsibilities
├── storageService.ts (492 lines) - OK
├── supplierService.ts (263 lines) - OK
├── itemUnitService.ts (128 lines) - OK
└── serviceConsumableService.ts (60 lines) - OK
```

### Target Structure

```
src/services/
├── inventoryService.ts (200 lines) - Summary/stats only
├── itemMasterService.ts (300 lines) - Item master CRUD (API 6.9, 6.10)
├── batchService.ts (150 lines) - Batch operations (API 6.2)
├── expiringAlertsService.ts (100 lines) - Expiring alerts (API 6.3)
├── storageService.ts (492 lines) - Transactions (API 6.6, 6.7) - Keep as is
├── supplierService.ts (263 lines) - Suppliers (API 6.13-6.16) - Keep as is
├── itemUnitService.ts (128 lines) - Units (API 6.11, 6.12) - Keep as is
└── serviceConsumableService.ts (60 lines) - Consumables (API 6.17) - Keep as is
```

---

## 🚀 Implementation Order

1. **Phase 1** - Standardize endpoints (Critical - affects all APIs)
2. **Phase 2** - Consolidate types (Foundation - needed for refactor)
3. **Phase 3** - Standardize response handling (Improves consistency)
4. **Phase 4** - Refactor service structure (Improves maintainability)
5. **Phase 5** - Standardize error handling (Improves debugging)

---

## ✅ Success Criteria

- [ ] All API endpoints match BE documentation
- [ ] No duplicate type definitions
- [ ] Consistent response handling across all services
- [ ] Services are focused and maintainable (< 300 lines each)
- [ ] Standardized error handling with context
- [ ] All components updated to use new structure
- [ ] No breaking changes to existing functionality

---

**Last Updated:** 2025-11-30  
**Status:** 🟡 IN PROGRESS

