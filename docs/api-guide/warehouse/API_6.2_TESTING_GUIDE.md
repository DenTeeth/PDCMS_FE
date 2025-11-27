# API 6.2 - Item Batches Testing Guide 

##  Implementation Complete

API 6.2 đã được implement đầy đủ với:

-  BatchStatus enum (EXPIRED, CRITICAL, EXPIRING_SOON, VALID)
-  3 DTOs (BatchDetailDTO, BatchStatsDTO, ItemBatchesResponse)
-  Repository với JOIN FETCH supplier
-  Service với business logic (stats, status calculation)
-  Controller endpoint với full Swagger docs
-  BUILD SUCCESS - 573 files compiled

---

##  Test Commands

### Prerequisites

Application is running on: http://localhost:8080

```bash
# Get JWT token (if needed)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dental.com",
    "password": "admin123"
  }'

# Set token
TOKEN="your_jwt_token_here"
```

---

##  Test Scenarios

### Test 1: Get All Batches (FEFO Default)

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**

```json
{
  "statusCode": 200,
  "message": "Item batches retrieved successfully",
  "data": {
    "itemMasterId": 1,
    "itemCode": "VT-001",
    "itemName": "Gạc y tế vô trùng",
    "unitName": "Gói",
    "minStockLevel": 50,
    "stats": {
      "totalBatches": 5,
      "expiredBatches": 0,
      "criticalBatches": 1,
      "warningBatches": 2,
      "validBatches": 2,
      "totalQuantityOnHand": 450
    },
    "meta": {
      "page": 0,
      "size": 20,
      "totalPages": 1,
      "totalElements": 5
    },
    "batches": [
      {
        "batchId": 1,
        "lotNumber": "LOT-2024-001",
        "expiryDate": "2025-12-01",
        "quantityOnHand": 50,
        "initialQuantity": 100,
        "usageRate": 50.0,
        "binLocation": "Kệ A - Tầng 2 - Hộp 05",
        "supplierName": "Dược Hậu Giang",
        "importedAt": "2024-01-15T08:00:00",
        "daysRemaining": 7,
        "status": "CRITICAL"
      }
    ]
  }
}
```

**Verify:**

-  Batches sorted by `expiryDate ASC` (FEFO)
-  Stats shows correct counts
-  `daysRemaining` calculated correctly
-  `status` matches business rules
-  `usageRate` = (100-50)/100 \* 100 = 50%

---

### Test 2: Hide Empty Batches

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?hideEmpty=true&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected:**

-  Only batches with `quantityOnHand > 0`
-  Empty batches (qty=0) not shown

**Alternative (show all including empty):**

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?hideEmpty=false" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### Test 3: Filter CRITICAL Batches (≤7 days)

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?filterStatus=CRITICAL" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Only batches with `daysRemaining <= 7`
-  All returned batches have `status: "CRITICAL"`

**Use Case:**

- Nhân viên kho cần biết lô nào phải dùng gấp trong tuần này

---

### Test 4: Filter EXPIRED Batches

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?filterStatus=EXPIRED" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Only batches with `daysRemaining < 0`
-  All returned batches have `status: "EXPIRED"`

**Use Case:**

- Quản lý cần làm phiếu hủy cho các lô hết hạn

---

### Test 5: Filter EXPIRING_SOON Batches (7-30 days)

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?filterStatus=EXPIRING_SOON" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Only batches with `7 < daysRemaining <= 30`
-  All returned batches have `status: "EXPIRING_SOON"`

**Use Case:**

- Cảnh báo sớm để chuẩn bị order thêm

---

### Test 6: Filter VALID Batches (>30 days)

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?filterStatus=VALID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Only batches with `daysRemaining > 30`
-  All returned batches have `status: "VALID"`

---

### Test 7: Sort by Quantity Descending

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?sortBy=quantityOnHand&sortDir=desc" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Batches sorted by `quantityOnHand DESC`
-  Lô có nhiều hàng nhất nằm trên cùng

**Use Case:**

- Cần xuất bulk, tìm lô có nhiều hàng để xuất cùng lúc

---

### Test 8: Sort by Import Date Descending

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?sortBy=importedAt&sortDir=desc" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Batches sorted by `importedAt DESC`
-  Lô nhập gần đây nhất nằm trên cùng

**Use Case:**

- Kiểm tra lô mới nhập

---

### Test 9: Pagination - Page 2

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?page=1&size=3" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

```json
{
  "meta": {
    "page": 1,  // Page 2 (0-based)
    "size": 3,
    "totalPages": 2,
    "totalElements": 5
  },
  "batches": [...]  // 3 items or less
}
```

---

### Test 10: Combined Filters

```bash
curl -X GET "http://localhost:8080/api/v1/warehouse/batches/1?hideEmpty=true&filterStatus=EXPIRING_SOON&sortBy=expiryDate&sortDir=asc&page=0&size=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected:**

-  Only batches with quantity > 0
-  Only batches with status EXPIRING_SOON
-  Sorted by expiryDate ASC
-  Page 0, size 10

---

##  Verify Business Rules

### Rule 1: Status Calculation

```
Test with different expiryDate values:
- expiryDate = 2024-11-20 (past) → EXPIRED
- expiryDate = 2024-11-27 (3 days) → CRITICAL
- expiryDate = 2024-12-15 (21 days) → EXPIRING_SOON
- expiryDate = 2025-03-01 (97 days) → VALID
```

### Rule 2: Usage Rate

```
Check calculation:
- initialQuantity = 100
- quantityOnHand = 50
- usageRate should be 50.0
```

### Rule 3: FEFO Sorting

```
Default sorting should show:
1. Batch with earliest expiryDate first
2. NULL expiry dates last
```

### Rule 4: Summary Stats

```
Verify counts match:
- totalBatches = count of all batches
- expiredBatches = count where status=EXPIRED
- criticalBatches = count where status=CRITICAL
- warningBatches = count where status=EXPIRING_SOON
- validBatches = count where status=VALID
- totalQuantityOnHand = SUM of all quantityOnHand
```

---

##  Common Issues & Solutions

### Issue 1: 404 Not Found

**Cause**: itemMasterId doesn't exist
**Solution**: Check if item exists in `item_masters` table

```sql
SELECT item_master_id, item_code, item_name
FROM item_masters
WHERE is_active = true
LIMIT 10;
```

### Issue 2: Empty batches array

**Cause**: No batches for this item, or all filtered out
**Solution**:

- Check `item_batches` table
- Try `hideEmpty=false`
- Remove `filterStatus` filter

### Issue 3: 401 Unauthorized

**Cause**: Invalid or expired JWT token
**Solution**: Login again and get fresh token

### Issue 4: supplierName is null

**Cause**: Batch doesn't have supplier assigned
**Solution**: Normal behavior, some batches may not have supplier

### Issue 5: Wrong daysRemaining

**Cause**: Server timezone mismatch
**Solution**: Server uses UTC+7 (Vietnam timezone)

---

##  Sample Test Data Setup

If you don't have test data, create some batches:

```sql
-- Insert test item
INSERT INTO item_masters (item_code, item_name, category_id, warehouse_type,
                          unit_of_measure, min_stock_level, max_stock_level, is_active, created_at)
VALUES ('TEST-001', 'Test Medicine', 1, 'NORMAL', 'Hộp', 50, 200, true, NOW());

-- Get the item_master_id (assume 999)

-- Insert batches with different expiry dates
-- EXPIRED batch
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity,
                          expiry_date, imported_at, bin_location, supplier_id)
VALUES (999, 'LOT-EXPIRED', 30, 100, '2024-01-01', '2023-06-01', 'Kệ A-01', 1);

-- CRITICAL batch (7 days)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity,
                          expiry_date, imported_at, bin_location, supplier_id)
VALUES (999, 'LOT-CRITICAL', 50, 100, CURRENT_DATE + INTERVAL '7 days', NOW(), 'Kệ A-02', 1);

-- EXPIRING_SOON batch (20 days)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity,
                          expiry_date, imported_at, bin_location, supplier_id)
VALUES (999, 'LOT-WARNING', 80, 100, CURRENT_DATE + INTERVAL '20 days', NOW(), 'Kệ A-03', 1);

-- VALID batch (90 days)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity,
                          expiry_date, imported_at, bin_location, supplier_id)
VALUES (999, 'LOT-VALID', 200, 200, CURRENT_DATE + INTERVAL '90 days', NOW(), 'Kệ A-04', 1);

-- Empty batch (quantity = 0)
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand, initial_quantity,
                          expiry_date, imported_at, bin_location, supplier_id)
VALUES (999, 'LOT-EMPTY', 0, 100, CURRENT_DATE + INTERVAL '60 days', NOW(), 'Kệ A-05', 1);
```

---

##  Success Criteria

### API Response Should Have:

-  Correct item context (itemMasterId, itemCode, itemName, unitName)
-  Summary stats with correct counts
-  Pagination metadata (page, size, totalPages, totalElements)
-  Batches array with computed fields

### Each Batch Should Have:

-  All required fields populated
-  `daysRemaining` calculated correctly (can be negative if expired)
-  `status` matches business rules
-  `usageRate` calculated correctly (0-100%)
-  `binLocation` shows physical location
-  `supplierName` from JOIN FETCH (no N+1 query)

### Filters Should Work:

-  `hideEmpty`: Hides/shows empty batches
-  `filterStatus`: Filters by EXPIRED/CRITICAL/EXPIRING_SOON/VALID
-  `sortBy`: Changes sort field
-  `sortDir`: Changes sort direction
-  Pagination: page and size work correctly

---

##  Logs to Check

Look for these log messages:

```
 API 6.2 - Getting batches for itemMasterId=1, hideEmpty=true, filterStatus=null, page=0, size=20
 Returned 5 batches out of 5 total for item 'Gạc y tế vô trùng'
```

---

##  Next Steps After Testing

1. **Verify with Real Data**

   - Test with actual item_masters from seed data
   - Check binLocation accuracy
   - Verify supplier names

2. **Performance Testing**

   - Test with item having 100+ batches
   - Monitor query performance
   - Check JOIN FETCH works (no N+1)

3. **Edge Cases**

   - Test with item having no batches
   - Test with null expiry dates
   - Test with null supplier

4. **Frontend Integration**
   - Update Warehouse Dashboard to call API 6.2
   - Display batch list with color-coded status
   - Add filters UI (status, sorting)
   - Show binLocation for warehouse staff

---

**Application Status**:  RUNNING on http://localhost:8080
**API Endpoint**: GET /api/v1/warehouse/batches/{itemMasterId}
**Swagger UI**: http://localhost:8080/swagger-ui.html
**Implementation Date**: 2024-11-24
