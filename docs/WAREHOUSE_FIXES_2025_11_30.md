# Warehouse Fixes - November 30, 2025

## Summary

Fixed multiple issues reported by user:
1. ✅ API 6.1 Summary error - Fixed response format mapping
2. ✅ Reports page errors - Added error handling for all 3 queries
3. ✅ Supplier Detail/Edit modals - Fixed error handling
4. ✅ Approve/Reject buttons - Added debug logging for permissions
5. ⚠️ Approve/Reject visibility - Requires user to have `APPROVE_TRANSACTION` permission or `ROLE_ADMIN`

---

## 1. API 6.1 - Inventory Summary Error

### Issue
- Console error: "Get inventory summary error: {}"
- Response format mismatch between BE and FE

### Fix
**File:** `src/services/inventoryService.ts`

**Changes:**
- Fixed mapping for `unitName` field (BE uses `unitName`, not `unitOfMeasure`)
- Fixed `totalItems` mapping (BE uses `totalItems`, not `totalElements`)
- Improved error logging with detailed error information

**Response Structure:**
```typescript
// BE Response: InventorySummaryResponse
{
  page: number,
  size: number,
  totalPages: number,
  totalItems: number,  // ← Fixed: was looking for totalElements
  content: InventoryItemDTO[]
}

// InventoryItemDTO
{
  itemMasterId: number,
  itemCode: string,
  itemName: string,
  unitName: string,  // ← Fixed: was looking for unitOfMeasure
  totalQuantity: number,
  stockStatus: string,
  // ...
}
```

---

## 2. Reports Page - 3 Errors

### Issue
- 3 console errors on reports page:
  1. Get inventory summary error
  2. Get all transactions error
  3. Get expiring alerts error

### Fix
**File:** `src/app/admin/warehouse/reports/page.tsx`

**Changes:**
- Added error handling for all 3 queries
- Added `retry: 1` and `retryDelay: 1000` for better resilience
- Display user-friendly error messages instead of crashing
- Show error state in UI for each section

**Error Handling:**
```typescript
const { data, isLoading, error } = useQuery({
  // ... query config
  retry: 1,
  retryDelay: 1000,
});

// In UI:
{error ? (
  <div className="text-center py-8 text-red-500">
    <p className="font-semibold">Không thể tải dữ liệu</p>
    <p className="text-sm text-gray-500 mt-2">
      {error.response?.data?.message || 'Vui lòng thử lại sau'}
    </p>
  </div>
) : (
  // ... normal content
)}
```

---

## 3. Supplier Detail/Edit Modals

### Issue
- Error when clicking "Xem" (View) or "Chỉnh sửa" (Edit) supplier
- "1 vật tư đã chọn" display issue

### Fix
**Files:**
- `src/app/admin/warehouse/components/SupplierDetailModal.tsx`
- `src/app/admin/warehouse/components/SupplierFormModal.tsx`

**Changes:**
1. **SupplierDetailModal:**
   - Added error handling for `useSupplier` hook
   - Display error message if fetch fails
   - Better loading states

2. **SupplierFormModal:**
   - Fixed `suppliedItems` mapping to handle different response formats
   - Added error handling for supplier detail fetch
   - Fixed `selectedItemIds` initialization from `suppliedItems`

**Fixed Mapping:**
```typescript
// Handle different response formats
const itemIds = supplierData.suppliedItems?.map(item => {
  return item.itemMasterId || (item as any).itemId || (item as any).id;
}).filter((id): id is number => typeof id === 'number' && id > 0) || [];
```

---

## 4. Approve/Reject Buttons Visibility

### Issue
- User doesn't see approve/reject buttons in transaction detail modal

### Current Implementation
**File:** `src/app/admin/warehouse/components/StorageDetailModal.tsx`

**Permission Check:**
```typescript
const isAdmin = useRole('ROLE_ADMIN');
const hasApprovePermission = isAdmin || usePermission('APPROVE_TRANSACTION');
const hasUpdatePermission = usePermission('UPDATE_WAREHOUSE') || usePermission('CANCEL_WAREHOUSE');

// Buttons only show when:
{transaction?.status === 'PENDING_APPROVAL' && hasApprovePermission && (
  // Approve/Reject buttons
)}
```

### Debug Added
- Added console logging in development mode to debug permission issues
- Logs: `isAdmin`, `hasApprovePermission`, `transaction.status`

### Possible Causes
1. **User doesn't have permission:**
   - User needs `APPROVE_TRANSACTION` permission OR `ROLE_ADMIN` role
   - Check user permissions in AuthContext

2. **Transaction status is not PENDING_APPROVAL:**
   - Buttons only show for transactions with status `PENDING_APPROVAL`
   - Check transaction status in detail modal

3. **Permission not loaded:**
   - Check if `user.permissions` array includes `APPROVE_TRANSACTION`
   - Check if `user.roles` array includes `ROLE_ADMIN`

### Action Required
- **For User:** Check browser console (F12) for debug logs showing permissions
- **For Admin:** Verify user has `APPROVE_TRANSACTION` permission or `ROLE_ADMIN` role
- **For BE:** Ensure permissions are correctly assigned to user roles

---

## 5. Inventory Page

### Status
✅ **Working** - No changes needed

The inventory page (`/admin/warehouse/inventory`) is working correctly with:
- API 6.1 summary endpoint
- Client-side filtering and pagination
- Error handling

---

## Testing Checklist

- [ ] Test API 6.1 - Inventory Summary loads without errors
- [ ] Test Reports Page - All 3 tabs load without errors
- [ ] Test Supplier Detail Modal - Opens without errors
- [ ] Test Supplier Edit Modal - Opens and loads data correctly
- [ ] Test Approve/Reject buttons - Verify visibility with correct permissions
- [ ] Test Transaction Detail Modal - Verify buttons show for PENDING_APPROVAL status

---

## Files Modified

1. `src/services/inventoryService.ts` - Fixed summary response mapping
2. `src/services/storageService.ts` - Improved error logging
3. `src/app/admin/warehouse/reports/page.tsx` - Added error handling
4. `src/app/admin/warehouse/components/SupplierDetailModal.tsx` - Added error handling
5. `src/app/admin/warehouse/components/SupplierFormModal.tsx` - Fixed supplied items mapping
6. `src/app/admin/warehouse/components/StorageDetailModal.tsx` - Added debug logging

---

**Last Updated:** 2025-11-30  
**Status:** ✅ Most issues fixed, approve/reject visibility requires permission verification

