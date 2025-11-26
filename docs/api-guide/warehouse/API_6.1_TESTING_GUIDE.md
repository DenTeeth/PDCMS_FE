# API 6.1 - Inventory Summary Testing Guide 

##  Implementation Complete

### What Was Implemented

1. **New DTOs (2 files)**

   - `InventoryItemDTO.java` - With computed fields (totalQuantity, stockStatus, nearestExpiryDate)
   - `InventorySummaryResponse.java` - Paginated response wrapper

2. **Service Layer**

   - `InventoryService.getInventorySummaryV2()` - Main business logic
   - `mapToInventoryItemDTO()` - Helper for computed fields
   - Added `ItemUnitRepository` dependency

3. **Repository Layer**

   - `ItemMasterRepository.findInventorySummary()` - Custom JPQL query with filters

4. **Controller Layer**
   - `WarehouseV3Controller.java` - New V3 controller
   - `GET /api/v3/warehouse/summary` - API 6.1 endpoint

---

##  Test Commands

### Prerequisites

```bash
# Get JWT token first (login as admin)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dental.com",
    "password": "admin123"
  }'

# Copy the access_token from response
TOKEN="your_jwt_token_here"
```

### Test 1: Get All Items (Basic Test)

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**

```json
{
  "page": 0,
  "size": 20,
  "totalPages": 1,
  "totalItems": 5,
  "content": [
    {
      "itemMasterId": 101,
      "itemCode": "VT-001",
      "itemName": "Gạc y tế vô trùng",
      "categoryName": "Vật tư tiêu hao",
      "warehouseType": "NORMAL",
      "unitName": "Gói",
      "minStockLevel": 50,
      "maxStockLevel": 200,
      "totalQuantity": 150,
      "stockStatus": "NORMAL",
      "nearestExpiryDate": "2025-06-15"
    }
  ]
}
```

### Test 2: Search by Item Name

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?search=gạc&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### Test 3: Filter by Stock Status - LOW_STOCK

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?stockStatus=LOW_STOCK&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### Test 4: Filter by Warehouse Type - COLD

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?warehouseType=COLD&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### Test 5: Filter by Category ID

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?categoryId=1&page=0&size=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### Test 6: Combined Filters

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?search=thuốc&stockStatus=LOW_STOCK&warehouseType=NORMAL&page=0&size=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### Test 7: Pagination - Page 2

```bash
curl -X GET "http://localhost:8080/api/v3/warehouse/summary?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

---

##  Verify Computed Fields

### totalQuantity (Aggregation)

- Should be SUM of all `quantity_on_hand` from item_batches
- If no batches, should be 0

### stockStatus (Calculated)

- `OUT_OF_STOCK`: totalQuantity = 0
- `LOW_STOCK`: totalQuantity < minStockLevel
- `OVERSTOCK`: totalQuantity > maxStockLevel
- `NORMAL`: otherwise

### nearestExpiryDate (FEFO)

- Should be MIN(expiry_date) where quantity > 0
- Null if no batches with expiry date
- Should ignore batches with quantity = 0

### unitName (Base Unit)

- Should come from `item_units` table where `is_base_unit = true`
- Falls back to `unit_of_measure` if no unit defined

---

##  Common Issues & Solutions

### Issue 1: 401 Unauthorized

**Cause**: Invalid or expired JWT token
**Solution**: Login again and get fresh token

### Issue 2: 403 Forbidden

**Cause**: User doesn't have VIEW_WAREHOUSE permission
**Solution**: Login as admin or inventory_manager

### Issue 3: Empty content array

**Cause**: No items in database or all filtered out
**Solution**: Check if seed data exists, try removing filters

### Issue 4: stockStatus always NORMAL

**Cause**: minStockLevel/maxStockLevel not set properly
**Solution**: Check item_masters table, ensure levels are reasonable

---

##  Sample Test Data Setup

If you don't have seed data yet, you can create test items:

```sql
-- Insert test category
INSERT INTO item_categories (category_code, category_name, is_active, created_at)
VALUES ('VT', 'Vật tư tiêu hao', true, NOW());

-- Insert test item
INSERT INTO item_masters (item_code, item_name, category_id, warehouse_type,
                          unit_of_measure, min_stock_level, max_stock_level, is_active, created_at)
VALUES ('VT-001', 'Gạc y tế vô trùng 10x10cm', 1, 'NORMAL', 'Gói', 50, 200, true, NOW());

-- Insert test batch
INSERT INTO item_batches (item_master_id, lot_number, quantity_on_hand,
                          initial_quantity, expiry_date, imported_at, supplier_id)
VALUES (1, 'LOT-2024-001', 150, 200, '2025-06-15', NOW(), 1);

-- Insert base unit
INSERT INTO item_units (item_master_id, unit_name, conversion_factor,
                        is_base_unit, display_order, created_at)
VALUES (1, 'Gói', 1.0, true, 1, NOW());
```

---

##  Success Criteria

### API Response Should Have:

-  Correct pagination (page, size, totalPages, totalItems)
-  Content array with items
-  Each item has all required fields
-  totalQuantity matches SUM from batches
-  stockStatus calculated correctly
-  nearestExpiryDate shows earliest expiry (FEFO)
-  unitName comes from base unit

### Filters Should Work:

-  search: filters by itemName or itemCode (LIKE)
-  stockStatus: filters by calculated status
-  warehouseType: filters COLD/NORMAL
-  categoryId: filters by category
-  pagination: page and size work correctly

---

##  Logs to Check

Look for these log messages in terminal:

```
 API 6.1 - GET /api/v3/warehouse/summary - search='...', stockStatus=..., warehouseType=..., categoryId=..., page=..., size=...
 Returned X items out of Y total
```

---

##  Next Steps After Testing

1. **Frontend Integration**

   - Update Dashboard to call `/api/v3/warehouse/summary`
   - Display computed fields in UI
   - Add filters dropdown (stock status, warehouse type, category)

2. **Performance Optimization** (if needed)

   - Monitor query performance with large dataset
   - Consider database-level aggregation views
   - Add indices on frequently filtered columns

3. **Additional Features**
   - Export to Excel functionality
   - Real-time inventory updates (WebSocket)
   - Advanced analytics dashboard

---

**Application Status**:  RUNNING on http://localhost:8080
**API Endpoint**: GET /api/v3/warehouse/summary
**Swagger UI**: http://localhost:8080/swagger-ui.html
**Implementation Date**: 2024-11-24
