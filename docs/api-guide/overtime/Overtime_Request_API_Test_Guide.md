# API TEST GUIDE: OVERTIME REQUEST MANAGEMENT (BE-304)
## For Frontend Developers

---

##  Table of Contents
1. [Overview](#overview)
2. [Pre-requisites](#pre-requisites)
3. [Authentication Setup](#authentication-setup)
4. [Test Data Available](#test-data-available)
5. [API Endpoints](#api-endpoints)
6. [Test Flow - Employee User](#test-flow---employee-user)
7. [Test Flow - Manager/Admin User](#test-flow---manageradmin-user)
8. [Error Scenarios & Expected Responses](#error-scenarios--expected-responses)
9. [Permission Matrix](#permission-matrix)

---

## Overview

This guide covers testing for **Overtime Request Management** feature. The API allows employees to request overtime work, and managers to approve/reject/cancel those requests.

**Base URL:** `/api/v1/overtime-requests`

**Permissions Required:**
- `VIEW_OT_ALL` - View all overtime requests (Manager/Admin)
- `VIEW_OT_OWN` - View only own overtime requests (Employee)
- `CREATE_OT` - Create overtime requests
- `APPROVE_OT` - Approve overtime requests (Manager)
- `REJECT_OT` - Reject overtime requests (Manager)
- `CANCEL_OT_OWN` - Cancel own pending requests (Employee)
- `CANCEL_OT_PENDING` - Cancel any pending requests (Manager)

---

## Pre-requisites

### 1. Database Seed Data
Ensure the database is loaded with seed data from `dental-clinic-seed-data_postgres_v2.sql`.

The seed file includes:
- **7 sample overtime requests** (OTR251030005-011) with different statuses
- **2 auto-created employee shifts** (EMS251030003-004) from approved OT
- **9 employee accounts** with different roles
- **4 work shifts** (Morning/Afternoon, Full-time/Part-time)

### 2. Test Environment
- API Base URL: `http://localhost:8080` (or your backend URL)
- Postman or any API testing tool
- Valid JWT tokens for different user roles

---

## Authentication Setup

### Step 1: Login to Get Access Token

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "username": "nhasi1",
  "password": "123456"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000
}
```

### Step 2: Set Authorization Header

For all subsequent requests, include:
```
Authorization: Bearer {accessToken}
```

### Available Test Accounts

| Username | Password | Role | Employee ID | Permissions |
|----------|----------|------|-------------|-------------|
| `nhasi1` | `123456` | Doctor | 2 | VIEW_OT_OWN, CREATE_OT, CANCEL_OT_OWN |
| `nhasi2` | `123456` | Doctor | 3 | VIEW_OT_OWN, CREATE_OT, CANCEL_OT_OWN |
| `letan` | `123456` | Receptionist | 4 | VIEW_OT_OWN, CREATE_OT, CANCEL_OT_OWN |
| `ketoan` | `123456` | Accountant | 5 | VIEW_OT_OWN, CREATE_OT, CANCEL_OT_OWN |
| `yta` | `123456` | Nurse | 6 | VIEW_OT_OWN, CREATE_OT, CANCEL_OT_OWN |
| `manager` | `123456` | Manager | 7 | VIEW_OT_ALL, CREATE_OT, APPROVE_OT, REJECT_OT, CANCEL_OT_PENDING |
| `admin` | `123456` | Admin | 1 | ALL PERMISSIONS |

---

## Test Data Available

### Overtime Requests in Database

| Request ID | Employee | Work Date | Shift | Status | Notes |
|------------|----------|-----------|-------|--------|-------|
| OTR251030001 | 2 (Minh) | 2025-11-04 | Afternoon FT | CANCELLED | Pre-existing data |
| OTR251030002 | 2 (Minh) | 2025-11-08 | Morning FT | APPROVED | Created shift EMS251030002 |
| OTR251030003 | 2 (Minh) | 2025-11-12 | Morning FT | REJECTED | Pre-existing data |
| OTR251030004 | 3 (Lan) | 2025-11-15 | Afternoon FT | CANCELLED | Pre-existing data |
| **OTR251030005** | 2 (Minh) | 2025-11-18 | Afternoon PT | **PENDING** | For approval testing |
| **OTR251030006** | 3 (Lan) | 2025-11-20 | Morning FT | **PENDING** | For approval testing |
| **OTR251030007** | 4 (Mai) | 2025-11-22 | Afternoon FT | **PENDING** | For approval testing |
| **OTR251030008** | 5 (Tuấn) | 2025-11-25 | Morning PT | **APPROVED** | Created shift EMS251030003 |
| **OTR251030009** | 6 (Hoa) | 2025-11-27 | Afternoon PT | **APPROVED** | Created shift EMS251030004 |
| **OTR251030010** | 2 (Minh) | 2025-11-28 | Morning FT | **REJECTED** | Has rejection reason |
| **OTR251030011** | 3 (Lan) | 2025-11-30 | Afternoon FT | **CANCELLED** | Self-cancelled |

### Work Shifts Available

| Shift ID | Shift Name | Start Time | End Time |
|----------|------------|------------|----------|
| WKS_MORNING_01 | Ca Sáng (8h-16h) | 08:00 | 16:00 |
| WKS_MORNING_02 | Ca Part-time Sáng (8h-12h) | 08:00 | 12:00 |
| WKS_AFTERNOON_01 | Ca Chiều (13h-20h) | 13:00 | 20:00 |
| WKS_AFTERNOON_02 | Ca Part-time Chiều (13h-17h) | 13:00 | 17:00 |

---

## API Endpoints

### 1. List Overtime Requests
`GET /api/v1/overtime-requests`

### 2. Get Overtime Request Detail
`GET /api/v1/overtime-requests/{requestId}`

### 3. Create Overtime Request
`POST /api/v1/overtime-requests`

### 4. Update Overtime Request Status (Approve/Reject/Cancel)
`PATCH /api/v1/overtime-requests/{requestId}`

---

## Test Flow - Employee User

### Setup: Login as Employee
**Username:** `nhasi1` | **Password:** `123456` | **Employee ID:** 2

```bash
POST /api/v1/auth/login
{
  "username": "nhasi1",
  "password": "123456"
}
```

---

### Test 1: View Own Overtime Requests

**Purpose:** Employee should only see their own overtime requests (VIEW_OT_OWN)

**Request:**
```http
GET /api/v1/overtime-requests?page=0&size=10
Authorization: Bearer {nhasi1_token}
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251030010",
      "employee": {
        "employeeId": 2,
        "employeeCode": "EMP001",
        "fullName": "Nguyễn Văn Minh"
      },
      "requestedBy": {
        "employeeId": 2,
        "fullName": "Nguyễn Văn Minh"
      },
      "workDate": "2025-11-28",
      "workShift": {
        "workShiftId": "WKS_MORNING_01",
        "shiftName": "Ca Sáng (8h-16h)"
      },
      "reason": "Yêu cầu tăng ca thêm",
      "status": "REJECTED",
      "approvedBy": {
        "employeeId": 7,
        "fullName": "Trần Minh Quân"
      },
      "rejectedReason": "Đã đủ nhân sự cho ngày này",
      "createdAt": "2025-10-28T00:00:00"
    }
    // More records for employee_id=2 only
  ],
  "totalElements": 5,
  "totalPages": 1,
  "size": 10,
  "number": 0
}
```

**Validation:**
-  Status code is 200
-  Only see requests where `employee.employeeId = 2` (own requests)
-  Does NOT see requests from employee 3, 4, 5, 6
-  Includes all statuses: PENDING, APPROVED, REJECTED, CANCELLED

---

### Test 2: View Specific Overtime Request Detail

**Purpose:** Employee can view details of their own request

**Request:**
```http
GET /api/v1/overtime-requests/OTR251030005
Authorization: Bearer {nhasi1_token}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251030005",
  "employee": {
    "employeeId": 2,
    "employeeCode": "EMP001",
    "fullName": "Nguyễn Văn Minh"
  },
  "requestedBy": {
    "employeeId": 2,
    "fullName": "Nguyễn Văn Minh"
  },
  "workDate": "2025-11-18",
  "workShift": {
    "workShiftId": "WKS_AFTERNOON_02",
    "shiftName": "Ca Part-time Chiều (13h-17h)",
    "startTime": "13:00:00",
    "endTime": "17:00:00"
  },
  "reason": "Hoàn thành báo cáo cuối tháng",
  "status": "PENDING",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedReason": null,
  "cancellationReason": null,
  "createdAt": "2025-10-30T00:00:00"
}
```

**Validation:**
-  Status code is 200
-  Request belongs to employee 2
-  Status is PENDING (ready for approval/cancellation)

---

### Test 3: ERROR - View Other Employee's Request

**Purpose:** Employee should NOT see other employees' requests (returns 404 to hide existence)

**Request:**
```http
GET /api/v1/overtime-requests/OTR251030006
Authorization: Bearer {nhasi1_token}
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "type": "about:blank",
  "title": "Related Resource Not Found",
  "status": 404,
  "detail": "Không tìm thấy yêu cầu tăng ca với ID: OTR251030006",
  "instance": "/api/v1/overtime-requests/OTR251030006",
  "code": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Không tìm thấy yêu cầu tăng ca với ID: OTR251030006"
}
```

**Validation:**
-  Status code is 404 (not 403) - hides resource existence for security
-  Message says "Không tìm thấy yêu cầu tăng ca"
-  OTR251030006 belongs to employee 3, so employee 2 cannot see it

---

### Test 4: Create New Overtime Request (Self-Request)

**Purpose:** Employee creates overtime request for themselves

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "workDate": "2025-12-05",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Hoàn thành dự án khẩn cấp cuối năm"
}
```

**Expected Response:** `201 CREATED`
```json
{
  "requestId": "OTR251205001",
  "employee": {
    "employeeId": 2,
    "employeeCode": "EMP001",
    "fullName": "Nguyễn Văn Minh"
  },
  "requestedBy": {
    "employeeId": 2,
    "fullName": "Nguyễn Văn Minh"
  },
  "workDate": "2025-12-05",
  "workShift": {
    "workShiftId": "WKS_MORNING_01",
    "shiftName": "Ca Sáng (8h-16h)",
    "startTime": "08:00:00",
    "endTime": "16:00:00"
  },
  "reason": "Hoàn thành dự án khẩn cấp cuối năm",
  "status": "PENDING",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedReason": null,
  "cancellationReason": null,
  "createdAt": "2025-10-30T08:30:00"
}
```

**Validation:**
-  Status code is 201
-  `employee.employeeId = 2` (automatically set from JWT token)
-  `requestedBy.employeeId = 2` (same as employee, self-request)
-  Status is PENDING
-  Request ID follows format OTRyymmddSSS

---

### Test 5: ERROR - Create OT with Past Date

**Purpose:** Cannot create overtime request for past dates

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "workDate": "2025-10-15",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Test với ngày quá khứ"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Ngày làm việc phải là ngày trong tương lai",
  "instance": "/api/v1/overtime-requests",
  "code": "VALIDATION_ERROR",
  "message": "Ngày làm việc phải là ngày trong tương lai"
}
```

**Validation:**
-  Status code is 400
-  Message explains date must be in future
-  Today is 2025-10-30, so 2025-10-15 is invalid

---

### Test 6: ERROR - Create OT with Invalid Work Shift

**Purpose:** Cannot create overtime request with non-existent work shift

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "workDate": "2025-12-06",
  "workShiftId": "WKS_INVALID_999",
  "reason": "Test với ca làm việc không tồn tại"
}
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "type": "about:blank",
  "title": "Related Resource Not Found",
  "status": 404,
  "detail": "Ca làm việc không tồn tại với ID: WKS_INVALID_999",
  "instance": "/api/v1/overtime-requests",
  "code": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Ca làm việc không tồn tại với ID: WKS_INVALID_999"
}
```

**Validation:**
-  Status code is 404
-  Clean error message (not showing full ProblemDetail structure)
-  Message identifies the invalid work shift ID

---

### Test 7: ERROR - Create Duplicate OT Request

**Purpose:** Cannot create duplicate OT for same employee+date+shift

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "workDate": "2025-11-18",
  "workShiftId": "WKS_AFTERNOON_02",
  "reason": "Test duplicate - same as OTR251030005"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Nhân viên đã có yêu cầu tăng ca cho ngày và ca làm việc này",
  "instance": "/api/v1/overtime-requests",
  "code": "VALIDATION_ERROR",
  "message": "Nhân viên đã có yêu cầu tăng ca cho ngày và ca làm việc này"
}
```

**Validation:**
-  Status code is 400
-  Message explains duplicate constraint
-  Unique constraint: (employee_id, work_date, work_shift_id)

---

### Test 8: ERROR - Create OT with Missing Required Fields

**Purpose:** Validate required fields

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "workDate": "2025-12-07"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/overtime-requests",
  "errors": {
    "workShiftId": "ID ca làm việc không được để trống",
    "reason": "Lý do tăng ca không được để trống"
  }
}
```

**Validation:**
-  Status code is 400
-  Shows all missing required fields
-  Required: workDate, workShiftId, reason

---

### Test 9: Cancel Own Pending Overtime Request

**Purpose:** Employee can cancel their own PENDING requests (CANCEL_OT_OWN)

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030005
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "action": "CANCEL",
  "reason": "Có việc đột xuất không thể tham gia"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251030005",
  "employee": {
    "employeeId": 2,
    "employeeCode": "EMP001",
    "fullName": "Nguyễn Văn Minh"
  },
  "requestedBy": {
    "employeeId": 2,
    "fullName": "Nguyễn Văn Minh"
  },
  "workDate": "2025-11-18",
  "workShift": {
    "workShiftId": "WKS_AFTERNOON_02",
    "shiftName": "Ca Part-time Chiều (13h-17h)"
  },
  "reason": "Hoàn thành báo cáo cuối tháng",
  "status": "CANCELLED",
  "cancellationReason": "Có việc đột xuất không thể tham gia",
  "createdAt": "2025-10-30T00:00:00"
}
```

**Validation:**
-  Status code is 200
-  Status changed from PENDING to CANCELLED
-  `cancellationReason` is set
-  Only PENDING requests can be cancelled

---

### Test 10: ERROR - Cancel Already Approved Request

**Purpose:** Employee cannot cancel APPROVED requests

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030002
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "action": "CANCEL",
  "reason": "Muốn hủy request đã được duyệt"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Chỉ có thể hủy yêu cầu tăng ca ở trạng thái PENDING",
  "instance": "/api/v1/overtime-requests/OTR251030002",
  "code": "VALIDATION_ERROR",
  "message": "Chỉ có thể hủy yêu cầu tăng ca ở trạng thái PENDING"
}
```

**Validation:**
-  Status code is 400
-  Message explains only PENDING can be cancelled
-  Business rule: Approved OT cannot be cancelled by employee

---

### Test 11: ERROR - Try to Approve Request (No Permission)

**Purpose:** Employee without APPROVE_OT permission cannot approve requests

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030006
Authorization: Bearer {nhasi1_token}
Content-Type: application/json

{
  "action": "APPROVE"
}
```

**Expected Response:** `403 FORBIDDEN`
```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access Denied",
  "instance": "/api/v1/overtime-requests/OTR251030006",
  "code": "ACCESS_DENIED",
  "message": "Bạn không có quyền thực hiện thao tác này"
}
```

**Validation:**
-  Status code is 403
-  Employee doesn't have APPROVE_OT permission
-  Only managers can approve

---

## Test Flow - Manager/Admin User

### Setup: Login as Manager
**Username:** `manager` | **Password:** `123456` | **Employee ID:** 7

```bash
POST /api/v1/auth/login
{
  "username": "manager",
  "password": "123456"
}
```

---

### Test 12: View All Overtime Requests

**Purpose:** Manager should see ALL overtime requests from all employees (VIEW_OT_ALL)

**Request:**
```http
GET /api/v1/overtime-requests?page=0&size=20
Authorization: Bearer {manager_token}
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251030011",
      "employee": {
        "employeeId": 3,
        "fullName": "Trần Thị Lan"
      },
      "status": "CANCELLED"
    },
    {
      "requestId": "OTR251030010",
      "employee": {
        "employeeId": 2,
        "fullName": "Nguyễn Văn Minh"
      },
      "status": "REJECTED"
    },
    {
      "requestId": "OTR251030009",
      "employee": {
        "employeeId": 6,
        "fullName": "Phạm Thị Hoa"
      },
      "status": "APPROVED"
    }
    // ... all records from all employees
  ],
  "totalElements": 11,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

**Validation:**
-  Status code is 200
-  See requests from ALL employees (2, 3, 4, 5, 6)
-  Includes all statuses
-  totalElements shows all records in database

---

### Test 13: Filter by Status - PENDING Only

**Purpose:** Manager can filter to see only pending requests for approval

**Request:**
```http
GET /api/v1/overtime-requests?status=PENDING&page=0&size=10
Authorization: Bearer {manager_token}
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251030007",
      "employee": {
        "employeeId": 4,
        "fullName": "Lê Thị Mai"
      },
      "status": "PENDING"
    },
    {
      "requestId": "OTR251030006",
      "employee": {
        "employeeId": 3,
        "fullName": "Trần Thị Lan"
      },
      "status": "PENDING"
    }
    // Only PENDING requests
  ],
  "totalElements": 3,
  "totalPages": 1
}
```

**Validation:**
-  Status code is 200
-  Only shows PENDING requests (OTR251030005, OTR251030006, OTR251030007)
-  Filter works correctly

---

### Test 14: Filter by Employee

**Purpose:** Manager can filter to see specific employee's requests

**Request:**
```http
GET /api/v1/overtime-requests?employeeId=2&page=0&size=10
Authorization: Bearer {manager_token}
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251030010",
      "employee": {
        "employeeId": 2,
        "fullName": "Nguyễn Văn Minh"
      },
      "status": "REJECTED"
    },
    {
      "requestId": "OTR251030005",
      "employee": {
        "employeeId": 2,
        "fullName": "Nguyễn Văn Minh"
      },
      "status": "PENDING"
    }
    // Only employee 2's requests
  ],
  "totalElements": 5
}
```

**Validation:**
-  Status code is 200
-  Only shows employee 2's requests
-  Manager can view any employee's requests

---

### Test 15: Filter by Date Range

**Purpose:** Manager can filter by work date range

**Request:**
```http
GET /api/v1/overtime-requests?fromDate=2025-11-18&toDate=2025-11-25&page=0&size=10
Authorization: Bearer {manager_token}
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251030008",
      "workDate": "2025-11-25",
      "status": "APPROVED"
    },
    {
      "requestId": "OTR251030007",
      "workDate": "2025-11-22",
      "status": "PENDING"
    },
    {
      "requestId": "OTR251030006",
      "workDate": "2025-11-20",
      "status": "PENDING"
    },
    {
      "requestId": "OTR251030005",
      "workDate": "2025-11-18",
      "status": "PENDING"
    }
  ],
  "totalElements": 4
}
```

**Validation:**
-  Status code is 200
-  Only shows requests with workDate between 2025-11-18 and 2025-11-25
-  Date range filter works correctly

---

### Test 16: Approve Overtime Request

**Purpose:** Manager approves a pending overtime request (APPROVE_OT permission)

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030006
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "action": "APPROVE"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251030006",
  "employee": {
    "employeeId": 3,
    "employeeCode": "EMP002",
    "fullName": "Trần Thị Lan"
  },
  "requestedBy": {
    "employeeId": 3,
    "fullName": "Trần Thị Lan"
  },
  "workDate": "2025-11-20",
  "workShift": {
    "workShiftId": "WKS_MORNING_01",
    "shiftName": "Ca Sáng (8h-16h)",
    "startTime": "08:00:00",
    "endTime": "16:00:00"
  },
  "reason": "Hỗ trợ dự án khẩn cấp",
  "status": "APPROVED",
  "approvedBy": {
    "employeeId": 7,
    "employeeCode": "EMP006",
    "fullName": "Trần Minh Quân"
  },
  "approvedAt": "2025-10-30T09:15:00",
  "rejectedReason": null,
  "cancellationReason": null,
  "createdAt": "2025-10-30T00:00:00"
}
```

**Validation:**
-  Status code is 200
-  Status changed from PENDING to APPROVED
-  `approvedBy` shows manager's info (employee 7)
-  `approvedAt` timestamp is set
-  **AUTO-CREATE EMPLOYEE SHIFT**: System automatically creates EmployeeShift record

**Check Auto-Created Employee Shift:**
```http
GET /api/v1/employee-shifts?employeeId=3&workDate=2025-11-20
Authorization: Bearer {manager_token}
```

Expected: Should see a new shift with:
- `source = "OT_APPROVAL"`
- `isOvertime = true`
- `sourceOtRequestId = "OTR251030006"`
- `status = "SCHEDULED"`

---

### Test 17: Reject Overtime Request with Reason

**Purpose:** Manager rejects a pending overtime request (REJECT_OT permission)

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030007
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "action": "REJECT",
  "reason": "Đã đủ nhân sự cho ca này, không cần tăng ca"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251030007",
  "employee": {
    "employeeId": 4,
    "fullName": "Lê Thị Mai"
  },
  "workDate": "2025-11-22",
  "workShift": {
    "workShiftId": "WKS_AFTERNOON_01",
    "shiftName": "Ca Chiều (13h-20h)"
  },
  "reason": "Hỗ trợ tiếp đón bệnh nhân ca tối",
  "status": "REJECTED",
  "approvedBy": {
    "employeeId": 7,
    "fullName": "Trần Minh Quân"
  },
  "approvedAt": "2025-10-30T09:20:00",
  "rejectedReason": "Đã đủ nhân sự cho ca này, không cần tăng ca",
  "createdAt": "2025-10-30T00:00:00"
}
```

**Validation:**
-  Status code is 200
-  Status changed from PENDING to REJECTED
-  `rejectedReason` is required and saved
-  `approvedBy` shows who rejected (employee 7)
-  No employee shift is created

---

### Test 18: ERROR - Reject without Reason

**Purpose:** Reject action requires mandatory reason field

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030007
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "action": "REJECT"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Lý do từ chối là bắt buộc khi từ chối yêu cầu tăng ca",
  "instance": "/api/v1/overtime-requests/OTR251030007",
  "code": "VALIDATION_ERROR",
  "message": "Lý do từ chối là bắt buộc khi từ chối yêu cầu tăng ca"
}
```

**Validation:**
-  Status code is 400
-  Reason field is mandatory for REJECT action
-  Clear error message

---

### Test 19: Manager Cancel Pending Request

**Purpose:** Manager can cancel any pending request (CANCEL_OT_PENDING)

**Request:**
```http
PATCH /api/v1/overtime-requests/OTR251030005
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "action": "CANCEL",
  "reason": "Kế hoạch thay đổi, không cần tăng ca"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251030005",
  "employee": {
    "employeeId": 2,
    "fullName": "Nguyễn Văn Minh"
  },
  "status": "CANCELLED",
  "cancellationReason": "Kế hoạch thay đổi, không cần tăng ca",
  "createdAt": "2025-10-30T00:00:00"
}
```

**Validation:**
-  Status code is 200
-  Manager can cancel other employees' requests
-  Different from employee (CANCEL_OT_OWN) - manager has CANCEL_OT_PENDING

---

### Test 20: Create Overtime Request for Another Employee

**Purpose:** Manager/Admin can create OT request on behalf of an employee

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "employeeId": 4,
  "workDate": "2025-12-10",
  "workShiftId": "WKS_AFTERNOON_01",
  "reason": "Phân công tăng ca do thiếu nhân sự"
}
```

**Expected Response:** `201 CREATED`
```json
{
  "requestId": "OTR251210001",
  "employee": {
    "employeeId": 4,
    "employeeCode": "EMP003",
    "fullName": "Lê Thị Mai"
  },
  "requestedBy": {
    "employeeId": 7,
    "fullName": "Trần Minh Quân"
  },
  "workDate": "2025-12-10",
  "workShift": {
    "workShiftId": "WKS_AFTERNOON_01",
    "shiftName": "Ca Chiều (13h-20h)"
  },
  "reason": "Phân công tăng ca do thiếu nhân sự",
  "status": "PENDING",
  "createdAt": "2025-10-30T09:30:00"
}
```

**Validation:**
-  Status code is 201
-  `employee.employeeId = 4` (specified in request)
-  `requestedBy.employeeId = 7` (manager who created it)
-  Admin creates OT for employee, not self-request

---

### Test 21: ERROR - Create OT for Non-existent Employee

**Purpose:** Cannot create OT for invalid employee ID

**Request:**
```http
POST /api/v1/overtime-requests
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "employeeId": 999,
  "workDate": "2025-12-11",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Test với nhân viên không tồn tại"
}
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "type": "about:blank",
  "title": "Related Resource Not Found",
  "status": 404,
  "detail": "Nhân viên không tồn tại với ID: 999",
  "instance": "/api/v1/overtime-requests",
  "code": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Nhân viên không tồn tại với ID: 999"
}
```

**Validation:**
-  Status code is 404
-  Message identifies invalid employee ID
-  Clean error message format

---

## Error Scenarios & Expected Responses

### Summary Table

| Test Case | HTTP Method | Endpoint | Expected Status | Error Code | Reason |
|-----------|-------------|----------|-----------------|------------|--------|
| Past date | POST | `/overtime-requests` | 400 | VALIDATION_ERROR | workDate must be future |
| Invalid shift | POST | `/overtime-requests` | 404 | RELATED_RESOURCE_NOT_FOUND | Work shift doesn't exist |
| Duplicate OT | POST | `/overtime-requests` | 400 | VALIDATION_ERROR | Same employee+date+shift exists |
| Missing fields | POST | `/overtime-requests` | 400 | VALIDATION_ERROR | Required fields empty |
| View other's OT | GET | `/overtime-requests/{id}` | 404 | RELATED_RESOURCE_NOT_FOUND | No permission (security) |
| Cancel approved | PATCH | `/overtime-requests/{id}` | 400 | VALIDATION_ERROR | Only PENDING can be cancelled |
| Reject no reason | PATCH | `/overtime-requests/{id}` | 400 | VALIDATION_ERROR | Reason required for REJECT |
| No approve perm | PATCH | `/overtime-requests/{id}` | 403 | ACCESS_DENIED | Missing APPROVE_OT permission |
| Invalid employee | POST | `/overtime-requests` | 404 | RELATED_RESOURCE_NOT_FOUND | Employee doesn't exist |

---

## Permission Matrix

### Employee Permissions

| Action | Permission | nhasi1 (Dr) | letan (Recep) | manager | admin |
|--------|------------|-------------|---------------|---------|-------|
| View own OT | VIEW_OT_OWN |  |  |  |  |
| View all OT | VIEW_OT_ALL |  |  |  |  |
| Create own OT | CREATE_OT |  |  |  |  |
| Create for others | CREATE_OT |  |  |  |  |
| Approve OT | APPROVE_OT |  |  |  |  |
| Reject OT | REJECT_OT |  |  |  |  |
| Cancel own pending | CANCEL_OT_OWN |  |  |  |  |
| Cancel any pending | CANCEL_OT_PENDING |  |  |  |  |

---

## Business Rules Checklist

###  Validation Rules
- [ ] Work date must be in the future (not past or today)
- [ ] Work shift must exist in database
- [ ] Employee must exist (when creating for others)
- [ ] Reason field is required (max 500 characters)
- [ ] No duplicate: same employee + date + shift

###  State Transitions
- [ ] PENDING → APPROVED (manager only)
- [ ] PENDING → REJECTED (manager only, requires reason)
- [ ] PENDING → CANCELLED (employee own, or manager any)
- [ ] APPROVED/REJECTED/CANCELLED → Cannot change

###  Auto-Create Employee Shift
- [ ] When OT is APPROVED, system creates EmployeeShift
- [ ] Employee shift has: `source = OT_APPROVAL`, `isOvertime = true`
- [ ] Employee shift references OT request ID
- [ ] Employee shift status is SCHEDULED

###  Security & Access Control
- [ ] Employees see only own requests (VIEW_OT_OWN)
- [ ] Managers see all requests (VIEW_OT_ALL)
- [ ] Returns 404 instead of 403 to hide resource existence
- [ ] JWT token required for all requests
- [ ] Permission checks enforced via @PreAuthorize

---

## Quick Test Checklist for FE Developers

###  Employee Flow (use `nhasi1`)
1.  Login and get token
2.  View own overtime requests (should see only employee 2's requests)
3.  Create new OT request for future date
4.  View detail of own request
5.  Try to view other employee's request (should get 404)
6.  Cancel own pending request
7.  Try to cancel approved request (should fail)
8.  Try to approve request (should get 403 - no permission)
9.  Test validation errors (past date, invalid shift, missing fields)

###  Manager Flow (use `manager`)
10.  Login and get token
11.  View all overtime requests (should see all employees)
12.  Filter by status (PENDING)
13.  Filter by employee
14.  Filter by date range
15.  Approve a pending request
16.  Verify employee shift was auto-created
17.  Reject a pending request with reason
18.  Try to reject without reason (should fail)
19.  Cancel any pending request
20.  Create OT for another employee

---

## Additional Notes

### Request ID Format
- Pattern: `OTRyymmddSSS`
- Example: `OTR251030005` = Overtime Request on 2025-10-30, sequence 005

### Auto-Created Employee Shift Format
- Pattern: `EMSyymmddSSS`
- Example: `EMS251030003` = Employee Shift on 2025-10-30, sequence 003
- Source: `OT_APPROVAL`
- Is Overtime: `true`

### Date Format
- Use ISO 8601: `YYYY-MM-DD`
- Example: `2025-11-18`
- Timezone: Server uses UTC+7 (Vietnam time)

### Pagination
- Default page size: 10
- Max page size: 100
- Page numbers start from 0

---

## Support & Troubleshooting

### Common Issues

**Issue:** 401 Unauthorized
- **Cause:** Missing or expired JWT token
- **Solution:** Login again to get fresh token

**Issue:** 403 Forbidden
- **Cause:** User lacks required permission
- **Solution:** Use correct user account with proper permissions

**Issue:** 404 Not Found on valid request ID
- **Cause:** Security - user doesn't have access to that resource
- **Solution:** This is expected behavior (VIEW_OT_OWN restricts access)

**Issue:** 400 Validation Error
- **Cause:** Invalid input data
- **Solution:** Check error message for specific validation issue

---

## Conclusion

This guide covers all scenarios for Overtime Request Management API testing. Follow the test flows in order, and verify both happy paths and error cases.

**Key Points:**
- Use correct user tokens for different permission levels
- Test data is pre-loaded in database
- All validation rules are enforced
- Auto-create EmployeeShift on approval is critical functionality
- Security uses 404 instead of 403 to hide resource existence

Good luck with testing! 
