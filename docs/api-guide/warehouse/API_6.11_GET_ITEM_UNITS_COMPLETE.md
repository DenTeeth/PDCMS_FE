# API 6.11: Get Item Units - Complete Specification

## Overview

API 6.11 provides the unit hierarchy (list of measurement units) for a specific item master. This API is essential for dropdown selection in:

- Import/Export transaction forms
- Prescription forms
- Transaction history display

## Endpoint Details

**Method:** GET
**Path:** `/api/v1/warehouse/items/{itemMasterId}/units`
**Authorization:** Requires one of: `ADMIN`, `VIEW_ITEMS`, `VIEW_WAREHOUSE`, `MANAGE_WAREHOUSE`

## Request Parameters

### Path Parameters

| Parameter    | Type | Required | Description           | Example |
| ------------ | ---- | -------- | --------------------- | ------- |
| itemMasterId | Long | Yes      | ID of the item master | 24      |

### Query Parameters

| Parameter | Type   | Required | Default | Description                                         |
| --------- | ------ | -------- | ------- | --------------------------------------------------- |
| status    | String | No       | active  | Filter units by status: `active`, `inactive`, `all` |

**Status Values:**

- `active` (default): Only active units for current transactions
- `inactive`: Only soft-deleted units for history display
- `all`: All units regardless of status

## Response Structure

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Item units retrieved successfully",
  "data": {
    "itemMaster": {
      "itemMasterId": 24,
      "itemCode": "DP-AMOX-500",
      "itemName": "Amoxicillin 500mg",
      "isActive": true
    },
    "baseUnit": {
      "unitId": 12,
      "unitName": "Vien"
    },
    "units": [
      {
        "unitId": 10,
        "unitName": "Hop",
        "conversionRate": 100,
        "isBaseUnit": false,
        "displayOrder": 1,
        "isActive": true,
        "description": "1 Hop = 100 Vien"
      },
      {
        "unitId": 11,
        "unitName": "Vi",
        "conversionRate": 10,
        "isBaseUnit": false,
        "displayOrder": 2,
        "isActive": true,
        "description": "1 Vi = 10 Vien"
      },
      {
        "unitId": 12,
        "unitName": "Vien",
        "conversionRate": 1,
        "isBaseUnit": true,
        "displayOrder": 3,
        "isActive": true,
        "description": "Don vi co so"
      }
    ]
  }
}
```

### Error Responses

#### 404 Not Found

Item master does not exist.

```json
{
  "statusCode": 404,
  "error": "ITEM_NOT_FOUND",
  "message": "Item master not found with ID: 999"
}
```

#### 410 Gone

Item master exists but is inactive (soft-deleted).

```json
{
  "statusCode": 410,
  "error": "ITEM_INACTIVE",
  "message": "Item 'DP-OLD-001' is no longer active"
}
```

## Business Logic

### 1. Validation

- Validates `itemMasterId` is positive integer
- Checks if item master exists in database
- If item is soft-deleted (isActive=false), returns 410 GONE

### 2. Status Filtering

- `status=active`: WHERE is_active = true
- `status=inactive`: WHERE is_active = false
- `status=all`: No filter

### 3. Sorting

- Always ORDER BY display_order ASC
- Large units (Box, Carton) typically have displayOrder=1
- Small units (Piece, Tablet) typically have displayOrder=3+

### 4. Description Generation

- Base unit: "Don vi co so"
- Other units: "1 {unitName} = {conversionRate} {baseUnitName}"
- Example: "1 Hop = 100 Vien"

### 5. Response Construction

- **itemMaster**: Provides context (code, name, status)
- **baseUnit**: Reference for calculations
- **units**: Complete list with descriptions

## Use Cases

### Use Case 1: Import Transaction Form

**Scenario:** Warehouse staff needs to select unit for import

**Request:**

```
GET /api/v1/warehouse/items/24/units?status=active
```

**Expected Result:**

- Returns active units only
- Sorted by displayOrder (large units first)
- Staff can quickly select "Hop" for bulk import

### Use Case 2: Prescription Form

**Scenario:** Doctor needs to prescribe medication

**Request:**

```
GET /api/v1/warehouse/items/24/units?status=active
```

**Expected Result:**

- Returns active units
- Doctor can select "Vien" for precise dosage
- Description helps avoid confusion

### Use Case 3: Transaction History

**Scenario:** View old transaction that used discontinued unit

**Request:**

```
GET /api/v1/warehouse/items/24/units?status=all
```

**Expected Result:**

- Returns all units including inactive
- Can display historical unit name correctly
- Example: "Hop Nhua (Cu)" - old packaging unit

### Use Case 4: Export Transaction

**Scenario:** Nurse exports medication for treatment

**Request:**

```
GET /api/v1/warehouse/items/24/units?status=active
```

**Expected Result:**

- Returns active units
- Can select appropriate unit for export
- Description shows conversion for verification

## Authorization Matrix

| Role            | Permission       | Can Access? | Use Case            |
| --------------- | ---------------- | ----------- | ------------------- |
| ADMIN           | ADMIN            | Yes         | All operations      |
| Manager         | VIEW_ITEMS       | Yes         | View for reports    |
| Warehouse Staff | MANAGE_WAREHOUSE | Yes         | Import/Export forms |
| Doctor          | VIEW_ITEMS       | Yes         | Prescription forms  |
| Nurse           | VIEW_ITEMS       | Yes         | Treatment records   |
| Receptionist    | VIEW_ITEMS       | Yes         | Service booking     |

## Technical Notes

### Performance

- Single query to item_units table
- Indexed on item_master_id and is_active
- Response typically < 2KB (3-5 units)
- Can be cached for 5-10 minutes

### Data Integrity

- Always returns exactly one base unit
- Base unit always has conversionRate=1
- displayOrder must be unique per item
- unitName must be unique per item

### Frontend Integration

```javascript
// Fetch units for dropdown
const response = await fetch(
  `/api/v1/warehouse/items/${itemId}/units?status=active`
);
const data = await response.json();

// Populate dropdown
const dropdown = data.data.units.map((unit) => ({
  value: unit.unitId,
  label: `${unit.unitName} (${unit.description})`,
}));

// Display: "Hop (1 Hop = 100 Vien)"
```

## Testing Checklist

- [ ] GET with valid itemMasterId returns 200
- [ ] GET with status=active returns only active units
- [ ] GET with status=inactive returns only inactive units
- [ ] GET with status=all returns all units
- [ ] GET with invalid itemMasterId returns 404
- [ ] GET with inactive item returns 410
- [ ] Description is correctly generated for all units
- [ ] Units are sorted by displayOrder
- [ ] Base unit info is correctly populated
- [ ] Authorization works for all permitted roles

## Change Log

| Version | Date       | Author | Changes                |
| ------- | ---------- | ------ | ---------------------- |
| 1.0     | 2025-11-28 | System | Initial implementation |
