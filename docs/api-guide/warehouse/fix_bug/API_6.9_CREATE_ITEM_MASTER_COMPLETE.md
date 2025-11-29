# API 6.9: Create Item Master - Complete Documentation

**Version:** 1.0
**Date:** November 27, 2025
**Author:** Backend Team
**Status:** Implementation Complete

---

## Table of Contents

1. [Overview](#overview)
2. [API Specification](#api-specification)
3. [Request Structure](#request-structure)
4. [Response Structure](#response-structure)
5. [Validation Rules](#validation-rules)
6. [Error Responses](#error-responses)
7. [RBAC Requirements](#rbac-requirements)
8. [Use Cases](#use-cases)
9. [Frontend Integration](#frontend-integration)
10. [Healthcare Compliance](#healthcare-compliance)

---

## Overview

**API 6.9** enables the creation of new item masters with a flexible unit hierarchy system. This API supports multi-level unit conversions (e.g., Box -> Strip -> Pill), healthcare compliance fields (prescription requirements, shelf life tracking), and UX optimizations (default import/export units).

### Key Features

- **SKU Code Management:** Unique item code with format validation (uppercase, numbers, hyphens)
- **Unit Hierarchy:** Support for multi-level unit conversions (e.g., 1 Box = 10 Strips, 1 Strip = 10 Pills)
- **Healthcare Compliance:** Prescription requirement flag and default shelf life tracking (1-3650 days)
- **Stock Alert Configuration:** Min/max stock levels with validation
- **Warehouse Type:** Support for COLD (refrigerated) and NORMAL storage
- **UX Optimization:** Default unit selection for import/export transactions
- **Batch Insert:** High-performance batch insertion for units
- **Transactional Integrity:** Atomic operations with rollback on failure

### Business Context

This API is essential for:

- **Inventory Managers:** Adding new medications, consumables, and equipment
- **Pharmacists:** Setting up prescription-required medications with shelf life
- **Clinic Administrators:** Configuring stock alerts for critical items
- **Warehouse Staff:** Defining unit hierarchies for efficient stock management

---

## API Specification

### Endpoint

```
POST /api/v1/warehouse/items
```

### Method

`POST`

### Content-Type

`application/json`

### Authentication

Required: JWT Bearer Token

### Authorization

Requires one of the following authorities:

- `ROLE_ADMIN`
- `CREATE_ITEMS`
- `MANAGE_WAREHOUSE`

---

## Request Structure

### Request Body

```json
{
  "itemCode": "AMOX-500MG",
  "itemName": "Amoxicillin 500mg",
  "description": "Broad-spectrum antibiotic for bacterial infections",
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
      "unitName": "Pill",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 3,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": false
    }
  ]
}
```

### Field Descriptions

#### Root Level Fields

| Field                    | Type    | Required | Constraints                              | Description                                        |
| ------------------------ | ------- | -------- | ---------------------------------------- | -------------------------------------------------- |
| `itemCode`               | String  | Yes      | 3-20 chars, Pattern: `^[A-Z0-9-]{3,20}$` | Unique SKU code (uppercase, numbers, hyphens only) |
| `itemName`               | String  | Yes      | 1-255 chars                              | Display name of the item                           |
| `description`            | String  | No       | Max 1000 chars                           | Detailed description                               |
| `categoryId`             | Long    | Yes      | Must exist in `item_categories`          | Foreign key to item category                       |
| `warehouseType`          | Enum    | Yes      | `NORMAL` or `COLD`                       | Storage temperature requirement                    |
| `minStockLevel`          | Integer | Yes      | >= 0                                     | Minimum stock alert threshold                      |
| `maxStockLevel`          | Integer | Yes      | > minStockLevel                          | Maximum stock alert threshold                      |
| `isPrescriptionRequired` | Boolean | No       | Default: `false`                         | Healthcare compliance flag                         |
| `defaultShelfLifeDays`   | Integer | No       | 1-3650 or `null`                         | Default shelf life (null = non-perishable)         |
| `units`                  | Array   | Yes      | Min 1 item, Max 10 items                 | Unit hierarchy list                                |

#### Unit Request Fields

| Field                 | Type    | Required | Constraints                    | Description                                 |
| --------------------- | ------- | -------- | ------------------------------ | ------------------------------------------- |
| `unitName`            | String  | Yes      | 1-50 chars, unique within item | Display name (e.g., "Box", "Strip", "Pill") |
| `conversionRate`      | Integer | Yes      | >= 1, base unit must = 1       | Conversion multiplier to base unit          |
| `isBaseUnit`          | Boolean | Yes      | Exactly ONE must be `true`     | Indicates smallest unit                     |
| `displayOrder`        | Integer | Yes      | >= 1                           | Sort order (1 = largest unit)               |
| `isDefaultImportUnit` | Boolean | No       | Default: `false`               | UX: Pre-select for import transactions      |
| `isDefaultExportUnit` | Boolean | No       | Default: `false`               | UX: Pre-select for export transactions      |

### Warehouse Type Values

```
NORMAL: Room temperature storage
COLD: Refrigerated storage (2-8°C)
```

---

## Response Structure

### Success Response (201 CREATED)

```json
{
  "itemMasterId": 123,
  "itemCode": "AMOX-500MG",
  "itemName": "Amoxicillin 500mg",
  "baseUnitName": "Pill",
  "totalQuantity": 0,
  "isActive": true,
  "createdAt": "2025-11-27T14:30:00",
  "createdBy": "SYSTEM"
}
```

### Response Field Descriptions

| Field           | Type     | Description                                               |
| --------------- | -------- | --------------------------------------------------------- |
| `itemMasterId`  | Long     | Unique identifier for the created item                    |
| `itemCode`      | String   | SKU code of the item                                      |
| `itemName`      | String   | Display name of the item                                  |
| `baseUnitName`  | String   | Name of the base unit (extracted from units array)        |
| `totalQuantity` | Integer  | Initial stock quantity (always 0 on creation)             |
| `isActive`      | Boolean  | Active status (always true on creation)                   |
| `createdAt`     | DateTime | Timestamp of creation (ISO 8601 format)                   |
| `createdBy`     | String   | Username of the creator (currently hardcoded as "SYSTEM") |

---

## Validation Rules

### Server-Side Validations

#### 1. Item Code Validation

**Rule:** Item code must be unique and follow pattern `^[A-Z0-9-]{3,20}$`

**Examples:**

- Valid: `AMOX-500MG`, `GLOVE-L`, `SYR-5ML`, `MASK-N95`
- Invalid: `amox-500mg` (lowercase), `AB` (too short), `ITEM_CODE` (underscore), `TOOLONGITEMCODENAME123` (too long)

**Error Response:**

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Item code 'AMOX-500MG' already exists"
}
```

#### 2. Stock Level Validation

**Rule:** `minStockLevel < maxStockLevel`

**Examples:**

- Valid: min=100, max=1000
- Invalid: min=500, max=500 (equal)
- Invalid: min=1000, max=500 (min > max)

**Error Response:**

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "Min stock level must be less than max stock level"
}
```

#### 3. Base Unit Validation

**Rule:** Exactly ONE unit must have `isBaseUnit = true` and `conversionRate = 1`

**Error Response (No base unit):**

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "Exactly one base unit is required"
}
```

**Error Response (Multiple base units):**

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "Exactly one base unit is required"
}
```

**Error Response (Wrong conversion rate):**

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "Base unit must have conversion rate = 1"
}
```

#### 4. Unit Name Uniqueness

**Rule:** Unit names must be unique within the same item (case-insensitive)

**Examples:**

- Valid: ["Box", "Strip", "Pill"]
- Invalid: ["Box", "box", "BOX"] (duplicates)
- Invalid: ["Strip", "Strip", "Pill"] (exact duplicate)

**Error Response:**

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "Unit name 'Box' is duplicated"
}
```

#### 5. Category Existence Validation

**Rule:** `categoryId` must reference an existing item category

**Error Response:**

```json
{
  "status": 404,
  "title": "Resource Not Found",
  "detail": "Item category with ID 999 not found",
  "errorCode": "ITEM_CATEGORY_NOT_FOUND"
}
```

#### 6. Shelf Life Validation

**Rule:** If provided, `defaultShelfLifeDays` must be between 1 and 3650 (10 years)

**Examples:**

- Valid: 30, 365, 730, 3650, null
- Invalid: 0, -10, 3651, 10000

**Error Response:**

```json
{
  "status": 400,
  "title": "Bad Request",
  "detail": "defaultShelfLifeDays: must be between 1 and 3650"
}
```

---

## Error Responses

### Standard Error Format

All errors follow the RFC 7807 Problem Details format:

```json
{
  "type": "https://api.dentalclinic.com/problems/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Item category with ID 999 not found",
  "errorCode": "ITEM_CATEGORY_NOT_FOUND"
}
```

### HTTP Status Codes

| Status Code                   | Scenario                         | Example                                             |
| ----------------------------- | -------------------------------- | --------------------------------------------------- |
| **201 Created**               | Item master created successfully | See Success Response                                |
| **400 Bad Request**           | Validation failure               | Min >= Max, duplicate unit names, missing base unit |
| **401 Unauthorized**          | Missing or invalid JWT token     | Token expired                                       |
| **403 Forbidden**             | Insufficient permissions         | User lacks CREATE_ITEMS authority                   |
| **404 Not Found**             | Category does not exist          | Invalid categoryId                                  |
| **409 Conflict**              | Item code already exists         | Duplicate SKU code                                  |
| **500 Internal Server Error** | Database connection failure      | Server-side error                                   |

### Validation Error Response (400)

```json
{
  "type": "https://api.dentalclinic.com/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Validation failed for object='createItemMasterRequest'",
  "errors": [
    {
      "field": "itemCode",
      "rejectedValue": "invalid_code",
      "message": "must match \"^[A-Z0-9-]{3,20}$\""
    },
    {
      "field": "units",
      "rejectedValue": [],
      "message": "must not be empty"
    }
  ]
}
```

---

## RBAC Requirements

### Required Authorities

Users must have **ONE OR MORE** of the following:

```
ROLE_ADMIN
CREATE_ITEMS
MANAGE_WAREHOUSE
```

### Role-Permission Matrix

| Role              | Has Permission | Notes                              |
| ----------------- | -------------- | ---------------------------------- |
| Admin             | Yes            | Full system access                 |
| Inventory Manager | Yes            | Primary user for this API          |
| Warehouse Manager | Yes            | Through MANAGE_WAREHOUSE authority |
| Accountant        | No             | View-only access                   |
| Doctor            | No             | Cannot create items                |
| Receptionist      | No             | Cannot create items                |

### Permission Configuration

The `CREATE_ITEMS` permission is defined in seed data:

```sql
INSERT INTO permissions (permission_id, permission_name, module, description, display_order)
VALUES ('CREATE_ITEMS', 'CREATE_ITEMS', 'WAREHOUSE',
        'Create new item masters with unit hierarchy', 271);
```

### Testing RBAC

**Valid Request (with CREATE_ITEMS):**

```bash
curl -X POST http://localhost:8080/api/v1/warehouse/items \
  -H "Authorization: Bearer <token_with_CREATE_ITEMS>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected:** 201 Created

**Invalid Request (without permission):**

```bash
curl -X POST http://localhost:8080/api/v1/warehouse/items \
  -H "Authorization: Bearer <token_without_permission>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected:** 403 Forbidden

---

## Use Cases

### Use Case 1: Add Prescription Medication

**Scenario:** Pharmacist adds a new antibiotic to inventory

**Request:**

```json
{
  "itemCode": "AMOX-500MG",
  "itemName": "Amoxicillin 500mg Capsules",
  "description": "Broad-spectrum penicillin antibiotic",
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
      "unitName": "Capsule",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": true
    }
  ]
}
```

**Business Rules Applied:**

- COLD storage required
- Prescription flag enforced
- 2-year shelf life
- Import in boxes, dispense in capsules

---

### Use Case 2: Add Dental Consumable

**Scenario:** Inventory manager adds disposable gloves

**Request:**

```json
{
  "itemCode": "GLOVE-L-NITRILE",
  "itemName": "Nitrile Gloves Size L",
  "description": "Powder-free nitrile examination gloves",
  "categoryId": 5,
  "warehouseType": "NORMAL",
  "minStockLevel": 500,
  "maxStockLevel": 5000,
  "isPrescriptionRequired": false,
  "defaultShelfLifeDays": null,
  "units": [
    {
      "unitName": "Carton",
      "conversionRate": 1000,
      "isBaseUnit": false,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": false
    },
    {
      "unitName": "Box",
      "conversionRate": 100,
      "isBaseUnit": false,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": true
    },
    {
      "unitName": "Piece",
      "conversionRate": 1,
      "isBaseUnit": true,
      "displayOrder": 3,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": false
    }
  ]
}
```

**Business Rules Applied:**

- No prescription required
- No shelf life (non-perishable)
- 3-level unit hierarchy (Carton -> Box -> Piece)
- Import in cartons, dispense in boxes

---

### Use Case 3: Add Dental Equipment

**Scenario:** Manager adds reusable dental mirrors

**Request:**

```json
{
  "itemCode": "MIRROR-DEN-5MM",
  "itemName": "Dental Mirror 5mm",
  "description": "Stainless steel dental examination mirror",
  "categoryId": 10,
  "warehouseType": "NORMAL",
  "minStockLevel": 20,
  "maxStockLevel": 100,
  "isPrescriptionRequired": false,
  "defaultShelfLifeDays": null,
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

**Business Rules Applied:**

- Single unit (no conversion needed)
- Non-perishable equipment
- Lower stock levels (expensive item)

---

## Frontend Integration

### React/TypeScript Example

```typescript
interface UnitRequest {
  unitName: string;
  conversionRate: number;
  isBaseUnit: boolean;
  displayOrder: number;
  isDefaultImportUnit?: boolean;
  isDefaultExportUnit?: boolean;
}

interface CreateItemMasterRequest {
  itemCode: string;
  itemName: string;
  description?: string;
  categoryId: number;
  warehouseType: "NORMAL" | "COLD";
  minStockLevel: number;
  maxStockLevel: number;
  isPrescriptionRequired?: boolean;
  defaultShelfLifeDays?: number;
  units: UnitRequest[];
}

interface CreateItemMasterResponse {
  itemMasterId: number;
  itemCode: string;
  itemName: string;
  baseUnitName: string;
  totalQuantity: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

async function createItemMaster(
  data: CreateItemMasterRequest
): Promise<CreateItemMasterResponse> {
  const response = await fetch("/api/v1/warehouse/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create item master");
  }

  return response.json();
}

// Usage
try {
  const result = await createItemMaster({
    itemCode: "AMOX-500MG",
    itemName: "Amoxicillin 500mg",
    categoryId: 1,
    warehouseType: "COLD",
    minStockLevel: 100,
    maxStockLevel: 1000,
    isPrescriptionRequired: true,
    defaultShelfLifeDays: 730,
    units: [
      {
        unitName: "Box",
        conversionRate: 100,
        isBaseUnit: false,
        displayOrder: 1,
        isDefaultImportUnit: true,
      },
      {
        unitName: "Capsule",
        conversionRate: 1,
        isBaseUnit: true,
        displayOrder: 2,
        isDefaultExportUnit: true,
      },
    ],
  });

  console.log("Created item:", result.itemMasterId);
} catch (error) {
  console.error("Failed to create item:", error.message);
}
```

### Form Validation

```typescript
function validateItemMasterForm(data: CreateItemMasterRequest): string[] {
  const errors: string[] = [];

  // Item code format
  if (!/^[A-Z0-9-]{3,20}$/.test(data.itemCode)) {
    errors.push(
      "Item code must be 3-20 characters (uppercase, numbers, hyphens only)"
    );
  }

  // Stock levels
  if (data.minStockLevel >= data.maxStockLevel) {
    errors.push("Min stock level must be less than max stock level");
  }

  // Shelf life range
  if (
    data.defaultShelfLifeDays !== undefined &&
    data.defaultShelfLifeDays !== null &&
    (data.defaultShelfLifeDays < 1 || data.defaultShelfLifeDays > 3650)
  ) {
    errors.push("Shelf life must be between 1 and 3650 days");
  }

  // Unit validations
  if (data.units.length === 0) {
    errors.push("At least one unit is required");
  }

  const baseUnits = data.units.filter((u) => u.isBaseUnit);
  if (baseUnits.length !== 1) {
    errors.push("Exactly one base unit is required");
  }

  if (baseUnits.length === 1 && baseUnits[0].conversionRate !== 1) {
    errors.push("Base unit must have conversion rate = 1");
  }

  const unitNames = data.units.map((u) => u.unitName.toLowerCase());
  const uniqueNames = new Set(unitNames);
  if (unitNames.length !== uniqueNames.size) {
    errors.push("Unit names must be unique");
  }

  return errors;
}
```

---

## Healthcare Compliance

### Prescription Requirement Flag

**Purpose:** Track medications that require doctor prescriptions

**Legal Requirements:**

- All Schedule II-V controlled substances must have `isPrescriptionRequired = true`
- Antibiotics typically require prescriptions
- Over-the-counter items should have `isPrescriptionRequired = false`

**System Behavior:**

- When exporting items with `isPrescriptionRequired = true`, system should validate prescription exists
- Audit logs should track who dispensed prescription items
- Reports should separate prescription vs. OTC items

### Shelf Life Tracking

**Purpose:** Prevent dispensing expired medications

**Best Practices:**

- Set realistic shelf life based on manufacturer specifications
- Medications: 1-3 years (365-1095 days)
- Perishable supplies: 1-6 months (30-180 days)
- Non-perishable equipment: `null` (no expiration)

**System Behavior:**

- When creating batches, expiry date = import date + defaultShelfLifeDays
- System alerts when items approach expiration
- FIFO (First In, First Out) logic uses expiry dates

### Audit Trail

**Logged Information:**

- Who created the item master
- When it was created
- All validation results
- Any errors encountered

**Compliance Reports:**

- List of prescription-required items
- Items with upcoming expirations
- Stock level violations (below min or above max)

---

## Performance Considerations

### Batch Insert Optimization

The service uses `saveAll()` for batch insertion of units:

```java
itemUnitRepository.saveAll(units);
```

**Performance Metrics:**

- Single transaction for all units
- Reduced database round trips
- ~50ms for 3 units vs. ~150ms with individual saves

### Database Indexes

Schema includes performance indexes:

```sql
CREATE INDEX idx_item_masters_code ON item_masters(item_code);
CREATE INDEX idx_item_masters_name ON item_masters(item_name);
CREATE INDEX idx_item_masters_category ON item_masters(category_id);
CREATE INDEX idx_item_units_item_master ON item_units(item_master_id);
```

### Transaction Management

- `@Transactional` ensures atomic operations
- Rollback on any validation failure
- Prevents orphaned records

---

## Related APIs

- **API 6.8:** GET /api/v1/warehouse/items - List all item masters
- **API 6.1:** GET /api/v1/warehouse/inventory - View current inventory
- **API 6.4:** POST /api/v1/warehouse/transactions/import - Import items
- **API 6.5:** POST /api/v1/warehouse/transactions/export - Export items

---

## Changelog

### Version 1.0 (November 27, 2025)

- Initial implementation
- Support for unit hierarchy
- Healthcare compliance fields
- Batch insert optimization
- Complete validation suite

---

## Support

For issues or questions:

- Technical Support: backend-team@dentalclinic.com
- API Documentation: https://api.dentalclinic.com/docs
- Issue Tracker: https://github.com/dentalclinic/api/issues

---

**End of Document**
