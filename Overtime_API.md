# API Testing Guide - Overtime Request Management (BE-304)

## Overview
This guide helps frontend developers test all API endpoints for the Overtime Request Management feature with comprehensive test cases covering all RBAC permissions and validation scenarios.

---

## Base URL
```
http://localhost:8080/api/v1/overtime-requests
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

| Permission | Description |
|-----------|-------------|
| `VIEW_OT_ALL` | Xem tất cả yêu cầu OT |
| `VIEW_OT_OWN` | Chỉ xem yêu cầu OT của chính mình |
| `CREATE_OT` | Tạo yêu cầu OT |
| `APPROVE_OT` | Duyệt yêu cầu OT |
| `REJECT_OT` | Từ chối yêu cầu OT |
| `CANCEL_OT_OWN` | Tự hủy yêu cầu OT (khi đang PENDING) |
| `CANCEL_OT_PENDING` | Quản lý hủy yêu cầu OT (khi đang PENDING) |

---

## Available Work Shifts

| Shift ID | Name | Time |
|----------|------|------|
| `WKS_MORNING_01` | Ca sáng 1 | 07:00-11:00 |
| `WKS_AFTERNOON_01` | Ca chiều 1 | 13:00-17:00 |
| `WKS_MORNING_02` | Ca sáng 2 | 08:00-12:00 |
| `WKS_AFTERNOON_02` | Ca chiều 2 | 14:00-18:00 |

---

## Test Cases

> **Important Note:** These test cases are ordered to work from a clean database state. Follow the steps sequentially:
> 
> **Test Execution Flow:**
> 1. **Step 1** - Create 4 overtime requests (OTR251115001 → OTR251118001)
> 2. **Step 2** - Test viewing list with different permissions
> 3. **Step 3** - Test viewing individual request details (creates OTR251119001 for employee 3)
> 4. **Step 4** - Test validation errors when creating
> 5. **Step 5** - Test updating status (approve, reject, cancel)
> 
> **Status After Step 5:**
> - OTR251115001: APPROVED (Test 5.1)
> - OTR251116001: PENDING (Tests 5.2-5.9 may attempt but fail)
> - OTR251117001: REJECTED (Test 5.3)
> - OTR251118001: CANCELLED (Test 5.6)
> - OTR251119001: CANCELLED by manager (Test 5.8)

---

## Step 1: Setup & Create Test Data

### 1. POST /api/v1/overtime-requests - Tạo yêu cầu OT

#### Test Case 1.1: Successfully create first overtime request
**Objective:** Create a valid overtime request to use for subsequent tests

**Prerequisites:**
- Login as user with `CREATE_OT` permission (e.g., Manager or Employee)
- Use valid employee_id (e.g., 2)
- Use valid shift_id (e.g., WKS_MORNING_01)
- Use future date

**Request:**
```bash
POST /api/v1/overtime-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-15",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Cần hoàn thành dự án quan trọng"
}
```

**Expected Response:** `201 CREATED`
```json
{
  "requestId": "OTR251115001",
  "employeeId": 2,
  "employeeName": "Nguyen Van A",
  "workDate": "2025-11-15",
  "workShiftId": "WKS_MORNING_01",
  "workShiftName": "Ca sáng 1",
  "status": "PENDING",
  "reason": "Cần hoàn thành dự án quan trọng",
  "requestedBy": 1,
  "requestedByName": "Current User",
  "createdAt": "2025-10-21T14:30:00"
}
```

**Validation:**
- ✅ Returns 201 Created
- ✅ Business ID generated correctly (OTRyymmddSEQ format)
- ✅ Status is PENDING
- ✅ requestedBy is automatically set to current user

**Save this for later tests:** `OTR251115001`

---

#### Test Case 1.2: Create second overtime request (different date)
**Objective:** Create another request for testing list view

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-16",
  "workShiftId": "WKS_AFTERNOON_01",
  "reason": "Hỗ trợ ca chiều do thiếu người"
}
```

**Expected Response:** `201 CREATED`
```json
{
  "requestId": "OTR251116001",
  "employeeId": 2,
  "workDate": "2025-11-16",
  "workShiftId": "WKS_AFTERNOON_01",
  "status": "PENDING",
  ...
}
```

**Save this for later tests:** `OTR251116001`

---

#### Test Case 1.3: Create third overtime request (for rejection test)
**Objective:** Create a request to test rejection

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-17",
  "workShiftId": "WKS_MORNING_02",
  "reason": "Tăng ca để hoàn thành báo cáo"
}
```

**Expected Response:** `201 CREATED`
```json
{
  "requestId": "OTR251117001",
  ...
}
```

**Save this for later tests:** `OTR251117001`

---

#### Test Case 1.4: Create fourth overtime request (for cancellation test)
**Objective:** Create a request to test cancellation

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-18",
  "workShiftId": "WKS_AFTERNOON_02",
  "reason": "Tăng ca xử lý công việc tồn đọng"
}
```

**Expected Response:** `201 CREATED`
```json
{
  "requestId": "OTR251118001",
  ...
}
```

**Save this for later tests:** `OTR251118001`

---

## Step 2: View & List Operations

### 2. GET /api/v1/overtime-requests - Lấy danh sách yêu cầu OT

#### Test Case 2.1: Manager with VIEW_OT_ALL permission
**Objective:** Verify that user with `VIEW_OT_ALL` can see all overtime requests

**Prerequisites:**
- Login as user with `VIEW_OT_ALL` permission (e.g., ROLE_MANAGER)
- Complete Step 1 (created 4 overtime requests)

**Request:**
```bash
GET /api/v1/overtime-requests
Authorization: Bearer <manager_token>
```

**Query Parameters (Optional):**
```
?page=0&size=10&sort=createdAt,desc
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251118001",
      "employeeId": 2,
      "employeeName": "Nguyen Van A",
      "workDate": "2025-11-18",
      "status": "PENDING",
      ...
    },
    {
      "requestId": "OTR251117001",
      "workDate": "2025-11-17",
      "status": "PENDING",
      ...
    },
    {
      "requestId": "OTR251116001",
      "workDate": "2025-11-16",
      "status": "PENDING",
      ...
    },
    {
      "requestId": "OTR251115001",
      "workDate": "2025-11-15",
      "status": "PENDING",
      ...
    }
  ],
  "pageable": { ... },
  "totalElements": 4,
  "totalPages": 1
}
```

**Validation:**
- ✅ Returns all 4 overtime requests created in Step 1
- ✅ Includes requests from all employees
- ✅ Pagination works correctly
- ✅ Sorted by latest first (descending date)

---

#### Test Case 2.2: Employee with VIEW_OT_OWN permission
**Objective:** Verify that user with only `VIEW_OT_OWN` can only see their own requests

**Prerequisites:**
- Login as employee (employee_id: 2) with only `VIEW_OT_OWN` permission
- This employee's requests were created in Step 1

**Request:**
```bash
GET /api/v1/overtime-requests
Authorization: Bearer <employee_token>
```

**Expected Response:** `200 OK`
```json
{
  "content": [
    {
      "requestId": "OTR251118001",
      "employeeId": 2,
      "employeeName": "Nguyen Van A",
      "workDate": "2025-11-18",
      "status": "PENDING",
      ...
    },
    {
      "requestId": "OTR251117001",
      "employeeId": 2,
      ...
    },
    {
      "requestId": "OTR251116001",
      "employeeId": 2,
      ...
    },
    {
      "requestId": "OTR251115001",
      "employeeId": 2,
      ...
    }
  ],
  "totalElements": 4
}
```

**Validation:**
- ✅ Returns only requests where `employeeId` = 2 (current employee)
- ✅ Does NOT include requests from other employees (if any exist)
- ✅ Employee cannot see other employees' overtime requests

---

### 3. GET /api/v1/overtime-requests/{request_id} - Xem chi tiết yêu cầu OT

#### Test Case 3.1: View specific request detail
**Objective:** View full details of a specific overtime request

**Prerequisites:**
- Login with appropriate permission (VIEW_OT_ALL or VIEW_OT_OWN)
- Use one of the request IDs created in Step 1

**Request:**
```bash
GET /api/v1/overtime-requests/OTR251115001
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251115001",
  "employeeId": 2,
  "employeeName": "Nguyen Van A",
  "workDate": "2025-11-15",
  "workShiftId": "WKS_MORNING_01",
  "workShiftName": "Ca sáng 1",
  "status": "PENDING",
  "reason": "Cần hoàn thành dự án quan trọng",
  "requestedBy": 1,
  "requestedByName": "Current User",
  "createdAt": "2025-10-21T14:30:00"
}
```

**Validation:**
- ✅ Returns full details of the request
- ✅ All fields are populated correctly

---

#### Test Case 3.2: Employee tries to view other employee's request (should fail)
**Objective:** Employee with VIEW_OT_OWN cannot view other employee's requests

**Prerequisites:**
- Login as employee with only `VIEW_OT_OWN` permission
- Create a request for a different employee first (employee_id: 3)

**Setup - Create request for employee 3:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 3,
  "workDate": "2025-11-19",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Test request for different employee"
}
```
*This should return OTR251119001*

**Now try to view it as employee 2:**
```bash
GET /api/v1/overtime-requests/OTR251119001
Authorization: Bearer <employee_2_token>
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "code": "OT_REQUEST_NOT_FOUND",
  "message": "Không tìm thấy yêu cầu làm thêm giờ."
}
```

**Validation:**
- ✅ Returns 404 (not 403) for security reasons
- ✅ Employee cannot see requests that don't belong to them

---

#### Test Case 3.3: Manager views any request with VIEW_OT_ALL
**Objective:** Manager can view any employee's request

**Prerequisites:**
- Login as manager with `VIEW_OT_ALL`
- Use any request ID from Step 1

**Request:**
```bash
GET /api/v1/overtime-requests/OTR251115001
Authorization: Bearer <manager_token>
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251115001",
  "employeeId": 2,
  "employeeName": "Nguyen Van A",
  ...
}
```

**Validation:**
- ✅ Returns details of any request regardless of employee
- ✅ Manager has full visibility

---

#### Test Case 3.4: Non-existent request
**Objective:** System returns 404 for non-existent request

**Request:**
```bash
GET /api/v1/overtime-requests/OTR999999999
Authorization: Bearer <token>
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "code": "OT_REQUEST_NOT_FOUND",
  "message": "Không tìm thấy yêu cầu làm thêm giờ."
}
```

---

## Step 3: Validation Tests (Create Operation)

### Test Invalid Create Scenarios

#### Test Case 4.1: Create request with non-existent employee
**Objective:** Validate employee existence

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 9999,
  "workDate": "2025-11-15",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Test"
}
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "code": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Nhân viên hoặc Ca làm việc không tồn tại."
}
```

**Validation:**
- ✅ Returns 404 for non-existent employee
- ✅ Request is not created

---

#### Test Case 4.2: Create request with non-existent work shift
**Objective:** Validate work shift existence

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-15",
  "workShiftId": "INVALID_SHIFT",
  "reason": "Test"
}
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "code": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Nhân viên hoặc Ca làm việc không tồn tại."
}
```

**Validation:**
- ✅ Returns 404 for non-existent shift
- ✅ Request is not created

---

#### Test Case 4.3: Create request with past date
**Objective:** Validate work date is not in the past

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-10-20",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Test past date"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "message": "Ngày làm việc không được ở quá khứ."
}
```

**Validation:**
- ✅ Returns 400 for past dates
- ✅ Error message is clear

---

#### Test Case 4.4: Create duplicate request (conflict)
**Objective:** Prevent duplicate overtime requests for same employee, date, and shift

**Prerequisites:**
- OTR251115001 already exists from Step 1:
  - Employee: 2
  - Date: 2025-11-15
  - Shift: WKS_MORNING_01
  - Status: PENDING

**Request:**
```bash
POST /api/v1/overtime-requests
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-15",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Another request"
}
```

**Expected Response:** `409 CONFLICT`
```json
{
  "code": "DUPLICATE_OT_REQUEST",
  "message": "Nhân viên đã đăng ký tăng ca cho ca làm việc này."
}
```

**Validation:**
- ✅ Returns 409 Conflict
- ✅ Prevents duplicate registration
- ✅ Unique constraint enforced (employee + date + shift)

---

#### Test Case 4.5: Create without CREATE_OT permission
**Objective:** Verify permission enforcement

**Prerequisites:**
- Login as user without `CREATE_OT` permission

**Request:**
```bash
POST /api/v1/overtime-requests
Authorization: Bearer <token_without_permission>
Content-Type: application/json

{
  "employeeId": 2,
  "workDate": "2025-11-15",
  "workShiftId": "WKS_MORNING_01",
  "reason": "Test"
}
```

**Expected Response:** `403 FORBIDDEN`
```json
{
  "code": "FORBIDDEN",
  "message": "Bạn không có quyền thực hiện hành động này."
}
```

---

## Step 4: Update Status Operations

### 4. PATCH /api/v1/overtime-requests/{request_id} - Cập nhật trạng thái

#### Test Case 5.1: Approve overtime request
**Objective:** Manager approves a pending request

**Prerequisites:**
- Login as user with `APPROVE_OT` permission
- Use OTR251115001 created in Step 1 (status: PENDING)

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251115001
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "status": "APPROVED"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251115001",
  "status": "APPROVED",
  "approvedBy": 1,
  "approvedByName": "Manager Name",
  "approvedAt": "2025-10-21T15:00:00",
  ...
}
```

**Validation:**
- ✅ Status changed to APPROVED
- ✅ approvedBy field populated
- ✅ approvedAt timestamp recorded
- ✅ System automatically creates record in employee_shifts table with:
  - is_overtime = true
  - source = 'OT_APPROVAL'
  - source_ot_request_id = request_id

---

#### Test Case 5.2: Approve without APPROVE_OT permission
**Objective:** Verify permission enforcement for approval

**Prerequisites:**
- Login as user without `APPROVE_OT` permission
- Use OTR251116001 which is still PENDING

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251116001
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "status": "APPROVED"
}
```

**Expected Response:** `403 FORBIDDEN`
```json
{
  "code": "FORBIDDEN",
  "message": "Bạn không có quyền thực hiện hành động này."
}
```

---

#### Test Case 5.3: Reject overtime request with reason
**Objective:** Manager rejects a pending request

**Prerequisites:**
- Login as user with `REJECT_OT` permission
- Use OTR251117001 created in Step 1 (status: PENDING)

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251117001
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "status": "REJECTED",
  "reason": "Không đủ ngân sách cho tháng này"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251117001",
  "status": "REJECTED",
  "rejectedReason": "Không đủ ngân sách cho tháng này",
  "approvedBy": 1,
  "approvedAt": "2025-10-21T15:10:00",
  ...
}
```

**Validation:**
- ✅ Status changed to REJECTED
- ✅ rejectedReason saved
- ✅ approvedBy and approvedAt recorded (person who rejected)

---

#### Test Case 5.4: Reject without reason (should fail)
**Objective:** Verify reason is required for rejection

**Prerequisites:**
- Use OTR251116001 which is still PENDING

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251116001
Content-Type: application/json

{
  "status": "REJECTED"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "message": "Lý do từ chối là bắt buộc."
}
```

**Validation:**
- ✅ Returns 400 when reason is missing
- ✅ Status is not changed

---

#### Test Case 5.5: Reject without REJECT_OT permission
**Objective:** Verify permission enforcement for rejection

**Prerequisites:**
- Login as user without `REJECT_OT` permission
- Use OTR251116001 which should still be PENDING (if Test 5.4 failed as expected)

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251116001
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "status": "REJECTED",
  "reason": "Test"
}
```

**Expected Response:** `403 FORBIDDEN`
```json
{
  "code": "FORBIDDEN",
  "message": "Bạn không có quyền thực hiện hành động này."
}
```

---

#### Test Case 5.6: Employee cancels own pending request
**Objective:** Employee with CANCEL_OT_OWN can cancel their own request

**Prerequisites:**
- Login as employee (employee_id: 2) with `CANCEL_OT_OWN` permission
- Use OTR251118001 created in Step 1 (status: PENDING)

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251118001
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "status": "CANCELLED",
  "reason": "Có việc đột xuất không thể tham gia"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251118001",
  "status": "CANCELLED",
  "cancellationReason": "Có việc đột xuất không thể tham gia",
  ...
}
```

**Validation:**
- ✅ Status changed to CANCELLED
- ✅ cancellationReason saved
- ✅ Employee can cancel their own request

---

#### Test Case 5.7: Employee tries to cancel other's request (should fail)
**Objective:** Employee cannot cancel requests that don't belong to them

**Prerequisites:**
- Login as employee (employee_id: 2) with `CANCEL_OT_OWN`
- Use request OTR251119001 created in Test Case 3.2 (belongs to employee 3)

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251119001
Authorization: Bearer <employee_2_token>
Content-Type: application/json

{
  "status": "CANCELLED",
  "reason": "Test"
}
```

**Expected Response:** `403 FORBIDDEN`
```json
{
  "code": "FORBIDDEN",
  "message": "Bạn không có quyền thực hiện hành động này."
}
```

**Validation:**
- ✅ Employee cannot cancel other employees' requests
- ✅ Only own requests can be cancelled with CANCEL_OT_OWN

---

#### Test Case 5.8: Manager cancels any pending request
**Objective:** Manager with CANCEL_OT_PENDING can cancel any request

**Prerequisites:**
- Login as manager with `CANCEL_OT_PENDING` permission
- Use OTR251119001 (belongs to employee 3, status: PENDING)

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251119001
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "status": "CANCELLED",
  "reason": "Thay đổi kế hoạch nhân sự"
}
```

**Expected Response:** `200 OK`
```json
{
  "requestId": "OTR251119001",
  "status": "CANCELLED",
  "cancellationReason": "Thay đổi kế hoạch nhân sự",
  ...
}
```

**Validation:**
- ✅ Manager can cancel any pending request
- ✅ Reason is saved

---

#### Test Case 5.9: Cancel without reason (should fail)
**Objective:** Verify reason is required for cancellation

**Prerequisites:**
- Use OTR251116001 which should still be PENDING

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251116001
Content-Type: application/json

{
  "status": "CANCELLED"
}
```

**Expected Response:** `400 BAD REQUEST`
```json
{
  "message": "Lý do hủy là bắt buộc."
}
```

**Validation:**
- ✅ Returns 400 when reason is missing
- ✅ Status is not changed

---

#### Test Case 5.10: Try to update non-PENDING request (should fail)
**Objective:** Verify state machine - only PENDING requests can be updated

**Prerequisites:**
- OTR251115001 was already APPROVED in Test Case 5.1

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR251115001
Content-Type: application/json

{
  "status": "REJECTED",
  "reason": "Test"
}
```

**Expected Response:** `409 CONFLICT`
```json
{
  "code": "INVALID_STATE_TRANSITION",
  "message": "Không thể cập nhật yêu cầu. Yêu cầu phải ở trạng thái PENDING."
}
```

**Validation:**
- ✅ Returns 409 Conflict
- ✅ Cannot change status of APPROVED/REJECTED/CANCELLED requests
- ✅ State machine enforced

---

#### Test Case 5.11: Update non-existent request
**Objective:** Verify 404 for non-existent requests

**Request:**
```bash
PATCH /api/v1/overtime-requests/OTR999999999
Content-Type: application/json

{
  "status": "APPROVED"
}
```

**Expected Response:** `404 NOT FOUND`
```json
{
  "code": "OT_REQUEST_NOT_FOUND",
  "message": "Không tìm thấy yêu cầu làm thêm giờ."
}
```

---

## Test Data Setup

### Recommended Test Users

1. **Manager Account**
   - Permissions: All 7 overtime permissions
   - Use for: Approval, rejection, viewing all requests, cancelling any request

2. **Employee Account (Doctor/Nurse)**
   - Permissions: VIEW_OT_OWN, CREATE_OT, CANCEL_OT_OWN
   - Use for: Creating own requests, viewing own requests, cancelling own requests

3. **Limited Account**
   - Permissions: None or minimal
   - Use for: Testing permission denied scenarios

### Sample Employees for Testing
- Employee ID 2: Use for most test cases
- Employee ID 3-5: Use for conflict and multi-employee scenarios

### Sample Work Shifts
All shifts listed in the "Available Work Shifts" section above are available for testing.

---

## Status Flow Diagram

```
[CREATE] → PENDING
              ↓
      ┌───────┼───────┐
      ↓       ↓       ↓
  APPROVED REJECTED CANCELLED
```

**Important Rules:**
- Only PENDING requests can change status
- Once APPROVED, REJECTED, or CANCELLED, the status is final
- All status changes require appropriate permissions
- REJECT and CANCEL require a reason

---

## Common Error Codes

| HTTP Status | Error Code | Message |
|-------------|-----------|---------|
| 400 | BAD_REQUEST | Validation errors (missing fields, past date) |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | OT_REQUEST_NOT_FOUND | Request not found |
| 404 | RELATED_RESOURCE_NOT_FOUND | Employee or work shift not found |
| 409 | DUPLICATE_OT_REQUEST | Duplicate request for same employee/date/shift |
| 409 | INVALID_STATE_TRANSITION | Cannot update non-PENDING request |

---

## Testing Checklist

### Create Overtime Request (POST)
- [ ] Create with valid data → 201 Created
- [ ] Create with non-existent employee → 404
- [ ] Create with non-existent shift → 404
- [ ] Create with past date → 400
- [ ] Create duplicate (same employee/date/shift) → 409
- [ ] Create without CREATE_OT permission → 403

### View Overtime Requests (GET List)
- [ ] Manager with VIEW_OT_ALL sees all requests → 200
- [ ] Employee with VIEW_OT_OWN sees only own requests → 200
- [ ] Pagination works correctly

### View Overtime Request Detail (GET by ID)
- [ ] Manager with VIEW_OT_ALL views any request → 200
- [ ] Employee with VIEW_OT_OWN views own request → 200
- [ ] Employee tries to view other's request → 404
- [ ] View non-existent request → 404

### Approve Request (PATCH)
- [ ] Approve with APPROVE_OT permission → 200
- [ ] Approve without permission → 403
- [ ] Approve non-PENDING request → 409
- [ ] Verify employee_shifts record created automatically

### Reject Request (PATCH)
- [ ] Reject with reason and REJECT_OT permission → 200
- [ ] Reject without reason → 400
- [ ] Reject without permission → 403
- [ ] Reject non-PENDING request → 409

### Cancel Request (PATCH)
- [ ] Employee cancels own request with CANCEL_OT_OWN → 200
- [ ] Employee tries to cancel other's request → 403
- [ ] Manager cancels any request with CANCEL_OT_PENDING → 200
- [ ] Cancel without reason → 400
- [ ] Cancel non-PENDING request → 409

---

## Notes for Frontend Developers

1. **Date Format:** Use ISO 8601 format: `YYYY-MM-DD`
2. **Business ID Format:** System generates IDs as `OTRyymmddSEQ` (e.g., OTR251115001)
3. **Pagination:** Default page size is 10, can be adjusted with `size` parameter
4. **Permission Checking:** Always check user permissions before showing action buttons
5. **Status Display:** Show status with appropriate colors:
   - PENDING: Yellow/Warning
   - APPROVED: Green/Success
   - REJECTED: Red/Danger
   - CANCELLED: Gray/Secondary
6. **Reason Fields:** Show rejection/cancellation reasons when status is REJECTED/CANCELLED
7. **Auto-refresh:** After status change, refresh the list/detail view
8. **Employee Shifts:** After approval, the system creates employee_shifts record automatically

---

## Support

If you encounter any issues during testing:
1. Check the application logs for detailed error messages
2. Verify your JWT token is valid and not expired
3. Confirm the user has the required permissions
4. Check database for data consistency

**Backend API Version:** 1.0  
**Last Updated:** October 21, 2025
