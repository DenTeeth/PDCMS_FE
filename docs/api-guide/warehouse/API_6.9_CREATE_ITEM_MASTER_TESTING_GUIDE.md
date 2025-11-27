# API 6.9: Create Item Master - Testing Guide

**Version:** 1.0  
**Date:** November 27, 2025  
**Purpose:** Comprehensive test cases for API 6.9

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test Data Preparation](#test-data-preparation)
3. [Success Test Cases](#success-test-cases)
4. [Validation Error Test Cases](#validation-error-test-cases)
5. [Business Logic Test Cases](#business-logic-test-cases)
6. [RBAC Test Cases](#rbac-test-cases)
7. [Integration Test Cases](#integration-test-cases)
8. [Performance Test Cases](#performance-test-cases)
9. [Test Results Template](#test-results-template)

---

## Test Environment Setup

### Prerequisites

1. **Application Running:** DentalClinicManagementApplication started on port 8080
2. **Database:** PostgreSQL with schema.sql and seed data loaded
3. **Authentication:** Valid JWT tokens for different roles
4. **Test Tool:** Postman, cURL, or automated test framework

### Base URL

```
http://localhost:8080/api/v1/warehouse/items
```

### Required Headers

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Test User Tokens

Generate tokens for the following users:

| Role | Username | Purpose |
|------|----------|---------|
| Admin | admin@clinic.com | Full access testing |
| Inventory Manager | inventory@clinic.com | Primary user testing |
| Warehouse Manager | warehouse@clinic.com | Alternative authorized user |
| Doctor | doctor@clinic.com | Unauthorized user testing |
| Receptionist | receptionist@clinic.com | Unauthorized user testing |

---

## Test Data Preparation

### Seed Data Requirements

Ensure the following data exists in the database:

#### Item Categories

```sql
SELECT category_id, category_code, category_name FROM item_categories LIMIT 5;
```

Expected categories:
- ID 1: Medications
- ID 2: Consumables
- ID 3: Equipment
- ID 4: Instruments
- ID 5: Supplies

#### Permissions Check

```sql
SELECT permission_id, permission_name FROM permissions WHERE permission_id = 'CREATE_ITEMS';
```

Expected result: 1 row with CREATE_ITEMS permission

#### Role Permissions Check

```sql
SELECT role_id, permission_id FROM role_permissions 
WHERE permission_id = 'CREATE_ITEMS';
```

Expected results:
- ROLE_ADMIN, CREATE_ITEMS
- ROLE_INVENTORY_MANAGER, CREATE_ITEMS

---

## Success Test Cases

### Test Case 1: Create Medication with Unit Hierarchy

**Test ID:** SUCCESS-001  
**Priority:** High  
**Description:** Create a prescription medication with 3-level unit hierarchy

**Request:**
```json
POST /api/v1/warehouse/items
Content-Type: application/json
Authorization: Bearer <INVENTORY_MANAGER_TOKEN>

{
  "itemCode": "AMOX-500MG",
  "itemName": "Amoxicillin 500mg Capsules",
  "description": "Broad-spectrum penicillin antibiotic for bacterial infections",
  "categoryId": 1,
  "warehouseType": "COLD",
  "minStockLevel": 100,
  "maxStockLevel": 1000,
  "isPrescriptionRequired": true,
  "defaultShelfLifeDays": 730,
  "units": [
    {
      "unitName": "Box",
      "conversionRate": 100,
      "isBaseUnit": false,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": false
    },
    {
      "unitName": "Strip",
      "conversionRate": 10,
      "isBaseUnit": false,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": true
    },
    {
      "unitName": "Capsule",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 3,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": false
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "itemMasterId": <GENERATED_ID>,
  "itemCode": "AMOX-500MG",
  "itemName": "Amoxicillin 500mg Capsules",
  "baseUnitName": "Capsule",
  "totalQuantity": 0,
  "isActive": true,
  "createdAt": "<TIMESTAMP>",
  "createdBy": "SYSTEM"
}
```

**Verification Steps:**
1. Check HTTP status code is 201
2. Verify itemMasterId is a positive integer
3. Verify baseUnitName is "Capsule"
4. Verify totalQuantity is 0
5. Verify isActive is true

**Database Verification:**
```sql
-- Check item master created
SELECT * FROM item_masters WHERE item_code = 'AMOX-500MG';

-- Check units created
SELECT unit_name, conversion_rate, is_base_unit, display_order 
FROM item_units 
WHERE item_master_id = <GENERATED_ID>
ORDER BY display_order;
```

Expected units:
```
Box    | 100 | false | 1
Strip  | 10  | false | 2
Capsule| 1   | true  | 3
```

---

### Test Case 2: Create Consumable with 2-Level Units

**Test ID:** SUCCESS-002  
**Priority:** High  
**Description:** Create non-prescription consumable with simple unit hierarchy

**Request:**
```json
POST /api/v1/warehouse/items
Content-Type: application/json
Authorization: Bearer <ADMIN_TOKEN>

{
  "itemCode": "GLOVE-L-NITRILE",
  "itemName": "Nitrile Gloves Size L",
  "description": "Powder-free nitrile examination gloves",
  "categoryId": 2,
  "warehouseType": "NORMAL",
  "minStockLevel": 500,
  "maxStockLevel": 5000,
  "isPrescriptionRequired": false,
  "defaultShelfLifeDays": null,
  "units": [
    {
      "unitName": "Box",
      "conversionRate": 100,
      "isBaseUnit": false,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": true
    },
    {
      "unitName": "Piece",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": false
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 201 Created

{
  "itemMasterId": <GENERATED_ID>,
  "itemCode": "GLOVE-L-NITRILE",
  "itemName": "Nitrile Gloves Size L",
  "baseUnitName": "Piece",
  "totalQuantity": 0,
  "isActive": true,
  "createdAt": "<TIMESTAMP>",
  "createdBy": "SYSTEM"
}
```

**Key Points:**
- No prescription required
- No shelf life (null)
- 2-level unit hierarchy
- Both import and export use Box

---

### Test Case 3: Create Equipment with Single Unit

**Test ID:** SUCCESS-003  
**Priority:** Medium  
**Description:** Create equipment item with only one unit (no conversion)

**Request:**
```json
POST /api/v1/warehouse/items
Content-Type: application/json
Authorization: Bearer <WAREHOUSE_MANAGER_TOKEN>

{
  "itemCode": "MIRROR-DEN-5MM",
  "itemName": "Dental Mirror 5mm",
  "description": "Stainless steel dental examination mirror",
  "categoryId": 3,
  "warehouseType": "NORMAL",
  "minStockLevel": 20,
  "maxStockLevel": 100,
  "isPrescriptionRequired": false,
  "units": [
    {
      "unitName": "Piece",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": true
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 201 Created

{
  "itemMasterId": <GENERATED_ID>,
  "itemCode": "MIRROR-DEN-5MM",
  "itemName": "Dental Mirror 5mm",
  "baseUnitName": "Piece",
  "totalQuantity": 0,
  "isActive": true,
  "createdAt": "<TIMESTAMP>",
  "createdBy": "SYSTEM"
}
```

**Key Points:**
- Single unit only
- No shelf life (omitted, not null)
- Simple equipment tracking

---

### Test Case 4: Create with Minimum Valid Data

**Test ID:** SUCCESS-004  
**Priority:** Medium  
**Description:** Create item with only required fields

**Request:**
```json
POST /api/v1/warehouse/items

{
  "itemCode": "TEST-MIN-001",
  "itemName": "Minimal Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 0,
  "maxStockLevel": 1,
  "units": [
    {
      "unitName": "Unit",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 1
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 201 Created

{
  "itemMasterId": <GENERATED_ID>,
  "itemCode": "TEST-MIN-001",
  "itemName": "Minimal Test Item",
  "baseUnitName": "Unit",
  "totalQuantity": 0,
  "isActive": true,
  "createdAt": "<TIMESTAMP>",
  "createdBy": "SYSTEM"
}
```

---

## Validation Error Test Cases

### Test Case 5: Duplicate Item Code

**Test ID:** ERROR-001  
**Priority:** High  
**Description:** Attempt to create item with existing item code

**Pre-condition:** Run SUCCESS-001 first to create AMOX-500MG

**Request:**
```json
POST /api/v1/warehouse/items

{
  "itemCode": "AMOX-500MG",
  "itemName": "Duplicate Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [
    {
      "unitName": "Piece",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 1
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 409 Conflict

{
  "status": 409,
  "title": "Conflict",
  "detail": "Item code 'AMOX-500MG' already exists"
}
```

---

### Test Case 6: Invalid Item Code Format

**Test ID:** ERROR-002  
**Priority:** High  
**Description:** Item code violates pattern validation

**Sub-Test 6.1: Lowercase Characters**
```json
{
  "itemCode": "amox-500mg",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [...]
}
```

**Expected:** 400 Bad Request - Pattern violation

**Sub-Test 6.2: Too Short**
```json
{
  "itemCode": "AB",
  "itemName": "Test Item",
  ...
}
```

**Expected:** 400 Bad Request - Size violation

**Sub-Test 6.3: Contains Underscore**
```json
{
  "itemCode": "ITEM_CODE_123",
  "itemName": "Test Item",
  ...
}
```

**Expected:** 400 Bad Request - Pattern violation

**Sub-Test 6.4: Too Long**
```json
{
  "itemCode": "VERYLONGITEMCODENAME12345",
  "itemName": "Test Item",
  ...
}
```

**Expected:** 400 Bad Request - Size violation

---

### Test Case 7: Invalid Stock Levels

**Test ID:** ERROR-003  
**Priority:** High  
**Description:** Min stock level >= Max stock level

**Sub-Test 7.1: Equal Values**
```json
{
  "itemCode": "TEST-STOCK-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 100,
  "maxStockLevel": 100,
  "units": [...]
}
```

**Expected Response:**
```json
HTTP/1.1 400 Bad Request

{
  "status": 400,
  "title": "Bad Request",
  "detail": "Min stock level must be less than max stock level"
}
```

**Sub-Test 7.2: Min Greater Than Max**
```json
{
  "minStockLevel": 500,
  "maxStockLevel": 100,
  ...
}
```

**Expected:** 400 Bad Request - Same error message

---

### Test Case 8: Missing Base Unit

**Test ID:** ERROR-004  
**Priority:** High  
**Description:** No unit has isBaseUnit = true

**Request:**
```json
{
  "itemCode": "TEST-NOBASE-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [
    {
      "unitName": "Box",
      "conversionRate": 10,
      "isBaseUnit": false,
      "displayOrder": 1
    },
    {
      "unitName": "Piece",
      "conversionRate": 1,
      "isBaseUnit": false,
      "displayOrder": 2
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 400 Bad Request

{
  "status": 400,
  "title": "Bad Request",
  "detail": "Exactly one base unit is required"
}
```

---

### Test Case 9: Multiple Base Units

**Test ID:** ERROR-005  
**Priority:** High  
**Description:** More than one unit has isBaseUnit = true

**Request:**
```json
{
  "itemCode": "TEST-MULTIBASE-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [
    {
      "unitName": "Box",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 1
    },
    {
      "unitName": "Piece",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 2
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 400 Bad Request

{
  "status": 400,
  "title": "Bad Request",
  "detail": "Exactly one base unit is required"
}
```

---

### Test Case 10: Base Unit Wrong Conversion Rate

**Test ID:** ERROR-006  
**Priority:** High  
**Description:** Base unit has conversionRate != 1

**Request:**
```json
{
  "itemCode": "TEST-WRONGRATE-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [
    {
      "unitName": "Piece",
      "conversionRate": 10,
      "isBaseUnit": true,
      "displayOrder": 1
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 400 Bad Request

{
  "status": 400,
  "title": "Bad Request",
  "detail": "Base unit must have conversion rate = 1"
}
```

---

### Test Case 11: Duplicate Unit Names

**Test ID:** ERROR-007  
**Priority:** High  
**Description:** Unit names are not unique (case-insensitive)

**Sub-Test 11.1: Exact Duplicates**
```json
{
  "itemCode": "TEST-DUPUNIT-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [
    {
      "unitName": "Box",
      "conversionRate": 10,
      "isBaseUnit": false,
      "displayOrder": 1
    },
    {
      "unitName": "Box",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 2
    }
  ]
}
```

**Expected Response:**
```json
HTTP/1.1 400 Bad Request

{
  "status": 400,
  "title": "Bad Request",
  "detail": "Unit name 'Box' is duplicated"
}
```

**Sub-Test 11.2: Case-Insensitive Duplicates**
```json
{
  "units": [
    { "unitName": "Box", ... },
    { "unitName": "box", ... },
    { "unitName": "BOX", ... }
  ]
}
```

**Expected:** 400 Bad Request - Duplicate detected

---

### Test Case 12: Invalid Category ID

**Test ID:** ERROR-008  
**Priority:** High  
**Description:** Category does not exist

**Request:**
```json
{
  "itemCode": "TEST-BADCAT-001",
  "itemName": "Test Item",
  "categoryId": 999999,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": [...]
}
```

**Expected Response:**
```json
HTTP/1.1 404 Not Found

{
  "type": "https://api.dentalclinic.com/problems/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Item category with ID 999999 not found",
  "errorCode": "ITEM_CATEGORY_NOT_FOUND"
}
```

---

### Test Case 13: Invalid Shelf Life

**Test ID:** ERROR-009  
**Priority:** Medium  
**Description:** Shelf life outside valid range

**Sub-Test 13.1: Zero Days**
```json
{
  "itemCode": "TEST-SHELF-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "defaultShelfLifeDays": 0,
  "units": [...]
}
```

**Expected:** 400 Bad Request - Must be between 1 and 3650

**Sub-Test 13.2: Negative Days**
```json
{
  "defaultShelfLifeDays": -30,
  ...
}
```

**Expected:** 400 Bad Request - Must be between 1 and 3650

**Sub-Test 13.3: Exceeds Maximum**
```json
{
  "defaultShelfLifeDays": 5000,
  ...
}
```

**Expected:** 400 Bad Request - Must be between 1 and 3650

---

### Test Case 14: Empty Units Array

**Test ID:** ERROR-010  
**Priority:** High  
**Description:** Units array is empty

**Request:**
```json
{
  "itemCode": "TEST-NOUNIT-001",
  "itemName": "Test Item",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 10,
  "maxStockLevel": 100,
  "units": []
}
```

**Expected Response:**
```json
HTTP/1.1 400 Bad Request

{
  "status": 400,
  "title": "Validation Error",
  "detail": "Validation failed",
  "errors": [
    {
      "field": "units",
      "rejectedValue": [],
      "message": "must not be empty"
    }
  ]
}
```

---

## Business Logic Test Cases

### Test Case 15: Healthcare Compliance Validation

**Test ID:** BUSINESS-001  
**Priority:** Medium  
**Description:** Verify prescription and shelf life combinations

**Sub-Test 15.1: Prescription Drug with Shelf Life**
```json
{
  "itemCode": "RX-VALID-001",
  "itemName": "Prescription Drug",
  "categoryId": 1,
  "warehouseType": "COLD",
  "isPrescriptionRequired": true,
  "defaultShelfLifeDays": 365,
  ...
}
```

**Expected:** 201 Created - Valid combination

**Sub-Test 15.2: OTC Item No Shelf Life**
```json
{
  "itemCode": "OTC-VALID-001",
  "itemName": "OTC Item",
  "isPrescriptionRequired": false,
  "defaultShelfLifeDays": null,
  ...
}
```

**Expected:** 201 Created - Valid combination

---

### Test Case 16: Unit Hierarchy Verification

**Test ID:** BUSINESS-002  
**Priority:** High  
**Description:** Verify unit hierarchy is correctly stored and ordered

**Request:** Create item with 3 units (Box=100, Strip=10, Pill=1)

**Database Verification:**
```sql
SELECT 
  unit_name, 
  conversion_rate, 
  is_base_unit, 
  display_order,
  is_default_import_unit,
  is_default_export_unit
FROM item_units 
WHERE item_master_id = <GENERATED_ID>
ORDER BY display_order;
```

**Expected Results:**
```
Box   | 100 | false | 1 | true  | false
Strip | 10  | false | 2 | false | true
Pill  | 1   | true  | 3 | false | false
```

**Verification Points:**
1. Exactly 3 records
2. conversion_rate decreases: 100 -> 10 -> 1
3. Only one is_base_unit = true (Pill)
4. display_order is sequential: 1, 2, 3
5. Default flags are correctly set

---

## RBAC Test Cases

### Test Case 17: Authorized Users

**Test ID:** RBAC-001  
**Priority:** High  
**Description:** Verify authorized users can create items

**Sub-Test 17.1: Admin Role**
```bash
Authorization: Bearer <ADMIN_TOKEN>
```
**Expected:** 201 Created

**Sub-Test 17.2: Inventory Manager**
```bash
Authorization: Bearer <INVENTORY_MANAGER_TOKEN>
```
**Expected:** 201 Created

**Sub-Test 17.3: Warehouse Manager**
```bash
Authorization: Bearer <WAREHOUSE_MANAGER_TOKEN>
```
**Expected:** 201 Created (through MANAGE_WAREHOUSE authority)

---

### Test Case 18: Unauthorized Users

**Test ID:** RBAC-002  
**Priority:** High  
**Description:** Verify unauthorized users cannot create items

**Sub-Test 18.1: Doctor Role**
```bash
Authorization: Bearer <DOCTOR_TOKEN>
```

**Expected Response:**
```json
HTTP/1.1 403 Forbidden

{
  "status": 403,
  "title": "Forbidden",
  "detail": "Access Denied"
}
```

**Sub-Test 18.2: Receptionist Role**
```bash
Authorization: Bearer <RECEPTIONIST_TOKEN>
```
**Expected:** 403 Forbidden

**Sub-Test 18.3: Accountant Role**
```bash
Authorization: Bearer <ACCOUNTANT_TOKEN>
```
**Expected:** 403 Forbidden

---

### Test Case 19: Missing Authentication

**Test ID:** RBAC-003  
**Priority:** High  
**Description:** Request without authentication token

**Request:**
```bash
POST /api/v1/warehouse/items
Content-Type: application/json
# NO Authorization header

{...}
```

**Expected Response:**
```json
HTTP/1.1 401 Unauthorized

{
  "status": 401,
  "title": "Unauthorized",
  "detail": "Full authentication is required to access this resource"
}
```

---

## Integration Test Cases

### Test Case 20: End-to-End Item Lifecycle

**Test ID:** INTEGRATION-001  
**Priority:** High  
**Description:** Create item and verify it appears in GET list

**Step 1:** Create item via POST
```json
POST /api/v1/warehouse/items
{
  "itemCode": "E2E-TEST-001",
  "itemName": "E2E Test Item",
  ...
}
```

**Step 2:** List items via GET
```bash
GET /api/v1/warehouse/items?search=E2E-TEST-001
```

**Expected:** Item appears in search results with correct data

**Step 3:** Verify in database
```sql
SELECT * FROM item_masters WHERE item_code = 'E2E-TEST-001';
SELECT * FROM item_units WHERE item_master_id = <ID>;
```

**Expected:** Records exist with correct relationships

---

### Test Case 21: Category Relationship

**Test ID:** INTEGRATION-002  
**Priority:** Medium  
**Description:** Verify category relationship is maintained

**Pre-condition:** Note existing category name

**Request:** Create item with known category ID

**Verification:**
```sql
SELECT 
  im.item_code,
  im.item_name,
  ic.category_name
FROM item_masters im
JOIN item_categories ic ON im.category_id = ic.category_id
WHERE im.item_code = '<TEST_CODE>';
```

**Expected:** Category name matches expected value

---

## Performance Test Cases

### Test Case 22: Batch Insert Performance

**Test ID:** PERFORMANCE-001  
**Priority:** Low  
**Description:** Measure unit insertion time

**Test Scenario:** Create item with 10 units

**Metrics to Capture:**
- Total response time
- Database insert time
- Transaction commit time

**Expected:** Response time < 500ms

---

### Test Case 23: Concurrent Creation

**Test ID:** PERFORMANCE-002  
**Priority:** Medium  
**Description:** Multiple users creating items simultaneously

**Test Scenario:** 5 concurrent requests with different item codes

**Expected:**
- All requests succeed (201 Created)
- No deadlocks
- No duplicate IDs

---

## Test Results Template

### Test Execution Log

```
Test Date: _______________
Tester: _______________
Environment: _______________
Application Version: _______________
Database Version: _______________

| Test ID | Status | Response Time | Notes |
|---------|--------|---------------|-------|
| SUCCESS-001 | PASS/FAIL | ___ms | |
| SUCCESS-002 | PASS/FAIL | ___ms | |
| SUCCESS-003 | PASS/FAIL | ___ms | |
| ERROR-001 | PASS/FAIL | ___ms | |
| ERROR-002 | PASS/FAIL | ___ms | |
| ERROR-003 | PASS/FAIL | ___ms | |
| ... | | | |

Total Tests: ___
Passed: ___
Failed: ___
Pass Rate: ___%
```

### Defect Report Template

```
Defect ID: _______________
Test Case: _______________
Severity: Critical/High/Medium/Low
Status: Open/In Progress/Fixed/Closed

Description:
_______________________________________________

Steps to Reproduce:
1. _______________
2. _______________
3. _______________

Expected Result:
_______________________________________________

Actual Result:
_______________________________________________

Environment Details:
- OS: _______________
- Browser/Tool: _______________
- Database: _______________

Attachments:
- Request payload: _______________
- Response: _______________
- Logs: _______________
```

---

## Automation Script Example

### cURL Script for All Success Cases

```bash
#!/bin/bash

BASE_URL="http://localhost:8080/api/v1/warehouse/items"
TOKEN="<INVENTORY_MANAGER_TOKEN>"

echo "Running API 6.9 Test Suite..."
echo "==============================="

# Test 1: Medication with 3 units
echo "Test 1: Create medication..."
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemCode": "AMOX-500MG",
    "itemName": "Amoxicillin 500mg Capsules",
    "categoryId": 1,
    "warehouseType": "COLD",
    "minStockLevel": 100,
    "maxStockLevel": 1000,
    "isPrescriptionRequired": true,
    "defaultShelfLifeDays": 730,
    "units": [
      {
        "unitName": "Box",
        "conversionRate": 100,
        "isBaseUnit": false,
        "displayOrder": 1,
        "isDefaultImportUnit": true
      },
      {
        "unitName": "Strip",
        "conversionRate": 10,
        "isBaseUnit": false,
        "displayOrder": 2,
        "isDefaultExportUnit": true
      },
      {
        "unitName": "Capsule",
        "conversionRate": 1,
        "isBaseUnit": true,
        "displayOrder": 3
      }
    ]
  }' | jq '.'

echo ""
echo "Test 1 completed. Check response above."
echo ""

# Test 2: Consumable with 2 units
echo "Test 2: Create consumable..."
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemCode": "GLOVE-L-NITRILE",
    "itemName": "Nitrile Gloves Size L",
    "categoryId": 2,
    "warehouseType": "NORMAL",
    "minStockLevel": 500,
    "maxStockLevel": 5000,
    "isPrescriptionRequired": false,
    "units": [
      {
        "unitName": "Box",
        "conversionRate": 100,
        "isBaseUnit": false,
        "displayOrder": 1,
        "isDefaultImportUnit": true,
        "isDefaultExportUnit": true
      },
      {
        "unitName": "Piece",
        "conversionRate": 1,
        "isBaseUnit": true,
        "displayOrder": 2
      }
    ]
  }' | jq '.'

echo ""
echo "Test 2 completed. Check response above."
echo ""

# Add more tests...

echo "==============================="
echo "Test suite completed!"
```

---

## Quick Reference: Expected HTTP Status Codes

| Scenario | Expected Status | Error Detail |
|----------|----------------|--------------|
| Valid request | 201 Created | N/A |
| Duplicate item code | 409 Conflict | "Item code 'XXX' already exists" |
| Invalid format | 400 Bad Request | Pattern/Size violation |
| Min >= Max | 400 Bad Request | "Min stock level must be less than max stock level" |
| No base unit | 400 Bad Request | "Exactly one base unit is required" |
| Multiple base units | 400 Bad Request | "Exactly one base unit is required" |
| Wrong conversion rate | 400 Bad Request | "Base unit must have conversion rate = 1" |
| Duplicate unit names | 400 Bad Request | "Unit name 'XXX' is duplicated" |
| Invalid category | 404 Not Found | "Item category with ID XXX not found" |
| Invalid shelf life | 400 Bad Request | "must be between 1 and 3650" |
| Empty units | 400 Bad Request | "must not be empty" |
| No auth token | 401 Unauthorized | "Full authentication is required" |
| Insufficient permission | 403 Forbidden | "Access Denied" |

---

**End of Testing Guide**
