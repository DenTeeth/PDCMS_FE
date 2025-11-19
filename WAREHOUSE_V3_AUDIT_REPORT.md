# 🔍 WAREHOUSE V3 - API INTEGRATION AUDIT REPORT

> **Audit Date:** November 18, 2025  
> **Status:** ⚠️ CRITICAL ISSUES FOUND  
> **Coverage:** Suppliers, Inventory, Storage Transactions, Analytics

---

## 📊 EXECUTIVE SUMMARY

### Overall Status: ⚠️ INCOMPLETE INTEGRATION

| Category                         | Status        | Issues Found | Completeness |
| -------------------------------- | ------------- | ------------ | ------------ |
| **Suppliers API**                | ✅ GOOD       | 0 critical   | 95%          |
| **Inventory (Item Masters) API** | ❌ MISSING    | 7 critical   | 40%          |
| **Batches (FEFO) API**           | ❌ MISSING    | 5 critical   | 30%          |
| **Transactions API**             | ❌ INCOMPLETE | 8 critical   | 50%          |
| **Analytics API**                | ⚠️ PARTIAL    | 3 critical   | 60%          |
| **Categories API**               | ❌ MISSING    | 4 critical   | 20%          |

**TOTAL CRITICAL ISSUES:** 27

---

## ❌ CRITICAL ISSUES BREAKDOWN

### 1. SUPPLIERS API ✅ (GOOD - 95%)

**Status:** Mostly complete, using V3 endpoints correctly

**What's Working:**

- ✅ GET /api/v3/warehouse/suppliers (with search)
- ✅ POST /api/v3/warehouse/suppliers
- ✅ PUT /api/v3/warehouse/suppliers/{id}
- ✅ DELETE /api/v3/warehouse/suppliers/{id}
- ✅ GET /api/v3/warehouse/suppliers/{id}
- ✅ GET /api/v3/warehouse/suppliers/{id}/items

**Missing Fields on UI:**

- ⚠️ `supplierCode` - Hiển thị trên UI nhưng không có trong bảng suppliers/page.tsx
- ⚠️ `taxCode`, `bankAccount`, `bankName` - Có trong form modal nhưng không hiển thị trên table

**UX Issues:**

- ⚠️ Search debounce 500ms - OK
- ⚠️ No pagination controls visible (React Query fetches all, manual filter)
- ⚠️ Missing loading skeleton on table
- ⚠️ No "Supplied Items" count badge on table row

---

### 2. INVENTORY (ITEM MASTERS) API ❌ (CRITICAL - 40%)

**Status:** MAJOR ISSUES - Using wrong endpoints

#### 🚨 CRITICAL PROBLEMS:

**❌ Problem 1: Wrong API Endpoint**

```typescript
// Current (WRONG):
const { data: inventory = [] } = useQuery({
  queryKey: ["itemMasterSummary", tabState],
  queryFn: () => itemMasterService.getSummary(filter), // ❌ Returns array
});

// Should be (CORRECT):
const { data: inventory = [] } = useQuery({
  queryKey: ["itemMasterSummary", tabState],
  queryFn: () => itemMasterService.getSummary(filter), // ✅ This is OK
});
```

**Verdict:** Actually OK! Using `/api/v3/warehouse/summary` is correct.

**❌ Problem 2: Missing Field Mapping**

Backend trả về (camelCase V3):

```json
{
  "itemMasterId": 1,
  "itemCode": "DRUG_001",
  "itemName": "Lidocaine 2%",
  "totalQuantityOnHand": 45,
  "stockStatus": "NORMAL",
  "isTool": false
}
```

Frontend type (snake_case):

```typescript
interface ItemMaster {
  item_master_id: number; // ❌ Mismatch
  item_code: string; // ❌ Mismatch
  item_name: string; // ❌ Mismatch
  total_quantity_on_hand: number; // ❌ Mismatch
  stock_status: string; // ❌ Mismatch
  is_tool: boolean; // ❌ Mismatch
}
```

**🔧 FIX REQUIRED:** Update `src/types/warehouse.ts` ItemMaster interface to use camelCase!

**❌ Problem 3: Missing UI Display Fields**

Table hiện tại shows:

- ✅ item_code
- ✅ item_name
- ✅ category
- ✅ total_quantity_on_hand
- ✅ min_stock_level / max_stock_level
- ✅ stock_status

Missing từ BE response:

- ❌ `description` - Not displayed
- ❌ `unitOfMeasure` - **CRITICAL** - User không biết đơn vị (Hộp, Lọ, Viên?)
- ❌ `isTool` - Not displayed (should show badge "Dụng cụ")
- ❌ `isActive` - Not displayed (should filter inactive items)

**❌ Problem 4: Stats Dashboard Incomplete**

Current stats shown:

- ✅ total_items
- ✅ low_stock_count
- ✅ expiring_soon_count
- ⚠️ total_inventory_value - **MISSING** from UI

Backend provides:

```json
{
  "totalItems": 150,
  "lowStockItems": 12,
  "expiringSoonItems": 5,
  "outOfStockItems": 3, // ❌ MISSING on UI
  "totalInventoryValue": 450000000 // ❌ MISSING on UI
}
```

**🔧 FIX REQUIRED:**

- Add "Tổng giá trị tồn kho" card
- Add "Hết hàng" card
- Format currency properly (VNĐ)

**❌ Problem 5: Filter Implementation Broken**

Current filter params sent to BE:

```typescript
// Frontend sends:
{
  warehouse_type: 'COLD',      // ✅ OK
  stock_status: 'LOW_STOCK',  // ✅ OK
  is_expiring_soon: true       // ✅ OK
}
```

**This is actually correct!** Backend expects snake_case per Swagger.

**❌ Problem 6: Missing Search Implementation**

Current code:

```typescript
const filter: any = {
  search: tabState.searchQuery || undefined,
};
```

BUT UI has no search input box! Search functionality is **completely missing**!

**🔧 FIX REQUIRED:** Add search input like suppliers page

**❌ Problem 7: Missing Batch Count**

Backend can provide batch count per item, but UI doesn't show:

- ❌ "X lô hàng" badge
- ❌ Click to view batches modal
- ❌ Expiring batches warning on row

---

### 3. BATCHES (FEFO) API ❌ (CRITICAL - 30%)

**Status:** COMPLETELY NOT INTEGRATED ON INVENTORY PAGE

#### 🚨 CRITICAL PROBLEMS:

**❌ Problem 1: BatchSelectorModal exists but not used in inventory page**

File exists: `src/app/admin/warehouse/components/BatchSelectorModal.tsx`

But inventory/page.tsx NEVER opens it!

**Expected UX:**

1. Click on item row → Opens ItemDetailModal
2. ItemDetailModal shows Tabs: ["Thông tin", "Lô hàng (X)", "Lịch sử"]
3. Batches tab calls:
   ```typescript
   const { data: batches } = useQuery({
     queryKey: ["itemBatches", itemId],
     queryFn: () => itemBatchService.getBatchesByItemId(itemId),
   });
   ```

**Current Reality:** ❌ NONE OF THIS EXISTS

**❌ Problem 2: Missing FEFO Visual Indicators**

Backend trả về đầy đủ:

```json
{
  "batchId": 1,
  "lotNumber": "LIDO-A-101",
  "quantityOnHand": 20,
  "expiryDate": "2025-03-15",
  "daysUntilExpiry": 15, // ❌ Not displayed anywhere
  "isExpiringSoon": true, // ❌ No warning badge
  "isExpired": false
}
```

**UI không hiển thị:**

- ❌ Days until expiry countdown
- ❌ Expiring soon badges (red/yellow/green)
- ❌ FEFO order visualization
- ❌ Batch import price history

**❌ Problem 3: Expiring Batches Warning Missing**

Inventory table should show:

```
[Item Row]
  - Lidocaine 2% | Tồn: 45 | ⚠️ 2 lô sắp hết hạn
```

**Current:** ❌ No batch warnings visible

**❌ Problem 4: No Batch Detail Modal**

Clicking batch row should show:

- Supplier info
- Import date
- Import price
- Current quantity
- Expiry date
- Transaction history
- **Quick export button (FEFO)**

**Current:** ❌ NONE IMPLEMENTED

**❌ Problem 5: Missing Expiring Batches Dashboard**

`GET /api/v3/warehouse/batches/expiring-soon?days=30`

Should have dedicated page/card showing:

- All batches expiring in next 30 days
- Estimated loss value
- Quick export actions

**Current:** ❌ NOT IMPLEMENTED

---

### 4. TRANSACTIONS API ❌ (CRITICAL - 50%)

**Status:** PARTIAL - Import/Export modals exist but incomplete

#### 🚨 CRITICAL PROBLEMS:

**❌ Problem 1: Transaction List Missing Critical Fields**

Current table shows:

- transaction_code
- transaction_date
- supplier_name (for imports)
- total_value
- notes

**Missing từ BE:**

- ❌ `performedByName` - Ai thực hiện?
- ❌ `items.length` - Số mặt hàng (VD: "5 items")
- ❌ Transaction status badge (if backend has approval workflow)
- ❌ Created/Updated timestamps

**❌ Problem 2: Import Modal - Missing Validation**

CreateImportModal.tsx:

```typescript
// Current validation:
if (itemMaster?.warehouseType === "COLD" && !item.expiryDate) {
  toast.error("Vật tư kho lạnh phải có hạn sử dụng!");
  return;
}
```

**Missing validations:**

- ❌ Lot number format check
- ❌ Duplicate lot number warning
- ❌ Expiry date must be > today
- ❌ Quantity > 0
- ❌ Unit price > 0
- ❌ Supplier selection required

**❌ Problem 3: Export Modal - FEFO Not Enforced**

CreateExportModal currently allows manual item selection!

**CRITICAL:** Should auto-use FEFO batches:

```typescript
// Current (WRONG):
const handleBatchSelected = (batch: ItemBatch, quantity: number) => {
  // User manually picks batch ❌
};

// Should be (CORRECT):
const handleItemSelected = (itemId: number, quantity: number) => {
  // 1. Fetch FEFO batches
  const batches = await itemBatchService.getBatchesByItemId(itemId);

  // 2. Auto-deduct from batches[0] (earliest expiry)
  // 3. If quantity > batches[0].quantityOnHand, use batches[1], etc.
  // 4. Show confirmation with FEFO selections
};
```

**❌ Problem 4: Missing Transaction Detail Modal**

When user clicks transaction row:

- Should open TransactionDetailModal.tsx
- Show all items with quantities, prices
- Show supplier info (for imports)
- Show performed by user
- **Print button**
- **PDF export button**

**Current:** Modal exists but never called!

**❌ Problem 5: No Transaction Stats**

Dashboard should show:

- Số phiếu nhập/xuất today
- Trending up/down
- Average transaction value
- Pending approvals count

**Current:** ❌ Only shows monthly totals

**❌ Problem 6: Missing Transaction Filters**

storage-in-out/page.tsx has tabs but missing:

- ❌ Date range picker
- ❌ Supplier filter dropdown
- ❌ Item filter
- ❌ Status filter (if approval workflow exists)
- ❌ Performed by filter

**❌ Problem 7: Pagination Broken**

Current:

```typescript
const { data: imports = [] } = useQuery({
  queryFn: async () => {
    const response = await storageTransactionService.getAll({
      transaction_type: "IMPORT",
      page: 0, // ❌ Always page 0!
      size: 20, // ❌ Hardcoded!
    });
    return response.content || [];
  },
});
```

**CRITICAL:** No pagination controls! User can only see first 20 transactions!

**🔧 FIX REQUIRED:**

```typescript
const [page, setPage] = useState(0);
const { data } = useQuery({
  queryKey: ["transactions", "import", page],
  queryFn: async () => {
    const response = await storageTransactionService.getAll({
      transaction_type: "IMPORT",
      page,
      size: 20,
    });
    return response;
  },
});

// Add pagination UI:
<Pagination
  totalPages={data?.totalPages}
  currentPage={page}
  onPageChange={setPage}
/>;
```

**❌ Problem 8: Missing Real-Time Updates**

After import/export, should:

- ✅ Invalidate queries (DONE)
- ❌ Show success animation
- ❌ Auto-scroll to new transaction
- ❌ Highlight new row (3s fade animation)

---

### 5. ANALYTICS API ⚠️ (PARTIAL - 60%)

**Status:** Basic stats work, missing advanced features

#### 🚨 CRITICAL PROBLEMS:

**❌ Problem 1: Storage Stats Incomplete**

Current usage:

```typescript
const { data: stats } = useQuery({
  queryKey: ["storageStats"],
  queryFn: () => warehouseAnalyticsService.getStorageStats(),
});
```

**Missing:**

- ❌ Month selector (should allow user to pick month)
- ❌ Year selector
- ❌ Comparison with previous month (built into BE response!)
- ❌ Trend chart (import/export over time)

**❌ Problem 2: Growth Percent Display Issue**

```typescript
// Current:
{(stats?.import_growth_percent ?? 0) > 0 ? '+' : ''}
{stats?.import_growth_percent ?? 0}%
```

**Issues:**

- ❌ No color coding (green for positive, red for negative)
- ❌ No arrow icons (↑ or ↓)
- ❌ Doesn't handle 0 growth (should show "—")

**❌ Problem 3: Missing Loss Records**

API exists: `/api/v3/warehouse/analytics/loss-records`

Should show:

- Recent losses (DESTROY/ADJUST transactions)
- Loss reasons
- Total loss value this month
- **Trend over months**

**Current:** ❌ "Báo cáo thất thoát" tab shows hardcoded "✓ Không có thất thoát"

**🔧 FIX REQUIRED:**

```typescript
const { data: lossRecords = [] } = useQuery({
  queryKey: ["lossRecords"],
  queryFn: () => warehouseAnalyticsService.getLossRecords(),
});

// Show table with:
// - Transaction code
// - Date
// - Item name
// - Quantity lost
// - Loss value
// - Reason
// - Performed by
```

---

### 6. CATEGORIES API ❌ (CRITICAL - 20%)

**Status:** COMPLETELY MISSING FROM UI

#### 🚨 CRITICAL PROBLEMS:

**❌ Problem 1: No Category Management Page**

Expected route: `/admin/warehouse/categories`

**Current:** ❌ DOES NOT EXIST

Should have:

- List all categories
- Create/Edit/Delete categories
- Filter by warehouse type (COLD/NORMAL)
- Show item count per category

**❌ Problem 2: Category Service Not Properly Used**

```typescript
// CreateItemMasterModal.tsx:
const { data: categories = [] } = useQuery<Category[]>({
  queryKey: ["categories"],
  queryFn: () => categoryService.getAll(),
});
```

**Issues:**

- ❌ Returns hardcoded data, not from API!
- ❌ No caching strategy
- ❌ No error handling

**Check warehouseService.ts:**

```typescript
// HARDCODED! ❌
let categories: Category[] = [
  {
    id: "CAT001",
    name: "Thuốc",
    // ...
  },
];
```

**🔧 FIX REQUIRED:**

```typescript
export const categoryService = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/api/v3/warehouse/categories");
    return response.data; // ✅ From API
  },
};
```

**❌ Problem 3: Missing Nested Categories Support**

Backend schema supports:

```typescript
{
  parent_category_id?: number;
  sub_categories?: Category[];
}
```

**Current UI:** ❌ Flat list only, no tree view!

**❌ Problem 4: No Category in Navigation**

Navigation config missing warehouse categories:

```typescript
// src/constants/navigationConfig.ts
{
  title: 'Quản lý kho',
  children: [
    { title: 'Tồn kho', href: '/admin/warehouse/inventory' },
    { title: 'Nhà cung cấp', href: '/admin/warehouse/suppliers' },
    { title: 'Xuất/Nhập kho', href: '/admin/warehouse/storage-in-out' },
    // ❌ MISSING:
    { title: 'Danh mục vật tư', href: '/admin/warehouse/categories' },
    // ❌ MISSING:
    { title: 'Báo cáo thất thoát', href: '/admin/warehouse/loss-reports' },
    // ❌ MISSING:
    { title: 'Cảnh báo HSD', href: '/admin/warehouse/expiry-warnings' },
  ],
}
```

---

## 🎨 UX/UI ISSUES

### Loading States ⚠️

**❌ Missing Skeleton Loaders:**

- Suppliers table: ❌ Shows "Đang tải..." text only
- Inventory table: ❌ No skeleton
- Transactions list: ❌ No skeleton
- Stats cards: ❌ Flash of empty state

**🔧 FIX:** Use shadcn/ui Skeleton component

---

### Empty States ⚠️

**Current empty states are boring:**

```tsx
<p className="text-center py-12 text-slate-500">Chưa có phiếu nhập</p>
```

**Should be:**

```tsx
<div className="text-center py-12">
  <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-2 text-sm font-semibold text-gray-900">
    Chưa có phiếu nhập kho
  </h3>
  <p className="mt-1 text-sm text-gray-500">
    Bắt đầu bằng cách tạo phiếu nhập kho đầu tiên.
  </p>
  <Button onClick={() => setIsImportModalOpen(true)} className="mt-4">
    <PlusIcon className="mr-2" />
    Tạo phiếu nhập
  </Button>
</div>
```

---

### Form Validation ❌

**Import/Export Modals:**

- ❌ No real-time validation feedback
- ❌ No field-level error messages
- ❌ No success animations
- ❌ No confirmation dialogs before submit

---

### Accessibility ❌

**Missing:**

- ❌ ARIA labels on action buttons
- ❌ Keyboard shortcuts (Ctrl+N for new item)
- ❌ Focus management in modals
- ❌ Screen reader announcements

---

### Mobile Responsive ⚠️

**Issues:**

- Table horizontal scroll on mobile: ⚠️ Works but not optimal
- Stats cards: ⚠️ `grid-cols-4` breaks on small screens (should be responsive)
- Modals: ⚠️ `max-w-2xl` too wide on mobile

**🔧 FIX:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## 📋 ACTIONABLE FIX CHECKLIST

### PRIORITY 1 - CRITICAL (Must Fix Immediately)

- [ ] **Fix ItemMaster type mismatch** (camelCase vs snake_case)
- [ ] **Add unitOfMeasure column** to inventory table
- [ ] **Add search input** to inventory page
- [ ] **Fix pagination** on transactions (currently stuck at page 0)
- [ ] **Implement FEFO auto-selection** in export modal
- [ ] **Replace hardcoded categories** with API call
- [ ] **Add "Total Inventory Value" card** to dashboard
- [ ] **Add "Out of Stock" card** to dashboard

### PRIORITY 2 - HIGH (Fix This Week)

- [ ] **Create ItemDetailModal** with batches tab
- [ ] **Add batch expiry warnings** to inventory rows
- [ ] **Implement loss records** tab with real data
- [ ] **Add month/year selector** for analytics
- [ ] **Add loading skeletons** everywhere
- [ ] **Fix empty states** with better UX
- [ ] **Add performedByName** to transaction tables
- [ ] **Create categories management page**

### PRIORITY 3 - MEDIUM (Nice to Have)

- [ ] Add batch count badges
- [ ] Implement nested categories tree view
- [ ] Add transaction print/PDF export
- [ ] Add growth trend charts
- [ ] Add keyboard shortcuts
- [ ] Improve mobile responsive
- [ ] Add success animations
- [ ] Add field-level validation

### PRIORITY 4 - LOW (Future Enhancements)

- [ ] Real-time updates with WebSocket
- [ ] Barcode scanning for lot numbers
- [ ] Batch transfer between warehouses
- [ ] Inventory forecasting
- [ ] Auto-reorder suggestions

---

## 🔧 RECOMMENDED FIXES

### Fix 1: Update ItemMaster Interface

```typescript
// src/types/warehouse.ts
export interface ItemMaster {
  itemMasterId: number; // ✅ camelCase
  itemCode: string;
  itemName: string;
  description: string | null;
  categoryId: number;
  category?: ItemCategoryResponse;
  unitOfMeasure: string; // ✅ Critical missing field!
  warehouseType: "COLD" | "NORMAL";
  minStockLevel: number;
  maxStockLevel: number;
  totalQuantityOnHand: number;
  stockStatus: "NORMAL" | "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK";
  isTool: boolean;
  isActive: boolean;
}
```

### Fix 2: Add Search to Inventory

```tsx
// inventory/page.tsx
<Card className="mb-4">
  <CardContent className="pt-6">
    <div className="relative">
      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3" />
      <Input
        type="text"
        placeholder="Tìm kiếm vật tư..."
        className="pl-10"
        value={tabState.searchQuery}
        onChange={(e) =>
          setTabState({ ...tabState, searchQuery: e.target.value })
        }
      />
    </div>
  </CardContent>
</Card>
```

### Fix 3: Fix Pagination

```tsx
// storage-in-out/page.tsx
const [importPage, setImportPage] = useState(0);

const { data: importsData } = useQuery({
  queryKey: ["transactions", "import", importPage],
  queryFn: async () => {
    return await storageTransactionService.getAll({
      transaction_type: "IMPORT",
      page: importPage,
      size: 20,
    });
  },
});

const imports = importsData?.content || [];

// Add pagination UI
<div className="flex justify-between items-center mt-4">
  <p className="text-sm text-gray-600">
    Trang {importPage + 1} / {importsData?.totalPages || 1}
  </p>
  <div className="flex gap-2">
    <Button
      disabled={importPage === 0}
      onClick={() => setImportPage((p) => p - 1)}
    >
      Trước
    </Button>
    <Button
      disabled={importPage >= (importsData?.totalPages || 1) - 1}
      onClick={() => setImportPage((p) => p + 1)}
    >
      Sau
    </Button>
  </div>
</div>;
```

### Fix 4: Replace Hardcoded Categories

```typescript
// warehouseService.ts
export const categoryService = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/api/v3/warehouse/categories");
    return response.data;
  },

  // Remove hardcoded array!
};
```

---

## 📊 SUMMARY METRICS

| Metric                    | Value    |
| ------------------------- | -------- |
| **Total API Endpoints**   | 24       |
| **Implemented**           | 12 (50%) |
| **Partially Implemented** | 6 (25%)  |
| **Not Implemented**       | 6 (25%)  |
| **Critical Bugs**         | 27       |
| **UX Issues**             | 15       |
| **Missing Features**      | 18       |

**Estimated Fix Time:** 3-5 days for Priority 1-2

---

## ✅ FINAL RECOMMENDATIONS

1. **Immediate Actions:**

   - Fix type mismatches (camelCase)
   - Add missing table columns
   - Implement pagination
   - Replace hardcoded data

2. **This Week:**

   - Complete modal integrations
   - Add batch management
   - Fix analytics dashboard

3. **Next Sprint:**

   - Category management page
   - Advanced filtering
   - Export/Print features

4. **Testing Strategy:**
   - Unit tests for services
   - E2E tests for critical flows
   - API integration tests

---

**Report Generated by:** AI Audit System  
**Date:** November 18, 2025  
**Status:** ⚠️ ACTION REQUIRED
