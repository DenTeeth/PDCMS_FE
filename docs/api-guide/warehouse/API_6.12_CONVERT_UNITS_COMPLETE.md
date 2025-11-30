# API 6.12: Convert Item Quantity Between Units - Complete Guide

## Overview

**Endpoint**: `POST /api/v1/warehouse/items/units/convert`
**Version**: V26 (2025-11-29)
**Status**: ✅ Production Ready

Utility API for converting quantities between different units of the same item with batch processing support.

## Business Context

### Use Cases

1. **Prescription Forms**: Display "0.5 Hop (= 50 Vien)" for doctor verification
2. **Import Transactions**: Convert "10 Thung" to "10,000 Vien" for inventory calculation
3. **Stock Reports**: Display quantities in user-preferred units
4. **Treatment Planning**: Calculate medication doses in appropriate units

### Key Features

- ✅ Batch processing (multiple items in single request)
- ✅ Three rounding modes (FLOOR, CEILING, HALF_UP)
- ✅ Formula transparency (shows calculation)
- ✅ Security validation (prevents cross-item unit mixing)
- ✅ Auto-formatted display strings (e.g., "1,000" vs "1000.0")
- ✅ Data integrity checks (base unit exists, rates > 0)

## Algorithm

### Intermediate Base Unit Pattern

```
Step 1: Convert from source unit to base unit
baseQuantity = inputQuantity × fromUnit.conversionRate

Step 2: Convert from base unit to target unit
resultQuantity = baseQuantity ÷ toUnit.conversionRate

Step 3: Apply rounding mode
finalQuantity = applyRounding(resultQuantity, roundingMode)
```

**Example**: Convert 2.5 Hop to Chiec (Item: Kim tiem)

- Hop conversion rate: 200 (1 Hop = 200 Chiec)
- Chiec conversion rate: 1 (base unit)
- Calculation: (2.5 × 200) ÷ 1 = 500 Chiec

## Request Format

### Endpoint Details

```http
POST /api/v1/warehouse/items/units/convert
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Request Body Schema

```json
{
  "conversions": [
    {
      "itemMasterId": Long,     // Required, positive
      "fromUnitId": Long,        // Required, positive
      "toUnitId": Long,          // Required, positive
      "quantity": Double         // Required, positive
    }
  ],
  "roundingMode": String        // Optional, default: "HALF_UP"
}
```

### Rounding Modes

| Mode        | Behavior                | Use Case                                     |
| ----------- | ----------------------- | -------------------------------------------- |
| **FLOOR**   | Round down (Math.floor) | Medications - cannot split pills             |
| **CEILING** | Round up (Math.ceil)    | Materials - buy full box instead of shortage |
| **HALF_UP** | Standard rounding       | Default, general purpose                     |

### Validation Rules

**Request Level:**

- `conversions` array must not be empty
- `roundingMode` is optional (defaults to "HALF_UP")

**Item Level:**

- All IDs must be positive integers
- `quantity` must be positive decimal
- All fields are required

## Response Format

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Conversion processed successfully",
  "data": {
    "totalProcessed": Integer,
    "results": [
      {
        "itemMasterId": Long,
        "itemName": String,
        "fromUnitName": String,
        "toUnitName": String,
        "inputQuantity": Double,
        "resultQuantity": Double,
        "resultQuantityDisplay": String,
        "formula": String,
        "conversionFactor": Double
      }
    ]
  }
}
```

### Response Fields

| Field                   | Type    | Description                                    |
| ----------------------- | ------- | ---------------------------------------------- |
| `totalProcessed`        | Integer | Number of successful conversions               |
| `itemMasterId`          | Long    | Item ID                                        |
| `itemName`              | String  | Item display name                              |
| `fromUnitName`          | String  | Source unit name                               |
| `toUnitName`            | String  | Target unit name                               |
| `inputQuantity`         | Double  | Original quantity                              |
| `resultQuantity`        | Double  | Converted quantity (exact)                     |
| `resultQuantityDisplay` | String  | Formatted for UI (e.g., "1,000")               |
| `formula`               | String  | Calculation formula (e.g., "(2.5 \* 200) / 1") |
| `conversionFactor`      | Double  | Direct multiplier (fromRate / toRate)          |

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Conversions list cannot be empty"
}
```

**Causes:**

- Empty conversions array
- Negative quantity
- Missing required fields
- Invalid data types

#### 400 Bad Request - Unit Ownership Violation

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Unit ID 99 does not belong to Item ID 1"
}
```

**Cause:** Attempting to use unit from different item (security violation)

#### 404 Not Found - Item Not Found

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Item with ID 99999 not found"
}
```

#### 404 Not Found - Unit Not Found

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Unit with ID 99999 not found"
}
```

#### 500 Internal Server Error - Base Unit Missing

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Base unit not found for item Kim tiem. Data integrity issue."
}
```

**Cause:** Data integrity problem - every item must have exactly one base unit

## Security & Authorization

### Required Permissions

**Any ONE of:**

- `ROLE_ADMIN` (full access)
- `VIEW_ITEMS` (doctors, nurses viewing inventory)
- `VIEW_WAREHOUSE` (warehouse staff)
- `MANAGE_WAREHOUSE` (warehouse managers)

### Permission Rationale

This is a **read-only utility API** that performs calculations without modifying data:

- No database writes
- No inventory changes
- Only performs mathematical conversions

Therefore, granted to all internal staff (doctors, nurses, warehouse staff) who need to view item information.

### Security Validations

1. **Unit Ownership Check**: Validates both `fromUnitId` and `toUnitId` belong to the specified `itemMasterId`
2. **Resource Existence**: Verifies item and units exist before processing
3. **Data Integrity**: Ensures base unit exists and conversion rates are valid

## Business Logic Details

### 10-Step Validation Process

```java
// Service Layer: ItemMasterService.convertSingleUnit()

Step 1: Fetch ItemMaster by ID (throws 404 if not found)
Step 2: Fetch fromUnit and validate ownership (throws 400 if mismatch)
Step 3: Fetch toUnit and validate ownership (throws 400 if mismatch)
Step 4: Validate conversion rates > 0 (throws 400 if invalid)
Step 5: Verify base unit exists (throws 500 if missing - data integrity)
Step 6: Calculate baseQuantity = quantity × fromRate
Step 7: Calculate resultQuantity = baseQuantity ÷ toRate
Step 8: Apply rounding mode (FLOOR/CEILING/HALF_UP)
Step 9: Build formula string for transparency
Step 10: Build response DTO with formatted display
```

### Conversion Rate Examples

**Item: Kim tiem nha khoa 27G x 1 inch**

| Unit Name    | Conversion Rate | Meaning               |
| ------------ | --------------- | --------------------- |
| Chiec (base) | 1               | 1 Chiec = 1 base unit |
| Cap          | 2               | 1 Cap = 2 Chiec       |
| Hop          | 200             | 1 Hop = 200 Chiec     |

**Converting 2.5 Hop to Cap:**

```
baseQty = 2.5 × 200 = 500 Chiec (base)
result = 500 ÷ 2 = 250 Cap
formula = "(2.5 * 200) / 2"
```

### Display Formatting Logic

The API auto-generates `resultQuantityDisplay` from `resultQuantity`:

```java
// Integer values: Remove decimal, add thousand separator
500.0 → "500"
1000.0 → "1,000"
10000.0 → "10,000"

// Decimal values: Keep up to 2 decimal places
12.5 → "12.5"
83.33 → "83.33"
0.83 → "0.83"
```

## Code Examples

### Example 1: Single Conversion

**Request:**

```bash
curl -X POST http://localhost:8080/api/v1/warehouse/items/units/convert \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversions": [
      {
        "itemMasterId": 1,
        "fromUnitId": 3,
        "toUnitId": 1,
        "quantity": 2.5
      }
    ],
    "roundingMode": "HALF_UP"
  }'
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Conversion processed successfully",
  "data": {
    "totalProcessed": 1,
    "results": [
      {
        "itemMasterId": 1,
        "itemName": "Kim tiem nha khoa 27G x 1 inch",
        "fromUnitName": "Hop",
        "toUnitName": "Chiec",
        "inputQuantity": 2.5,
        "resultQuantity": 500.0,
        "resultQuantityDisplay": "500",
        "formula": "(2.5 * 200) / 1",
        "conversionFactor": 200.0
      }
    ]
  }
}
```

### Example 2: Batch Conversion

**Request:**

```bash
curl -X POST http://localhost:8080/api/v1/warehouse/items/units/convert \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversions": [
      {
        "itemMasterId": 1,
        "fromUnitId": 3,
        "toUnitId": 1,
        "quantity": 0.5
      },
      {
        "itemMasterId": 2,
        "fromUnitId": 3,
        "toUnitId": 1,
        "quantity": 1
      },
      {
        "itemMasterId": 3,
        "fromUnitId": 3,
        "toUnitId": 1,
        "quantity": 2
      }
    ],
    "roundingMode": "HALF_UP"
  }'
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Conversion processed successfully",
  "data": {
    "totalProcessed": 3,
    "results": [
      {
        "itemMasterId": 1,
        "itemName": "Kim tiem nha khoa 27G x 1 inch",
        "fromUnitName": "Hop",
        "toUnitName": "Chiec",
        "inputQuantity": 0.5,
        "resultQuantity": 100.0,
        "resultQuantityDisplay": "100",
        "formula": "(0.5 * 200) / 1",
        "conversionFactor": 200.0
      },
      {
        "itemMasterId": 2,
        "itemName": "Gang tay nha khoa size M",
        "fromUnitName": "Hop",
        "toUnitName": "Cai",
        "inputQuantity": 1.0,
        "resultQuantity": 100.0,
        "resultQuantityDisplay": "100",
        "formula": "(1 * 100) / 1",
        "conversionFactor": 100.0
      },
      {
        "itemMasterId": 3,
        "itemName": "Lidocaine 2% - 20ml",
        "fromUnitName": "Hop",
        "toUnitName": "Ong",
        "inputQuantity": 2.0,
        "resultQuantity": 100.0,
        "resultQuantityDisplay": "100",
        "formula": "(2 * 50) / 1",
        "conversionFactor": 50.0
      }
    ]
  }
}
```

### Example 3: Rounding Mode - CEILING

**Scenario**: Convert 83 individual gloves to boxes (need to buy full box)

**Request:**

```bash
curl -X POST http://localhost:8080/api/v1/warehouse/items/units/convert \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "conversions": [
      {
        "itemMasterId": 2,
        "fromUnitId": 1,
        "toUnitId": 3,
        "quantity": 83
      }
    ],
    "roundingMode": "CEILING"
  }'
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Conversion processed successfully",
  "data": {
    "totalProcessed": 1,
    "results": [
      {
        "itemMasterId": 2,
        "itemName": "Gang tay nha khoa size M",
        "fromUnitName": "Cai",
        "toUnitName": "Hop",
        "inputQuantity": 83.0,
        "resultQuantity": 1.0,
        "resultQuantityDisplay": "1",
        "formula": "(83 * 1) / 100",
        "conversionFactor": 0.01
      }
    ]
  }
}
```

**Explanation**: 83 gloves = 0.83 boxes → CEILING rounds up to 1 box (cannot buy partial box)

## Frontend Integration Guide

### When to Use This API

1. **Prescription Form**: Show equivalent in smaller units

   ```javascript
   // Doctor prescribes 0.5 boxes
   // Call API to show: "0.5 Hop = 50 Vien"
   ```

2. **Import Form**: Calculate total base units

   ```javascript
   // User enters 10 boxes
   // Call API to calculate: "10 Hop = 10,000 Vien"
   // Store 10,000 in inventory
   ```

3. **Stock Report**: Display in preferred units
   ```javascript
   // Database has 2,500 pills (base unit)
   // Call API to convert: "2,500 Vien = 12.5 Hop"
   ```

### Sample Frontend Code (React)

```typescript
interface ConversionRequest {
  conversions: Array<{
    itemMasterId: number;
    fromUnitId: number;
    toUnitId: number;
    quantity: number;
  }>;
  roundingMode?: "FLOOR" | "CEILING" | "HALF_UP";
}

async function convertUnits(request: ConversionRequest) {
  const response = await fetch("/api/v1/warehouse/items/units/convert", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json();
}

// Usage in prescription form
const result = await convertUnits({
  conversions: [
    {
      itemMasterId: 1,
      fromUnitId: 3, // Hop
      toUnitId: 1, // Chiec (base)
      quantity: 0.5,
    },
  ],
  roundingMode: "FLOOR", // Cannot split pills
});

// Display: "0.5 Hop = 100 Chiec"
console.log(
  `${result.data.results[0].inputQuantity} ${result.data.results[0].fromUnitName} = ${result.data.results[0].resultQuantityDisplay} ${result.data.results[0].toUnitName}`
);
```

### Batch Processing Optimization

**Bad Practice** (3 HTTP requests):

```javascript
const result1 = await convertUnits({ conversions: [item1] });
const result2 = await convertUnits({ conversions: [item2] });
const result3 = await convertUnits({ conversions: [item3] });
// Total time: ~90ms (3 × 30ms)
```

**Good Practice** (1 HTTP request):

```javascript
const results = await convertUnits({
  conversions: [item1, item2, item3],
});
// Total time: ~50ms (45% faster)
```

## Performance Characteristics

### Response Times (measured on test environment)

| Operation         | Response Time |
| ----------------- | ------------- |
| Single conversion | ~30ms         |
| Batch (3 items)   | ~50ms         |
| Batch (10 items)  | ~100ms        |

### Database Queries per Request

- Item lookup: 1 query per item
- Unit lookup: 2 queries per conversion (fromUnit, toUnit)
- Base unit validation: 1 query per item

**Total for batch of 3 items**: ~9 queries (~3 queries per item)

### Optimization Tips

1. **Use batch processing** for multiple items in same form
2. **Cache unit hierarchies** on frontend (rarely change)
3. **Pre-calculate** conversion factors for common pairs
4. **Avoid unnecessary calls** - only convert when user needs to see result

## Testing Guide

### Test Data (from seed data)

**Item 1: Kim tiem nha khoa 27G x 1 inch**

- Unit 1: Chiec (base, rate: 1)
- Unit 2: Cap (rate: 2)
- Unit 3: Hop (rate: 200)

**Item 2: Gang tay nha khoa size M**

- Unit 1: Cai (base, rate: 1)
- Unit 2: Cap (rate: 2)
- Unit 3: Hop (rate: 100)

**Item 3: Lidocaine 2% - 20ml**

- Unit 1: Ong (base, rate: 1)
- Unit 2: Tuyp (rate: 1)
- Unit 3: Hop (rate: 50)

### Test Cases Summary

| Test | Type    | Description                     | Expected Status |
| ---- | ------- | ------------------------------- | --------------- |
| 1    | Success | Single conversion (Hop → Chiec) | 200 OK          |
| 2    | Success | Batch conversion (3 items)      | 200 OK          |
| 3    | Success | Rounding FLOOR                  | 200 OK          |
| 4    | Success | Rounding CEILING                | 200 OK          |
| 5    | Success | Decimal result with HALF_UP     | 200 OK          |
| 6    | Error   | Unit ownership violation        | 400 BAD_REQUEST |
| 7    | Error   | Item not found                  | 404 NOT_FOUND   |
| 8    | Error   | Empty conversions               | 400 BAD_REQUEST |
| 9    | Error   | Negative quantity               | 400 BAD_REQUEST |
| 10   | Error   | Unit not found                  | 404 NOT_FOUND   |

**Full test guide**: See `ITEM_UNIT_CONVERSION_API_TEST_GUIDE.md`

## Technical Implementation

### Service Layer

**File**: `ItemMasterService.java`

```java
@Transactional(readOnly = true)
public ConversionResponse convertUnits(ConversionRequest request) {
    // Batch processing with error handling
    List<ConversionResult> results = new ArrayList<>();

    for (ConversionItemRequest item : request.getConversions()) {
        ConversionResult result = convertSingleUnit(item, request.getRoundingMode());
        results.add(result);
    }

    return new ConversionResponse(results.size(), results);
}

private ConversionResult convertSingleUnit(
    ConversionItemRequest request, String roundingMode) {

    // 10-step validation and conversion
    // See "Business Logic Details" section above
}
```

### Controller Layer

**File**: `ItemMasterController.java`

```java
@PostMapping("/units/convert")
@PreAuthorize("hasRole(ADMIN) or hasAnyAuthority('VIEW_ITEMS', 'VIEW_WAREHOUSE', 'MANAGE_WAREHOUSE')")
public ResponseEntity<ConversionResponse> convertUnits(
    @Valid @RequestBody ConversionRequest request) {

    ConversionResponse response = itemMasterService.convertUnits(request);
    return ResponseEntity.ok(response);
}
```

## Common Pitfalls & Solutions

### Pitfall 1: Using Wrong Unit IDs

❌ **Wrong**: Hardcoded unit IDs

```json
{
  "fromUnitId": 3, // Assumes this is always "Hop"
  "toUnitId": 1 // Assumes this is always base unit
}
```

✅ **Correct**: Fetch unit IDs from API 6.11 first

```javascript
// Step 1: Get units for item
const units = await fetch(`/api/v1/warehouse/items/${itemId}/units`);
const hopUnit = units.find((u) => u.unitName === "Hop");
const baseUnit = units.find((u) => u.isBaseUnit === true);

// Step 2: Use correct IDs
const result = await convertUnits({
  conversions: [
    {
      itemMasterId: itemId,
      fromUnitId: hopUnit.itemUnitId,
      toUnitId: baseUnit.itemUnitId,
      quantity: 2.5,
    },
  ],
});
```

### Pitfall 2: Wrong Rounding Mode

❌ **Wrong**: Using HALF_UP for medications

```json
{
  "conversions": [...],
  "roundingMode": "HALF_UP"  // Could result in 12.5 pills
}
```

✅ **Correct**: Use FLOOR for medications

```json
{
  "conversions": [...],
  "roundingMode": "FLOOR"  // Always round down (can't have half pill)
}
```

### Pitfall 3: Not Handling Errors

❌ **Wrong**: Assuming success

```javascript
const result = await convertUnits(request);
// What if unit ownership violation?
```

✅ **Correct**: Handle all error cases

```javascript
try {
  const result = await convertUnits(request);
  // Display result
} catch (error) {
  if (error.statusCode === 400) {
    alert("Invalid request: " + error.message);
  } else if (error.statusCode === 404) {
    alert("Item or unit not found");
  } else {
    alert("System error, please contact admin");
  }
}
```

## Related APIs

- **API 6.8**: Get Item Masters List - Get items with categories
- **API 6.11**: Get Item Units - Get unit hierarchy for item
- **API 6.4**: Import Transaction - Uses converted quantities for stock entry
- **API 6.5**: Export Transaction - May need conversion for prescription

## Version History

| Version | Date       | Changes                     |
| ------- | ---------- | --------------------------- |
| V26     | 2025-11-29 | Initial release of API 6.12 |

## Support

For issues or questions:

- Check test guide: `ITEM_UNIT_CONVERSION_API_TEST_GUIDE.md`
- Review seed data: `dental-clinic-seed-data.sql`
- Contact: Backend Team

---

**Last Updated**: 2025-11-29
**API Version**: V26
**Status**: ✅ Production Ready
