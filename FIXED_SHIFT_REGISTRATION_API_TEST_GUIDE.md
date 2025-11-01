# Fixed Shift Registration Management API - Test Guide

## Overview

API này quản lý đăng ký ca làm việc cố định cho nhân viên **FULL_TIME** và **PART_TIME_FIXED**.
Nhân viên **PART_TIME_FLEX** không được phép sử dụng fixed shift registration (phải dùng part_time_registrations).

**Base URL**: `http://localhost:8080/api/v1/fixed-registrations`

---

## ⚠️ IMPORTANT: JSON Format

**API sử dụng camelCase** cho tất cả field names:

- ✅ `employeeId`, `workShiftId`, `daysOfWeek`, `effectiveFrom`, `effectiveTo`
- ❌ KHÔNG dùng snake_case: `employee_id`, `work_shift_id`, etc.

---

## Seed Data - Test Accounts & Employees

### Employees by Employment Type

| ID  | Name            | Account | Role         | Employment Type     | Usage                              |
| --- | --------------- | ------- | ------------ | ------------------- | ---------------------------------- |
| 1   | Admin Hệ thống  | admin   | ADMIN        | FULL_TIME           | Admin account                      |
| 2   | Nguyễn Văn Minh | nhasi1  | DOCTOR       | FULL_TIME           | ✅ Can use Fixed Registration      |
| 3   | Trần Thị Lan    | nhasi2  | DOCTOR       | FULL_TIME           | ✅ Can use Fixed Registration      |
| 4   | Lê Thị Mai      | letan   | RECEPTIONIST | FULL_TIME           | ✅ Can use Fixed Registration      |
| 5   | Hoàng Văn Tuấn  | ketoan  | ACCOUNTANT   | FULL_TIME           | ✅ Can use Fixed Registration      |
| 6   | Phạm Thị Hoa    | yta     | NURSE        | **PART_TIME_FIXED** | ✅ Can use Fixed Registration      |
| 7   | Trần Minh Quân  | manager | MANAGER      | FULL_TIME           | ✅ Can use Fixed Registration      |
| 8   | Nguyễn Thị Linh | yta2    | NURSE        | **PART_TIME_FLEX**  | ❌ Must use Part-time Registration |
| 9   | Võ Thị Trang    | yta3    | NURSE        | **PART_TIME_FIXED** | ✅ Can use Fixed Registration      |

### Work Shifts

| ID               | Name                         | Start | End   | Category |
| ---------------- | ---------------------------- | ----- | ----- | -------- |
| WKS_MORNING_01   | Ca Sáng (8h-16h)             | 08:00 | 16:00 | NORMAL   |
| WKS_AFTERNOON_01 | Ca Chiều (13h-20h)           | 13:00 | 20:00 | NORMAL   |
| WKS_MORNING_02   | Ca Part-time Sáng (8h-12h)   | 08:00 | 12:00 | NORMAL   |
| WKS_AFTERNOON_02 | Ca Part-time Chiều (13h-17h) | 13:00 | 17:00 | NORMAL   |

### Default Password & Permissions

- All accounts: `123456`
- **ROLE_ADMIN** & **ROLE_MANAGER**: Có `MANAGE_FIXED_REGISTRATIONS` + `VIEW_FIXED_REGISTRATIONS_ALL`
- **All employee roles**: Có `VIEW_FIXED_REGISTRATIONS_OWN`

**Quick Test Examples:**

- ✅ employeeId=6 (Phạm Thị Hoa - PART_TIME_FIXED) → Allowed
- ❌ employeeId=8 (Nguyễn Thị Linh - PART_TIME_FLEX) → 409 Conflict
- ✅ employeeId=9 (Võ Thị Trang - PART_TIME_FIXED) → Allowed

---

## Authentication

Tất cả các endpoints đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Permissions Required

| Action                    | Permission                     |
| ------------------------- | ------------------------------ |
| Create Fixed Registration | `MANAGE_FIXED_REGISTRATIONS`   |
| Update Fixed Registration | `MANAGE_FIXED_REGISTRATIONS`   |
| Delete Fixed Registration | `MANAGE_FIXED_REGISTRATIONS`   |
| View All Registrations    | `VIEW_FIXED_REGISTRATIONS_ALL` |
| View Own Registrations    | `VIEW_FIXED_REGISTRATIONS_OWN` |

**Who has what:**

- ✅ **admin** / **manager**: MANAGE + VIEW_ALL
- ✅ **yta** / **nhasi1** / etc: VIEW_OWN only

---

## 1. Create Fixed Shift Registration

**Endpoint**: `POST /api/v1/fixed-registrations`

**Permission**: `MANAGE_FIXED_REGISTRATIONS`

### Request Body (camelCase format!)

```json
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
```

### Field Descriptions

- `employeeId` (required): ID của nhân viên (phải là FULL_TIME hoặc PART_TIME_FIXED)
- `workShiftId` (required): ID của ca làm việc
- `daysOfWeek` (required): Mảng các ngày (1=Monday, 7=Sunday)
- `effectiveFrom` (required): Ngày bắt đầu (format: YYYY-MM-DD)
- `effectiveTo` (optional): Ngày kết thúc (null = vô thời hạn)

### Success Response (201 Created)

```json
{
  "registrationId": 1,
  "employeeId": 6,
  "employeeName": "Phạm Thị Hoa",
  "workShiftId": "WKS_MORNING_02",
  "workShiftName": "Ca Part-time Sáng (8h-12h)",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31",
  "isActive": true
}
```

### Error Cases

#### Case 1: Employee không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Employee not found with id: 999",
  "errorCode": "EMPLOYEE_NOT_FOUND"
}
```

#### Case 2: Work Shift không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Work shift not found with id: INVALID_ID",
  "errorCode": "WORK_SHIFT_NOT_FOUND"
}
```

#### Case 3: Employee là PART_TIME_FLEX (409)

**Request:**

```json
{
  "employeeId": 8,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3],
  "effectiveFrom": "2025-11-01"
}
```

**Response:**

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Employee type PART_TIME_FLEX cannot use fixed shift registration. Use part-time registration instead.",
  "errorCode": "INVALID_EMPLOYEE_TYPE"
}
```

#### Case 4: Duplicate Registration (409)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Employee already has an active fixed shift registration for this period",
  "errorCode": "DUPLICATE_FIXED_SHIFT_REGISTRATION"
}
```

#### Case 5: Missing Required Fields (400)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "employeeId": "Employee ID is required",
    "workShiftId": "Work shift ID is required",
    "daysOfWeek": "Days of week cannot be empty",
    "effectiveFrom": "Effective from date is required"
  }
}
```

#### Case 6: Invalid daysOfWeek (400)

**Request:**

```json
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [0, 8, 10],
  "effectiveFrom": "2025-11-01"
}
```

**Response:**

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Ngày làm việc phải từ 1 (Thứ 2) đến 7 (Chủ nhật): 8"
}
```

---

## 2. Get Fixed Shift Registrations (List/Filter)

**Endpoint**: `GET /api/v1/fixed-registrations?employeeId={id}`

**Permissions**:

- `VIEW_FIXED_REGISTRATIONS_ALL` - Xem tất cả
- `VIEW_FIXED_REGISTRATIONS_OWN` - Chỉ xem của mình

### Query Parameters

- `employeeId` (optional):
  - Nếu có VIEW_ALL permission: có thể xem tất cả hoặc filter theo employeeId
  - Nếu chỉ có VIEW_OWN permission: bắt buộc phải truyền employeeId của chính mình

### Use Cases

#### Case 1: Admin/Manager xem tất cả

**Request:**

```
GET /api/v1/fixed-registrations
Authorization: Bearer <admin_token>
```

**Response (200 OK):**

```json
[
  {
    "registrationId": 1,
    "employeeId": 2,
    "employeeName": "Nguyễn Văn Minh",
    "workShiftId": "WKS_MORNING_01",
    "workShiftName": "Ca Sáng (8h-16h)",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "effectiveFrom": "2025-11-01",
    "effectiveTo": "2026-10-31",
    "isActive": true
  },
  {
    "registrationId": 2,
    "employeeId": 6,
    "employeeName": "Phạm Thị Hoa",
    "workShiftId": "WKS_MORNING_02",
    "workShiftName": "Ca Part-time Sáng (8h-12h)",
    "daysOfWeek": [1, 3, 5],
    "effectiveFrom": "2025-11-01",
    "effectiveTo": null,
    "isActive": true
  }
]
```

#### Case 2: Admin filter theo employeeId

**Request:**

```
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <admin_token>
```

**Response:** Array với chỉ registrations của employee 6

#### Case 3: Employee xem của mình (SUCCESS)

**Request:** (yta account - employeeId=6)

```
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <yta_token>
```

**Response:** 200 OK với registrations của employee 6

#### Case 4: Employee không truyền employeeId (ERROR)

**Request:**

```
GET /api/v1/fixed-registrations
Authorization: Bearer <yta_token>
```

**Response (400):**

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Employee ID is required when you only have VIEW_FIXED_REGISTRATIONS_OWN permission",
  "errorCode": "EMPLOYEE_ID_REQUIRED"
}
```

#### Case 5: Employee xem của người khác (ERROR)

**Request:** (yta account - employeeId=6 cố xem của employeeId=9)

```
GET /api/v1/fixed-registrations?employeeId=9
Authorization: Bearer <yta_token>
```

**Response (403):**

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied: You can only view your own fixed shift registrations",
  "errorCode": "ACCESS_DENIED"
}
```

---

## 3. Update Fixed Shift Registration

**Endpoint**: `PUT /api/v1/fixed-registrations/{id}`

**Permission**: `MANAGE_FIXED_REGISTRATIONS`

### Request Body (all fields optional)

```json
{
  "workShiftId": "WKS_AFTERNOON_02",
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-12-01",
  "effectiveTo": "2026-11-30"
}
```

**Note**: Tất cả fields đều optional. Chỉ update những fields được gửi lên.

### Success Response (200 OK)

```json
{
  "registrationId": 1,
  "employeeId": 6,
  "employeeName": "Phạm Thị Hoa",
  "workShiftId": "WKS_AFTERNOON_02",
  "workShiftName": "Ca Part-time Chiều (13h-17h)",
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-12-01",
  "effectiveTo": "2026-11-30",
  "isActive": true
}
```

### Error Cases

#### Case 1: Registration không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Fixed shift registration not found with id: 999",
  "errorCode": "FIXED_REGISTRATION_NOT_FOUND"
}
```

#### Case 2: Update chỉ workShiftId

**Request:**

```json
{
  "workShiftId": "WKS_MORNING_01"
}
```

**Response:** 200 OK - Chỉ workShiftId thay đổi, fields khác giữ nguyên

#### Case 3: Set effectiveTo = null

**Request:**

```json
{
  "effectiveTo": null
}
```

**Response:** 200 OK - Registration trở thành vô thời hạn

---

## 4. Delete Fixed Shift Registration (Soft Delete)

**Endpoint**: `DELETE /api/v1/fixed-registrations/{id}`

**Permission**: `MANAGE_FIXED_REGISTRATIONS`

**Note**: Soft delete - chỉ set `isActive = false`

### Success Response (204 No Content)

Không có response body, chỉ HTTP 204.

### Error Case: Registration không tồn tại (404)

```json
{
  "timestamp": "2025-10-30T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Fixed shift registration not found with id: 999",
  "errorCode": "FIXED_REGISTRATION_NOT_FOUND"
}
```

---

## Testing Workflow

### Scenario 1: Create và Manage (CRUD Full)

```bash
# Step 1: Login as Admin
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "123456"
}
# => Lấy JWT token

# Step 2: Tạo registration
POST /api/v1/fixed-registrations
Authorization: Bearer <token>
{
  "employeeId": 6,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
# => Expect: 201 Created

# Step 3: Xem danh sách
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <token>
# => Expect: 200 OK, array có 1 item

# Step 4: Update
PUT /api/v1/fixed-registrations/1
Authorization: Bearer <token>
{
  "daysOfWeek": [1, 3, 5]
}
# => Expect: 200 OK

# Step 5: Delete
DELETE /api/v1/fixed-registrations/1
Authorization: Bearer <token>
# => Expect: 204 No Content

# Step 6: Verify
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <token>
# => Expect: 200 OK, array rỗng []
```

### Scenario 2: Test PART_TIME_FLEX bị reject

```bash
POST /api/v1/fixed-registrations
Authorization: Bearer <token>
{
  "employeeId": 8,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 2, 3],
  "effectiveFrom": "2025-11-01"
}
# => Expect: 409 Conflict với errorCode "INVALID_EMPLOYEE_TYPE"
```

### Scenario 3: Test duplicate detection

```bash
# Step 1: Tạo registration đầu tiên
POST /api/v1/fixed-registrations
{
  "employeeId": 9,
  "workShiftId": "WKS_AFTERNOON_02",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "effectiveFrom": "2025-11-01",
  "effectiveTo": "2026-10-31"
}
# => Expect: 201 Created

# Step 2: Tạo duplicate
POST /api/v1/fixed-registrations
{
  "employeeId": 9,
  "workShiftId": "WKS_MORNING_02",
  "daysOfWeek": [1, 3, 5],
  "effectiveFrom": "2025-12-01",
  "effectiveTo": "2026-11-30"
}
# => Expect: 409 Conflict "DUPLICATE_FIXED_SHIFT_REGISTRATION"
```

### Scenario 4: Test employee permissions

```bash
# Step 1: Login as Employee
POST /api/v1/auth/login
{
  "username": "yta",
  "password": "123456"
}
# => employeeId = 6

# Step 2: Xem của mình (OK)
GET /api/v1/fixed-registrations?employeeId=6
Authorization: Bearer <token>
# => Expect: 200 OK

# Step 3: Xem của người khác (FORBIDDEN)
GET /api/v1/fixed-registrations?employeeId=9
Authorization: Bearer <token>
# => Expect: 403 Forbidden

# Step 4: Không truyền employeeId (BAD REQUEST)
GET /api/v1/fixed-registrations
Authorization: Bearer <token>
# => Expect: 400 Bad Request "EMPLOYEE_ID_REQUIRED"
```

---

## Common HTTP Status Codes

- **200 OK**: Success (GET, PUT)
- **201 Created**: Registration created (POST)
- **204 No Content**: Deleted successfully (DELETE)
- **400 Bad Request**: Validation error / missing fields
- **403 Forbidden**: Không có permission
- **404 Not Found**: Employee / WorkShift / Registration không tồn tại
- **409 Conflict**: Duplicate registration / invalid employee type

---

## Error Codes Summary

| Error Code                           | HTTP Status | Meaning                                           |
| ------------------------------------ | ----------- | ------------------------------------------------- |
| `EMPLOYEE_NOT_FOUND`                 | 404         | Employee không tồn tại                            |
| `WORK_SHIFT_NOT_FOUND`               | 404         | Work shift không tồn tại                          |
| `FIXED_REGISTRATION_NOT_FOUND`       | 404         | Registration không tồn tại                        |
| `INVALID_EMPLOYEE_TYPE`              | 409         | PART_TIME_FLEX không được dùng fixed registration |
| `DUPLICATE_FIXED_SHIFT_REGISTRATION` | 409         | Employee đã có registration active                |
| `EMPLOYEE_ID_REQUIRED`               | 400         | Thiếu employeeId khi chỉ có VIEW_OWN permission   |
| `ACCESS_DENIED`                      | 403         | Không có quyền truy cập                           |
| `VALIDATION_ERROR`                   | 400         | Lỗi validation (missing fields, invalid format)   |

---

## Notes for Frontend Developers

1. **JSON Format**: **PHẢI dùng camelCase** (`employeeId`, `workShiftId`, NOT snake_case)

2. **Days of Week**:

   - 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
   - Hiển thị checkbox cho user chọn

3. **Employee Type Validation**:

   - Check employee type trước khi cho phép tạo
   - PART_TIME_FLEX → redirect to `/api/v1/part-time-registrations`

4. **Permissions**:

   - Admin/Manager: CRUD + view all
   - Employee: View own only (không có CRUD)

5. **Soft Delete**:

   - Registration bị xóa không hiện trong GET list
   - Vẫn tồn tại trong DB với `isActive=false`

6. **Date Format**:
   - Request: `"YYYY-MM-DD"` (e.g., "2025-11-01")
   - Response: ISO 8601 (e.g., "2025-11-01T10:00:00")

---

## Quick Reference - Test Data

```bash
# Login
username: admin, password: 123456  # Has MANAGE + VIEW_ALL
username: manager, password: 123456  # Has MANAGE + VIEW_ALL
username: yta, password: 123456  # Has VIEW_OWN only (employeeId=6)

# Employees
employeeId=6: PART_TIME_FIXED ✅ Can use fixed registration
employeeId=8: PART_TIME_FLEX ❌ Cannot use (will get 409)
employeeId=9: PART_TIME_FIXED ✅ Can use fixed registration

# Work Shifts
WKS_MORNING_02: Ca Part-time Sáng (8h-12h)
WKS_AFTERNOON_02: Ca Part-time Chiều (13h-17h)
```

---

## Contact

Nếu có bug hoặc vấn đề, liên hệ Backend team.
