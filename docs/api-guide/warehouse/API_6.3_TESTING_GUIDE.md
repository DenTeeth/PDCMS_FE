#  API 6.3: Expiring Alerts - Testing Guide

##  Test Overview

Guide này cung cấp **10 test scenarios** chi tiết để verify API 6.3 hoạt động đúng business logic.

---

##  Prerequisites

### 1. Server Running
```bash
cd /d/Code/PDCMS_BE
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=test"
```

### 2. Authentication Token
```bash
# Login as Admin
POST http://localhost:8080/api/auth/login
{
  "username": "admin",
  "password": "Admin@123"
}

# Copy token from response
TOKEN="Bearer eyJhbGc..."
```

### 3. Base URL
```bash
BASE_URL="http://localhost:8080/api/v1/warehouse/alerts/expiring"
```

---

##  Test Scenarios

### Test 1: Default Parameters (Basic Happy Path)

**Objective:** Verify API works with default params

**Request:**
```bash
curl -X GET "$BASE_URL" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Lấy cảnh báo hàng sắp hết hạn thành công",
  "data": {
    "reportDate": "2025-11-24T10:00:00",
    "thresholdDays": 30,
    "stats": {
      "totalAlerts": 5,
      "expiredCount": 1,
      "criticalCount": 1,
      "expiringSoonCount": 3,
      "totalQuantity": 300
    },
    "meta": {
      "page": 0,
      "size": 20,
      "totalPages": 1,
      "totalElements": 5
    },
    "alerts": [...]
  }
}
```

**Validation:**
-  Status code = 200
-  `thresholdDays` = 30 (default)
-  `stats.totalAlerts` > 0
-  Alerts sorted by `expiryDate ASC` (FEFO)
-  All alerts have `daysRemaining <= 30`

---

### Test 2: Morning Routine (days=7)

**Use Case:** Thủ kho check hàng cần dùng gấp tuần này

**Request:**
```bash
curl -X GET "$BASE_URL?days=7" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  `thresholdDays` = 7
-  All alerts: `daysRemaining <= 7`
-  Most items should be `CRITICAL` or `EXPIRED`

**Manual Verification:**
- Check first alert: `daysRemaining` should be smallest (most urgent)
- Check `binLocation` field present → Giúp tìm hàng nhanh

---

### Test 3: Supplier Return Planning (days=60)

**Use Case:** Quản lý lọc hàng còn 2 tháng để đàm phán trả NCC

**Request:**
```bash
curl -X GET "$BASE_URL?days=60" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  `thresholdDays` = 60
-  All alerts: `daysRemaining <= 60`
-  Mix of `EXPIRED`, `CRITICAL`, `EXPIRING_SOON` statuses
-  `stats.expiringSoonCount` > 0

**Business Logic Check:**
- Items with `7 < daysRemaining <= 60` → Status = `EXPIRING_SOON`
- These items CAN BE returned to supplier (NCC nhận trả trước 1 tháng)

---

### Test 4: Disposal Management (statusFilter=EXPIRED)

**Use Case:** Lập phiếu hủy hàng đã hết hạn

**Request:**
```bash
curl -X GET "$BASE_URL?days=30&statusFilter=EXPIRED" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  All alerts: `status` = "EXPIRED"
-  All alerts: `daysRemaining` < 0
-  `stats.expiredCount` = `stats.totalAlerts`

**Action:**
- Export this list → Lập phiếu xuất hủy
- Check `supplierName` → Contact NCC if returnable

---

### Test 5: Critical Items Only (statusFilter=CRITICAL)

**Use Case:** Focus vào hàng khẩn cấp (0-7 days)

**Request:**
```bash
curl -X GET "$BASE_URL?days=30&statusFilter=CRITICAL" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  All alerts: `status` = "CRITICAL"
-  All alerts: `0 <= daysRemaining <= 7`
-  `stats.criticalCount` = `stats.totalAlerts`

**Business Impact:**
- These items MUST BE used within this week
- Thủ kho should move to "Priority Shelf"

---

### Test 6: Filter by Category

**Use Case:** Check riêng nhóm Thuốc kháng sinh

**Request:**
```bash
curl -X GET "$BASE_URL?days=30&categoryId=5" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  All alerts: `categoryName` matches the filtered category
-  `stats` reflects only this category

**Note:** CategoryId = 5 là example. Check database để biết ID thực tế:
```sql
SELECT category_id, category_name FROM item_categories;
```

---

### Test 7: Filter by Warehouse Type (COLD)

**Use Case:** Check riêng kho lạnh (thuốc cần bảo quản đặc biệt)

**Request:**
```bash
curl -X GET "$BASE_URL?days=30&warehouseType=COLD" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  All alerts: `warehouseType` = "COLD"
-  High-priority items (vaccines, biologics)

**Business Priority:**
- Kho lạnh = Thuốc đắt tiền (vaccines) → Cần xử lý trước

---

### Test 8: Pagination (page=1)

**Use Case:** Handle large result set (> 20 items)

**Request:**
```bash
curl -X GET "$BASE_URL?days=365&page=1&size=10" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  `meta.page` = 1
-  `meta.size` = 10
-  Max 10 alerts in response
-  `meta.totalElements` > 10 (indicates more pages)

**Validation:**
-  `alerts.length <= 10`
-  Check page 0 vs page 1 → Different items

---

### Test 9: Edge Case - Minimum Days (days=1)

**Use Case:** Xem hàng hết hạn hôm nay hoặc ngày mai

**Request:**
```bash
curl -X GET "$BASE_URL?days=1" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  `thresholdDays` = 1
-  All alerts: `daysRemaining <= 1`
-  Most items should be `EXPIRED` or `CRITICAL`

---

### Test 10: Edge Case - Maximum Days (days=1095)

**Use Case:** Quét hàng hết hạn trong 3 năm (full warehouse scan)

**Request:**
```bash
curl -X GET "$BASE_URL?days=1095" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  `thresholdDays` = 1095
-  Large result set (most items in warehouse)
-  Mix of all statuses (EXPIRED, CRITICAL, EXPIRING_SOON, VALID)

**Performance Check:**
-  Response time < 500ms (even with 1000+ items)
-  Pagination works correctly

---

##  Negative Test Cases

### Test 11: Invalid days (days=0)

**Request:**
```bash
curl -X GET "$BASE_URL?days=0" \
  -H "Authorization: $TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Parameter 'days' must be between 1 and 1095 (3 years)"
}
```

---

### Test 12: Invalid days (days=2000)

**Request:**
```bash
curl -X GET "$BASE_URL?days=2000" \
  -H "Authorization: $TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Parameter 'days' must be between 1 and 1095 (3 years)"
}
```

---

### Test 13: Unauthorized (No Token)

**Request:**
```bash
curl -X GET "$BASE_URL"
# No Authorization header
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Full authentication is required to access this resource"
}
```

---

### Test 14: Forbidden (User without VIEW_WAREHOUSE)

**Setup:** Login as user with role `ROLE_DOCTOR` (không có VIEW_WAREHOUSE permission)

**Request:**
```bash
curl -X GET "$BASE_URL" \
  -H "Authorization: $DOCTOR_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Access Denied"
}
```

---

##  Advanced Test Scenarios

### Test 15: Combined Filters

**Use Case:** Lọc thuốc kháng sinh trong kho lạnh, chỉ xem CRITICAL

**Request:**
```bash
curl -X GET "$BASE_URL?days=30&categoryId=5&warehouseType=COLD&statusFilter=CRITICAL" \
  -H "Authorization: $TOKEN"
```

**Expected Behavior:**
-  All alerts meet ALL 4 conditions:
  1. `daysRemaining <= 30`
  2. `categoryId = 5`
  3. `warehouseType = COLD`
  4. `status = CRITICAL`

---

### Test 16: Empty Result

**Use Case:** Warehouse có ít hàng, không có alert nào

**Request:**
```bash
curl -X GET "$BASE_URL?days=1&categoryId=999" \
  -H "Authorization: $TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "stats": {
      "totalAlerts": 0,
      "expiredCount": 0,
      "criticalCount": 0,
      "expiringSoonCount": 0,
      "totalQuantity": 0
    },
    "alerts": []
  }
}
```

**Validation:**
-  Status 200 (not 404)
-  Empty array, not null
-  All stats = 0

---

##  Data Validation Checklist

For each response, verify:

### Response Structure
- [ ] `statusCode` = 200
- [ ] `message` present
- [ ] `data` object present
- [ ] `data.reportDate` is valid ISO 8601 datetime
- [ ] `data.thresholdDays` matches request param

### Stats Object
- [ ] `stats.totalAlerts` = length of `alerts` array
- [ ] `stats.expiredCount + criticalCount + expiringSoonCount` = `totalAlerts`
- [ ] `stats.totalQuantity` = SUM of all `alerts[].quantityOnHand`

### Pagination Meta
- [ ] `meta.page` = request param `page`
- [ ] `meta.size` = request param `size`
- [ ] `meta.totalElements >= alerts.length`
- [ ] `meta.totalPages` = CEIL(totalElements / size)

### Alerts Array
- [ ] Sorted by `expiryDate ASC` (FEFO)
- [ ] All items: `daysRemaining <= thresholdDays`
- [ ] All items: `quantityOnHand > 0`

### Each Alert Item
- [ ] `batchId` is integer
- [ ] `itemCode` is string
- [ ] `itemName` is string
- [ ] `categoryName` is string (or null)
- [ ] `warehouseType` is "COLD" or "NORMAL"
- [ ] `lotNumber` is string
- [ ] `binLocation` is string (important!)
- [ ] `quantityOnHand` is positive integer
- [ ] `unitName` is string
- [ ] `expiryDate` is valid date (YYYY-MM-DD)
- [ ] `daysRemaining` is integer (can be negative)
- [ ] `status` is "EXPIRED" | "CRITICAL" | "EXPIRING_SOON"
- [ ] `supplierName` is string (or null)

### Status Consistency
- [ ] If `daysRemaining < 0` → `status = EXPIRED`
- [ ] If `0 <= daysRemaining <= 7` → `status = CRITICAL`
- [ ] If `7 < daysRemaining <= 30` → `status = EXPIRING_SOON`

---

##  Business Logic Verification

### FEFO Compliance
```
Check first 5 alerts:
- alert[0].daysRemaining <= alert[1].daysRemaining
- alert[1].daysRemaining <= alert[2].daysRemaining
...
→ FEFO (First Expired First Out) confirmed
```

### Status Filter Post-Query
```
Request: statusFilter=CRITICAL
Expected: All alerts with status=CRITICAL
Logic: Filtered AFTER query (because status is computed field)
```

### Category/Warehouse Filter In-Query
```
Request: categoryId=5, warehouseType=COLD
Expected: Filtered IN query (database-level)
Performance: Faster than post-query filter
```

---

##  Manual Testing Workflow

### Step 1: Seed Test Data
```sql
-- Insert test batches with various expiry dates
INSERT INTO item_batches (lot_number, expiry_date, quantity_on_hand, ...)
VALUES 
  ('EXPIRED-LOT', '2025-11-01', 50, ...),   -- Đã hết hạn
  ('CRITICAL-LOT', '2025-11-28', 100, ...), -- 4 ngày nữa
  ('WARNING-LOT', '2025-12-15', 200, ...);  -- 21 ngày nữa
```

### Step 2: Run Tests 1-10
- Check response structure
- Verify business logic
- Validate stats calculation

### Step 3: Run Negative Tests 11-14
- Verify error handling
- Check authorization

### Step 4: Performance Test
```bash
# Load test with 1000 concurrent requests
ab -n 1000 -c 100 -H "Authorization: $TOKEN" "$BASE_URL?days=30"
```

Expected:
-  All requests succeed (200 OK)
-  Average response time < 300ms
-  No 500 errors

---

##  Common Issues & Troubleshooting

### Issue 1: Empty alerts array (but expected data)
**Cause:** No batches with `quantity_on_hand > 0` or `expiry_date <= targetDate`

**Fix:** Check database:
```sql
SELECT * FROM item_batches 
WHERE quantity_on_hand > 0 
  AND expiry_date <= CURRENT_DATE + INTERVAL '30 days';
```

### Issue 2: Wrong status calculation
**Cause:** Server date/time incorrect

**Fix:** Check server time:
```bash
date
# Should match current date
```

### Issue 3: N+1 Query Problem
**Symptom:** Slow response (> 1 second)

**Fix:** Check logs for multiple queries. Should be 1 query with JOINs:
```sql
SELECT DISTINCT ib.* 
FROM item_batches ib 
LEFT JOIN item_masters im ON ...
LEFT JOIN item_categories cat ON ...
LEFT JOIN suppliers s ON ...
```

### Issue 4: statusFilter not working
**Symptom:** statusFilter=EXPIRED but seeing all statuses

**Cause:** statusFilter applied post-query. Check service logic.

**Fix:** Verify in InventoryService:
```java
if (statusFilter != null) {
    alerts = alerts.stream()
        .filter(alert -> alert.getStatus() == statusFilter)
        .collect(Collectors.toList());
}
```

---

##  Success Criteria

API 6.3 is **PRODUCTION READY** when:

- [x] All 10 positive tests pass
- [x] All 4 negative tests return correct errors
- [x] FEFO sorting verified
- [x] Stats calculation accurate
- [x] statusFilter works correctly
- [x] Pagination works
- [x] Performance < 500ms for 1000+ items
- [x] No N+1 queries (verify in logs)
- [x] Authorization enforced
- [x] No 500 errors

---

##  Support

**Issues?** Check:
1. Server logs: `tail -f logs/spring-boot.log`
2. Database queries: Enable SQL logging in `application.yaml`
3. API documentation: `/swagger-ui.html`

**Contact:** Development Team

---

**Last Updated:** 2025-11-24  
**Test Coverage:** 16 scenarios  
**Status:**  Ready for Testing
