# Warehouse API Refactor Plan

**Date:** 2025-11-28  
**Status:** 🔄 In Progress  
**Purpose:** Refactor FE để align với BE API mới (6.9-6.15)

---

## 📊 Summary

| API | Endpoint | Method | Status | Priority | Effort |
|-----|----------|--------|--------|-----------|--------|
| 6.9 | `/warehouse/items` | POST | ✅ Backend Ready | High | UI: 4h |
| 6.10 | `/warehouse/items/{id}` | PUT | ✅ Backend Ready | High | UI: 4h |
| 6.11 | `/warehouse/items/{id}/units` | GET | ✅ Backend Ready | Medium | UI: 2h |
| 6.12 | `/warehouse/items/units/convert` | POST/GET | ✅ Backend Ready | Low | UI: 2h |
| 6.13 | `/warehouse/suppliers/list` | GET | ✅ Backend Ready | Medium | UI: 3h |
| 6.14 | `/warehouse/suppliers` | POST | ✅ Working | Low | - |
| 6.15 | `/warehouse/suppliers/{id}` | PUT | ✅ Working | Low | - |

---

## ✅ Completed

### API 6.9 - Create Item Master
- **Status:** ✅ Fixed (Type & Test Script)
- **Changes:**
  - ✅ Updated `CreateItemMasterRequest` type to include `units` array (required)
  - ✅ Added `ItemUnitRequest` interface
  - ✅ Updated test script to include units field
  - ⚠️ **TODO:** Update `CreateItemMasterModal` UI to allow users to add/edit units (requires UI work)

### API 6.10 - Update Item Master
- **Status:** ✅ Implemented
- **Changes:**
  - ✅ Updated `UpdateItemMasterRequest` type to include `units` array and new fields
  - ✅ Added `UpdateItemMasterResponse` type with `safetyLockApplied` flag
  - ✅ Updated `update()` method to handle Safety Lock errors (409 CONFLICT)
  - ✅ Added error handling for Safety Lock violations with user-friendly messages
  - ⚠️ **TODO:** Update `CreateItemMasterModal` UI to support unit editing (same as create)

### API 6.11 - Get Item Units
- **Status:** ✅ Implemented
- **Changes:**
  - ✅ Added `GetItemUnitsResponse` type matching BE structure
  - ✅ Updated `ItemUnitResponse` to include `isActive` and `description` fields
  - ✅ Added `getItemUnits()` method to `itemUnitService.ts` with status filter
  - ✅ Updated `getUnits()` legacy method to use new API
  - ⚠️ **TODO:** Update import/export modals to use `getItemUnits()` instead of `getBaseUnit()` for better UX

### API 6.12 - Convert Quantity
- **Status:** ✅ Implemented
- **Changes:**
  - ✅ Added `ConversionRequest`, `ConversionResponse`, and `ConversionResult` types
  - ✅ Added `convertUnits()` method for batch conversion (POST)
  - ✅ Added `convertQuantity()` method for simple conversion (GET)
  - ⚠️ **TODO:** Integrate conversion helpers into import/export modals

### API 6.13 - Get Suppliers with Metrics
- **Status:** ✅ Implemented
- **Changes:**
  - ✅ Added `getSuppliersWithMetrics()` method to `supplierService.ts`
  - ✅ Updated all supplier endpoints to use `/warehouse/suppliers` path (matching BE)
  - ⚠️ **TODO:** Update supplier list UI to use new endpoint and display metrics

---

## 🔄 In Progress

### API 6.9 & 6.10 - Create/Update Item Master (UI Update)
- **File:** `src/app/admin/warehouse/components/CreateItemMasterModal.tsx`
- **Current Issue:** Modal only sends `unitOfMeasure` (legacy field), not `units` array
- **Status:** ⚠️ Backend types ready, UI update pending
- **Required Changes:**
  1. Add UI for managing units array (add/remove units)
  2. Ensure at least 1 unit with `isBaseUnit: true`
  3. Validate `conversionRate` (base unit = 1, others > 1)
  4. Map legacy `unitOfMeasure` to units array for backward compatibility
  5. Show Safety Lock warnings when updating items with existing stock
  6. Handle 409 CONFLICT errors with user-friendly messages

---

## 📋 Pending Implementation (UI Integration)

### API 6.11 - Get Item Units (UI Integration)
- **Status:** ✅ Backend ready, UI integration pending
- **Required Changes:**
  1. Update `CreateImportModal.tsx` to use `getItemUnits()` for unit dropdown
  2. Update `CreateExportModal.tsx` to use `getItemUnits()` for unit dropdown
  3. Cache units per item to reduce API calls
  4. Show unit descriptions (e.g., "1 Hop = 100 Vien") in dropdown

**Files to Update:**
- `src/app/admin/warehouse/components/CreateImportModal.tsx` - Use `getItemUnits()`
- `src/app/admin/warehouse/components/CreateExportModal.tsx` - Use `getItemUnits()`

---

### API 6.12 - Convert Quantity (UI Integration)
- **Status:** ✅ Backend ready, UI integration pending
- **Required Changes:**
  1. Add conversion helper UI component
  2. Show converted quantities in import/export forms
  3. Use batch conversion for multiple items

**Files to Create/Update:**
- `src/app/admin/warehouse/components/CreateImportModal.tsx` - Add conversion helper
- `src/app/admin/warehouse/components/CreateExportModal.tsx` - Add conversion helper

---

### API 6.13 - Get Suppliers with Metrics (UI Integration)
- **Status:** ✅ Backend ready, UI integration pending
- **Required Changes:**
  1. Update supplier list UI to use `getSuppliersWithMetrics()` endpoint
  2. Add `SupplierPageResponse` type with metrics (if needed)
  3. Display business metrics: `totalOrders`, `lastOrderDate`, `isBlacklisted`
  4. Add filters for `isBlacklisted` and `isActive`
  5. Add sorting options: `totalOrders`, `lastOrderDate`, `tierLevel`, `ratingScore`

**Files to Update:**
- `src/types/supplier.ts` - Add `SupplierPageResponse` with metrics (if needed)
- `src/app/admin/warehouse/suppliers/page.tsx` - Use `getSuppliersWithMetrics()` and display metrics

---

## 🔍 API Comparison: BE vs FE

### Item Master APIs

| Feature | BE | FE Backend | FE UI | Status |
|---------|----|-----------|-------|--------|
| Create with units array | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |
| Update with Safety Lock | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |
| Get units for item | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |
| Convert quantity | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |

### Supplier APIs

| Feature | BE | FE Backend | FE UI | Status |
|---------|----|-----------|-------|--------|
| List with metrics | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |
| Business metrics | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |
| Advanced filters | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |
| Advanced sorting | ✅ | ✅ Ready | ⚠️ Pending | ⚠️ |

---

## 📝 Implementation Priority

### High Priority (Backend Ready, UI Pending)
1. ✅ **API 6.9** - Create Item Master (types & test) - **DONE**
2. ✅ **API 6.10** - Update Item Master (Safety Lock handling) - **DONE**
3. ⚠️ **API 6.9 & 6.10 UI** - Update CreateItemMasterModal to support units array (4h)

### Medium Priority (Backend Ready, UI Pending)
4. ✅ **API 6.11** - Get Item Units (backend) - **DONE**
5. ⚠️ **API 6.11 UI** - Integrate into import/export modals (2h)
6. ✅ **API 6.13** - Get Suppliers with Metrics (backend) - **DONE**
7. ⚠️ **API 6.13 UI** - Display metrics in supplier list (3h)

### Low Priority (Backend Ready, UI Pending)
8. ✅ **API 6.12** - Convert Quantity (backend) - **DONE**
9. ⚠️ **API 6.12 UI** - Add conversion helpers to forms (2h)

---

## 🎯 Next Steps

1. **Immediate (Backend Complete):**
   - ✅ Fix test script for API 6.9
   - ✅ Update `CreateItemMasterRequest` and `UpdateItemMasterRequest` types
   - ✅ Implement API 6.11, 6.12, 6.13 backend methods
   - ✅ Update all supplier endpoints to use `/warehouse/suppliers` path

2. **Short-term (UI Integration Required):**
   - ⚠️ Update `CreateItemMasterModal` to support units array (4h)
   - ⚠️ Integrate `getItemUnits()` into import/export modals (2h)
   - ⚠️ Update supplier list to use metrics endpoint (3h)

3. **Long-term (Nice to Have):**
   - ⚠️ Add conversion helpers to import/export forms (2h)
   - ⚠️ Enhance UI with Safety Lock warnings and error messages

## 📊 Progress Summary

- **Backend Implementation:** ✅ **100% Complete** (6/6 APIs)
- **UI Integration:** ⚠️ **0% Complete** (0/6 UIs)
- **Total Progress:** 🟡 **50% Complete**

**Estimated Remaining Work:** ~13 hours of UI development

---

## 📚 References

- BE Controller: `files_from_BE/warehouse/controller/ItemMasterController.java`
- BE Controller: `files_from_BE/warehouse/controller/ItemUnitController.java`
- BE Controller: `files_from_BE/warehouse/controller/SupplierController.java`
- API Docs: `docs/api-guide/warehouse/fix_bug/API_6.9_CREATE_ITEM_MASTER_COMPLETE.md`

---

**Last Updated:** 2025-11-28  
**Status:** ✅ Backend implementation complete, UI integration pending

