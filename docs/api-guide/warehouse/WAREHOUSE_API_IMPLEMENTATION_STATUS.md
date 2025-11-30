# Warehouse API Implementation Status

**Last Updated:** 2025-01-30  
**Purpose:** Track implementation status of all warehouse APIs from BE and which pages use them

---

## 📊 Summary

| Category | Total APIs | Implemented | Not Implemented | Partial |
|----------|-----------|-------------|-----------------|---------|
| **Inventory** | 15 | 12 | 2 | 1 |
| **Item Master** | 5 | 4 | 1 | 0 |
| **Transactions** | 6 | 6 | 0 | 0 |
| **Suppliers** | 7 | 6 | 1 | 0 |
| **Categories** | 4 | 4 | 0 | 0 |
| **Item Units** | 3 | 2 | 1 | 0 |
| **Alerts** | 1 | 1 | 0 | 0 |
| **TOTAL** | **41** | **35** | **5** | **1** |

---

## ✅ Implemented APIs

### 📦 Inventory Management (`/api/v1/inventory`)

| API | Endpoint | Method | Status | Used In | Notes |
|-----|----------|--------|--------|---------|-------|
| Get All Item Masters | `/inventory` | GET | ✅ | `inventory/page.tsx` | Simple list without pagination |
| Get Item Master By ID | `/inventory/{id}` | GET | ✅ | `components/ItemDetailModal.tsx` | Item detail view |
| **API 1** - Inventory Summary | `/inventory/summary` | GET | ✅ | `page.tsx`, `reports/page.tsx` | Paginated inventory dashboard |
| Get Inventory Stats | `/inventory/stats` | GET | ✅ | `page.tsx` | Dashboard statistics cards |
| **API 3** - Get Batches | `/inventory/batches/{itemMasterId}` | GET | ✅ | `components/BatchSelectorModal.tsx` | FEFO sorted batches |
| Get Categories | `/inventory/categories` | GET | ✅ | `components/CreateItemMasterModal.tsx` | Category dropdown |
| Create Category | `/inventory/categories` | POST | ✅ | `components/CategoryFormModal.tsx` | Create new category |
| Update Category | `/inventory/categories/{id}` | PUT | ✅ | `components/CategoryFormModal.tsx` | Update category |
| Delete Category | `/inventory/categories/{id}` | DELETE | ✅ | `components/CategoryFormModal.tsx` | Soft delete category |
| Get Item Suppliers | `/inventory/{id}/suppliers` | GET | ⚠️ **Partial** | - | API exists but not used in UI |
| **API 6.4** - Create Import | `/inventory/import` | POST | ✅ | `components/CreateImportModal.tsx` | Create import transaction |
| **API 6.5** - Create Export | `/inventory/export` | POST | ✅ | `components/CreateExportModal.tsx` | Create export transaction |

### 🏷️ Item Master Management (`/api/v1/warehouse/items`)

| API | Endpoint | Method | Status | Used In | Notes |
|-----|----------|--------|--------|---------|-------|
| **API 6.8** - Get Item Masters | `/warehouse/items` | GET | ✅ | `inventory/page.tsx` | Advanced filtering & pagination |
| **API 6.9** - Create Item Master | `/warehouse/items` | POST | ✅ | `components/CreateItemMasterModal.tsx` | With unit hierarchy |
| **API 6.10** - Update Item Master | `/warehouse/items/{id}` | PUT | ✅ | `components/CreateItemMasterModal.tsx` | With Safety Lock |
| Delete Item Master | `/warehouse/items/{id}` | DELETE | ✅ | `inventory/page.tsx` | Soft delete with validation |
| **API 6.11** - Get Item Units | `/warehouse/items/{itemMasterId}/units` | GET | ✅ | `services/itemUnitService.ts` | Unit hierarchy for item |

### 📋 Transaction History (`/api/v1/warehouse/transactions`)

| API | Endpoint | Method | Status | Used In | Notes |
|-----|----------|--------|--------|---------|-------|
| **API 6.6** - Get Transactions | `/warehouse/transactions` | GET | ✅ | `storage/page.tsx`, `reports/page.tsx` | Advanced filtering |
| **API 6.7** - Get Transaction Detail | `/warehouse/transactions/{id}` | GET | ✅ | `components/StorageDetailModal.tsx` | Full transaction details |
| Get Transaction Stats | `/warehouse/transactions/stats` | GET | ✅ | `storage/page.tsx` | Summary cards |
| **API 6.6.1** - Approve Transaction | `/warehouse/transactions/{id}/approve` | POST | ✅ | `components/StorageDetailModal.tsx` | Approval workflow |
| **API 6.6.2** - Reject Transaction | `/warehouse/transactions/{id}/reject` | POST | ✅ | `components/StorageDetailModal.tsx` | Rejection workflow |
| **API 6.6.3** - Cancel Transaction | `/warehouse/transactions/{id}/cancel` | POST | ✅ | `components/StorageDetailModal.tsx` | Cancellation workflow |

### 🏢 Supplier Management (`/api/v1/warehouse/suppliers`)

| API | Endpoint | Method | Status | Used In | Notes |
|-----|----------|--------|--------|---------|-------|
| Get All Suppliers | `/warehouse/suppliers` | GET | ✅ | `suppliers/page.tsx` | Paginated list |
| **API 6.13** - Get Suppliers with Metrics | `/warehouse/suppliers/list` | GET | ⚠️ **Partial** | - | API exists but UI uses basic endpoint |
| Get Supplier By ID | `/warehouse/suppliers/{id}` | GET | ✅ | `components/SupplierDetailModal.tsx` | Supplier detail |
| Get Supplied Items | `/warehouse/suppliers/{id}/supplied-items` | GET | ✅ | `components/SupplierDetailModal.tsx` | Item history |
| **API 6.14** - Create Supplier | `/warehouse/suppliers` | POST | ✅ | `components/SupplierFormModal.tsx` | Create new supplier |
| **API 6.15** - Update Supplier | `/warehouse/suppliers/{id}` | PUT | ✅ | `components/SupplierFormModal.tsx` | Update supplier |
| **API 6.16** - Delete Supplier | `/warehouse/suppliers/{id}` | DELETE | ✅ | `suppliers/page.tsx` | Soft delete |

### 📦 Warehouse Inventory (`/api/v1/warehouse`)

| API | Endpoint | Method | Status | Used In | Notes |
|-----|----------|--------|--------|---------|-------|
| **API 6.1** - Advanced Summary | `/warehouse/summary` | GET | ❌ **Not Used** | - | FE uses `/inventory/summary` instead |
| **API 6.2** - Advanced Batches | `/warehouse/batches/{itemMasterId}` | GET | ❌ **Not Used** | - | FE uses `/inventory/batches/{id}` instead |
| **API 6.3** - Expiring Alerts | `/warehouse/alerts/expiring` | GET | ✅ | `reports/page.tsx` | Expiring items alert |
| **API 6.4** - Create Import (Alt) | `/warehouse/import` | POST | ✅ | `components/CreateImportModal.tsx` | Alternative endpoint |

### 🔢 Item Units (`/api/v1/warehouse/items`)

| API | Endpoint | Method | Status | Used In | Notes |
|-----|----------|--------|--------|---------|-------|
| Get Base Unit | `/warehouse/items/{itemMasterId}/units/base` | GET | ✅ | `services/itemUnitService.ts` | Legacy endpoint |
| **API 6.12** - Convert Quantity (GET) | `/warehouse/items/units/convert` | GET | ✅ | `services/itemUnitService.ts` | Simple conversion |
| **API 6.12** - Convert Quantity (POST) | `/warehouse/items/units/convert` | POST | ✅ | `services/itemUnitService.ts` | Batch conversion |

---

## ❌ Not Implemented APIs

### 📦 Inventory Management

| API | Endpoint | Method | Priority | Reason | Notes |
|-----|----------|--------|----------|--------|-------|
| Create Item Master (Alt) | `/inventory/item-master` | POST | Low | Duplicate of API 6.9 | Use `/warehouse/items` instead |
| Update Item Master (Alt) | `/inventory/item-master/{id}` | PUT | Low | Duplicate of API 6.10 | Use `/warehouse/items/{id}` instead |
| Delete Item Master (Alt) | `/inventory/item-master/{id}` | DELETE | Low | Duplicate | Use `/warehouse/items/{id}` instead |

### 🏢 Supplier Management

| API | Endpoint | Method | Priority | Reason | Notes |
|-----|----------|--------|----------|--------|-------|
| **API 6.13** - Suppliers with Metrics | `/warehouse/suppliers/list` | GET | Medium | UI uses basic endpoint | Should update UI to show metrics (totalOrders, lastOrderDate, isBlacklisted) |

### 🔢 Item Units

| API | Endpoint | Method | Priority | Reason | Notes |
|-----|----------|--------|----------|--------|-------|
| **API 6.12** - Convert (ItemUnitController) | `/warehouse/items/units/convert` | GET | Low | Duplicate | Already implemented via ItemMasterController |

---

## 📄 Page-to-API Mapping

### `/admin/warehouse` (Tổng Quan Kho)

**APIs Used:**
- ✅ `GET /inventory/summary` - Inventory summary dashboard
- ✅ `GET /inventory/stats` - Statistics cards (total items, alerts, expiring, out of stock)

**Components:**
- `page.tsx` - Main dashboard

---

### `/admin/warehouse/inventory` (Quản Lý Vật Tư)

**APIs Used:**
- ✅ `GET /warehouse/items` (API 6.8) - Item masters list with filtering
- ✅ `GET /inventory/{id}` - Item detail
- ✅ `POST /warehouse/items` (API 6.9) - Create item master
- ✅ `PUT /warehouse/items/{id}` (API 6.10) - Update item master
- ✅ `DELETE /warehouse/items/{id}` - Delete item master
- ✅ `GET /inventory/categories` - Categories dropdown
- ✅ `POST /inventory/categories` - Create category
- ✅ `PUT /inventory/categories/{id}` - Update category
- ✅ `DELETE /inventory/categories/{id}` - Delete category

**Components:**
- `page.tsx` - Item masters list
- `components/CreateItemMasterModal.tsx` - Create/Edit item master
- `components/ItemDetailModal.tsx` - Item detail view
- `components/CategoryFormModal.tsx` - Category management

---

### `/admin/warehouse/storage` (Nhập/Xuất Kho)

**APIs Used:**
- ✅ `GET /warehouse/transactions` (API 6.6) - Transaction history
- ✅ `GET /warehouse/transactions/stats` - Transaction statistics
- ✅ `GET /warehouse/transactions/{id}` (API 6.7) - Transaction detail
- ✅ `POST /warehouse/transactions/{id}/approve` (API 6.6.1) - Approve transaction
- ✅ `POST /warehouse/transactions/{id}/reject` (API 6.6.2) - Reject transaction
- ✅ `POST /warehouse/transactions/{id}/cancel` (API 6.6.3) - Cancel transaction
- ✅ `POST /inventory/import` (API 6.4) - Create import transaction
- ✅ `POST /inventory/export` (API 6.5) - Create export transaction
- ✅ `GET /inventory/batches/{itemMasterId}` (API 3) - Get batches for export (FEFO)
- ✅ `GET /warehouse/items/{itemMasterId}/units` (API 6.11) - Get item units

**Components:**
- `page.tsx` - Transaction list
- `components/StorageDetailModal.tsx` - Transaction detail & approval
- `components/CreateImportModal.tsx` - Create import transaction
- `components/CreateExportModal.tsx` - Create export transaction
- `components/EditImportModal.tsx` - Edit import transaction
- `components/EditExportModal.tsx` - Edit export transaction
- `components/BatchSelectorModal.tsx` - Batch selection for export

---

### `/admin/warehouse/suppliers` (Nhà Cung Cấp)

**APIs Used:**
- ✅ `GET /warehouse/suppliers` - Suppliers list (paginated)
- ⚠️ `GET /warehouse/suppliers/list` (API 6.13) - **Not used** (should use for metrics)
- ✅ `GET /warehouse/suppliers/{id}` - Supplier detail
- ✅ `GET /warehouse/suppliers/{id}/supplied-items` - Supplied items history
- ✅ `POST /warehouse/suppliers` (API 6.14) - Create supplier
- ✅ `PUT /warehouse/suppliers/{id}` (API 6.15) - Update supplier
- ✅ `DELETE /warehouse/suppliers/{id}` (API 6.16) - Delete supplier

**Components:**
- `page.tsx` - Suppliers list
- `components/SupplierDetailModal.tsx` - Supplier detail
- `components/SupplierFormModal.tsx` - Create/Edit supplier

---

### `/admin/warehouse/reports` (Báo Cáo & Thống Kê)

**APIs Used:**
- ✅ `GET /inventory/summary` - Inventory summary for reports
- ✅ `GET /warehouse/transactions` (API 6.6) - Transaction reports
- ✅ `GET /warehouse/alerts/expiring` (API 6.3) - Expiring items alert

**Components:**
- `page.tsx` - Reports dashboard with tabs (Inventory, Transactions, Expiring)

---

## 🔄 API Endpoint Alternatives

Some APIs have multiple endpoints for the same functionality:

| Functionality | Primary Endpoint | Alternative Endpoint | Status |
|--------------|------------------|----------------------|--------|
| **Inventory Summary** | `/inventory/summary` (Simple) | `/warehouse/summary` (Advanced) | ✅ Using simple version |
| **Item Batches** | `/inventory/batches/{id}` (Simple) | `/warehouse/batches/{id}` (Advanced) | ✅ Using simple version |
| **Create Item Master** | `/warehouse/items` (API 6.9) | `/inventory/item-master` | ✅ Using API 6.9 |
| **Update Item Master** | `/warehouse/items/{id}` (API 6.10) | `/inventory/item-master/{id}` | ✅ Using API 6.10 |
| **Create Import** | `/inventory/import` (API 6.4) | `/warehouse/import` (API 6.4 Alt) | ✅ Using `/inventory/import` |
| **Convert Units** | `/warehouse/items/units/convert` (ItemMasterController) | `/warehouse/items/units/convert` (ItemUnitController) | ✅ Using ItemMasterController |

**Note:** FE is using the simpler endpoints (`/inventory/*`) which are production-ready and recommended by BE team.

---

## 🎯 Next Steps / TODO

### High Priority

1. **Update Supplier List UI to use API 6.13**
   - Replace `/warehouse/suppliers` with `/warehouse/suppliers/list`
   - Display metrics: `totalOrders`, `lastOrderDate`, `isBlacklisted`
   - Add filters for blacklist status and active status
   - Add sorting by metrics (totalOrders, lastOrderDate)

### Medium Priority

2. **Integrate Unit Conversion (API 6.12) into Import/Export Modals**
   - Add conversion helper in import modal
   - Add conversion helper in export modal
   - Show converted quantities when user changes unit

3. **Use Get Item Units (API 6.11) in Import/Export Forms**
   - Replace `getBaseUnit()` with `getItemUnits()` for better UX
   - Show all available units in dropdown
   - Display unit hierarchy (e.g., "1 Hộp = 100 Viên")

### Low Priority

4. **Use Get Item Suppliers API**
   - Add supplier filter in item detail modal
   - Show supplier comparison (prices, last order date)

5. **Remove Duplicate Endpoint Calls**
   - Clean up unused alternative endpoints
   - Document why certain endpoints are preferred

---

## 📝 Notes

- **API Versioning:** Most APIs are under `/api/v1/`
- **Permissions:** All APIs require proper RBAC permissions (VIEW_WAREHOUSE, MANAGE_WAREHOUSE, etc.)
- **Error Handling:** All implemented APIs have proper error handling and user feedback
- **Pagination:** Most list APIs support pagination with `page` and `size` parameters
- **Filtering:** Advanced APIs support multiple filter parameters (search, status, type, date range, etc.)

---

**Last Updated:** 2025-01-30  
**Maintained By:** Frontend Team  
**Related Documents:**
- `docs/WAREHOUSE_API_REFACTOR_PLAN.md` - Refactoring plan
- `docs/api-guide/warehouse/FE_ISSUES_RESOLUTION_2025_11_29.md` - BE issues resolution
- `docs/BE_OPEN_ISSUES.md` - Current open issues

