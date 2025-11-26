# API 6.5: Export Transaction - Testing Guide

**Version:** 1.0
**Date:** November 25, 2025
**Author:** Backend Team
**Status:** ✅ Ready for Testing

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication Setup](#authentication-setup)
3. [Test Data Preparation](#test-data-preparation)
4. [Test Scenarios](#test-scenarios)
   - [Scenario 1: Basic Export (FEFO)](#scenario-1-basic-export-fefo)
   - [Scenario 2: Auto-Unpacking](#scenario-2-auto-unpacking)
   - [Scenario 3: Multi-Batch Allocation](#scenario-3-multi-batch-allocation)
   - [Scenario 4: Expired Stock Export](#scenario-4-expired-stock-export)
   - [Scenario 5: Insufficient Stock](#scenario-5-insufficient-stock)
   - [Scenario 6: Near-Expiry Warning](#scenario-6-near-expiry-warning)
5. [Database Verification](#database-verification)
6. [Common Issues](#common-issues)

---

## 🔧 Prerequisites

### Required Tools

- **cURL** or **Postman** (for API testing)
- **PostgreSQL Client** (for database verification)
- **Running Server** on `http://localhost:8080`

### Required Permissions

- `EXPORT_ITEMS` - For USAGE export type
- `DISPOSE_ITEMS` - For DISPOSAL export type
- Admin role recommended for testing

### Database State

- PostgreSQL database with schema applied
- Test data loaded (items, batches, units)

---

## 🔐 Authentication Setup

### Step 1: Login to get JWT token

```bash
# Login request
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employeeCode": "EMP001",
  "roles": ["ADMIN", "EXPORT_ITEMS", "DISPOSE_ITEMS"]
}
```

### Step 2: Set Token Variable (for easier testing)

**Bash:**

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**PowerShell:**

```powershell
$JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 Test Data Preparation

### Step 1: Check Existing Items

```sql
-- Check items with batches
SELECT
    im.item_code,
    im.item_name,
    ib.batch_id,
    ib.lot_number,
    ib.quantity_on_hand,
    ib.expiry_date,
    iu.unit_name,
    iu.conversion_rate
FROM item_masters im
JOIN item_batches ib ON im.item_master_id = ib.item_master_id
JOIN item_units iu ON im.item_master_id = iu.item_master_id
WHERE ib.quantity_on_hand > 0
ORDER BY im.item_code, ib.expiry_date;
```

### Step 2: Create Test Data (if needed)

**Insert Sample Item:**

```sql
-- 1. Insert Item Master
INSERT INTO item_masters (item_code, item_name, description, category_id, created_at, updated_at)
VALUES ('THU001', 'Paracetamol 500mg', 'Pain reliever', 1, NOW(), NOW());

-- 2. Insert Units (Base unit: Viên, Larger: Hộp)
INSERT INTO item_units (item_master_id, unit_name, conversion_rate, is_base_unit, display_order, created_at)
VALUES
  ((SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'), 'Viên', 1, true, 1, NOW()),
  ((SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'), 'Hộp', 10, false, 2, NOW());

-- 3. Insert Batches (for testing scenarios)
-- Batch 1: 5 Viên lẻ, expires soon (for FEFO test)
INSERT INTO item_batches (
  item_master_id, lot_number, expiry_date, quantity_on_hand,
  bin_location, imported_at, created_at
) VALUES (
  (SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'),
  'LOT001',
  CURRENT_DATE + INTERVAL '10 days',  -- Expires in 10 days (near expiry)
  5,
  'A-01-01',
  NOW(),
  NOW()
);

-- Batch 2: 1 Hộp (10 viên), expires later (for unpacking test)
INSERT INTO item_batches (
  item_master_id, lot_number, expiry_date, quantity_on_hand,
  bin_location, imported_at, created_at
) VALUES (
  (SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'),
  'LOT002',
  CURRENT_DATE + INTERVAL '90 days',  -- Expires in 90 days
  1,  -- 1 Hộp = 10 viên
  'A-01-02',
  NOW(),
  NOW()
);

-- Batch 3: Expired stock (for disposal test)
INSERT INTO item_batches (
  item_master_id, lot_number, expiry_date, quantity_on_hand,
  bin_location, imported_at, created_at
) VALUES (
  (SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'),
  'LOT003',
  CURRENT_DATE - INTERVAL '5 days',  -- Already expired
  20,
  'A-01-03',
  NOW(),
  NOW()
);
```

---

## 🧪 Test Scenarios

---

### **Scenario 1: Basic Export (FEFO)**

**Objective:** Verify FEFO (First Expired First Out) algorithm works correctly.

**Precondition:**

- Item `THU001` has 2 batches:
  - Batch 1: 5 Viên, expires in 10 days (LOT001)
  - Batch 2: 1 Hộp (10 viên), expires in 90 days (LOT002)

**Test Case:** Export 3 Viên (should take from LOT001 first - nearest expiry)

**cURL Command:**

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "USAGE",
    "referenceCode": "REQ-001",
    "departmentName": "Phòng khám tổng hợp",
    "requestedBy": "Dr. Nguyen Van A",
    "notes": "Test FEFO - Export 3 Viên",
    "allowExpired": false,
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 3,
        "unitId": 1,
        "notes": "Basic FEFO test"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "transactionId": 123,
  "transactionCode": "PX-20251125-001",
  "transactionDate": "2025-11-25",
  "exportType": "USAGE",
  "totalItems": 1,
  "totalValue": 150000.0,
  "items": [
    {
      "itemCode": "THU001",
      "itemName": "Paracetamol 500mg",
      "batchId": 1,
      "lotNumber": "LOT001",
      "expiryDate": "2025-12-05",
      "quantityChange": 3,
      "unitName": "Viên",
      "binLocation": "A-01-01",
      "unitPrice": 50000.0,
      "totalLineValue": 150000.0,
      "unpackingInfo": null
    }
  ],
  "warnings": [
    {
      "batchId": 1,
      "itemCode": "THU001",
      "warningType": "NEAR_EXPIRY",
      "expiryDate": "2025-12-05",
      "daysUntilExpiry": 10,
      "message": "Batch LOT001 will expire in 10 days"
    }
  ]
}
```

**Verification:**

1. **Check batch quantity:**

```sql
SELECT batch_id, lot_number, quantity_on_hand
FROM item_batches
WHERE batch_id = 1;
-- Expected: quantity_on_hand = 2 (5 - 3)
```

2. **Check transaction:**

```sql
SELECT transaction_id, transaction_code, export_type, notes
FROM storage_transactions
WHERE transaction_code = 'PX-20251125-001';
```

3. **Check transaction items:**

```sql
SELECT batch_id, quantity_change, price, total_line_value
FROM storage_transaction_items
WHERE transaction_id = 123;
-- Expected: quantity_change = -3 (negative for export)
```

**✅ Success Criteria:**

- Status code: `200 OK`
- Response contains 1 item from LOT001 (nearest expiry)
- Batch quantity reduced: 5 → 2
- Warning for near-expiry item present
- Transaction recorded in database

---

### **Scenario 2: Auto-Unpacking**

**Objective:** Verify auto-unpacking from larger unit to smaller unit.

**Precondition:**

- After Scenario 1: LOT001 has 2 Viên left
- LOT002 has 1 Hộp (10 viên)

**Test Case:** Export 15 Viên (need to unpack 1 Hộp)

**cURL Command:**

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "USAGE",
    "referenceCode": "REQ-002",
    "departmentName": "Phòng khám tổng hợp",
    "requestedBy": "Dr. Tran Thi B",
    "notes": "Test Auto-Unpacking - Need 15 Viên",
    "allowExpired": false,
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 15,
        "unitId": 1,
        "notes": "Auto-unpacking test"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "transactionId": 124,
  "transactionCode": "PX-20251125-002",
  "transactionDate": "2025-11-25",
  "exportType": "USAGE",
  "totalItems": 2,
  "totalValue": 750000.0,
  "items": [
    {
      "itemCode": "THU001",
      "itemName": "Paracetamol 500mg",
      "batchId": 1,
      "lotNumber": "LOT001",
      "expiryDate": "2025-12-05",
      "quantityChange": 2,
      "unitName": "Viên",
      "binLocation": "A-01-01",
      "unitPrice": 50000.0,
      "totalLineValue": 100000.0,
      "unpackingInfo": null
    },
    {
      "itemCode": "THU001",
      "itemName": "Paracetamol 500mg",
      "batchId": 999,
      "lotNumber": "LOT002-UNPACKED",
      "expiryDate": "2026-02-23",
      "quantityChange": 13,
      "unitName": "Viên",
      "binLocation": "A-01-02",
      "unitPrice": 50000.0,
      "totalLineValue": 650000.0,
      "unpackingInfo": {
        "wasUnpacked": true,
        "parentBatchId": 2,
        "parentUnitName": "Hộp",
        "remainingInBatch": 0
      }
    }
  ],
  "warnings": []
}
```

**Verification:**

1. **Check parent batch (Hộp):**

```sql
SELECT batch_id, lot_number, quantity_on_hand, is_unpacked, unpacked_at
FROM item_batches
WHERE batch_id = 2;
-- Expected:
--   quantity_on_hand = 0 (1 - 1)
--   is_unpacked = true
--   unpacked_at = NOT NULL
```

2. **Check child batch (Viên unpacked):**

```sql
SELECT batch_id, lot_number, quantity_on_hand, parent_batch_id, is_unpacked
FROM item_batches
WHERE lot_number = 'LOT002-UNPACKED';
-- Expected:
--   quantity_on_hand = 0 (10 created, 13 taken - error if > 10!)
--   parent_batch_id = 2
--   is_unpacked = true
```

**⚠️ Note:** If need 13 but only have 10 from unpacking, system should continue unpacking more or report insufficient stock.

**✅ Success Criteria:**

- Status code: `200 OK`
- 2 items in response (loose + unpacked)
- Parent batch reduced and marked as unpacked
- Child batch created with parent_batch_id
- unpackingInfo present in second item

---

### **Scenario 3: Multi-Batch Allocation**

**Objective:** Verify allocation from multiple batches in FEFO order.

**Precondition:**

- Need to prepare 3+ batches with different expiry dates

**Setup Test Data:**

```sql
-- Add more batches for multi-batch test
INSERT INTO item_batches (item_master_id, lot_number, expiry_date, quantity_on_hand, bin_location, imported_at, created_at)
VALUES
  ((SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'), 'LOT004', CURRENT_DATE + INTERVAL '20 days', 10, 'A-02-01', NOW(), NOW()),
  ((SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'), 'LOT005', CURRENT_DATE + INTERVAL '30 days', 15, 'A-02-02', NOW(), NOW()),
  ((SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'), 'LOT006', CURRENT_DATE + INTERVAL '60 days', 20, 'A-02-03', NOW(), NOW());
```

**Test Case:** Export 35 Viên (should take from 3 batches in FEFO order)

**cURL Command:**

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "USAGE",
    "referenceCode": "REQ-003",
    "departmentName": "Phòng khám răng hàm mặt",
    "requestedBy": "Dr. Le Van C",
    "notes": "Test Multi-Batch - Export 35 Viên",
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 35,
        "unitId": 1,
        "notes": "Multi-batch allocation"
      }
    ]
  }'
```

**Expected Allocation Order:**

1. LOT004: 10 viên (expires in 20 days)
2. LOT005: 15 viên (expires in 30 days)
3. LOT006: 10 viên from 20 available (expires in 60 days)

**Expected Response:**

```json
{
  "transactionId": 125,
  "transactionCode": "PX-20251125-003",
  "exportType": "USAGE",
  "totalItems": 3,
  "items": [
    {
      "batchId": 4,
      "lotNumber": "LOT004",
      "quantityChange": 10,
      "expiryDate": "2025-12-15"
    },
    {
      "batchId": 5,
      "lotNumber": "LOT005",
      "quantityChange": 15,
      "expiryDate": "2025-12-25"
    },
    {
      "batchId": 6,
      "lotNumber": "LOT006",
      "quantityChange": 10,
      "expiryDate": "2026-01-24"
    }
  ]
}
```

**✅ Success Criteria:**

- 3 items in response (from 3 different batches)
- Allocation follows FEFO order (nearest expiry first)
- Total quantity = 35 viên
- Batch quantities updated correctly

---

### **Scenario 4: Expired Stock Export**

**Objective:** Test DISPOSAL export type allows expired stock.

**Precondition:**

- LOT003 is expired (expiry_date < today)

**Test Case 4A:** Try to export expired stock with `exportType = USAGE` (should FAIL)

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "USAGE",
    "referenceCode": "REQ-004A",
    "notes": "Try to use expired stock (should fail)",
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 5,
        "unitId": 1
      }
    ]
  }'
```

**Expected Response (ERROR):**

```json
{
  "errorCode": "INSUFFICIENT_STOCK",
  "message": "Insufficient non-expired stock for item THU001",
  "details": {
    "itemCode": "THU001",
    "requested": 5,
    "availableNonExpired": 0,
    "availableExpired": 20,
    "suggestion": "Change exportType to DISPOSAL or set allowExpired=true"
  }
}
```

**Test Case 4B:** Export expired stock with `exportType = DISPOSAL` (should SUCCESS)

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "DISPOSAL",
    "referenceCode": "REQ-004B",
    "departmentName": "Kho dược",
    "requestedBy": "Pharmacist D",
    "notes": "Dispose expired stock",
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 10,
        "unitId": 1,
        "notes": "Expired - need disposal"
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "transactionId": 126,
  "transactionCode": "PX-20251125-004",
  "exportType": "DISPOSAL",
  "items": [
    {
      "batchId": 3,
      "lotNumber": "LOT003",
      "expiryDate": "2025-11-20",
      "quantityChange": 10
    }
  ],
  "warnings": [
    {
      "warningType": "EXPIRED_USED",
      "message": "Batch LOT003 has expired 5 days ago"
    }
  ]
}
```

**✅ Success Criteria:**

- USAGE type rejects expired stock
- DISPOSAL type accepts expired stock
- Warning generated for expired stock usage

---

### **Scenario 5: Insufficient Stock**

**Objective:** Test error handling when stock is insufficient.

**Test Case:** Request more than available stock

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "USAGE",
    "referenceCode": "REQ-005",
    "notes": "Request 1000 units (insufficient)",
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 1000,
        "unitId": 1
      }
    ]
  }'
```

**Expected Response (ERROR):**

```json
{
  "errorCode": "INSUFFICIENT_STOCK",
  "message": "Insufficient stock for item THU001. Available: 45 (Loose: 25, Packed: 20 from 2 larger units), Requested: 1000",
  "details": {
    "itemCode": "THU001",
    "requestedQuantity": 1000,
    "availableNonExpired": 45,
    "availableExpired": 10,
    "breakdown": {
      "loose": 25,
      "packed": 20
    },
    "suggestions": [
      "Reduce quantity to 45 or less",
      "Check other warehouses",
      "Create purchase request"
    ]
  }
}
```

**✅ Success Criteria:**

- Status code: `400 Bad Request`
- Error message with detailed stock breakdown
- Suggestions provided

---

### **Scenario 6: Near-Expiry Warning**

**Objective:** Verify warnings for items expiring within 30 days.

**Test Case:** Export items expiring in 25 days

**Setup:**

```sql
INSERT INTO item_batches (item_master_id, lot_number, expiry_date, quantity_on_hand, bin_location, imported_at, created_at)
VALUES
  ((SELECT item_master_id FROM item_masters WHERE item_code = 'THU001'),
   'LOT007',
   CURRENT_DATE + INTERVAL '25 days',
   30,
   'A-03-01',
   NOW(),
   NOW());
```

**cURL Command:**

```bash
curl -X POST http://localhost:8080/api/v1/inventory/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "transactionDate": "2025-11-25",
    "exportType": "USAGE",
    "referenceCode": "REQ-006",
    "notes": "Test near-expiry warning",
    "items": [
      {
        "itemMasterId": 1,
        "quantity": 5,
        "unitId": 1
      }
    ]
  }'
```

**Expected Response:**

```json
{
  "transactionId": 127,
  "items": [...],
  "warnings": [
    {
      "batchId": 7,
      "itemCode": "THU001",
      "warningType": "NEAR_EXPIRY",
      "expiryDate": "2025-12-20",
      "daysUntilExpiry": 25,
      "message": "Batch LOT007 will expire in 25 days"
    }
  ]
}
```

**✅ Success Criteria:**

- Warning present in response
- Warning type is `NEAR_EXPIRY`
- Correct days until expiry calculated

---

## 🔍 Database Verification

### Check All Batches Status

```sql
SELECT
    ib.batch_id,
    im.item_code,
    ib.lot_number,
    ib.quantity_on_hand,
    ib.expiry_date,
    ib.is_unpacked,
    ib.parent_batch_id,
    ib.unpacked_at,
    CASE
        WHEN ib.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN ib.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'NEAR_EXPIRY'
        ELSE 'GOOD'
    END AS status
FROM item_batches ib
JOIN item_masters im ON ib.item_master_id = im.item_master_id
ORDER BY im.item_code, ib.expiry_date;
```

### Check Export Transactions

```sql
SELECT
    st.transaction_id,
    st.transaction_code,
    st.transaction_date,
    st.export_type,
    st.reference_code,
    st.department_name,
    st.requested_by,
    st.notes,
    e.employee_code,
    e.full_name
FROM storage_transactions st
LEFT JOIN employees e ON st.employee_id = e.employee_id
WHERE st.transaction_type = 'EXPORT'
ORDER BY st.transaction_date DESC;
```

### Check Transaction Items with Unpacking Info

```sql
SELECT
    sti.transaction_id,
    st.transaction_code,
    sti.item_code,
    sti.batch_id,
    ib.lot_number,
    sti.quantity_change,
    iu.unit_name,
    sti.price,
    sti.total_line_value,
    ib.parent_batch_id,
    ib.is_unpacked,
    CASE WHEN ib.parent_batch_id IS NOT NULL THEN
        (SELECT lot_number FROM item_batches WHERE batch_id = ib.parent_batch_id)
    END AS parent_lot_number
FROM storage_transaction_items sti
JOIN storage_transactions st ON sti.transaction_id = st.transaction_id
JOIN item_batches ib ON sti.batch_id = ib.batch_id
LEFT JOIN item_units iu ON sti.unit_id = iu.unit_id
WHERE st.transaction_type = 'EXPORT'
ORDER BY sti.transaction_id DESC, sti.item_code;
```

### Financial Summary

```sql
SELECT
    st.transaction_code,
    st.export_type,
    COUNT(sti.transaction_item_id) AS total_items,
    SUM(ABS(sti.quantity_change)) AS total_quantity,
    SUM(sti.total_line_value) AS total_value
FROM storage_transactions st
JOIN storage_transaction_items sti ON st.transaction_id = sti.transaction_id
WHERE st.transaction_type = 'EXPORT'
GROUP BY st.transaction_id, st.transaction_code, st.export_type
ORDER BY st.transaction_id DESC;
```

---

## ⚠️ Common Issues

### Issue 1: Token Expired

**Symptom:** `401 Unauthorized`
**Solution:** Login again to get new token

### Issue 2: Insufficient Permissions

**Symptom:** `403 Forbidden`
**Solution:** Ensure user has `EXPORT_ITEMS` or `DISPOSE_ITEMS` permission

### Issue 3: Item Not Found

**Symptom:** `404 Not Found - Item with ID X not found`
**Solution:** Check itemMasterId exists in database

### Issue 4: Unit Mismatch

**Symptom:** `400 Bad Request - Unit does not belong to this item`
**Solution:** Verify unitId belongs to the itemMasterId

### Issue 5: Date Validation

**Symptom:** `400 Bad Request - Transaction date cannot be in the future`
**Solution:** Use current date or past date only

### Issue 6: Server Not Running

**Symptom:** `Connection refused` or `Could not connect`
**Solution:**

```bash
cd /d/Code/PDCMS_BE
./mvnw spring-boot:run
```

### Issue 7: Database Connection

**Symptom:** `Could not connect to database`
**Solution:**

- Check PostgreSQL is running
- Verify `application.yaml` connection settings
- Check `pgdata_dental` directory permissions

---

## 📝 Testing Checklist

Use this checklist to track your testing progress:

- [ ] ✅ Authentication successful (JWT token obtained)
- [ ] ✅ Scenario 1: Basic Export (FEFO) - PASSED
- [ ] ✅ Scenario 2: Auto-Unpacking - PASSED
- [ ] ✅ Scenario 3: Multi-Batch Allocation - PASSED
- [ ] ✅ Scenario 4A: Expired stock rejected (USAGE) - PASSED
- [ ] ✅ Scenario 4B: Expired stock allowed (DISPOSAL) - PASSED
- [ ] ✅ Scenario 5: Insufficient stock error - PASSED
- [ ] ✅ Scenario 6: Near-expiry warning - PASSED
- [ ] ✅ Database verification - All tables updated correctly
- [ ] ✅ Financial calculations accurate
- [ ] ✅ Unpacking traceability verified (parent-child relationships)

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check server logs: `tail -f logs/application.log`
2. Check database logs: PostgreSQL error log
3. Review API documentation: `API_6.5_EXPORT_TRANSACTION_COMPLETE.md`
4. Contact Backend Team

---

**Document Version:** 1.0
**Last Updated:** November 25, 2025
**Next Review:** December 25, 2025
