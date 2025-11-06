# API Testing Guide - Time Off Type Management (BE-306)

## Overview

This guide provides comprehensive testing instructions for the Time Off Type Management API, including CRUD operations, RBAC permissions, and validation scenarios.

---

## Base URL

```
http://localhost:8080/api/v1/time-off-types
```

---

## Authentication

All requests require JWT Bearer Token:

```
Authorization: Bearer <your_jwt_token>
```

---

## RBAC Permissions

| Permission             | Description                  |
| ---------------------- | ---------------------------- |
| `VIEW_TIME_OFF_TYPE`   | Xem danh sách loại nghỉ phép |
| `CREATE_TIME_OFF_TYPE` | Tạo loại nghỉ phép mới       |
| `UPDATE_TIME_OFF_TYPE` | Cập nhật loại nghỉ phép      |
| `DELETE_TIME_OFF_TYPE` | Xóa loại nghỉ phép           |

---

## Time Off Type Entity Structure

```json
{
  "typeId": "TOT001",
  "typeName": "Nghi phep nam",
  "typeCode": "ANNUAL_LEAVE",
  "description": "Nghi phep hang nam (12 ngay/nam)",
  "requiresBalance": true,
  "defaultDaysPerYear": 12.0,
  "isPaid": true,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00",
  "updatedAt": "2025-01-01T00:00:00"
}
```

---

## Test Cases

### STEP 1: View Time Off Types

#### Test Case 1.1: Get All Active Time Off Types

**Objective:** View all active time off types (public endpoint for dropdowns)

**Request:**

```bash
GET /api/v1/time-off-types?isActive=true
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "content": [
    {
      "typeId": "TOT001",
      "typeName": "Nghi phep nam",
      "typeCode": "ANNUAL_LEAVE",
      "description": "Nghi phep hang nam (12 ngay/nam)",
      "requiresBalance": true,
      "defaultDaysPerYear": 12.0,
      "isPaid": true,
      "isActive": true
    },
    {
      "typeId": "TOT002",
      "typeName": "Nghi om",
      "typeCode": "SICK_LEAVE",
      "description": "Nghi om dau benh",
      "requiresBalance": false,
      "defaultDaysPerYear": null,
      "isPaid": true,
      "isActive": true
    },
    {
      "typeId": "TOT003",
      "typeName": "Nghi hieu",
      "typeCode": "BEREAVEMENT_LEAVE",
      "description": "Nghi tang (3 ngay cho cha me/vo chong, 1 ngay cho ong ba/anh chi em)",
      "requiresBalance": false,
      "isPaid": true,
      "isActive": true
    },
    {
      "typeId": "TOT004",
      "typeName": "Nghi thai san",
      "typeCode": "MATERNITY_LEAVE",
      "description": "Nghi sinh con (6 thang)",
      "requiresBalance": false,
      "isPaid": true,
      "isActive": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 4,
  "totalPages": 1
}
```

**Validation:**

- ✅ Returns only active types (isActive=true)
- ✅ Sorted by typeName by default
- ✅ All required fields are present

---

#### Test Case 1.2: Get All Types Including Inactive

**Objective:** Admin views all types including inactive ones

**Request:**

```bash
GET /api/v1/time-off-types?page=0&size=20
Authorization: Bearer <admin_token>
```

**Expected Response:** `200 OK`

- Returns all types regardless of isActive status

---

#### Test Case 1.3: Get Time Off Type by ID

**Objective:** View detailed information of a specific type

**Request:**

```bash
GET /api/v1/time-off-types/TOT001
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "typeId": "TOT001",
  "typeName": "Nghi phep nam",
  "typeCode": "ANNUAL_LEAVE",
  "description": "Nghi phep hang nam (12 ngay/nam)",
  "requiresBalance": true,
  "defaultDaysPerYear": 12.0,
  "isPaid": true,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00",
  "updatedAt": "2025-01-01T00:00:00"
}
```

---

#### Test Case 1.4: Error - Type Not Found

**Objective:** Request non-existent type

**Request:**

```bash
GET /api/v1/time-off-types/TOT999
Authorization: Bearer <token>
```

**Expected Response:** `404 NOT FOUND`

```json
{
  "status": 404,
  "message": "Time off type not found with ID: TOT999",
  "timestamp": "2025-10-20T12:00:00"
}
```

---

### STEP 2: Create Time Off Types

#### Test Case 2.1: Successfully Create New Time Off Type

**Objective:** Admin creates a new time off type

**Prerequisites:**

- Login as user with `CREATE_TIME_OFF_TYPE` permission

**Request:**

```bash
POST /api/v1/time-off-types
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Nghi cuoi hoi",
  "typeCode": "MARRIAGE_LEAVE",
  "description": "Nghi ket hon (3 ngay)",
  "requiresBalance": false,
  "defaultDaysPerYear": null,
  "isPaid": true,
  "isActive": true
}
```

**Expected Response:** `201 CREATED`

```json
{
  "typeId": "TOT005",
  "typeName": "Nghi cuoi hoi",
  "typeCode": "MARRIAGE_LEAVE",
  "description": "Nghi ket hon (3 ngay)",
  "requiresBalance": false,
  "defaultDaysPerYear": null,
  "isPaid": true,
  "isActive": true,
  "createdAt": "2025-10-20T12:05:00",
  "updatedAt": "2025-10-20T12:05:00"
}
```

**Validation:**

- ✅ Returns 201 Created
- ✅ typeId auto-generated (TOT + sequence)
- ✅ createdAt and updatedAt automatically set
- ✅ All fields saved correctly

---

#### Test Case 2.2: Create Type with Balance Requirement

**Objective:** Create a type that requires balance tracking

**Request:**

```bash
POST /api/v1/time-off-types
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Nghi bu",
  "typeCode": "COMPENSATORY_LEAVE",
  "description": "Nghi bu cho nhung ngay lam them gio",
  "requiresBalance": true,
  "defaultDaysPerYear": 0.0,
  "isPaid": true,
  "isActive": true
}
```

**Expected Response:** `201 CREATED`

```json
{
  "typeId": "TOT006",
  "typeName": "Nghi bu",
  "typeCode": "COMPENSATORY_LEAVE",
  "requiresBalance": true,
  "defaultDaysPerYear": 0.0
}
```

**Validation:**

- ✅ requiresBalance = true
- ✅ defaultDaysPerYear can be 0 (accumulated through overtime)

---

#### Test Case 2.3: Validation Error - Missing Required Fields

**Objective:** Test validation for required fields

**Request:**

```bash
POST /api/v1/time-off-types
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "",
  "typeCode": "",
  "requiresBalance": true
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "errors": [
    {
      "field": "typeName",
      "message": "typeName is required"
    },
    {
      "field": "typeCode",
      "message": "typeCode is required"
    }
  ],
  "timestamp": "2025-10-20T12:10:00"
}
```

---

#### Test Case 2.4: Validation Error - Duplicate Type Code

**Objective:** Test uniqueness constraint on typeCode

**Request:**

```bash
POST /api/v1/time-off-types
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Annual Leave Duplicate",
  "typeCode": "ANNUAL_LEAVE",
  "requiresBalance": true,
  "isPaid": true
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "typeCode 'ANNUAL_LEAVE' already exists",
  "timestamp": "2025-10-20T12:12:00"
}
```

---

#### Test Case 2.5: Forbidden - No CREATE Permission

**Objective:** Regular employee tries to create type

**Request:**

```bash
POST /api/v1/time-off-types
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "typeName": "Test Type",
  "typeCode": "TEST",
  "requiresBalance": false,
  "isPaid": true
}
```

**Expected Response:** `403 FORBIDDEN`

```json
{
  "status": 403,
  "message": "Access Denied",
  "timestamp": "2025-10-20T12:15:00"
}
```

---

### STEP 3: Update Time Off Types

#### Test Case 3.1: Successfully Update Time Off Type

**Objective:** Admin updates existing time off type

**Prerequisites:**

- Login as user with `UPDATE_TIME_OFF_TYPE` permission

**Request:**

```bash
PUT /api/v1/time-off-types/TOT005
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Nghi cuoi hoi (cap nhat)",
  "typeCode": "MARRIAGE_LEAVE",
  "description": "Nghi ket hon (3 ngay lam viec)",
  "requiresBalance": false,
  "defaultDaysPerYear": null,
  "isPaid": true,
  "isActive": true
}
```

**Expected Response:** `200 OK`

```json
{
  "typeId": "TOT005",
  "typeName": "Nghi cuoi hoi (cap nhat)",
  "typeCode": "MARRIAGE_LEAVE",
  "description": "Nghi ket hon (3 ngay lam viec)",
  "requiresBalance": false,
  "isPaid": true,
  "isActive": true,
  "updatedAt": "2025-10-20T12:20:00"
}
```

**Validation:**

- ✅ All fields updated
- ✅ updatedAt timestamp changed
- ✅ typeId remains unchanged

---

#### Test Case 3.2: Update - Change Balance Requirement

**Objective:** Change requiresBalance from false to true

**Request:**

```bash
PUT /api/v1/time-off-types/TOT002
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Nghi om",
  "typeCode": "SICK_LEAVE",
  "description": "Nghi om (gioi han 10 ngay/nam)",
  "requiresBalance": true,
  "defaultDaysPerYear": 10.0,
  "isPaid": true,
  "isActive": true
}
```

**Expected Response:** `200 OK`

**Validation:**

- ✅ requiresBalance changed to true
- ✅ defaultDaysPerYear set to 10.0
- ⚠️ Warning: This may affect existing requests

---

#### Test Case 3.3: Validation Error - Change typeCode to Existing

**Objective:** Try to update typeCode to one that already exists

**Request:**

```bash
PUT /api/v1/time-off-types/TOT005
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Test",
  "typeCode": "ANNUAL_LEAVE",
  "requiresBalance": false,
  "isPaid": true,
  "isActive": true
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "typeCode 'ANNUAL_LEAVE' is already used by another time off type",
  "timestamp": "2025-10-20T12:25:00"
}
```

---

#### Test Case 3.4: Error - Update Non-Existent Type

**Objective:** Try to update a type that doesn't exist

**Request:**

```bash
PUT /api/v1/time-off-types/TOT999
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "typeName": "Test",
  "typeCode": "TEST",
  "requiresBalance": false,
  "isPaid": true
}
```

**Expected Response:** `404 NOT FOUND`

```json
{
  "status": 404,
  "message": "Time off type not found with ID: TOT999",
  "timestamp": "2025-10-20T12:30:00"
}
```

---

### STEP 4: Delete Time Off Types

#### Test Case 4.1: Soft Delete (Deactivate) Time Off Type

**Objective:** Admin deactivates a time off type (soft delete)

**Prerequisites:**

- Login as user with `DELETE_TIME_OFF_TYPE` permission
- Type has no active requests

**Request:**

```bash
DELETE /api/v1/time-off-types/TOT005
Authorization: Bearer <admin_token>
```

**Expected Response:** `200 OK`

```json
{
  "message": "Time off type TOT005 has been deactivated",
  "typeId": "TOT005",
  "isActive": false
}
```

**Validation:**

- ✅ isActive set to false (soft delete)
- ✅ Type still exists in database
- ✅ Will not appear in active type listings

---

#### Test Case 4.2: Error - Delete Type with Active Requests

**Objective:** Try to delete a type that has pending requests

**Request:**

```bash
DELETE /api/v1/time-off-types/TOT001
Authorization: Bearer <admin_token>
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Cannot delete time off type TOT001. There are 5 active requests using this type.",
  "timestamp": "2025-10-20T12:35:00"
}
```

**Validation:**

- ✅ Type with active PENDING requests cannot be deleted
- ✅ Protects data integrity

---

#### Test Case 4.3: Forbidden - No DELETE Permission

**Objective:** Regular employee tries to delete type

**Request:**

```bash
DELETE /api/v1/time-off-types/TOT005
Authorization: Bearer <employee_token>
```

**Expected Response:** `403 FORBIDDEN`

```json
{
  "status": 403,
  "message": "Access Denied",
  "timestamp": "2025-10-20T12:40:00"
}
```

---

### STEP 5: Special Operations

#### Test Case 5.1: Reactivate Deactivated Type

**Objective:** Admin reactivates a previously deactivated type

**Request:**

```bash
PATCH /api/v1/time-off-types/TOT005/reactivate
Authorization: Bearer <admin_token>
```

**Expected Response:** `200 OK`

```json
{
  "typeId": "TOT005",
  "typeName": "Nghi cuoi hoi (cap nhat)",
  "isActive": true,
  "updatedAt": "2025-10-20T12:45:00"
}
```

**Validation:**

- ✅ isActive changed from false to true
- ✅ Type appears in active listings again

---

#### Test Case 5.2: Get Types by Balance Requirement

**Objective:** Filter types by requiresBalance flag

**Request:**

```bash
GET /api/v1/time-off-types?requiresBalance=true&isActive=true
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "content": [
    {
      "typeId": "TOT001",
      "typeName": "Nghi phep nam",
      "requiresBalance": true,
      "defaultDaysPerYear": 12.0
    }
  ]
}
```

**Validation:**

- ✅ Returns only types with requiresBalance=true
- ✅ Useful for balance initialization

---

#### Test Case 5.3: Get Types by Payment Status

**Objective:** Filter types by isPaid flag

**Request:**

```bash
GET /api/v1/time-off-types?isPaid=false&isActive=true
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

- Returns only unpaid leave types

---

## Error Responses Reference

| Status Code | Message                                                 | Cause                       |
| ----------- | ------------------------------------------------------- | --------------------------- |
| 400         | "typeName is required"                                  | Missing required field      |
| 400         | "typeCode already exists"                               | Duplicate typeCode          |
| 400         | "Cannot delete type with active requests"               | Type in use                 |
| 400         | "defaultDaysPerYear required when requiresBalance=true" | Invalid configuration       |
| 403         | "Access Denied"                                         | Missing required permission |
| 404         | "Time off type not found"                               | Invalid typeId              |

---

## Business Rules

1. **Type Code Uniqueness:**

   - `typeCode` must be unique across all time off types
   - Case-insensitive comparison
   - Used for system logic (e.g., ANNUAL_LEAVE triggers balance check)

2. **Balance Requirements:**

   - If `requiresBalance = true`, must specify `defaultDaysPerYear`
   - If `requiresBalance = false`, `defaultDaysPerYear` should be null
   - Balance types require balance initialization for employees

3. **Soft Delete:**

   - DELETE operation sets `isActive = false`
   - Hard delete only if no requests exist (database constraint)
   - Deactivated types hidden from dropdowns but visible in admin panel

4. **Default Types:**

   - System comes with 4 default types (TOT001-TOT004)
   - Default types cannot be hard deleted
   - Can be modified or deactivated

5. **Type ID Format:**
   - Format: `TOT` + 3-digit sequence (TOT001, TOT002, ...)
   - Auto-generated by service layer
   - Sequential, not date-based

---

## Integration Notes

1. **Dropdown Population:**

   - Use `GET /api/v1/time-off-types?isActive=true` for UI dropdowns
   - Returns only active, selectable types

2. **Balance Initialization:**

   - When new employee is created, check all types with `requiresBalance=true`
   - Create balance records with `defaultDaysPerYear` as initial amount

3. **Request Validation:**

   - Before creating time off request, validate typeId exists and isActive=true
   - If type has `requiresBalance=true`, check employee balance

4. **Admin Panel:**
   - Show all types (including inactive) with filter toggles
   - Display usage count (number of requests using each type)
   - Warning before deactivation if type has pending requests

---

## Test Execution Checklist

- [ ] Test VIEW operations (1.1 - 1.4)
- [ ] Test CREATE validations (2.1 - 2.5)
- [ ] Test UPDATE operations (3.1 - 3.4)
- [ ] Test DELETE/deactivate (4.1 - 4.3)
- [ ] Test reactivation (5.1)
- [ ] Test filter by requiresBalance (5.2)
- [ ] Test filter by isPaid (5.3)
- [ ] Verify all error responses
- [ ] Test pagination and sorting
- [ ] Test typeCode uniqueness

---

**Last Updated:** October 22, 2025
**API Version:** v1
**Feature:** BE-306 - Time Off Type Management
