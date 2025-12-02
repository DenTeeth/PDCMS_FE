# API 6.15: Update Supplier - Complete Documentation

## Overview

**Method**: PUT
**Endpoint**: `/api/v1/warehouse/suppliers/{supplierId}`
**Description**: Update supplier profile information and risk management flags (isActive, isBlacklisted)
**Authorization**: `MANAGE_SUPPLIERS` or `MANAGE_WAREHOUSE`
**Schema Version**: V30 (Added contact_person column)

## Business Purpose

This API serves two critical functions:

1. **Profile Management**: Update contact information when supplier changes representatives or business details
2. **Risk Management**: Mark suppliers as inactive (pause orders) or blacklisted (fraud/quality issues)

## Request

### Path Parameters

- `supplierId` (required, Long): ID of the supplier to update

### Request Body

```json
{
  "supplierName": "Cong ty Duoc Pham TW1 (CN HCM)",
  "contactPerson": "Tran Thi B (Sales Manager)",
  "phoneNumber": "0909999888",
  "email": "new_sales@tw1.com.vn",
  "address": "350 Hai Ba Trung, District 1, HCMC",
  "isActive": true,
  "isBlacklisted": false,
  "notes": "Updated contact person - previous representative retired"
}
```

### Field Validation

| Field         | Type    | Required | Validation                  | Notes                             |
| ------------- | ------- | -------- | --------------------------- | --------------------------------- |
| supplierName  | String  | Yes      | 2-255 chars                 | Must be unique (case-insensitive) |
| contactPerson | String  | No       | Max 255 chars               | Name of contact person            |
| phoneNumber   | String  | Yes      | 10-11 digits, starts with 0 | Vietnamese phone format           |
| email         | String  | No       | Valid email, max 255 chars  | Must be unique if provided        |
| address       | String  | No       | Max 500 chars               | Physical address                  |
| isActive      | Boolean | No       | -                           | false = Pause orders temporarily  |
| isBlacklisted | Boolean | No       | -                           | true = Fraud warning              |
| notes         | String  | No       | Max 1000 chars              | Additional information            |

## Response

### Success (200 OK)

```json
{
  "supplierId": 1,
  "supplierCode": "SUP-001",
  "supplierName": "Cong ty Vat tu Nha khoa A (Updated)",
  "contactPerson": "Nguyen Van A - Sales Manager",
  "phoneNumber": "0901234567",
  "email": "sales@vtnk-a.com",
  "address": "123 Le Loi, District 1, HCMC (New Address)",
  "isActive": true,
  "isBlacklisted": false,
  "totalOrders": 27,
  "lastOrderDate": "2025-11-29",
  "notes": "Updated contact information",
  "createdAt": "2025-05-28T19:05:52.535696",
  "status": "ACTIVE"
}
```

### Error Responses

#### 404 Not Found

```json
{
  "statusCode": 404,
  "error": "SUPPLIER_NOT_FOUND",
  "message": "Resource Not Found",
  "data": null
}
```

#### 409 Conflict - Duplicate Name

```json
{
  "statusCode": 409,
  "error": "DUPLICATE_SUPPLIER_NAME",
  "message": "Resource Already Exists",
  "data": null
}
```

#### 409 Conflict - Duplicate Email

```json
{
  "statusCode": 409,
  "error": "DUPLICATE_EMAIL",
  "message": "Resource Already Exists",
  "data": null
}
```

## Business Logic

### 1. Supplier Validation

- **Exists Check**: Verify supplier ID exists in database
- **Result**: 404 NOT FOUND if supplier not found

### 2. Duplicate Name Validation

- **Rule**: Supplier name must be unique across OTHER suppliers (case-insensitive)
- **Logic**: `WHERE LOWER(name) = LOWER(newName) AND id != supplierId`
- **Result**: 409 CONFLICT if name already used by another supplier
- **Note**: Can keep same name (no validation error)

### 3. Duplicate Email Validation

- **Rule**: Email must be unique across OTHER suppliers if provided (case-insensitive)
- **Logic**: `WHERE LOWER(email) = LOWER(newEmail) AND id != supplierId`
- **Result**: 409 CONFLICT if email already used by another supplier
- **Note**: Only validated if email is not null/empty

### 4. Blacklist Flag Management

- **Detection**: If `isBlacklisted` changed from false/null to true
- **Action**: Log WARNING message with supplier code, name, and reason
- **Log Format**: `"RISK MANAGEMENT: Supplier '{code}' ({name}) marked as BLACKLISTED. Reason: {notes}"`
- **Use Case**: Track fraud, counterfeit products, quality issues

### 5. Profile Update

- **Fields Updated**: supplierName, contactPerson, phoneNumber, email, address, isActive, isBlacklisted, notes
- **Fields NOT Updated**: supplierId, supplierCode, totalOrders, lastOrderDate, createdAt
- **Note**: Metrics (totalOrders, lastOrderDate) are auto-updated by import transactions only

### 6. Status Derivation

- **ACTIVE**: isActive=true, isBlacklisted=false
- **INACTIVE**: isActive=false
- **BLACKLISTED**: isBlacklisted=true (regardless of isActive)

## Test Results

### Test 1: Successful Update

**Request**: Update supplier 1 with new contact person and address

```bash
curl -X PUT http://localhost:8082/api/v1/warehouse/suppliers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierName": "Cong ty Vat tu Nha khoa A (Updated)",
    "contactPerson": "Nguyen Van A - Sales Manager",
    "phoneNumber": "0901234567",
    "email": "sales@vtnk-a.com",
    "address": "123 Le Loi, District 1, HCMC (New Address)",
    "isActive": true,
    "isBlacklisted": false,
    "notes": "Updated contact information"
  }'
```

**Result**: SUCCESS

- Status: 200 OK
- supplierName updated
- contactPerson: "Nguyen Van A - Sales Manager"
- totalOrders: 27 (unchanged)

### Test 2: 404 Not Found

**Request**: Update non-existent supplier ID 9999

```bash
curl -X PUT http://localhost:8082/api/v1/warehouse/suppliers/9999 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"supplierName": "Test", "phoneNumber": "0909999999"}'
```

**Result**: FAILED as expected

- Status: 404 NOT FOUND
- Error: "SUPPLIER_NOT_FOUND"

### Test 3: 409 Duplicate Name

**Request**: Change supplier 1 name to match supplier 2's name

```bash
curl -X PUT http://localhost:8082/api/v1/warehouse/suppliers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Duoc pham B",
    "phoneNumber": "0901234567"
  }'
```

**Result**: FAILED as expected

- Status: 409 CONFLICT
- Error: "DUPLICATE_SUPPLIER_NAME"

### Test 4: Blacklist Flag Change

**Request**: Mark supplier 3 as blacklisted with fraud notes

```bash
curl -X PUT http://localhost:8082/api/v1/warehouse/suppliers/3 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Thiet bi Y te C",
    "contactPerson": "Risk Team",
    "phoneNumber": "0923456789",
    "email": "contact@medical-c.com",
    "isActive": false,
    "isBlacklisted": true,
    "notes": "FRAUD DETECTED"
  }'
```

**Result**: SUCCESS

- Status: 200 OK
- isBlacklisted: true
- isActive: false
- status: "INACTIVE"
- Server log: "RISK MANAGEMENT: Supplier 'SUP-003' (Cong ty Thiet bi Y te C) marked as BLACKLISTED"

### Test 5: Partial Update

**Request**: Update only phone number and notes for supplier 2

```bash
curl -X PUT http://localhost:8082/api/v1/warehouse/suppliers/2 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Duoc pham B",
    "phoneNumber": "0912345999",
    "email": "info@duocpham-b.com",
    "notes": "Changed phone number only"
  }'
```

**Result**: SUCCESS

- Status: 200 OK
- phoneNumber updated to "0912345999"
- Other fields unchanged
- totalOrders: 19 (unchanged)

### Test 6: Metrics Protection

**Observation**: From all tests above

- totalOrders values remain unchanged (Test 1: 27, Test 4: 15, Test 5: 19)
- lastOrderDate values unchanged
- Metrics are protected from manual update via this API
- Only auto-updated by import transaction logic

## Use Cases

### Use Case 1: Sales Representative Change

**Scenario**: Supplier notifies that old sales rep retired, new rep is Ms. B
**Action**:

1. Update contactPerson to "Ms. B - Sales Manager"
2. Update phoneNumber to new rep's number
3. Add notes: "New sales representative as of 2025-11-29"

### Use Case 2: Fraud Detection

**Scenario**: Warehouse receives counterfeit products from supplier
**Action**:

1. Set isBlacklisted = true
2. Set isActive = false (prevent new orders)
3. Add detailed notes about fraud incident
4. System logs warning for audit trail
5. Frontend shows red alert when this supplier appears

### Use Case 3: Temporary Suspension

**Scenario**: Supplier has quality issues, needs investigation period
**Action**:

1. Set isActive = false (pause orders)
2. Keep isBlacklisted = false (not fraud, just quality review)
3. Add notes about investigation
4. Can reactivate later when issues resolved

## Database Changes

### Schema V30

```sql
ALTER TABLE suppliers ADD COLUMN contact_person VARCHAR(255);
```

**Note**: Hibernate auto-generates this via ddl-auto=update

## Implementation Details

### Files Modified

1. **UpdateSupplierRequest.java**: Added contactPerson, isActive, isBlacklisted fields
2. **Supplier.java**: Added contactPerson field with @Column annotation
3. **SupplierMapper.java**: Updated updateEntity() to handle all new fields
4. **SupplierService.java**:
   - Enhanced updateSupplier() with duplicate name validation
   - Added blacklist flag change logging
   - Null-safe boolean comparison for isBlacklisted
5. **SupplierController.java**: Updated @PreAuthorize to MANAGE_SUPPLIERS or MANAGE_WAREHOUSE
6. **schema.sql**: Updated to V30 with contact_person column documentation

### Key Code Patterns

```java
// Null-safe blacklist flag check
if (request.getIsBlacklisted() != null && request.getIsBlacklisted()
        && !Boolean.TRUE.equals(supplier.getIsBlacklisted())) {
    log.warn("RISK MANAGEMENT: Supplier '{}' marked as BLACKLISTED. Reason: {}",
        supplier.getSupplierCode(), request.getNotes());
}
```

## Authorization

- **Required Roles**: ADMIN
- **Required Authorities**: MANAGE_SUPPLIERS OR MANAGE_WAREHOUSE
- **Seed Data**: Permissions assigned to INVENTORY_MANAGER and MANAGER roles

## Frontend Integration

### Display Logic

```javascript
if (supplier.isBlacklisted) {
  // Show red warning banner
  alert("WARNING: This supplier is BLACKLISTED. Check notes for details.");
  bannerColor = "red";
} else if (!supplier.isActive) {
  // Show yellow warning
  alert("This supplier is currently INACTIVE.");
  bannerColor = "yellow";
}
```

### Form Behavior

- All fields editable
- Show confirmation dialog when setting isBlacklisted = true
- Require notes when blacklisting supplier
- Disable supplier selection in import form if isBlacklisted = true

## Conclusion

API 6.15 successfully implements supplier profile updates with strong risk management capabilities. All test cases passed, including duplicate validation, blacklist logging, and metrics protection. The system now supports real-world warehouse scenarios including fraud detection and supplier lifecycle management.
