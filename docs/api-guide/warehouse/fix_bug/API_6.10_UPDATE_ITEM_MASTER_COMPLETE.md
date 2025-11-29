# API 6.10: Update Item Master - Complete Specification

## Overview

This API allows updating an existing item master with a Safety Lock mechanism that prevents dangerous changes when inventory exists in the system.

## API Endpoint

```
PUT /api/v1/warehouse/items/{id}
```

## Authentication & Authorization

- **Required Permission**: `UPDATE_ITEMS`
- **Roles with Access**:
  - ROLE_ADMIN
  - ROLE_INVENTORY_MANAGER (default)
  - ROLE_MANAGER (if granted)

## Safety Lock Mechanism

### Purpose

The Safety Lock protects data integrity by preventing modifications that would corrupt stock calculations or break transaction history when the item has existing inventory (cached_total_quantity > 0).

### Rules

#### BLOCKED Changes (when stock exists):

1. **Conversion Rate Changes**: Would corrupt all existing stock calculations
2. **Base Unit Flag Changes**: Would break unit hierarchy integrity
3. **Hard Delete Units**: Would cause FK constraint violations in transaction history

#### ALLOWED Changes (when stock exists):

1. **Item Details**: name, description, category, warehouse type
2. **Stock Levels**: min/max stock level adjustments
3. **Unit Rename**: Cosmetic change, no impact on calculations
4. **Add New Units**: Expands available options without affecting existing data
5. **Display Order**: UI ordering only
6. **Soft Delete Units**: Set isActive=false, preserves history

#### FREE Mode (when stock = 0):

All changes are allowed when no inventory exists.

## Request

### Path Parameters

- `id` (Long, required): Item Master ID

### Request Body

```json
{
  "itemName": "Paracetamol 500mg",
  "description": "Pain reliever and fever reducer",
  "categoryId": 1,
  "warehouseType": "NORMAL",
  "minStockLevel": 100,
  "maxStockLevel": 1000,
  "isPrescriptionRequired": true,
  "defaultShelfLifeDays": 730,
  "units": [
    {
      "unitId": 1,
      "unitName": "Hop",
      "conversionRate": 10.0,
      "isBaseUnit": false,
      "isActive": true,
      "displayOrder": 1,
      "isDefaultImportUnit": true,
      "isDefaultExportUnit": false
    },
    {
      "unitId": 2,
      "unitName": "Vi",
      "conversionRate": 1.0,
      "isBaseUnit": true,
      "isActive": true,
      "displayOrder": 2,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": true
    },
    {
      "unitId": null,
      "unitName": "Pallet",
      "conversionRate": 100.0,
      "isBaseUnit": false,
      "isActive": true,
      "displayOrder": 0,
      "isDefaultImportUnit": false,
      "isDefaultExportUnit": false
    }
  ]
}
```

### Field Descriptions

#### Item Fields

- `itemName` (String, required): Item name (1-255 chars)
- `description` (String, optional): Detailed description
- `categoryId` (Long, required): Category ID (must exist)
- `warehouseType` (Enum, required): NORMAL or COLD
- `minStockLevel` (Integer, required): Minimum stock alert level (>= 0, < maxStockLevel)
- `maxStockLevel` (Integer, required): Maximum stock alert level (> minStockLevel)
- `isPrescriptionRequired` (Boolean, optional): Default false
- `defaultShelfLifeDays` (Integer, optional): Shelf life in days

#### Unit Fields

- `unitId` (Long, nullable):
  - If provided: Update existing unit
  - If null: Create new unit
- `unitName` (String, required): Unit name (1-50 chars)
- `conversionRate` (Double, required): Conversion to base unit (> 0)
- `isBaseUnit` (Boolean, required): Exactly ONE unit must be base unit with rate = 1.0
- `isActive` (Boolean, optional): Default true, set false for soft delete
- `displayOrder` (Integer, required): Display ordering
- `isDefaultImportUnit` (Boolean, optional): Default import unit flag
- `isDefaultExportUnit` (Boolean, optional): Default export unit flag

## Response

### Success Response (200 OK)

```json
{
  "itemMasterId": 1,
  "itemCode": "MED-PARA-500",
  "itemName": "Paracetamol 500mg",
  "totalQuantity": 500,
  "updatedAt": "2025-11-27T19:30:00",
  "updatedBy": "SYSTEM",
  "safetyLockApplied": true,
  "units": [
    {
      "unitId": 3,
      "unitName": "Pallet",
      "conversionRate": 100.0,
      "isBaseUnit": false,
      "isActive": true
    },
    {
      "unitId": 1,
      "unitName": "Hop",
      "conversionRate": 10.0,
      "isBaseUnit": false,
      "isActive": true
    },
    {
      "unitId": 2,
      "unitName": "Vi",
      "conversionRate": 1.0,
      "isBaseUnit": true,
      "isActive": true
    }
  ]
}
```

### Error Responses

#### 400 BAD REQUEST - Validation Errors

```json
{
  "timestamp": "2025-11-27T19:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Min stock level must be less than max stock level",
  "path": "/api/v1/warehouse/items/1"
}
```

Common validation errors:

- Min stock level >= Max stock level
- No base unit or multiple base units
- Base unit conversion rate != 1.0
- Duplicate unit names
- Unit name too long (> 50 chars)

#### 404 NOT FOUND - Item Not Found

```json
{
  "timestamp": "2025-11-27T19:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Item master with ID 999 not found",
  "path": "/api/v1/warehouse/items/999"
}
```

#### 409 CONFLICT - Safety Lock Violation

```json
{
  "timestamp": "2025-11-27T19:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "Safety Lock: Cannot modify units when stock exists. Blocked changes: Cannot change conversion rate for unit 'Hop' (current: 10.0, new: 12.0); Cannot change base unit status for unit 'Vi'",
  "path": "/api/v1/warehouse/items/1"
}
```

#### 403 FORBIDDEN - Missing Permission

```json
{
  "timestamp": "2025-11-27T19:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied",
  "path": "/api/v1/warehouse/items/1"
}
```

## Use Cases

### 1. Update Item Details (Safe)

**Scenario**: Change item name and category
**Stock Status**: Any
**Expected Result**: SUCCESS
**Changes**:

- itemName: "Paracetamol 500mg" -> "Paracetamol Tablets 500mg"
- categoryId: 1 -> 2

### 2. Adjust Stock Alerts (Safe)

**Scenario**: Update min/max levels based on demand
**Stock Status**: Any
**Expected Result**: SUCCESS
**Changes**:

- minStockLevel: 100 -> 150
- maxStockLevel: 1000 -> 1500

### 3. Rename Unit (Safe, even with stock)

**Scenario**: Change "Box" to "Carton" for clarity
**Stock Status**: 500 units in stock
**Expected Result**: SUCCESS (cosmetic change only)
**Changes**:

- unitName: "Box" -> "Carton"

### 4. Add New Unit (Safe, even with stock)

**Scenario**: Add "Pallet" for bulk orders
**Stock Status**: 500 units in stock
**Expected Result**: SUCCESS (expands options)
**Changes**:

- Add new unit with unitId=null, conversionRate=100.0

### 5. Soft Delete Unit (Safe, even with stock)

**Scenario**: Hide "Sample Pack" from dropdowns
**Stock Status**: 500 units in stock
**Expected Result**: SUCCESS (preserves history)
**Changes**:

- isActive: true -> false

### 6. Change Conversion Rate (BLOCKED with stock)

**Scenario**: Change Box conversion from 10 to 12
**Stock Status**: 500 units in stock
**Expected Result**: 409 CONFLICT
**Reason**: Would corrupt stock calculations

### 7. Change Base Unit (BLOCKED with stock)

**Scenario**: Change base unit from "Pill" to "Strip"
**Stock Status**: 500 units in stock
**Expected Result**: 409 CONFLICT
**Reason**: Would break unit hierarchy

### 8. Delete Unit (BLOCKED with stock)

**Scenario**: Remove "Box" unit completely
**Stock Status**: 500 units in stock
**Expected Result**: 409 CONFLICT
**Reason**: Would break transaction history

### 9. Free Mode - All Changes Allowed

**Scenario**: Restructure entire unit hierarchy
**Stock Status**: 0 units (no inventory)
**Expected Result**: SUCCESS
**Changes**: Any changes allowed

## Implementation Notes

### Immutable Fields

- `itemCode`: SKU code cannot be changed after creation
- `itemMasterId`: Primary key, system-generated

### Base Unit Requirements

- Exactly ONE unit must have `isBaseUnit = true`
- Base unit must have `conversionRate = 1.0`
- All other units convert to base unit

### Soft Delete Pattern

- Setting `isActive = false` hides unit from dropdowns
- Unit remains in database for transaction history integrity
- No FK constraint violations

### Safety Lock Detection

```java
boolean safetyLockApplied = itemMaster.getCachedTotalQuantity() > 0;
```

### Cache Invalidation

- `cached_total_quantity` remains unchanged (updated by batch triggers)
- Base unit name updated in `unit_of_measure` field

## Testing Scenarios

### Success Cases

1. Update item name, description, category (any stock level)
2. Update min/max stock levels (any stock level)
3. Rename unit with stock = 500
4. Add new unit with stock = 500
5. Soft delete unit (isActive=false) with stock = 500
6. Change conversion rate with stock = 0
7. Change base unit with stock = 0
8. Add + rename + soft delete units simultaneously

### Error Cases

1. Min stock >= Max stock (400 BAD REQUEST)
2. Zero base units (400 BAD REQUEST)
3. Multiple base units (400 BAD REQUEST)
4. Duplicate unit names (400 BAD REQUEST)
5. Change conversion rate with stock > 0 (409 CONFLICT)
6. Change isBaseUnit with stock > 0 (409 CONFLICT)
7. Hard delete unit with stock > 0 (409 CONFLICT)
8. Invalid itemMasterId (404 NOT FOUND)
9. Missing UPDATE_ITEMS permission (403 FORBIDDEN)

### RBAC Test

1. ROLE_ADMIN: Full access
2. ROLE_INVENTORY_MANAGER: Full access
3. ROLE_DOCTOR without UPDATE_ITEMS: 403 FORBIDDEN

## Performance Considerations

### Query Optimization

- Uses `cached_total_quantity` for Safety Lock check (O(1))
- Batch save for units with `saveAll()`
- Single transaction for consistency

### Index Usage

- `item_units.item_master_id` (foreign key index)
- `item_units.is_active` (for active unit queries)

### Expected Response Times

- Update without stock: < 100ms
- Update with stock (Safety Lock check): < 150ms
- Update with 10 units: < 200ms

## Database Impact

### Tables Modified

1. `item_masters`: itemName, description, categoryId, warehouseType, minStockLevel, maxStockLevel, isPrescriptionRequired, defaultShelfLifeDays, unitOfMeasure, updatedAt
2. `item_units`: unitName, conversionRate, isBaseUnit, isActive, displayOrder, isDefaultImportUnit, isDefaultExportUnit, updatedAt

### Tables Read

1. `item_masters`: Load existing item
2. `item_units`: Load existing units for comparison
3. `item_categories`: Validate categoryId

### Constraints

- FK: `item_units.item_master_id` references `item_masters.item_master_id`
- FK: `item_masters.category_id` references `item_categories.category_id`
- Unique: `item_masters.item_code`

## Related APIs

- API 6.8: List Item Masters (GET /api/v1/warehouse/items)
- API 6.9: Create Item Master (POST /api/v1/warehouse/items)
- API 6.4: Import Transaction (references item_units.unit_id)
- API 6.5: Export Transaction (references item_units.unit_id)

## Version History

- **v1.0** (2025-11-27): Initial release with Safety Lock mechanism and Soft Delete support
