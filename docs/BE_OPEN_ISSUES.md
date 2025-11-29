# BE Open Issues (2025-11-28)

> ⚠️ Only **open** issues are listed below. All resolved issues have been removed for clarity.
> 
> **Note (2025-11-28)**: 
> - ✅ **Resolved Issues:** #15, #16, #17, #20, #21, #22 (đã được xác nhận resolved sau khi test lại)
> - 🔴 **Open Issues:** #18, #19 (vẫn còn 500 error - cần BE kiểm tra lại seed data hoặc database)
> - 🔵 **Low Priority:** #23 (improvement, không blocking)

---

## 📊 Summary

| # | Issue | Status | Priority | Owner | Est. Effort |
|---|-------|--------|----------|-------|-------------|
| 18 | API 6.1 - Inventory Summary returns 500 Internal Server Error | 🔴 Open | High | BE | ~2h |
| 19 | API 6.2 - Item Batches returns 500 Internal Server Error | 🔴 Open | High | BE | ~2h |
| 23 | Payment Status Default Value for DRAFT Import Transactions | 🔵 Low Priority | Low | BE | ~30m |

---

## #18 – API 6.1 - Inventory Summary returns 500 Internal Server Error

**Status:** 🔴 **OPEN** • **Priority:** High  
**Endpoint:** `GET /api/v1/warehouse/summary` (API 6.1)  
**Files (Suspected):** `warehouse/controller/WarehouseInventoryController.java`, `warehouse/service/InventoryService.java`  
**Last Checked:** 2025-11-28 (Test script with authentication)

### 📊 Test Results (2025-11-28)
- **Status Code:** 500 Internal Server Error
- **Response Time:** 451ms
- **Error:** Internal server error
- **Authentication:** ✅ Valid (admin token)
- **Note:** BE team reported this was due to seed data issues, but test still shows 500 error

### ✅ Update (2025-11-28)
- **BE Team Report:** Issue was caused by **seed data problems**, not code issues
- **BE Code Status:** ✅ Code is correct, endpoint implementation is complete
- **Test Result:** ❌ Still returns 500 - may need additional seed data or database fix

### ❌ Original Problem Statement
- API 6.1 (`GET /api/v1/warehouse/summary`) returns HTTP 500 Internal Server Error on every request.
- This endpoint is critical for inventory dashboard and reports.
- FE cannot display inventory summary, stock status, or expiring items using this endpoint.

### 🔎 Evidence
- Test script result: `Status: FAIL | Code: 500 | Time: 419ms | Error: Internal server error`
- Request: `GET /api/v1/warehouse/summary?page=0&size=10`
- Authentication: ✅ Valid (admin token)
- Response: 500 with empty body or generic error message
- **Root Cause:** Seed data issues (missing/invalid data in database)

### 🧪 Reproduction Steps
1. Login with admin account (username: admin, password: 123456)
2. Call `GET /api/v1/warehouse/summary?page=0&size=10`
3. **Expected**: 200 OK with inventory summary data
4. **Actual**: 500 Internal Server Error

### 🚨 Impact
- **Critical**: Inventory dashboard cannot load
- **Reports**: Inventory reports fail
- **User Experience**: Users cannot view stock status, low stock alerts, or expiring items

### ✅ Expected Behavior
- Endpoint should return `200 OK` with `InventorySummaryPage` response
- Should handle pagination, filtering, and sorting correctly
- Should gracefully handle empty results (return empty list, not error)

### 🛠 Suggested Investigation
1. Check BE logs for stack trace when calling `/api/v1/warehouse/summary`
2. Verify database schema matches expected structure
3. Check for null pointer exceptions in service/mapper layer
4. Verify JOIN queries are correct (item_master, category, batches)
5. Check if pagination parameters are handled correctly

### ✅ Definition of Done
- `GET /api/v1/warehouse/summary` returns 200 OK with valid response
- Inventory dashboard loads successfully
- Pagination, filtering, and sorting work correctly
- Empty results return empty list (not error)

### 📝 Notes (2025-11-28)
- **BE Code:** ✅ Implementation is correct
- **Issue:** Seed data problems (missing/invalid data)
- **Action:** Test again after seed data is fixed
- **FE Status:** ✅ Implementation ready, waiting for BE seed data fix

---

## #19 – API 6.2 - Item Batches returns 500 Internal Server Error

**Status:** 🔴 **OPEN** • **Priority:** High  
**Endpoint:** `GET /api/v1/warehouse/batches/{itemMasterId}` (API 6.2)  
**Files (Suspected):** `warehouse/controller/WarehouseInventoryController.java`, `warehouse/service/InventoryService.java`, `warehouse/repository/ItemBatchRepository.java`  
**Last Checked:** 2025-11-28 (Test script with authentication)

### 📊 Test Results (2025-11-28)
- **Status Code:** 500 Internal Server Error
- **Response Time:** 196ms
- **Error:** Internal server error
- **Authentication:** ✅ Valid (admin token)
- **Test Item ID:** 1
- **Note:** BE team reported this was due to seed data issues, but test still shows 500 error

### ✅ Update (2025-11-28)
- **BE Team Report:** Issue was caused by **seed data problems**, not code issues
- **BE Code Status:** ✅ Code is correct, endpoint implementation is complete
- **Test Result:** ❌ Still returns 500 - may need additional seed data or database fix

### ❌ Original Problem Statement
- API 6.2 (`GET /api/v1/warehouse/batches/{itemMasterId}`) returns HTTP 500 Internal Server Error.
- This endpoint is used for FEFO (First Expired, First Out) batch selection in export transactions.
- FE cannot display batch details for items, blocking export transaction creation.

### 🔎 Evidence
- Test script result: `Status: FAIL | Code: 500 | Time: 237ms | Error: Internal server error`
- Request: `GET /api/v1/warehouse/batches/1`
- Authentication: ✅ Valid (admin token)
- Response: 500 Internal Server Error
- **Root Cause:** Seed data issues (missing/invalid item_master or batch data)

### 🧪 Reproduction Steps
1. Login with admin account
2. Call `GET /api/v1/warehouse/batches/1` (or any valid itemMasterId)
3. **Expected**: 200 OK with batch list sorted by expiry date (FEFO)
4. **Actual**: 500 Internal Server Error

### 🚨 Impact
- **Export Transactions**: Cannot create export transactions (FEFO selection fails)
- **Item Detail**: Cannot view batch details in item detail modal
- **Stock Management**: Cannot see batch-level information

### ✅ Expected Behavior
- Endpoint should return `200 OK` with `BatchResponse[]` sorted by expiry date (FEFO)
- Should handle non-existent itemMasterId gracefully (return empty list or 404)
- Should only return batches with `quantityOnHand > 0`

### 🛠 Suggested Investigation
1. Check BE logs for stack trace
2. Verify `ItemBatchRepository.findByItemMasterId()` query is correct
3. Check for null pointer exceptions when mapping batch data
4. Verify JOIN queries (item_master, supplier) are correct
5. Check if itemMasterId validation is working

### ✅ Definition of Done
- `GET /api/v1/warehouse/batches/{itemMasterId}` returns 200 OK with valid batch list
- Batches are sorted by expiry date (FEFO)
- Export transaction creation works correctly
- Item detail modal displays batch information

### 📝 Notes (2025-11-28)
- **BE Code:** ✅ Implementation is correct
- **Issue:** Seed data problems (missing/invalid item_master or batch data)
- **Action:** Test again after seed data is fixed
- **FE Status:** ✅ Implementation ready, waiting for BE seed data fix

---

## #23 – Payment Status Default Value for DRAFT Import Transactions

**Status:** 🔵 **LOW PRIORITY** • **Priority:** Low  
**Endpoint:** `GET /api/v1/warehouse/transactions/{id}` (API 6.7)  
**Files (Affected):** `warehouse/domain/StorageTransaction.java`, `warehouse/service/ImportTransactionService.java`  
**Last Checked:** 2025-11-28

### ❌ Problem Statement
- DRAFT import transactions có thể có `paymentStatus = null` trong database
- FE phải default `paymentStatus = 'UNPAID'` khi null để hiển thị đúng
- BE nên set default `paymentStatus = UNPAID` khi tạo transaction mới (DRAFT)

### 🔎 Evidence
- FE code: `const paymentStatus = transaction.paymentStatus || (transaction.status === 'DRAFT' ? 'UNPAID' : null);`
- BE entity: `paymentStatus` field không có `nullable = false` và không có default value
- User report: Phần "Thông tin thanh toán" hiển thị "Chưa có" cho DRAFT transactions

### ✅ Expected Behavior
- Khi tạo import transaction mới với status DRAFT, BE nên tự động set `paymentStatus = UNPAID`
- API 6.7 response nên luôn có `paymentStatus` (không null) cho IMPORT transactions

### 🛠 Suggested Fix
1. **Option 1 (Recommended)**: Set default value trong entity:
   ```java
   @Enumerated(EnumType.STRING)
   @Column(name = "payment_status", length = 20)
   @Builder.Default
   private PaymentStatus paymentStatus = PaymentStatus.UNPAID;
   ```

2. **Option 2**: Set trong service khi tạo transaction:
   ```java
   if (transaction.getTransactionType() == TransactionType.IMPORT && transaction.getPaymentStatus() == null) {
       transaction.setPaymentStatus(PaymentStatus.UNPAID);
   }
   ```

### ✅ Definition of Done
- [ ] DRAFT import transactions có `paymentStatus = UNPAID` (không null)
- [ ] API 6.7 response luôn có `paymentStatus` cho IMPORT transactions
- [ ] FE không cần default logic nữa (có thể remove fallback)

### 📝 Notes
- **FE Workaround**: FE đã implement fallback logic để default UNPAID cho DRAFT transactions
- **Impact**: Low - không ảnh hưởng functionality, chỉ là UX improvement
- **Priority**: Low - có thể fix sau khi các issues #18-#22 được resolved

---

**Last Updated:** 2025-11-28  
**Total Open Issues:** 3 (Issues #18, #19, #23)
