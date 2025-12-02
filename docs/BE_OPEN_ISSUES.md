# BE Open Issues

> ⚠️ Only **open** issues are listed below. All resolved issues have been removed for clarity.
> 
> **Note (2025-01-30)**: 
> - ✅ **Resolved Issues:** #15, #16, #17, #20, #21, #22, #18, #19, #23, #24, #25, #26 (đã được BE xác nhận resolved)
> - 📋 **BE Response:** Xem file `docs/api-guide/warehouse/FE_ISSUES_RESOLUTION_2025_11_29.md` để biết chi tiết
> - **Issue #24:** Đã resolved - FE đã được update để dùng đúng endpoint `/api/v1/inventory/summary` thay vì `/api/v1/warehouse/summary`
> - **Issue #25:** Đã resolved - Seed data đã có `APPROVE_TRANSACTION` permission cho `ROLE_ADMIN`, FE đã thêm button "Gửi duyệt" để submit transaction từ DRAFT → PENDING_APPROVAL
> - **Issue #26:** Đã resolved - BE đã fix database constraints và error handling. FE test script đã fetch units dynamically (không có hardcoded IDs)

---

## 📊 Summary

| # | Issue | Status | Priority | Reported Date |
|---|-------|--------|----------|---------------|
| #27 | API 6.6 - Transaction List không trả về `totalValue` (Giá trị) | 🔴 **OPEN** | **MEDIUM** | 2025-01-30 |
| #28 | API - Transaction Stats endpoint trả về 400 INVALID_PARAMETER_TYPE | 🔴 **OPEN** | **MEDIUM** | 2025-01-30 |

---

## 🔴 Open Issues

---

### Issue #27: API 6.6 - Transaction List không trả về `totalValue` (Giá trị)

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-01-30  
**Endpoint:** `GET /api/v1/warehouse/transactions`

#### Problem Description

API 6.6 (Transaction List) không trả về field `totalValue` trong response, khiến FE không thể hiển thị giá trị của các phiếu nhập/xuất kho trong bảng danh sách. Tất cả transactions đều hiển thị giá trị mặc định hoặc không có giá trị.

#### Expected Behavior

Theo API 6.6 specification:
- Response nên bao gồm field `totalValue` (hoặc `total_value`) cho mỗi transaction
- `totalValue` = tổng giá trị của tất cả items trong transaction
- Công thức: `sum(item.quantity * item.unitPrice)` cho mỗi item

#### Actual Behavior

- **Status Code:** `200 OK`
- **Response Structure:** Transaction list được trả về đúng
- **Missing Field:** `totalValue` không có trong response
- **FE Impact:** Cột "Giá trị" trong bảng hiển thị "-" hoặc giá trị mặc định (10.000 ₫)

#### FE Implementation

**File:** `src/services/storageService.ts`

**Mapping Function:** `mapTransactionSummary()`
- Line 105: `totalValue: item.totalValue ?? item.total_value`
- FE đã thử nhiều field names: `totalValue`, `total_value`, `totalAmount`, `total_amount`, `amount`, `value`
- FE đã implement fallback: Tính toán từ `items` array nếu có

**Display Logic:** `src/app/admin/warehouse/storage/page.tsx`
- Line 772-774: Hiển thị `totalValue` nếu có, nếu không hiển thị "-"
- Code: `{txn.totalValue !== null && txn.totalValue !== undefined ? ${txn.totalValue.toLocaleString('vi-VN')} ₫ : <span className="text-gray-400">-</span>}`

#### Possible Root Causes

1. **BE Response Missing Field:**
   - BE không tính toán và trả về `totalValue` trong list response
   - BE có thể chỉ trả về `totalValue` trong detail response (API 6.7), không có trong list response (API 6.6)
   - **Action Required:** Verify BE response structure cho API 6.6

2. **BE Field Name Mismatch:**
   - BE có thể trả về field với tên khác (ví dụ: `totalAmount`, `total_amount`, `value`)
   - **Action Required:** Check BE DTO response class để xem field name chính xác

3. **BE Performance Optimization:**
   - BE có thể không trả về `totalValue` trong list để tối ưu performance
   - BE có thể không trả về `items` array trong list response
   - **Action Required:** Verify xem BE có trả về `items` array trong list response không

4. **BE Calculation Missing:**
   - BE có thể chưa tính toán `totalValue` khi tạo transaction
   - **Action Required:** Verify xem BE có tính toán và lưu `totalValue` vào database không

#### Investigation Steps

1. **✅ Check FE Mapping (COMPLETED):**
   - ✅ FE đã thử nhiều field names: `totalValue`, `total_value`, `totalAmount`, `total_amount`, `amount`, `value`
   - ✅ FE đã implement fallback: Tính toán từ `items` array nếu có
   - ✅ FE đã thêm debug logging để track BE response

2. **Check BE Response:**
   - Verify response từ `GET /api/v1/warehouse/transactions` có field `totalValue` không
   - Check xem BE có trả về `items` array trong list response không
   - Verify field name chính xác trong BE DTO

3. **Check BE DTO:**
   - Review `TransactionSummaryResponse` hoặc tương tự
   - Verify xem có field `totalValue` hoặc tương tự không
   - Check xem field có được map từ entity không

4. **Check BE Service:**
   - Verify xem service có tính toán `totalValue` khi query transactions không
   - Check xem có logic để populate `totalValue` trong list response không

#### Related BE Files (Expected)

- Controller: `TransactionHistoryController.java`
  - Method: `GET /api/v1/warehouse/transactions` (API 6.6)
- Service: `TransactionHistoryService.java`
  - Method: `getAllTransactions()` hoặc tương tự
- DTO: `TransactionSummaryResponse.java` hoặc tương tự
  - Expected field: `totalValue` hoặc `total_value`

#### Related FE Files

- `src/services/storageService.ts:85-115` - `mapTransactionSummary()` function
- `src/app/admin/warehouse/storage/page.tsx:770-776` - Display logic for `totalValue`

#### Suggested Fixes

1. **BE: Add `totalValue` to List Response:**
   - Tính toán `totalValue` từ items khi query transactions
   - Thêm field `totalValue` vào `TransactionSummaryResponse` DTO
   - Map field từ entity hoặc tính toán trong service

2. **BE: Include `items` Array in List Response (if needed):**
   - Nếu FE cần tính toán từ items, BE nên trả về `items` array trong list response
   - Hoặc BE nên tính toán và trả về `totalValue` trực tiếp

3. **BE: Verify Field Name:**
   - Đảm bảo field name consistent (camelCase: `totalValue` hoặc snake_case: `total_value`)
   - Document field name trong API specification

4. **Documentation:**
   - Update API 6.6 specification để include `totalValue` field
   - Document calculation formula: `sum(item.quantity * item.unitPrice)`

#### Test Request (for BE team to verify)

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/transactions?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "content": [
    {
      "transactionId": 1,
      "transactionCode": "PN-20251130-001",
      "transactionType": "IMPORT",
      "totalValue": 1000000,  // ← Field này cần có
      ...
    }
  ],
  ...
}
```

**Actual Response:** `totalValue` field missing hoặc `null`

---

**Last Updated:** 2025-01-30  
**Total Open Issues:** 2  
**High Priority Issues:** 0  
**Medium Priority Issues:** 2 (Issue #27, #28)

**For detailed BE response, see:** `docs/api-guide/warehouse/FE_ISSUES_RESOLUTION_2025_11_29.md`

---

## 📝 Verification Summary (2025-01-30)

### Issue #25 - Admin Approve/Reject Permissions

**✅ RESOLVED:**
- `APPROVE_TRANSACTION` permission đã được tạo trong seed data
- `ROLE_ADMIN` đã được gán TẤT CẢ permissions, bao gồm `APPROVE_TRANSACTION`
- FE đã thêm button "Gửi duyệt" để submit transaction từ DRAFT → PENDING_APPROVAL
- Buttons approve/reject hiển thị đúng khi transaction status = PENDING_APPROVAL và user có permission
- **Status:** ✅ **RESOLVED** - Đã được fix và test thành công

### Issue #26 - API 6.12-POST Batch Unit Conversion

**✅ RESOLVED BY BE:**
- **Root Cause:** Database có duplicate base units (4 copies per item) gây `NonUniqueResultException`
- **BE Fixes:**
  1. ✅ Database constraints: `UNIQUE (item_master_id, unit_name)` và `UNIQUE (item_master_id) WHERE is_base_unit = true`
  2. ✅ Seed data fixed với proper `ON CONFLICT` handling
  3. ✅ Error handling improved: Returns `404 UNIT_NOT_FOUND` for invalid unit IDs
- **Status:** ✅ **RESOLVED** - API hoạt động đúng khi dùng valid unit IDs

**FE Status:**
- ✅ Test script (`scripts/test-warehouse-apis.ts`) đã fetch units dynamically (line 950-1008)
- ✅ No hardcoded unit IDs found in test script
- ✅ FE service code (`src/services/itemUnitService.ts`) không có hardcoded IDs
- **Note:** FE code đã đúng, chỉ cần test lại với BE fixes

### Issue #27 - API 6.6 Transaction List Missing `totalValue`

**❌ FIELD MISSING IN BE RESPONSE:**
- BE không trả về field `totalValue` trong transaction list response
- FE đã thử nhiều field names nhưng không tìm thấy
- **Status:** 🔴 **OPEN** - Cần BE thêm field `totalValue` vào response

### Issue #28 - Transaction Stats Endpoint 400 Error

**❌ ENDPOINT ERROR:**
- Endpoint `/warehouse/transactions/stats` trả về `400 INVALID_PARAMETER_TYPE`
- Error message: "Invalid parameter type: id"
- FE đang gửi `month` và `year` nhưng BE expect `id`
- **Status:** 🔴 **OPEN** - Cần BE fix endpoint signature hoặc implement endpoint đúng

**Action Required:**
1. BE cần thêm field `totalValue` vào `TransactionSummaryResponse` DTO
2. BE cần tính toán và trả về `totalValue` trong list response
3. Hoặc BE cần trả về `items` array để FE có thể tính toán

---

### Issue #28: API - Transaction Stats endpoint trả về 400 INVALID_PARAMETER_TYPE

**Status:** 🔴 **OPEN**  
**Priority:** **MEDIUM**  
**Reported Date:** 2025-01-30  
**Endpoint:** `GET /api/v1/warehouse/transactions/stats`

#### Problem Description

Endpoint `/warehouse/transactions/stats` trả về `400 Bad Request` với error `INVALID_PARAMETER_TYPE` và message "Invalid parameter type: id", mặc dù FE đang gửi parameters `month` và `year` (không phải `id`).

#### Expected Behavior

Theo documentation và FE implementation:
- Endpoint: `GET /api/v1/warehouse/transactions/stats`
- Parameters: `month` (optional, number), `year` (optional, number)
- Expected response: Statistics về import/export transactions cho tháng/năm được chỉ định

#### Actual Behavior

- **Status Code:** `400 Bad Request`
- **Error Code:** `INVALID_PARAMETER_TYPE`
- **Error Message:** `"Invalid parameter type: id"`
- **Request URL:** `/warehouse/transactions/stats?month=11&year=2025`
- **Request Params:** `{ month: 11, year: 2025 }`
- **Issue:** BE expect parameter `id` nhưng FE đang gửi `month` và `year`

#### Error Response

```json
{
  "statusCode": 400,
  "error": "INVALID_PARAMETER_TYPE",
  "message": "Invalid parameter type: id",
  "data": null
}
```

#### FE Implementation

**File:** `src/services/storageService.ts:228-273`

```typescript
getStats: async (month?: number, year?: number): Promise<StorageStats> => {
  try {
    const response = await api.get(`${TRANSACTION_BASE}/stats`, {
      params: { month, year },
    });
    // ... mapping logic ...
  } catch (error: any) {
    // Returns default values to prevent UI crash
    return defaultStats;
  }
}
```

**Used In:**
- `src/app/admin/warehouse/page.tsx:51-54` - Dashboard stats
- `src/app/admin/warehouse/storage/page.tsx:111-112` - Storage page stats

#### Possible Root Causes

1. **Endpoint Signature Mismatch:**
   - BE endpoint có thể expect `id` parameter thay vì `month`/`year`
   - Endpoint có thể là `/warehouse/transactions/{id}/stats` thay vì `/warehouse/transactions/stats`
   - **Action Required:** Verify endpoint signature trong BE controller

2. **Endpoint Not Implemented:**
   - Endpoint này có thể chưa được implement bởi BE
   - Endpoint có thể đã bị remove hoặc deprecated
   - **Action Required:** Check BE controller xem endpoint có tồn tại không

3. **Parameter Validation Bug:**
   - BE có validation bug, expect `id` nhưng endpoint không cần `id`
   - **Action Required:** Check BE parameter validation logic

4. **Wrong Endpoint Path:**
   - Endpoint có thể ở path khác (ví dụ: `/warehouse/stats` hoặc `/inventory/stats`)
   - **Action Required:** Verify correct endpoint path trong BE

#### Investigation Steps

1. **Check BE Controller:**
   - Verify endpoint `GET /warehouse/transactions/stats` có tồn tại không
   - Check parameter annotations (`@RequestParam`, `@PathVariable`, etc.)
   - Verify expected parameter names và types

2. **Check BE Service:**
   - Verify service method signature
   - Check xem có logic để handle `month` và `year` parameters không

3. **Check API Documentation:**
   - Verify endpoint specification trong BE docs
   - Check xem endpoint có được document đúng không

4. **Alternative Solution:**
   - Nếu endpoint không tồn tại, FE có thể tính toán stats từ transaction list
   - Hoặc BE có thể implement endpoint mới với đúng signature

#### Related BE Files (Expected)

- Controller: `TransactionHistoryController.java`
  - Method: `GET /api/v1/warehouse/transactions/stats`
- Service: `TransactionHistoryService.java`
  - Method: `getTransactionStats()` hoặc tương tự

#### Related FE Files

- `src/services/storageService.ts:228-273` - `getStats()` method
- `src/app/admin/warehouse/page.tsx:51-54` - Dashboard stats query
- `src/app/admin/warehouse/storage/page.tsx:111-112` - Storage page stats query

#### Suggested Fixes

1. **BE: Fix Endpoint Signature:**
   - Update endpoint để accept `month` và `year` parameters
   - Remove validation cho `id` parameter nếu không cần
   - Hoặc document endpoint đúng signature nếu cần `id`

2. **BE: Implement Endpoint (if missing):**
   - Implement endpoint `/warehouse/transactions/stats` với `month`/`year` parameters
   - Return statistics về import/export counts, growth percentages, etc.

3. **FE: Workaround (temporary):**
   - FE đã implement fallback: Return default values khi endpoint fail
   - UI vẫn hoạt động bình thường, chỉ stats hiển thị 0

#### Test Request (for BE team to verify)

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/transactions/stats?month=11&year=2025" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "monthlyImportCount": 10,
  "monthlyExportCount": 5,
  "importGrowthPercent": 15.5,
  "exportGrowthPercent": -5.2,
  "totalTransactionsCount": 15,
  "expiredItemsCount": 0
}
```

**Actual Response:** `400 INVALID_PARAMETER_TYPE` with message "Invalid parameter type: id"

---

**Last Updated:** 2025-01-30  
**Total Open Issues:** 2  
**High Priority Issues:** 0  
**Medium Priority Issues:** 2 (Issue #27, #28)
