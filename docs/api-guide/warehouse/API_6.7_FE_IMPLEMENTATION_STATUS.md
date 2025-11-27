# API 6.7 - Transaction Detail: FE Implementation Status

**Date:** 2025-01-28  
**Status:** ✅ **PARTIALLY IMPLEMENTED** (Core functionality working, RBAC & some fields pending)

---

## 📋 Overview

API 6.7 (`GET /api/v1/warehouse/transactions/{id}`) là endpoint để lấy chi tiết đầy đủ của một phiếu nhập/xuất kho. FE đã tích hợp endpoint này vào `storageService` và `StorageDetailModal`.

---

## ✅ Current Implementation Status

### 1. **Service Layer** (`src/services/storageService.ts`)

#### ✅ **Endpoint Integration**
- **Method:** `storageService.getById(id: number)`
- **Endpoint:** `GET /api/v1/warehouse/transactions/{id}`
- **Status:** ✅ **Implemented**
- **Details:**
  - Gọi đúng endpoint `/warehouse/transactions/{id}`
  - Xử lý response payload với `extractPayload()` helper
  - Mapping đầy đủ các fields từ BE response

#### ✅ **Field Mapping** (`mapTransactionDetail`)
Đã map các fields sau:
- ✅ `transactionId`, `transactionCode`, `transactionType`, `transactionDate`
- ✅ `supplierId`, `supplierName`, `invoiceNumber`
- ✅ `exportType`, `notes`
- ✅ `createdByName`, `createdAt`
- ✅ `approvedByName`, `approvedAt` (vừa thêm)
- ✅ `totalItems`, `totalValue`
- ✅ `status` (với default = 'DRAFT' nếu BE không trả về)
- ✅ `paymentStatus`, `paidAmount`, `remainingDebt`, `dueDate`
- ✅ `relatedAppointmentId`, `relatedAppointmentCode`, `patientName`
- ✅ `items[]` với `mapTransactionItem()`

#### ⚠️ **Issues Found**
1. **Comment sai:** Comment trong code nói "API 6.6" nhưng thực ra đây là **API 6.7**
   ```typescript
   /**
    * GET /api/v1/warehouse/transactions/{id} - Chi tiết phiếu nhập/xuất kho (API 6.6)
    */
   ```
   **Should be:** `(API 6.7)`

2. **RBAC không được xử lý:** Service layer không check `VIEW_COST` permission để mask financial data
   - BE đã mask data nếu user không có `VIEW_COST`
   - FE không cần làm gì thêm ở service layer (BE đã xử lý)

---

### 2. **UI Component** (`src/app/admin/warehouse/components/StorageDetailModal.tsx`)

#### ✅ **Basic Implementation**
- **Status:** ✅ **Implemented**
- **Details:**
  - Sử dụng `useQuery` để fetch transaction detail
  - Hiển thị modal với 2 tabs: "Thông tin phiếu" và "Chi tiết vật tư"
  - Loading state và error handling

#### ✅ **Fields Displayed**
**Tab "Thông tin phiếu":**
- ✅ Mã phiếu (`transactionCode`)
- ✅ Loại phiếu (`transactionType`) với badge màu sắc
- ✅ Ngày giao dịch (`transactionDate`)
- ✅ Nhà cung cấp (`supplierName`) - chỉ hiện nếu có
- ✅ Người thực hiện (`createdByName`)
- ✅ Ghi chú (`notes`) - chỉ hiện nếu có
- ✅ Ngày tạo (`createdAt`)
- ✅ Ngày cập nhật (`updatedAt`) - nếu có

**Tab "Chi tiết vật tư":**
- ✅ Danh sách items với:
  - STT
  - Mã vật tư / Hạn sử dụng (combined column)
  - Tên vật tư
  - Số lô
  - Số lượng

#### ⚠️ **Missing Fields**
Các fields sau chưa được hiển thị trong UI vì **BE không trả về trong response**:
- ❌ `status` (trạng thái duyệt) - **QUAN TRỌNG** - BE có nhưng là String, nên là TransactionStatus enum
- ❌ `approvedByName`, `approvedAt` (thông tin duyệt) - **BE thiếu trong ImportTransactionResponse và ExportTransactionResponse**
- ❌ `invoiceNumber` (số hóa đơn) - cho IMPORT - BE có trong response
- ❌ `paymentStatus`, `paidAmount`, `remainingDebt`, `dueDate` (thông tin thanh toán) - cho IMPORT - **BE thiếu trong ImportTransactionResponse**
- ❌ `relatedAppointmentId`, `patientName` (thông tin ca điều trị) - cho EXPORT - **BE thiếu trong ExportTransactionResponse** (chỉ có `referenceCode`)
- ❌ `totalValue` (tổng giá trị) - BE có nhưng cần RBAC check (đã xử lý)
- ❌ `unitPrice`, `totalLineValue` (giá từng item) - BE có trong items nhưng cần RBAC check (đã xử lý)

**Note:** Xem Issue #17 trong `docs/BE_OPEN_ISSUES.md` để biết chi tiết về các fields BE thiếu.

#### ⚠️ **RBAC UI Handling**
- ❌ Chưa check `VIEW_COST` permission trong component
- ❌ Chưa có logic để ẩn/hiện financial fields
- ⚠️ **Note:** BE đã mask data, nhưng FE nên có visual indicator khi data bị mask

#### ✅ **Fallback Mechanism**
- ✅ Có fallback để fetch `itemCode` và `expiryDate` nếu BE không trả về
- ✅ Sử dụng `inventoryService.getById()` và `getBatchesByItemId()`
- ✅ Hiển thị loading state khi đang fetch fallback data

---

### 3. **Type Definitions** (`src/types/warehouse.ts`)

#### ✅ **Interface `StorageTransactionV3`**
Đã có đầy đủ các fields:
- ✅ `status?: string`
- ✅ `paymentStatus?: string`
- ✅ `paidAmount?: number`
- ✅ `remainingDebt?: number`
- ✅ `dueDate?: string`
- ✅ `approvedByName?: string`
- ✅ `approvedAt?: string`
- ✅ `relatedAppointmentId?: number`
- ✅ `relatedAppointmentCode?: string`
- ✅ `patientName?: string`

#### ✅ **Interface `StorageTransactionItemV3`**
Đã có đầy đủ các fields:
- ✅ `unitPrice?: number`
- ✅ `totalLineValue?: number`

---

## ⚠️ Pending / To Be Implemented

### 0. **BE Dependencies** (Blocking)
- ⏳ **Chờ BE fix Issue #17**: BE cần thêm các fields thiếu vào `ImportTransactionResponse` và `ExportTransactionResponse` trước khi FE có thể hiển thị.
- Xem `docs/BE_OPEN_ISSUES.md` Issue #17 để biết chi tiết.

### 1. **UI Enhancements** (High Priority - After BE fix)

#### a. **Display Status Badge**
- Thêm hiển thị `status` badge trong tab "Thông tin phiếu"
- Sử dụng cùng logic badge như trong list page (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED)

#### b. **Display Approval Info**
- Hiển thị `approvedByName` và `approvedAt` nếu status = APPROVED
- Hiển thị rejection reason nếu status = REJECTED (nếu BE trả về)

#### c. **Display Financial Info** (với RBAC check)
- Thêm section "Thông tin tài chính" cho IMPORT transactions
- Hiển thị:
  - `totalValue` (tổng giá trị phiếu)
  - `paymentStatus` (trạng thái thanh toán)
  - `paidAmount` (số tiền đã thanh toán)
  - `remainingDebt` (số tiền còn nợ)
  - `dueDate` (hạn thanh toán)
- Chỉ hiển thị nếu user có `VIEW_COST` permission
- Hiển thị indicator (ví dụ: "🔒 Bạn không có quyền xem thông tin tài chính") nếu không có quyền

#### d. **Display Export Info**
- Thêm section "Thông tin ca điều trị" cho EXPORT transactions
- Hiển thị:
  - `relatedAppointmentCode` (mã ca điều trị)
  - `patientName` (tên bệnh nhân)

#### e. **Display Invoice Number**
- Hiển thị `invoiceNumber` trong tab "Thông tin phiếu" cho IMPORT transactions

#### f. **Items Table Enhancements**
- Thêm cột "Đơn giá" (`unitPrice`) - với RBAC check
- Thêm cột "Thành tiền" (`totalLineValue`) - với RBAC check
- Chỉ hiển thị các cột này nếu user có `VIEW_COST` permission

### 2. **RBAC Integration** (High Priority)

#### a. **Permission Check Hook**
```typescript
import { usePermission } from '@/hooks/usePermissions';

const hasViewCost = usePermission('VIEW_COST');
```

#### b. **Conditional Rendering**
- Wrap financial sections với `{hasViewCost && (...)}`
- Show indicator khi data bị mask

### 3. **Code Cleanup** (Low Priority)

#### a. **Fix Comment**
- Sửa comment trong `storageService.getById()` từ "API 6.6" → "API 6.7"

---

## 🚀 Implementation Plan

### Phase 0: BE Dependencies (Blocking)
- ⏳ **Chờ BE fix Issue #17** trước khi implement Phase 1-3
- BE cần thêm các fields vào response DTOs

### Phase 1: Critical Fields (2-3 hours) - After BE fix
1. ✅ Display `status` badge (sau khi BE trả về)
2. ✅ Display `approvedByName` và `approvedAt` (sau khi BE trả về)
3. ✅ Display `invoiceNumber` (BE đã có, chỉ cần hiển thị)
4. ✅ Display `relatedAppointmentId` và `patientName` (sau khi BE trả về cho EXPORT)

### Phase 2: Financial Info với RBAC (2-3 hours)
1. ✅ Add `usePermission('VIEW_COST')` hook
2. ✅ Create "Thông tin tài chính" section
3. ✅ Display financial fields với conditional rendering
4. ✅ Add visual indicator khi data bị mask

### Phase 3: Items Table Enhancements (1-2 hours)
1. ✅ Add "Đơn giá" column (với RBAC check)
2. ✅ Add "Thành tiền" column (với RBAC check)
3. ✅ Update table layout

### Phase 4: Code Cleanup (30 minutes)
1. ✅ Fix comment trong `storageService.ts`
2. ✅ Add JSDoc comments cho new sections

**Total Estimated Time:** 5-8 hours

---

## 📊 Current vs Expected

| Feature | Current | Expected | Status |
|---------|---------|----------|--------|
| Basic transaction info | ✅ | ✅ | ✅ Complete |
| Items list | ✅ | ✅ | ✅ Complete |
| Status display | ❌ | ✅ | ⏳ Pending |
| Approval info | ❌ | ✅ | ⏳ Pending |
| Financial info | ❌ | ✅ | ⏳ Pending |
| RBAC handling | ❌ | ✅ | ⏳ Pending |
| Export info | ❌ | ✅ | ⏳ Pending |
| Invoice number | ❌ | ✅ | ⏳ Pending |
| Items pricing | ❌ | ✅ | ⏳ Pending |

**Completion:** ~40% (Core functionality working, enhancements pending)

---

## 🧪 Testing Checklist

### Current Functionality
- [x] Modal opens when clicking "View" button
- [x] Transaction detail loads correctly
- [x] Items list displays correctly
- [x] Fallback mechanism works for missing itemCode/expiryDate
- [x] Loading states work correctly
- [x] Error handling works correctly

### Pending Tests (after implementation)
- [ ] Status badge displays correctly
- [ ] Approval info displays for APPROVED transactions
- [ ] Financial info displays with VIEW_COST permission
- [ ] Financial info is hidden without VIEW_COST permission
- [ ] Export info displays for EXPORT transactions
- [ ] Invoice number displays for IMPORT transactions
- [ ] Items pricing columns display with VIEW_COST permission
- [ ] Items pricing columns are hidden without VIEW_COST permission

---

## 📝 Related Files

### Modified Files
- `src/services/storageService.ts` - Service layer implementation
- `src/app/admin/warehouse/components/StorageDetailModal.tsx` - UI component
- `src/types/warehouse.ts` - Type definitions

### Related Documentation
- `docs/api-guide/warehouse/API_6.7_TRANSACTION_DETAIL_COMPLETE.md` - BE API specification
- `docs/api-guide/warehouse/API_6.7_TRANSACTION_DETAIL_IMPLEMENTATION_SUMMARY.md` - BE implementation summary
- `docs/api-guide/warehouse/TRANSACTION_APPROVAL_WORKFLOW.md` - Approval workflow documentation

---

## ✅ Summary

**Current Status:** API 6.7 đã được tích hợp cơ bản vào FE. Core functionality (fetch và hiển thị transaction detail) đã hoạt động tốt. Tuy nhiên, **BE thiếu một số fields quan trọng trong response** (approval info, payment info, appointment info) nên FE không thể hiển thị đầy đủ.

**Blocking Issues:**
- ⏳ **BE Issue #17**: BE cần thêm các fields thiếu vào `ImportTransactionResponse` và `ExportTransactionResponse` (xem `docs/BE_OPEN_ISSUES.md`)

**Next Steps:**
1. **Chờ BE fix Issue #17** trước
2. Sau đó implement Phase 1-3 để hoàn thiện UI
3. Test với các scenarios khác nhau
4. Verify RBAC behavior với users có/không có VIEW_COST permission

**Estimated Completion:** 
- BE fix: ~2 hours (Issue #17)
- FE implementation: 5-8 hours (sau khi BE fix)

---

**Last Updated:** 2025-01-28  
**Next Review:** After Phase 1-3 implementation

