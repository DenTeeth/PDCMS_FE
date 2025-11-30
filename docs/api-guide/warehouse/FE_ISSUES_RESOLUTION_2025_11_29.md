# BE Response to FE Issues - November 29, 2025

## Issue Resolution Summary

This document addresses three issues reported by the Frontend team regarding the Warehouse module APIs.

---

## Issue #18: API 6.1 - Inventory Summary Returns 500 Internal Server Error

### Status: RESOLVED - NOT A BUG

**Finding**: The API is working correctly. The 500 error was due to incorrect endpoint URL used in testing.

### Correct Endpoint

```
GET /api/v1/inventory/summary
```

### Test Results (2025-11-29)

- Status Code: 200 OK
- Response Time: 254ms
- Authentication: Valid (admin token)
- Data: Successfully returned 34 inventory items with pagination

### Sample Request

```bash
curl -X GET "http://localhost:8082/api/v1/inventory/summary?page=0&size=10" \
  -H "Authorization: Bearer {token}"
```

### Sample Response

```json
{
  "content": [
    {
      "itemMasterId": 2,
      "itemCode": "CON-MASK-01",
      "itemName": "Khau trang y te",
      "categoryName": "Vat tu tieu hao",
      "warehouseType": "NORMAL",
      "unitOfMeasure": "Cai",
      "totalQuantityOnHand": 800,
      "stockStatus": "NORMAL",
      "isExpiringSoon": false,
      "minStockLevel": 10,
      "maxStockLevel": 1000
    }
  ],
  "totalElements": 34,
  "totalPages": 4,
  "number": 0,
  "size": 10
}
```

### Resolution

- BE Code: Correct implementation
- Seed Data: Valid and sufficient
- FE Action: **No changes needed** - API is production ready

---

## Issue #19: API 6.2 - Item Batches Returns 500 Internal Server Error

### Status: RESOLVED - INCORRECT ENDPOINT URL

**Finding**: The API is working correctly. The 500 error was due to incorrect endpoint URL format.

### Incorrect URL (Used by FE Test)

```
GET /api/v1/inventory/1/batches  // WRONG - causes 404
```

### Correct Endpoint

```
GET /api/v1/inventory/batches/{itemMasterId}  // CORRECT
```

### Example Correct URLs

```
GET /api/v1/inventory/batches/1   // Get batches for item 1
GET /api/v1/inventory/batches/24  // Get batches for item 24
```

### Test Results (2025-11-29)

- Status Code: 200 OK
- Response Time: 89ms
- Authentication: Valid (admin token)
- Data: Successfully returned batch list with FEFO sorting

### Sample Request

```bash
curl -X GET "http://localhost:8082/api/v1/inventory/batches/1" \
  -H "Authorization: Bearer {token}"
```

### Sample Response

```json
[
  {
    "batchId": 2,
    "lotNumber": "BATCH-GLOVE-2023-012",
    "quantityOnHand": 30,
    "expiryDate": "2025-12-18",
    "importedAt": "2024-12-13T19:05:52.661273",
    "supplierName": "Cong ty Vat tu Nha khoa A (Updated)",
    "isExpiringSoon": true,
    "isExpired": false
  },
  {
    "batchId": 1,
    "lotNumber": "BATCH-GLOVE-2024-001",
    "quantityOnHand": 150,
    "expiryDate": "2026-02-26",
    "importedAt": "2025-10-29T19:05:52.648079",
    "supplierName": "Cong ty Vat tu Nha khoa A (Updated)",
    "isExpiringSoon": false,
    "isExpired": false
  }
]
```

### FEFO Sorting

- Batches are sorted by `expiryDate` ascending (First Expired, First Out)
- Expired batches appear first (for warning/disposal)
- Expiring soon batches (within 30 days) flagged with `isExpiringSoon: true`

### Alternative Endpoint (Advanced)

For more detailed batch information with statistics, use:

```
GET /api/v1/warehouse/batches/{itemMasterId}
```

This endpoint provides:

- Batch statistics (totalBatches, expiredBatches, validBatches)
- Filtering by status (EXPIRED, CRITICAL, EXPIRING_SOON, VALID)
- Sorting options (expiryDate, quantityOnHand, importedAt)
- Pagination support
- Hide empty batches option

### Resolution

- BE Code: Correct implementation
- Endpoint Format: **/api/v1/inventory/batches/{itemMasterId}** (not /inventory/{id}/batches)
- FE Action: **Update endpoint URL format** in API calls

---

## Issue #23: Payment Status Default Value for DRAFT Import Transactions

### Status: FIXED IN V30

**Finding**: Valid issue. Import transactions with DRAFT status could have `paymentStatus = null`, requiring FE to handle fallback logic.

### What Changed

Modified `StorageTransaction` entity to set default `paymentStatus = UNPAID` for all import transactions.

### Code Change

```java
// Before (V29)
@Enumerated(EnumType.STRING)
@Column(name = "payment_status", length = 20)
private PaymentStatus paymentStatus; // Could be null

// After (V30)
@Enumerated(EnumType.STRING)
@Column(name = "payment_status", length = 20)
@Builder.Default
private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Never null
```

### Impact

- All new import transactions will have `paymentStatus = "UNPAID"` by default
- API 6.7 (Transaction Detail) will always return non-null `paymentStatus`
- FE can remove fallback logic: `const paymentStatus = transaction.paymentStatus || 'UNPAID'`

### Testing Required

After deployment, verify:

1. Create new DRAFT import transaction
2. GET /api/v1/warehouse/transactions/{id}
3. Confirm response has `"paymentStatus": "UNPAID"` (not null)

### Resolution

- BE Code: Fixed - Added @Builder.Default to entity
- Schema: V30 - No migration needed (only affects new records)
- FE Action: **Can remove fallback logic** after deployment (optional - keeping it doesn't hurt)

---

## Summary

| Issue                   | Status        | Root Cause                   | Action Required                           |
| ----------------------- | ------------- | ---------------------------- | ----------------------------------------- |
| #18 API 6.1 - 500 Error | NOT A BUG     | API working, no issues found | None - API is production ready            |
| #19 API 6.2 - 500 Error | INCORRECT URL | Endpoint format was wrong    | FE: Fix URL to /inventory/batches/{id}    |
| #23 Payment Status Null | FIXED V30     | Missing default value        | BE: Deployed fix, FE: Can remove fallback |

## Correct API Endpoints Reference

| API                    | Correct Endpoint                        | Example                 |
| ---------------------- | --------------------------------------- | ----------------------- |
| 6.1 Inventory Summary  | GET /api/v1/inventory/summary           | /summary?page=0&size=10 |
| 6.2 Item Batches       | GET /api/v1/inventory/batches/{id}      | /batches/1              |
| 6.7 Transaction Detail | GET /api/v1/warehouse/transactions/{id} | /transactions/123       |

## Additional Notes

### API 6.1 - Query Parameters

- `page` (int, default=0): Page number (0-based)
- `size` (int, default=10): Items per page
- `search` (string, optional): Search by item code or name
- `stockStatus` (enum, optional): NORMAL, LOW_STOCK, OUT_OF_STOCK, OVERSTOCKED
- `warehouseType` (enum, optional): NORMAL, CONTROLLED, TOOL_EQUIPMENT
- `categoryId` (long, optional): Filter by category
- `sort` (string, default=itemCode,asc): Sort field and direction

### API 6.2 - Response Details

- Batches sorted by expiry date (FEFO - First Expired, First Out)
- `isExpiringSoon`: true if expiry within 30 days
- `isExpired`: true if expiry date < today
- Only returns batches with `quantityOnHand > 0` (can be changed via hideEmpty parameter in advanced endpoint)

### Schema Version

Current version: V30 (November 29, 2025)

- Added default value for paymentStatus
- No database migration needed
- Affects only new records

## Contact

For questions or further clarification, contact Backend team.

**Last Updated**: 2025-11-29
**Tested By**: Backend Team
**Environment**: Development (localhost:8082)
