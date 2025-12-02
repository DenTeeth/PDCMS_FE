# API 6.16: Soft Delete Supplier - Complete Implementation Guide

**Version**: V30
**Author**: Backend Team
**Date**: November 29, 2025
**Status**: IMPLEMENTED

---

## Overview

API 6.16 implements **soft delete** functionality for suppliers with comprehensive transaction validation. The API sets `isActive=false` instead of permanently deleting records, maintaining data integrity and audit trails.

**Key Features**:
- Soft delete (preserves historical data)
- Transaction history validation
- Proper authorization checks
- English error messages with error codes
- Business rule enforcement

---

## Business Rules

### BR-1: Soft Delete Only
- Suppliers are NEVER permanently deleted from database
- DELETE operation sets `isActive=false` and `status="INACTIVE"`
- All historical data (transactions, items, metadata) preserved
- Inactive suppliers cannot be used in new transactions

### BR-2: Transaction History Protection
- **Cannot delete suppliers with transaction history**
- System checks `storage_transaction` table for any records linked to supplier
- If transactions exist → returns `409 Conflict` with error code `SUPPLIER_HAS_TRANSACTIONS`
- Protects referential integrity and audit trails

### BR-3: Authorization Requirements
- User must have **ADMIN** role OR
- User must have **MANAGE_SUPPLIERS** permission OR
- User must have **MANAGE_WAREHOUSE** permission
- Unauthorized access returns `403 Forbidden`

### BR-4: Validation Flow
```
1. Check supplier exists → 404 Not Found if missing
2. Check transaction history → 409 Conflict if has transactions
3. Set isActive=false → 204 No Content on success
```

---

## API Specification

### Endpoint
```
DELETE /api/v1/warehouse/suppliers/{id}
```

### Authorization
```java
@PreAuthorize("hasRole('ADMIN') or hasAnyAuthority('MANAGE_SUPPLIERS', 'MANAGE_WAREHOUSE')")
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | Long | Yes | Supplier ID (Primary Key) |

### Request Headers
| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | No |

### Success Response
**HTTP Status**: `204 No Content`

**Response Body**: None

**Database Changes**:
- `supplier.is_active` changed from `true` to `false`
- `supplier.status` changed from `ACTIVE` to `INACTIVE`
- `supplier.updated_at` timestamp updated

---

## Error Responses

### 404 Not Found - Supplier Does Not Exist
**Condition**: Supplier ID not found in database

**Response**:
```json
{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "Supplier not found with id: 9999",
  "path": "/api/v1/warehouse/suppliers/9999"
}
```

**Exception Type**: `SupplierNotFoundException`

---

### 409 Conflict - Supplier Has Transactions
**Condition**: Supplier has transaction history in `storage_transaction` table

**Response**:
```json
{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 409,
  "error": "Conflict",
  "errorCode": "SUPPLIER_HAS_TRANSACTIONS",
  "message": "Cannot delete supplier 'Medical Supplies Inc.' because it has transaction history. You can only set it to INACTIVE status.",
  "path": "/api/v1/warehouse/suppliers/1"
}
```

**Exception Type**: `BusinessException`

**Workaround**: Instead of deleting, use **API 6.15 Update Supplier** to set `isActive=false`:
```bash
curl -X PUT http://localhost:8080/api/v1/warehouse/suppliers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

---

### 403 Forbidden - Insufficient Permissions
**Condition**: User lacks required permissions

**Response**:
```json
{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/warehouse/suppliers/1"
}
```

**Solution**: User needs **ADMIN** role or **MANAGE_SUPPLIERS**/**MANAGE_WAREHOUSE** permission

---

## Test Scenarios

### Scenario 1: Successful Soft Delete (Supplier with No Transactions)

**Precondition**: Create new supplier with no transaction history

**Request**:
```bash
curl -X DELETE http://localhost:8080/api/v1/warehouse/suppliers/10 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```
HTTP/1.1 204 No Content
Date: Fri, 29 Nov 2025 18:45:00 GMT
```

**Verification**:
```bash
# Check supplier is marked inactive
curl -X GET http://localhost:8080/api/v1/warehouse/suppliers/10 \
  -H "Authorization: Bearer $TOKEN"

# Expected:
{
  "id": 10,
  "supplierCode": "SUP-010",
  "supplierName": "Test Supplier",
  "isActive": false,
  "status": "INACTIVE",
  ...
}
```

---

### Scenario 2: 404 Not Found (Non-Existent Supplier)

**Request**:
```bash
curl -X DELETE http://localhost:8080/api/v1/warehouse/suppliers/9999 \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

**Expected Response**:
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "Supplier not found with id: 9999",
  "path": "/api/v1/warehouse/suppliers/9999"
}
```

---

### Scenario 3: 409 Conflict (Supplier Has Transactions)

**Precondition**: Use existing supplier with transaction history (e.g., SUP-001)

**Request**:
```bash
curl -X DELETE http://localhost:8080/api/v1/warehouse/suppliers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

**Expected Response**:
```
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 409,
  "error": "Conflict",
  "errorCode": "SUPPLIER_HAS_TRANSACTIONS",
  "message": "Cannot delete supplier 'Medical Supplies Inc.' because it has transaction history. You can only set it to INACTIVE status.",
  "path": "/api/v1/warehouse/suppliers/1"
}
```

**Workaround**: Use Update API to set `isActive=false`

---

### Scenario 4: Verify Already Inactive Supplier

**Precondition**: Supplier already soft deleted (isActive=false)

**Request**:
```bash
# Try to delete again
curl -X DELETE http://localhost:8080/api/v1/warehouse/suppliers/10 \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

**Expected Response**:
```
HTTP/1.1 204 No Content
```

**Note**: System allows re-deletion of inactive suppliers (idempotent operation)

---

### Scenario 5: 403 Forbidden (Insufficient Permissions)

**Precondition**: Login with user having no MANAGE_SUPPLIERS or MANAGE_WAREHOUSE permission

**Request**:
```bash
# Login as receptionist (no warehouse permissions)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "receptionist",
    "password": "password123"
  }'

# Try to delete supplier
curl -X DELETE http://localhost:8080/api/v1/warehouse/suppliers/10 \
  -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
  -v
```

**Expected Response**:
```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "timestamp": "2025-11-29T18:45:00.123Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/warehouse/suppliers/10"
}
```

---

## Implementation Details

### Service Layer (`SupplierService.java`)

```java
public void deleteSupplier(Long id) {
    log.info("API 6.16: Processing soft delete for supplier ID: {}", id);

    // 1. Validate supplier exists (404 if not found)
    Supplier supplier = supplierRepository.findById(id)
        .orElseThrow(() -> new SupplierNotFoundException(id));

    log.info("API 6.16: Found supplier to delete - Code: {}, Name: {}",
             supplier.getSupplierCode(), supplier.getSupplierName());

    // 2. Business Rule: Cannot delete if has transactions (409 if exists)
    if (storageTransactionRepository.existsBySupplier(id)) {
        log.warn("API 6.16: Cannot delete supplier {} - has transaction history",
                 supplier.getSupplierCode());
        throw new BusinessException(
            "SUPPLIER_HAS_TRANSACTIONS",
            "Cannot delete supplier '" + supplier.getSupplierName() +
            "' because it has transaction history. You can only set it to INACTIVE status.");
    }

    // 3. Soft Delete: Set isActive=false
    supplier.setIsActive(false);
    supplierRepository.save(supplier);

    log.info("API 6.16: Successfully soft deleted supplier {} (ID: {})",
             supplier.getSupplierCode(), id);
}
```

### Controller Layer (`SupplierController.java`)

```java
/**
 * API 6.16: Soft Delete Supplier (sets isActive=false)
 * Cannot delete if supplier has transaction history
 */
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or hasAnyAuthority('MANAGE_SUPPLIERS', 'MANAGE_WAREHOUSE')")
@Operation(summary = "Delete a supplier (soft delete)",
           description = "Soft delete a supplier by setting isActive=false. Cannot delete if supplier has transaction history.")
@ApiResponses(value = {
    @ApiResponse(responseCode = "204", description = "Supplier successfully deleted"),
    @ApiResponse(responseCode = "404", description = "Supplier not found"),
    @ApiResponse(responseCode = "409", description = "Cannot delete - supplier has transaction history")
})
public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
    log.info("API 6.16: DELETE /api/v1/warehouse/suppliers/{} - Soft delete supplier", id);
    supplierService.deleteSupplier(id);
    return ResponseEntity.noContent().build();
}
```

### Repository Method (`StorageTransactionRepository.java`)

```java
/**
 * Check if supplier has any transaction history
 * Used in API 6.16 to prevent deletion of suppliers with transactions
 */
@Query("SELECT COUNT(st) > 0 FROM StorageTransaction st WHERE st.supplier.id = :supplierId")
boolean existsBySupplier(@Param("supplierId") Long supplierId);
```

---

## Database Impact

### Tables Modified
- **supplier** table:
  - `is_active` column changed to `false`
  - `status` column changed to `INACTIVE`
  - `updated_at` timestamp updated

### Tables Queried
- **supplier** table (existence check)
- **storage_transaction** table (transaction history check)

### No Cascading Deletes
- All related records preserved (items, transactions, metadata)
- Referential integrity maintained
- Historical data fully accessible for audits

---

## Best Practices

### When to Use API 6.16 (Soft Delete)
- Supplier no longer active but has NO transaction history
- Testing/development suppliers with no real data
- Duplicate suppliers created by mistake (no transactions yet)

### When to Use API 6.15 (Update isActive)
- Supplier has transaction history (API 6.16 will fail)
- Need to temporarily deactivate supplier
- Blacklisting high-risk suppliers
- Marking suppliers as inactive during dispute resolution

### Recommended Workflow
```
1. Check if supplier has transactions:
   GET /api/v1/warehouse/suppliers/{id}

2. If transactions exist (transactionCount > 0):
   → Use API 6.15 to set isActive=false

3. If no transactions (transactionCount = 0):
   → Use API 6.16 to soft delete
```

---

## Frontend Integration Notes

### Success Handling
```javascript
async function deleteSuppli(supplierId) {
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/warehouse/suppliers/${supplierId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    );

    if (response.status === 204) {
      showNotification('Supplier successfully deleted', 'success');
      refreshSupplierList();
    }
  } catch (error) {
    handleError(error);
  }
}
```

### Error Handling
```javascript
async function handleSupplierDelete(supplierId) {
  try {
    const response = await fetch(
      `http://localhost:8080/api/v1/warehouse/suppliers/${supplierId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    );

    if (response.status === 204) {
      showNotification('Supplier deleted successfully', 'success');
      refreshSupplierList();
    } else if (response.status === 409) {
      const error = await response.json();
      if (error.errorCode === 'SUPPLIER_HAS_TRANSACTIONS') {
        showConfirmDialog(
          'Cannot Delete',
          'This supplier has transaction history and cannot be deleted. Would you like to mark it as INACTIVE instead?',
          () => updateSupplierStatus(supplierId, false)
        );
      }
    } else if (response.status === 404) {
      showNotification('Supplier not found', 'error');
    }
  } catch (error) {
    showNotification('Error deleting supplier: ' + error.message, 'error');
  }
}
```

---

## Testing Data

### Seed Data Suppliers
| ID | Code | Name | Has Transactions | Can Delete |
|----|------|------|------------------|------------|
| 1 | SUP-001 | Medical Supplies Inc. | 27 transactions | NO (409) |
| 2 | SUP-002 | Dental Equipment Co. | 19 transactions | NO (409) |
| 3 | SUP-003 | Lab Materials Ltd. | 15 transactions | NO (409) |
| 10-13 | SUP-010 to SUP-013 | Test Suppliers (API 6.14) | 0 transactions | YES (204) |

### Test Sequence
1. **Test 404**: `DELETE /api/v1/warehouse/suppliers/9999`
2. **Test 409**: `DELETE /api/v1/warehouse/suppliers/1` (SUP-001 has transactions)
3. **Test 204**: `DELETE /api/v1/warehouse/suppliers/10` (SUP-010 has no transactions)
4. **Verify Soft Delete**: `GET /api/v1/warehouse/suppliers/10` (check isActive=false)
5. **Test Idempotent**: `DELETE /api/v1/warehouse/suppliers/10` again (should still return 204)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| V30 | Nov 29, 2025 | Initial implementation of API 6.16 |

---

## Related APIs

- **API 6.13**: Get Supplier by ID
- **API 6.14**: Create Supplier
- **API 6.15**: Update Supplier (Alternative to deletion when transactions exist)
- **API 6.17**: List Suppliers (filtered by isActive status)

---

## Troubleshooting

### Problem: 409 Conflict when deleting supplier
**Solution**: Use API 6.15 to set `isActive=false` instead

### Problem: Soft deleted supplier still appears in list
**Solution**: Check frontend filters - inactive suppliers may still be included. Filter by `isActive=true`

### Problem: Cannot restore deleted supplier
**Solution**: Use API 6.15 to set `isActive=true` again

---

**End of API 6.16 Complete Implementation Guide**
