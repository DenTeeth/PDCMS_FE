# API 6.14: Create New Supplier (Complete Guide)

## Overview

**Endpoint**: `POST /api/v1/warehouse/suppliers`
**Method**: POST
**Authorization**: Requires `MANAGE_SUPPLIERS` or `MANAGE_WAREHOUSE` permission
**Version**: V28
**Status**: PRODUCTION READY

## Description

Create a new supplier record for procurement management. Automatically generates supplier code (SUP-XXX format) and validates uniqueness constraints.

## Business Context

- **Purpose**: Add new vendors/suppliers to the system for import transactions
- **Auto-generation**: Supplier code is auto-generated in SUP-001, SUP-002, ... format
- **Validation**: Ensures no duplicate supplier names or email addresses (case-insensitive)
- **Defaults**: Sets isActive=true, totalOrders=0, lastOrderDate=null automatically

## Request

### Headers

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Request Body

```json
{
  "supplierName": "Cong ty Duoc Pham TW1",
  "phone": "0909123456",
  "email": "sales@tw1.com.vn",
  "address": "350 Hai Ba Trung, Quan 1, TP.HCM",
  "isBlacklisted": false,
  "notes": "Chuyen cung cap thuoc gay te va khang sinh"
}
```

### Field Specifications

| Field           | Type    | Required | Constraints                            | Description                           |
| --------------- | ------- | -------- | -------------------------------------- | ------------------------------------- |
| `supplierName`  | String  | Yes      | 2-255 chars, unique (case-insensitive) | Supplier company name                 |
| `phone`         | String  | Yes      | 10-11 digits, numeric only             | Contact phone number                  |
| `email`         | String  | No       | Valid email format, unique if provided | Contact email                         |
| `address`       | String  | No       | Max 500 characters                     | Supplier address                      |
| `isBlacklisted` | Boolean | No       | Default: false                         | Blacklist flag (fraud/quality issues) |
| `notes`         | String  | No       | Max 1000 characters                    | Additional notes                      |

### Validation Rules

1. **Supplier Name Uniqueness** (Case-Insensitive)

   - "Duoc Pham A" and "duoc pham a" are considered duplicates
   - Returns 409 CONFLICT if duplicate found

2. **Email Uniqueness** (Case-Insensitive)

   - Only validated if email is provided
   - "Sales@ABC.com" and "sales@abc.com" are considered duplicates
   - Returns 409 CONFLICT if duplicate found

3. **Phone Format**

   - Must be 10-11 digits
   - Only numeric characters allowed (0-9)
   - No spaces, dashes, or special characters

4. **Email Format**
   - Must be valid email format (name@domain.com)
   - Optional field

## Response

### Success Response (201 Created)

```json
{
  "statusCode": 201,
  "message": "Supplier created successfully",
  "data": {
    "supplierId": 6,
    "supplierCode": "SUP-006",
    "supplierName": "Cong ty Duoc Pham TW1",
    "phoneNumber": "0909123456",
    "email": "sales@tw1.com.vn",
    "address": "350 Hai Ba Trung, Quan 1, TP.HCM",
    "isActive": true,
    "isBlacklisted": false,
    "totalOrders": 0,
    "lastOrderDate": null,
    "notes": "Chuyen cung cap thuoc gay te va khang sinh",
    "createdAt": "2025-11-29T10:30:00",
    "status": "ACTIVE"
  }
}
```

### Response Field Descriptions

| Field           | Type      | Description                                              |
| --------------- | --------- | -------------------------------------------------------- |
| `supplierId`    | Long      | Database ID (auto-generated)                             |
| `supplierCode`  | String    | Unique code (SUP-001, SUP-002, ...) auto-generated       |
| `supplierName`  | String    | Supplier company name                                    |
| `phoneNumber`   | String    | Contact phone                                            |
| `email`         | String    | Contact email                                            |
| `address`       | String    | Supplier address                                         |
| `isActive`      | Boolean   | Always true for new suppliers                            |
| `isBlacklisted` | Boolean   | Blacklist status (default: false)                        |
| `totalOrders`   | Integer   | Number of import transactions (starts at 0)              |
| `lastOrderDate` | LocalDate | Date of last import transaction (null for new suppliers) |
| `notes`         | String    | Additional notes                                         |
| `createdAt`     | DateTime  | Timestamp of creation                                    |
| `status`        | String    | Computed field: "ACTIVE" or "INACTIVE"                   |

## Error Responses

### 400 Bad Request - Invalid Input

```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    "Supplier name is required",
    "Phone number must be 10-11 digits",
    "Email format is invalid"
  ]
}
```

**Common Causes**:

- Missing required fields (supplierName, phone)
- Invalid phone format (contains letters/special chars)
- Invalid email format
- Field length violations

### 409 Conflict - Duplicate Supplier Name

```json
{
  "statusCode": 409,
  "error": "DUPLICATE_SUPPLIER_NAME",
  "message": "Supplier 'Cong ty Duoc Pham TW1' already exists"
}
```

**Cause**: Supplier name already exists in database (case-insensitive match)

### 409 Conflict - Duplicate Email

```json
{
  "statusCode": 409,
  "error": "DUPLICATE_EMAIL",
  "message": "Email 'sales@tw1.com.vn' is already in use by another supplier"
}
```

**Cause**: Email address already registered to another supplier (case-insensitive match)

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Access token is missing or invalid"
}
```

**Cause**: Missing or invalid JWT token

### 403 Forbidden

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "You do not have permission to create suppliers"
}
```

**Cause**: User lacks `MANAGE_SUPPLIERS` or `MANAGE_WAREHOUSE` permission

## Testing Guide

### Prerequisites

1. Server running on port 8082
2. Valid admin credentials (username: admin, password: 123456)
3. Existing suppliers in database (SUP-001 to SUP-005 from seed data)

### Test Scenarios

#### Test 1: Successful Creation

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8082/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Create new supplier
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Duoc Pham TW1",
    "phone": "0909123456",
    "email": "sales@tw1.com.vn",
    "address": "350 Hai Ba Trung, Quan 1, TP.HCM",
    "isBlacklisted": false,
    "notes": "Test supplier for API 6.14"
  }'
```

**Expected Result**:

- Status: 201 Created
- Response contains supplierCode: "SUP-006" (next available)
- isActive: true
- totalOrders: 0
- lastOrderDate: null

#### Test 2: Duplicate Supplier Name (409 Conflict)

```bash
# Try to create supplier with existing name
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Vat tu Nha khoa A",
    "phone": "0901111111",
    "email": "new@test.com"
  }'
```

**Expected Result**:

- Status: 409 Conflict
- Error: "DUPLICATE_SUPPLIER_NAME"
- Message: "Supplier 'Cong ty Vat tu Nha khoa A' already exists"

#### Test 3: Duplicate Email (409 Conflict)

```bash
# Try to create supplier with existing email
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Moi",
    "phone": "0902222222",
    "email": "contact@vattu-a.com.vn"
  }'
```

**Expected Result**:

- Status: 409 Conflict
- Error: "DUPLICATE_EMAIL"
- Message: "Email 'contact@vattu-a.com.vn' is already in use by another supplier"

#### Test 4: Invalid Phone Format (400 Bad Request)

```bash
# Try with invalid phone (letters)
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Test",
    "phone": "090-123-4567",
    "email": "test@test.com"
  }'
```

**Expected Result**:

- Status: 400 Bad Request
- Error: "VALIDATION_ERROR"
- Message contains: "Phone number must contain only digits (10-11 characters)"

#### Test 5: Invalid Email Format (400 Bad Request)

```bash
# Try with invalid email
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Test 2",
    "phone": "0903333333",
    "email": "invalid-email"
  }'
```

**Expected Result**:

- Status: 400 Bad Request
- Error: "VALIDATION_ERROR"
- Message contains: "Email format is invalid"

#### Test 6: Missing Required Fields (400 Bad Request)

```bash
# Try without supplierName
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone": "0904444444",
    "email": "test@test.com"
  }'
```

**Expected Result**:

- Status: 400 Bad Request
- Error: "VALIDATION_ERROR"
- Message contains: "Supplier name is required"

#### Test 7: Minimal Valid Request (Only Required Fields)

```bash
# Create with only required fields
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Minimal Test",
    "phone": "0905555555"
  }'
```

**Expected Result**:

- Status: 201 Created
- email: null
- address: null
- notes: null
- Other fields have default values

#### Test 8: Verify Auto-Generated Supplier Code

```bash
# Create supplier and check code generation
curl -X POST http://localhost:8082/api/v1/warehouse/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "supplierName": "Cong ty Code Test",
    "phone": "0906666666"
  }' | grep -o '"supplierCode":"[^"]*"'
```

**Expected Result**:

- supplierCode follows pattern: "SUP-XXX" where XXX is zero-padded number
- Code should be SUP-007 (or next available after Test 1)

## Integration with Other APIs

### Related APIs

- **API 6.13**: GET /api/v1/warehouse/suppliers/list - List suppliers with filters
- **API 6.15** (Future): PUT /api/v1/warehouse/suppliers/{id} - Update supplier
- **API 6.4**: POST /api/v1/warehouse/transactions/import - Import transaction (uses supplierId)

### Workflow Example

```
1. Create Supplier (API 6.14)
   -> Returns supplierId: 6, supplierCode: "SUP-006"

2. Create Import Transaction (API 6.4)
   -> Use supplierId: 6 in request body
   -> Supplier metrics auto-updated (totalOrders++, lastOrderDate=today)

3. List Suppliers (API 6.13)
   -> See supplier with totalOrders: 1, lastOrderDate: 2025-11-29
```

## Business Rules

1. **Supplier Code Generation**

   - Format: SUP-XXX (e.g., SUP-001, SUP-002, ...)
   - Auto-generated based on MAX(supplier_id) + 1
   - Cannot be manually specified
   - Guaranteed unique

2. **Name Uniqueness**

   - Case-insensitive comparison
   - "ABC Company" = "abc company" = "ABC COMPANY"
   - Prevents duplicate suppliers with slight name variations

3. **Email Uniqueness**

   - Only enforced if email is provided
   - Case-insensitive comparison
   - Prevents multiple suppliers sharing same contact email

4. **Default Values**

   - isActive: true (new suppliers are active by default)
   - totalOrders: 0 (no orders yet)
   - lastOrderDate: null (no orders yet)
   - isBlacklisted: false (if not specified)

5. **Metrics Auto-Update**
   - totalOrders and lastOrderDate are updated automatically when import transactions are created
   - No manual update needed

## Performance Considerations

- Average response time: <100ms
- Database queries: 2-3 (uniqueness checks + insert)
- No pagination needed (single record creation)

## Security Notes

- Requires authentication (JWT token)
- Requires authorization (MANAGE_SUPPLIERS or MANAGE_WAREHOUSE)
- Input validation prevents SQL injection
- Email format validation prevents XSS

## Common Issues & Solutions

### Issue 1: "Supplier already exists" but can't find it

**Cause**: Case-insensitive matching
**Solution**: Check with different case variations (lowercase, uppercase, titlecase)

### Issue 2: Phone validation fails with valid number

**Cause**: Phone contains spaces, dashes, or parentheses
**Solution**: Remove all non-digit characters (use only 0-9)

### Issue 3: Can't create supplier - 403 Forbidden

**Cause**: Missing required permission
**Solution**: Ensure user has MANAGE_SUPPLIERS or MANAGE_WAREHOUSE permission

### Issue 4: Supplier code skips numbers (e.g., SUP-003 -> SUP-005)

**Cause**: Deleted suppliers leave gaps
**Solution**: This is expected behavior - codes are based on database IDs, not sequential

## Change Log

### V28 (2025-11-29) - API 6.14 Implementation

- Initial implementation of Create Supplier API
- Auto-generate supplier code (SUP-XXX format)
- Validate name uniqueness (case-insensitive)
- Validate email uniqueness (case-insensitive)
- Set default values for new suppliers
- Added MANAGE_SUPPLIERS and MANAGE_WAREHOUSE permissions
- Assigned permissions to INVENTORY_MANAGER and MANAGER roles

## Support Information

- API Version: V28
- Last Updated: 2025-11-29
- Maintained By: Backend Team
- Related Documentation: API 6.13 (Get Suppliers)
