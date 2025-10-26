# API Testing Guide - Time Off Request Management (BE-305)

## Overview

This guide provides comprehensive testing instructions for the Time Off Request Management API, including all RBAC permissions, validation scenarios, and edge cases.

---

## Base URL

```
http://localhost:8080/api/v1/time-off-requests
```

---

## Authentication

All requests require JWT Bearer Token:

```
Authorization: Bearer <your_jwt_token>
```

To get a token, login first:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

---

## RBAC Permissions

| Permission                | Description                              |
| ------------------------- | ---------------------------------------- |
| `VIEW_TIME_OFF_ALL`       | Xem tất cả yêu cầu nghỉ phép             |
| `VIEW_TIME_OFF_OWN`       | Chỉ xem yêu cầu nghỉ phép của chính mình |
| `CREATE_TIME_OFF`         | Tạo yêu cầu nghỉ phép                    |
| `APPROVE_TIME_OFF`        | Duyệt yêu cầu nghỉ phép                  |
| `REJECT_TIME_OFF`         | Từ chối yêu cầu nghỉ phép                |
| `CANCEL_TIME_OFF_OWN`     | Tự hủy yêu cầu (khi PENDING)             |
| `CANCEL_TIME_OFF_PENDING` | Quản lý hủy yêu cầu (khi PENDING)        |

---

## Time Off Types

| Type ID  | Name                            | Requires Balance      |
| -------- | ------------------------------- | --------------------- |
| `TOT001` | Nghi phep nam (Annual Leave)    | ✅ Yes (12 days/year) |
| `TOT002` | Nghi om (Sick Leave)            | ❌ No                 |
| `TOT003` | Nghi hieu (Bereavement Leave)   | ❌ No                 |
| `TOT004` | Nghi thai san (Maternity Leave) | ❌ No                 |

---

## Available Slots (for Half-Day Time Off)

| Slot ID          | Name     | Time        |
| ---------------- | -------- | ----------- |
| `SLOT_MORNING`   | Ca sáng  | 07:00-12:00 |
| `SLOT_AFTERNOON` | Ca chiều | 13:00-18:00 |

---

## Test Cases

### STEP 1: Create Time Off Requests

#### Test Case 1.1: Create Full-Day Annual Leave Request

**Objective:** Create a valid full-day annual leave request

**Prerequisites:**

- Login as user with `CREATE_TIME_OFF` permission
- User has available leave balance (check balance first)
- Use future dates

**Request:**

```bash
POST /api/v1/time-off-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 2,
  "timeOffTypeId": "TOT001",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "slotId": null,
  "reason": "Du lịch cùng gia đình 3 ngày"
}
```

**Expected Response:** `201 CREATED`

```json
{
  "requestId": "TOR251020001",
  "employeeId": 2,
  "employeeName": "Nguyen Van B",
  "timeOffTypeId": "TOT001",
  "timeOffTypeName": "Nghi phep nam",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "slotId": null,
  "slotName": null,
  "totalDays": 3.0,
  "reason": "Du lịch cùng gia đình 3 ngày",
  "status": "PENDING",
  "requestedBy": 2,
  "requestedByName": "Nguyen Van B",
  "requestedAt": "2025-10-20T10:30:00",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedReason": null,
  "cancellationReason": null
}
```

**Validation:**

- ✅ Returns 201 Created
- ✅ Request ID generated correctly (TORyymmddSEQ format)
- ✅ Status is PENDING
- ✅ totalDays = 3.0 (full days)
- ✅ slotId is null (full-day leave)

---

#### Test Case 1.2: Create Half-Day Annual Leave Request (Morning)

**Objective:** Create half-day leave for morning shift

**Request:**

```bash
POST /api/v1/time-off-requests
Content-Type: application/json

{
  "employeeId": 2,
  "timeOffTypeId": "TOT001",
  "startDate": "2025-11-25",
  "endDate": "2025-11-25",
  "slotId": "SLOT_MORNING",
  "reason": "Khám bệnh buổi sáng"
}
```

**Expected Response:** `201 CREATED`

```json
{
  "requestId": "TOR251020002",
  "employeeId": 2,
  "timeOffTypeId": "TOT001",
  "timeOffTypeName": "Nghi phep nam",
  "startDate": "2025-11-25",
  "endDate": "2025-11-25",
  "slotId": "SLOT_MORNING",
  "slotName": "Ca sáng",
  "totalDays": 0.5,
  "reason": "Khám bệnh buổi sáng",
  "status": "PENDING"
}
```

**Validation:**

- ✅ totalDays = 0.5 (half day)
- ✅ slotId = "SLOT_MORNING"

---

#### Test Case 1.3: Create Sick Leave Request (No Balance Required)

**Objective:** Create sick leave without checking balance

**Request:**

```bash
POST /api/v1/time-off-requests
Content-Type: application/json

{
  "employeeId": 2,
  "timeOffTypeId": "TOT002",
  "startDate": "2025-10-23",
  "endDate": "2025-10-24",
  "slotId": null,
  "reason": "Bị sốt cao, cần nghỉ ngơi"
}
```

**Expected Response:** `201 CREATED`

```json
{
  "requestId": "TOR251020003",
  "timeOffTypeId": "TOT002",
  "timeOffTypeName": "Nghi om",
  "totalDays": 2.0,
  "status": "PENDING"
}
```

**Validation:**

- ✅ No balance check for sick leave
- ✅ Can be created for past dates (retroactive)

---

#### Test Case 1.4: Validation Error - Insufficient Balance

**Objective:** Test balance validation for annual leave

**Request:**

```bash
POST /api/v1/time-off-requests
Content-Type: application/json

{
  "employeeId": 2,
  "timeOffTypeId": "TOT001",
  "startDate": "2025-12-01",
  "endDate": "2025-12-20",
  "slotId": null,
  "reason": "Nghỉ dài ngày"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Số dư nghỉ phép không đủ. Còn lại: 9.0 ngày, yêu cầu: 20.0 ngày",
  "timestamp": "2025-10-20T10:35:00"
}
```

---

#### Test Case 1.5: Validation Error - Invalid Date Range

**Objective:** Test start_date > end_date validation

**Request:**

```bash
POST /api/v1/time-off-requests
Content-Type: application/json

{
  "employeeId": 2,
  "timeOffTypeId": "TOT001",
  "startDate": "2025-11-30",
  "endDate": "2025-11-25",
  "slotId": null,
  "reason": "Invalid date range"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "startDate must be before or equal to endDate",
  "timestamp": "2025-10-20T10:36:00"
}
```

---

#### Test Case 1.6: Validation Error - Half-Day for Multi-Day Request

**Objective:** Test slotId validation for multi-day requests

**Request:**

```bash
POST /api/v1/time-off-requests
Content-Type: application/json

{
  "employeeId": 2,
  "timeOffTypeId": "TOT001",
  "startDate": "2025-11-25",
  "endDate": "2025-11-27",
  "slotId": "SLOT_MORNING",
  "reason": "Invalid half-day request"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "slotId chỉ được sử dụng cho yêu cầu 1 ngày (startDate = endDate)",
  "timestamp": "2025-10-20T10:37:00"
}
```

---

### STEP 2: View Time Off Requests

#### Test Case 2.1: Get All Requests (VIEW_TIME_OFF_ALL)

**Objective:** Manager views all time off requests with filters

**Request:**

```bash
GET /api/v1/time-off-requests?status=PENDING&page=0&size=10&sort=requestedAt,desc
Authorization: Bearer <manager_token>
```

**Expected Response:** `200 OK`

```json
{
  "content": [
    {
      "requestId": "TOR251020003",
      "employeeId": 2,
      "employeeName": "Nguyen Van B",
      "timeOffTypeId": "TOT002",
      "timeOffTypeName": "Nghi om",
      "startDate": "2025-10-23",
      "endDate": "2025-10-24",
      "totalDays": 2.0,
      "status": "PENDING",
      "requestedAt": "2025-10-20T10:32:00"
    },
    {
      "requestId": "TOR251020002",
      "employeeId": 2,
      "timeOffTypeName": "Nghi phep nam",
      "startDate": "2025-11-25",
      "endDate": "2025-11-25",
      "slotName": "Ca sáng",
      "totalDays": 0.5,
      "status": "PENDING",
      "requestedAt": "2025-10-20T10:31:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 3,
  "totalPages": 1
}
```

**Validation:**

- ✅ Returns all requests from all employees
- ✅ Filtered by status=PENDING
- ✅ Sorted by requestedAt descending

---

#### Test Case 2.2: Get Own Requests Only (VIEW_TIME_OFF_OWN)

**Objective:** Employee views only their own requests

**Request:**

```bash
GET /api/v1/time-off-requests?page=0&size=10
Authorization: Bearer <employee_token>
```

**Expected Response:** `200 OK`

```json
{
  "content": [
    {
      "requestId": "TOR251020001",
      "employeeId": 2,
      "employeeName": "Nguyen Van B",
      "status": "PENDING"
    }
  ],
  "totalElements": 1
}
```

**Validation:**

- ✅ Returns only requests where employeeId = current user's employeeId
- ✅ Cannot see other employees' requests

---

#### Test Case 2.3: Filter by Date Range

**Objective:** Get requests within specific date range

**Request:**

```bash
GET /api/v1/time-off-requests?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <manager_token>
```

**Expected Response:** `200 OK`

- Returns only requests with startDate >= 2025-11-01 AND endDate <= 2025-11-30

---

#### Test Case 2.4: Get Request by ID (Own Request)

**Objective:** View detailed information of a specific request

**Request:**

```bash
GET /api/v1/time-off-requests/TOR251020001
Authorization: Bearer <employee_token>
```

**Expected Response:** `200 OK`

```json
{
  "requestId": "TOR251020001",
  "employeeId": 2,
  "employeeName": "Nguyen Van B",
  "timeOffTypeId": "TOT001",
  "timeOffTypeName": "Nghi phep nam",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "slotId": null,
  "slotName": null,
  "totalDays": 3.0,
  "reason": "Du lịch cùng gia đình 3 ngày",
  "status": "PENDING",
  "requestedBy": 2,
  "requestedByName": "Nguyen Van B",
  "requestedAt": "2025-10-20T10:30:00",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedReason": null,
  "cancellationReason": null
}
```

---

#### Test Case 2.5: Forbidden - View Other Employee's Request

**Objective:** User with VIEW_TIME_OFF_OWN tries to view another employee's request

**Request:**

```bash
GET /api/v1/time-off-requests/TOR251020003
Authorization: Bearer <employee_token_for_employee_1>
```

**Expected Response:** `403 FORBIDDEN`

```json
{
  "status": 403,
  "message": "Bạn không có quyền xem yêu cầu nghỉ phép này",
  "timestamp": "2025-10-20T10:40:00"
}
```

---

### STEP 3: Approve Time Off Requests

#### Test Case 3.1: Successfully Approve Request (APPROVE_TIME_OFF)

**Objective:** Manager approves a pending request

**Prerequisites:**

- Login as user with `APPROVE_TIME_OFF` permission
- Request must be in PENDING status

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020001/approve
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Expected Response:** `200 OK`

```json
{
  "requestId": "TOR251020001",
  "employeeId": 2,
  "status": "APPROVED",
  "approvedBy": 1,
  "approvedByName": "Manager Name",
  "approvedAt": "2025-10-20T11:00:00"
}
```

**Validation:**

- ✅ Status changed from PENDING to APPROVED
- ✅ approvedBy and approvedAt are set
- ✅ Leave balance is deducted (for annual leave)

---

#### Test Case 3.2: Forbidden - No APPROVE_TIME_OFF Permission

**Objective:** Regular employee tries to approve request

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020002/approve
Authorization: Bearer <employee_token>
```

**Expected Response:** `403 FORBIDDEN`

```json
{
  "status": 403,
  "message": "Access Denied",
  "timestamp": "2025-10-20T11:05:00"
}
```

---

#### Test Case 3.3: Error - Approve Non-Pending Request

**Objective:** Try to approve already approved request

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020001/approve
Authorization: Bearer <manager_token>
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Chỉ có thể duyệt yêu cầu ở trạng thái PENDING",
  "timestamp": "2025-10-20T11:10:00"
}
```

---

### STEP 4: Reject Time Off Requests

#### Test Case 4.1: Successfully Reject Request (REJECT_TIME_OFF)

**Objective:** Manager rejects a pending request with reason

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020002/reject
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "rejectedReason": "Không đủ nhân sự trong thời gian này. Vui lòng chọn ngày khác."
}
```

**Expected Response:** `200 OK`

```json
{
  "requestId": "TOR251020002",
  "employeeId": 2,
  "status": "REJECTED",
  "rejectedReason": "Không đủ nhân sự trong thời gian này. Vui lòng chọn ngày khác.",
  "approvedBy": 1,
  "approvedByName": "Manager Name",
  "approvedAt": "2025-10-20T11:15:00"
}
```

**Validation:**

- ✅ Status changed to REJECTED
- ✅ rejectedReason is saved
- ✅ Leave balance is NOT deducted

---

#### Test Case 4.2: Error - Missing rejectedReason

**Objective:** Reject request without providing reason

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020003/reject
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "rejectedReason": ""
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "rejectedReason is required when rejecting a request",
  "timestamp": "2025-10-20T11:20:00"
}
```

---

### STEP 5: Cancel Time Off Requests

#### Test Case 5.1: Employee Cancels Own Pending Request (CANCEL_TIME_OFF_OWN)

**Objective:** Employee cancels their own PENDING request

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020003/cancel
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "cancellationReason": "Đã có kế hoạch khác, không cần nghỉ nữa"
}
```

**Expected Response:** `200 OK`

```json
{
  "requestId": "TOR251020003",
  "employeeId": 2,
  "status": "CANCELLED",
  "cancellationReason": "Đã có kế hoạch khác, không cần nghỉ nữa"
}
```

**Validation:**

- ✅ Status changed to CANCELLED
- ✅ Employee can only cancel their own PENDING requests

---

#### Test Case 5.2: Manager Cancels Any Pending Request (CANCEL_TIME_OFF_PENDING)

**Objective:** Manager cancels any employee's PENDING request

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020004/cancel
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "cancellationReason": "Yêu cầu bị hủy bởi quản lý do lý do khẩn cấp"
}
```

**Expected Response:** `200 OK`

---

#### Test Case 5.3: Error - Cancel Non-Pending Request

**Objective:** Try to cancel already approved request

**Request:**

```bash
PATCH /api/v1/time-off-requests/TOR251020001/cancel
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "cancellationReason": "Đổi ý"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Chỉ có thể hủy yêu cầu ở trạng thái PENDING",
  "timestamp": "2025-10-20T11:30:00"
}
```

---

### STEP 6: Check Leave Balance

#### Test Case 6.1: Get Employee Leave Balance

**Objective:** View current leave balance for an employee

**Request:**

```bash
GET /api/v1/leave-balances?employeeId=2&year=2025
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "employeeId": 2,
  "employeeName": "Nguyen Van B",
  "year": 2025,
  "balances": [
    {
      "timeOffTypeId": "TOT001",
      "timeOffTypeName": "Nghi phep nam",
      "totalAllotted": 12.0,
      "used": 3.5,
      "remaining": 8.5
    }
  ]
}
```

**Validation:**

- ✅ remaining = totalAllotted - used
- ✅ used includes all APPROVED requests

---

## Error Responses Reference

| Status Code | Message                                 | Cause                                    |
| ----------- | --------------------------------------- | ---------------------------------------- |
| 400         | "Insufficient leave balance"            | Not enough days remaining                |
| 400         | "startDate must be before endDate"      | Invalid date range                       |
| 400         | "slotId only for single-day requests"   | Multi-day with slotId                    |
| 400         | "Only PENDING requests can be approved" | Wrong status                             |
| 400         | "rejectedReason is required"            | Missing rejection reason                 |
| 403         | "Access Denied"                         | Missing required permission              |
| 403         | "Không có quyền xem yêu cầu này"        | Viewing other's request without VIEW_ALL |
| 404         | "Time off request not found"            | Invalid requestId                        |
| 404         | "Time off type not found"               | Invalid timeOffTypeId                    |

---

## Notes

1. **Balance Deduction Logic:**

   - Balance is deducted ONLY when request is APPROVED
   - If request is REJECTED or CANCELLED, balance is NOT deducted
   - Half-day requests deduct 0.5 days

2. **Permission Hierarchy:**

   - `VIEW_TIME_OFF_ALL` includes `VIEW_TIME_OFF_OWN`
   - `CANCEL_TIME_OFF_PENDING` includes `CANCEL_TIME_OFF_OWN`

3. **Date Calculations:**

   - Weekend days (Sat/Sun) are INCLUDED in totalDays calculation
   - Holiday dates are INCLUDED in totalDays calculation
   - Only working days can be excluded by custom business rules

4. **Request ID Format:**
   - Format: `TORyymmddSSS` (TOR + year(2) + month(2) + day(2) + sequence(3))
   - Example: `TOR251020001` = Time Off Request on Oct 20, 2025, sequence 001

---

## Test Execution Checklist

- [ ] Test all CREATE validations (1.1 - 1.6)
- [ ] Test VIEW permissions (2.1 - 2.5)
- [ ] Test APPROVE flow (3.1 - 3.3)
- [ ] Test REJECT flow (4.1 - 4.2)
- [ ] Test CANCEL flows (5.1 - 5.3)
- [ ] Verify leave balance calculations (6.1)
- [ ] Test all error responses
- [ ] Test pagination and sorting
- [ ] Test filter combinations

---

**Last Updated:** October 22, 2025
**API Version:** v1
**Feature:** BE-305 - Time Off Request Management
