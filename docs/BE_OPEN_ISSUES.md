# BE Open Issues

> ⚠️ Only **open** issues are listed below. All resolved issues have been removed for clarity.
> 
> **Note (2025-01-30)**: 
> - ✅ **Resolved Issues:** #15, #16, #17, #20, #21, #22, #18, #19, #23, #24 (đã được BE xác nhận resolved)
> - 📋 **BE Response:** Xem file `docs/api-guide/warehouse/FE_ISSUES_RESOLUTION_2025_11_29.md` để biết chi tiết
> - **Issue #24:** Đã resolved - FE đã được update để dùng đúng endpoint `/api/v1/inventory/summary` thay vì `/api/v1/warehouse/summary`

---

## 📊 Summary

| # | Issue | Status | Priority | Reported Date |
|---|-------|--------|----------|---------------|
| #25 | Admin không thấy nút Approve/Reject cho phiếu nhập kho | 🔴 **OPEN** | **HIGH** | 2025-01-30 |
| #26 | API 6.12-POST - Batch Unit Conversion trả về 400 Bad Request | 🔴 **OPEN** | **MEDIUM** | 2025-01-30 |

---

## 🔴 Open Issues

### Issue #25: Admin không thấy nút Approve/Reject cho phiếu nhập kho

**Status:** 🔴 **OPEN**  
**Priority:** **HIGH**  
**Reported Date:** 2025-01-30  
**Endpoint:** `POST /api/v1/warehouse/transactions/{id}/approve`, `POST /api/v1/warehouse/transactions/{id}/reject`

#### Problem Description

Khi đăng nhập bằng tài khoản admin, không thấy nút "Duyệt" và "Từ chối" trong modal chi tiết phiếu nhập kho (`StorageDetailModal`), mặc dù BE cho phép `ROLE_ADMIN` có quyền approve/reject transactions.

#### Expected Behavior

Theo BE code (`TransactionHistoryController.java`):
- Line 193: `@PreAuthorize("hasRole('" + ADMIN + "') or hasAuthority('APPROVE_TRANSACTION')")`
- Admin role (`ROLE_ADMIN`) nên có quyền approve/reject transactions

FE logic (`StorageDetailModal.tsx`):
- Line 67-68: `const isAdmin = useRole('ROLE_ADMIN'); const hasApprovePermission = isAdmin || usePermission('APPROVE_TRANSACTION');`
- Line 644: Button chỉ hiển thị khi `transaction?.status === 'PENDING_APPROVAL' && hasApprovePermission`

#### Possible Root Causes

1. **Transaction Status Issue:**
   - Transaction status hiện tại là `DRAFT` (Nháp) thay vì `PENDING_APPROVAL` (Chờ duyệt)
   - Nút approve/reject chỉ hiển thị khi status = `PENDING_APPROVAL`
   - **Action Required:** Cần submit transaction để chuyển từ `DRAFT` → `PENDING_APPROVAL`

2. **Admin Role Not Recognized:**
   - FE check `useRole('ROLE_ADMIN')` nhưng BE có thể trả về role name khác (ví dụ: `ADMIN` thay vì `ROLE_ADMIN`)
   - **Action Required:** Kiểm tra response từ `/api/v1/auth/login` xem `roles` array có chứa `ROLE_ADMIN` không

3. **Missing APPROVE_TRANSACTION Permission:**
   - Admin có thể không có `APPROVE_TRANSACTION` trong `permissions` array
   - **Action Required:** Kiểm tra seed data xem admin có được gán quyền `APPROVE_TRANSACTION` không

4. **Permission Check Logic:**
   - FE check: `isAdmin || usePermission('APPROVE_TRANSACTION')`
   - Nếu cả hai đều false, button sẽ không hiển thị

#### FE Debug Logging

FE đã thêm debug logging trong `StorageDetailModal.tsx` để track:
- `isAdmin`: Kết quả check `ROLE_ADMIN`
- `hasApprovePermission`: Kết quả check permission
- `userRoles`: Danh sách roles của user
- `userPermissions`: Danh sách permissions của user
- `transactionStatus`: Status hiện tại của transaction
- `canShowApproveButton`: Điều kiện hiển thị button

**Check browser console để xem debug logs khi mở modal chi tiết phiếu.**

#### Investigation Steps

1. **Kiểm tra Transaction Status:**
   - Mở modal chi tiết phiếu
   - Xem console log để check `transactionStatus`
   - Nếu status = `DRAFT`, cần submit transaction để chuyển sang `PENDING_APPROVAL`

2. **Kiểm tra User Roles & Permissions:**
   - Xem console log để check `userRoles` và `userPermissions`
   - Verify xem có `ROLE_ADMIN` trong `userRoles` không
   - Verify xem có `APPROVE_TRANSACTION` trong `userPermissions` không

3. **Kiểm tra BE Seed Data:**
   - Verify xem admin user có được gán `ROLE_ADMIN` role không
   - Verify xem admin user có được gán `APPROVE_TRANSACTION` permission không
   - Verify xem role `ROLE_ADMIN` có được map với permission `APPROVE_TRANSACTION` không

#### Related BE Files

- `files_from_BE/warehouse/controller/TransactionHistoryController.java:193, 225`
- `files_from_BE/warehouse/service/TransactionHistoryService.java:453-529`
- Seed data files (cần check role và permission mapping)

#### Related FE Files

- `src/app/admin/warehouse/components/StorageDetailModal.tsx:67-68, 644`
- `src/hooks/usePermissions.ts:35-38`
- `src/contexts/AuthContext.tsx:330-333`

#### Suggested Fixes

1. **BE: Ensure Admin Role Has Approve Permission:**
   - Verify seed data: Admin role should have `APPROVE_TRANSACTION` permission
   - Or ensure `ROLE_ADMIN` is recognized by Spring Security `@PreAuthorize`

2. **BE: Verify Role Name Format:**
   - Ensure login response returns `ROLE_ADMIN` (not `ADMIN`) in `roles` array
   - Or update FE to check for both `ROLE_ADMIN` and `ADMIN`

3. **FE: Add Fallback Role Check:**
   - Check for both `ROLE_ADMIN` and `ADMIN` roles
   - Or check `baseRole === 'admin'` as fallback

4. **Documentation:**
   - Document required permissions for approve/reject workflow
   - Document how to submit transaction from DRAFT to PENDING_APPROVAL

---

### Issue #26: API 6.12-POST - Batch Unit Conversion trả về 400 Bad Request

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-01-30  
**Endpoint:** `POST /api/v1/warehouse/items/units/convert`

#### Problem Description

API 6.12-POST (Batch Unit Conversion) trả về `400 Bad Request` với error message generic `"error": "error.bad_request"` không có chi tiết validation error, mặc dù:
- Request structure đúng theo test guide (`ITEM_UNIT_CONVERSION_API_TEST_GUIDE.md`)
- Units đã được verify belong to the same item (via API 6.11)
- GET endpoint (API 6.12-GET) hoạt động tốt với cùng unit IDs
- Request payload structure khớp với test guide

#### Expected Behavior

Theo test guide (`docs/api-guide/warehouse/ITEM_UNIT_CONVERSION_API_TEST_GUIDE.md`):
- Endpoint: `POST /api/v1/warehouse/items/units/convert`
- Request structure:
  ```json
  {
    "conversions": [
      {
        "itemMasterId": 1,
        "fromUnitId": 60,
        "toUnitId": 58,
        "quantity": 2.5
      }
    ],
    "roundingMode": "HALF_UP"
  }
  ```
- Expected response: `200 OK` với conversion results

#### Actual Behavior

- **Status Code:** `400 Bad Request`
- **Error Response:**
  ```json
  {
    "statusCode": 400,
    "error": "error.bad_request",
    "message": "Bad Request",
    "data": null
  }
  ```
- **Issue:** Error message quá generic, không có chi tiết validation error nào

#### Test Evidence

**Test Script:** `scripts/test-warehouse-apis.ts`

**Test Steps:**
1. ✅ Get item units via API 6.11: `GET /warehouse/items/1/units`
   - Found 9 units for item 1 (CON-GLOVE-01)
   - Base Unit: Chiec (ID: 58)
   - Selected: Hop (ID: 60, order: 1) → Chiec (ID: 58, base: true)

2. ✅ Verify units belong to item:
   - Verified units belong to item 1: Hop → Chiec

3. ✅ GET endpoint works:
   - `GET /warehouse/items/units/convert?fromUnitId=60&toUnitId=58&quantity=10`
   - Status: `200 OK`
   - Result: `10 → 2000` (correct conversion)

4. ❌ POST endpoint fails:
   - `POST /warehouse/items/units/convert`
   - Request body:
     ```json
     {
       "conversions": [
         {
           "itemMasterId": 1,
           "fromUnitId": 60,
           "toUnitId": 58,
           "quantity": 2.5
         }
       ],
       "roundingMode": "HALF_UP"
     }
     ```
   - Status: `400 Bad Request`
   - Error: Generic "error.bad_request" without details

#### BE Code Analysis

**Controller:** `ItemMasterController.java:252-318`
- Endpoint: `POST /api/v1/warehouse/items/units/convert`
- Uses `@Valid` annotation on `ConversionRequest`
- Authorization: `ADMIN`, `VIEW_ITEMS`, `VIEW_WAREHOUSE`, `MANAGE_WAREHOUSE`

**Request DTO:** `ConversionRequest.java`
- `@NotEmpty` on `conversions` list
- `@Valid` on nested `ConversionItemRequest` objects
- `roundingMode` optional (default: "HALF_UP")

**Item Request DTO:** `ConversionItemRequest.java`
- `@NotNull`, `@Positive` on `itemMasterId` (Long)
- `@NotNull`, `@Positive` on `fromUnitId` (Long)
- `@NotNull`, `@Positive` on `toUnitId` (Long)
- `@NotNull`, `@Positive` on `quantity` (Double)

**Service Logic:** `ItemMasterService.java:612-637`
- Line 620-632: Loop through conversions, catch exceptions
- Line 626-631: Catch exception and throw `ResponseStatusException` with message
- Line 642-676: `convertSingleUnit()` validates:
  1. Item exists (404 if not found)
  2. From unit exists and belongs to item (400 if mismatch)
  3. To unit exists and belongs to item (400 if mismatch)
  4. Conversion rates > 0 (400 if invalid)
  5. Base unit exists (500 if missing)

#### Possible Root Causes

1. **Validation Error Handling:**
   - `@Valid` validation errors (MethodArgumentNotValidException) may not be handled properly
   - Generic error response suggests validation errors are caught but message is lost
   - **Action Required:** Check global exception handler for `MethodArgumentNotValidException`

2. **Unit Ownership Validation:**
   - Line 658-662: Checks `fromUnit.getItemMaster().getItemMasterId().equals(request.getItemMasterId())`
   - Line 671-675: Checks `toUnit.getItemMaster().getItemMasterId().equals(request.getItemMasterId())`
   - **Issue:** If units don't belong to item, should return specific error message
   - **Test Evidence:** GET endpoint works with same unit IDs, suggesting units DO belong to item
   - **Action Required:** Verify unit ownership check logic

3. **@Positive Validation for Double:**
   - `@Positive` on `Double quantity` may have issues with decimal values
   - Test uses `quantity: 2.5` which should be valid
   - **Action Required:** Verify `@Positive` works correctly with `Double` type

4. **Missing Error Details:**
   - BE trả về generic "error.bad_request" thay vì specific validation errors
   - Exception messages from service (line 630) may not be included in response
   - **Action Required:** Check global exception handler to include validation error details

#### Investigation Steps

1. **Verify Request Structure:**
   - Check BE DTO (`BatchConversionRequest` hoặc tương tự)
   - Verify field names match (camelCase: `itemMasterId`, `fromUnitId`, `toUnitId`, `quantity`)
   - Verify `roundingMode` enum values

2. **Check BE Validation:**
   - Review validation annotations (`@Valid`, `@NotNull`, `@Min`, etc.)
   - Check if units belong to item validation
   - Check if conversion rate exists between units

3. **Compare GET vs POST:**
   - GET endpoint works with same unit IDs
   - POST endpoint fails with same unit IDs
   - Check if validation logic differs between GET and POST

4. **Test with Test Guide Example:**
   - Try with exact unit IDs from test guide (fromUnitId: 3, toUnitId: 1 for item 1)
   - Verify if issue is specific to certain unit IDs or general

#### Related BE Files (Expected)

- Controller: `ItemMasterController.java` hoặc `ItemUnitController.java`
  - Method: `@PostMapping("/units/convert")` hoặc tương tự
- Service: `ItemUnitService.java` hoặc tương tự
  - Method: `batchConvert()` hoặc `convertUnits()`
- DTO: `BatchConversionRequest.java` hoặc tương tự
  - Fields: `conversions[]`, `roundingMode`

#### Related FE Files

- `src/services/itemUnitService.ts:74-101` - `convertUnits()` method
- `src/types/warehouse.ts:459-467` - `ConversionRequest` interface
- `scripts/test-warehouse-apis.ts:1028-1043` - Test script

#### Suggested Fixes

1. **BE: Improve Error Response:**
   - Return specific validation errors instead of generic "error.bad_request"
   - Include field-level validation errors (e.g., "fromUnitId: Unit not found", "quantity: Must be positive")
   - Use `@Valid` with proper error handling

2. **BE: Verify Validation Logic:**
   - Ensure POST endpoint validation matches GET endpoint logic
   - Verify units belong to item validation
   - Check conversion rate calculation

3. **BE: Update Test Guide:**
   - If request structure changed, update test guide
   - If unit IDs in test guide are incorrect, update with correct IDs

4. **Documentation:**
   - Document exact request structure required
   - Document validation rules and error codes
   - Provide working example with actual unit IDs from seed data

#### Test Request (for BE team to reproduce)

```bash
curl -X POST http://localhost:8080/api/v1/warehouse/items/units/convert \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversions": [
      {
        "itemMasterId": 1,
        "fromUnitId": 60,
        "toUnitId": 58,
        "quantity": 2.5
      }
    ],
    "roundingMode": "HALF_UP"
  }'
```

**Expected:** `200 OK` with conversion results  
**Actual:** `400 Bad Request` with generic error

---

**Last Updated:** 2025-01-30  
**Total Open Issues:** 2  
**High Priority Issues:** 1  
**Medium Priority Issues:** 1

**For detailed BE response, see:** `docs/api-guide/warehouse/FE_ISSUES_RESOLUTION_2025_11_29.md`
