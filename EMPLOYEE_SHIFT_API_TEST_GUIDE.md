# Employee Shift Management API - Test Guide (BE-307)

## 📋 Overview
This guide provides comprehensive test cases for all 6 Employee Shift Management API endpoints, covering happy paths, error scenarios, and edge cases.

---

## 🔑 Test Users & Permissions

### Users (Password: `123456`)
| Username | Role | Employee ID | Permissions |
|----------|------|-------------|-------------|
| `manager` | ROLE_MANAGER | 7 | All 6 shift permissions |
| `ketoan` | ROLE_ACCOUNTANT | 5 | VIEW_SHIFTS_OWN only |
| `nhasi1` | ROLE_DOCTOR | 2 | VIEW_SHIFTS_OWN only |
| `nhasi2` | ROLE_DOCTOR | 3 | VIEW_SHIFTS_OWN only |
| `letan` | ROLE_RECEPTIONIST | 4 | VIEW_SHIFTS_OWN only |
| `yta` | ROLE_NURSE | 6 | VIEW_SHIFTS_OWN only |

### Permission Matrix
| Permission | Manager | Ketoan | Others |
|------------|---------|--------|--------|
| VIEW_SHIFTS_ALL | ✅ | ❌ | ❌ |
| VIEW_SHIFTS_OWN | ✅ | ✅ | ✅ |
| VIEW_SHIFTS_SUMMARY | ✅ | ❌ | ❌ |
| CREATE_SHIFTS | ✅ | ❌ | ❌ |
| UPDATE_SHIFTS | ✅ | ❌ | ❌ |
| DELETE_SHIFTS | ✅ | ❌ | ❌ |

---

## 📊 Sample Data Overview

### Employee Shifts in Database
```
November 2025 (Current Month):
├── employee_id=2 (nhasi1): EMS251101001, EMS251101002, EMS251101003
├── employee_id=3 (nhasi2): EMS251101004, EMS251101005
├── employee_id=4 (letan): EMS251101006, EMS251101007
├── employee_id=5 (ketoan): EMS251101008, EMS251101009, EMS251101010
├── employee_id=6 (yta): EMS251101011, EMS251101012
└── employee_id=7 (manager): EMS251101013, EMS251101014

December 2025 (Future Month):
├── EMS251201001, EMS251201002, EMS251201003

October 2025 (Past Month):
├── EMS251001001, EMS251001002, EMS251001003
```

### Status Distribution
- **SCHEDULED**: 11 shifts (normal upcoming shifts)
- **COMPLETED**: 5 shifts (finished shifts)
- **CANCELLED**: 2 shifts (canceled shifts)
- **ON_LEAVE**: 1 shift (leave request approved)

### Shift Types
- **MANUAL_ENTRY**: 13 shifts (created manually)
- **BATCH_JOB**: 7 shifts (auto-generated)

---

## 🧪 Test Cases

### 1️⃣ GET /api/v1/shifts - Get Shift Calendar

#### ✅ Happy Path Tests

**Test 1.1: Manager views all shifts in November**
```bash
GET /api/v1/shifts?start_date=2025-11-01&end_date=2025-11-30
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK` with 14 shifts (all employees)
✅ Contains: employee_id 2,3,4,5,6,7

---

**Test 1.2: Manager filters by employee_id=5**
```bash
GET /api/v1/shifts?start_date=2025-11-01&end_date=2025-11-30&employee_id=5
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK` with 3 shifts (ketoan only)
✅ All shifts have employee_id=5

---

**Test 1.3: Manager filters by status=SCHEDULED**
```bash
GET /api/v1/shifts?start_date=2025-11-01&end_date=2025-11-30&status=SCHEDULED
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK` with SCHEDULED shifts only
✅ No COMPLETED/CANCELLED/ON_LEAVE shifts

---

**Test 1.4: Ketoan views own shifts (VIEW_SHIFTS_OWN)**
```bash
GET /api/v1/shifts?start_date=2025-11-01&end_date=2025-11-30
Authorization: Bearer {ketoan_token}
```
✅ Expected: `200 OK` with 3 shifts
✅ All shifts have employee_id=5 (auto-filtered)

---

#### ❌ Error Cases

**Test 1.5: Missing date parameters**
```bash
GET /api/v1/shifts
Authorization: Bearer {manager_token}
```
❌ Expected: `400 BAD_REQUEST`
```json
{
  "statusCode": 400,
  "error": "INVALID_DATE_RANGE",
  "message": "Vui lòng cung cấp ngày bắt đầu và ngày kết thúc hợp lệ."
}
```

---

**Test 1.6: Invalid date format**
```bash
GET /api/v1/shifts?start_date=01-11-2025&end_date=30-11-2025
Authorization: Bearer {manager_token}
```
❌ Expected: `400 BAD_REQUEST`
```json
{
  "statusCode": 400,
  "error": "INVALID_DATE_FORMAT",
  "message": "Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD."
}
```

---

**Test 1.7: Ketoan tries to view other employee's shifts**
```bash
GET /api/v1/shifts?start_date=2025-11-01&end_date=2025-11-30&employee_id=2
Authorization: Bearer {ketoan_token}
```
❌ Expected: `403 FORBIDDEN`
```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập."
}
```

---

### 2️⃣ GET /api/v1/shifts/{shift_id} - Get Shift Detail

#### ✅ Happy Path Tests

**Test 2.1: Manager views any shift detail**
```bash
GET /api/v1/shifts/EMS251101001
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK` with full shift details
```json
{
  "statusCode": 200,
  "data": {
    "employeeShiftId": "EMS251101001",
    "employeeId": 2,
    "workShiftId": "WKS_MORNING_01",
    "workDate": "2025-11-03",
    "status": "SCHEDULED",
    "shiftType": "MANUAL_ENTRY",
    "notes": "Ca sáng thứ 2"
  }
}
```

---

**Test 2.2: Ketoan views own shift**
```bash
GET /api/v1/shifts/EMS251101008
Authorization: Bearer {ketoan_token}
```
✅ Expected: `200 OK` (employee_id=5 matches ketoan)

---

#### ❌ Error Cases

**Test 2.3: Shift not found**
```bash
GET /api/v1/shifts/EMS999999999
Authorization: Bearer {manager_token}
```
❌ Expected: `404 NOT_FOUND`
```json
{
  "statusCode": 404,
  "error": "SHIFT_NOT_FOUND",
  "message": "Ca làm việc không tồn tại hoặc bạn không có quyền truy cập."
}
```

---

**Test 2.4: Ketoan tries to view other's shift**
```bash
GET /api/v1/shifts/EMS251101001
Authorization: Bearer {ketoan_token}
```
❌ Expected: `404 NOT_FOUND` (security: return 404 instead of 403)
```json
{
  "statusCode": 404,
  "error": "SHIFT_NOT_FOUND",
  "message": "Ca làm việc không tồn tại hoặc bạn không có quyền truy cập."
}
```

---

### 3️⃣ GET /api/v1/shifts/summary - Get Shift Summary

#### ✅ Happy Path Tests

**Test 3.1: Manager gets November summary**
```bash
GET /api/v1/shifts/summary?start_date=2025-11-01&end_date=2025-11-30
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK` with statistics
```json
{
  "statusCode": 200,
  "data": {
    "totalShifts": 14,
    "byStatus": {
      "SCHEDULED": 8,
      "COMPLETED": 4,
      "CANCELLED": 1,
      "ON_LEAVE": 1
    },
    "byEmployee": [
      {"employeeId": 2, "count": 3},
      {"employeeId": 3, "count": 2},
      ...
    ]
  }
}
```

---

**Test 3.2: Manager filters summary by employee_id=5**
```bash
GET /api/v1/shifts/summary?start_date=2025-11-01&end_date=2025-11-30&employee_id=5
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK` with ketoan's stats only

---

#### ❌ Error Cases

**Test 3.3: Ketoan lacks VIEW_SHIFTS_SUMMARY permission**
```bash
GET /api/v1/shifts/summary?start_date=2025-11-01&end_date=2025-11-30
Authorization: Bearer {ketoan_token}
```
❌ Expected: `403 FORBIDDEN`
```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập."
}
```

---

### 4️⃣ POST /api/v1/shifts - Create Manual Shift

#### ✅ Happy Path Tests

**Test 4.1: Manager creates shift for employee_id=2**
```bash
POST /api/v1/shifts
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "employee_id": 2,
  "work_date": "2025-11-20",
  "work_shift_id": "WKS_MORNING_01",
  "notes": "Ca thêm do thiếu nhân sự"
}
```
✅ Expected: `201 CREATED`
```json
{
  "statusCode": 201,
  "message": "Tạo ca làm việc thành công",
  "data": {
    "employeeShiftId": "EMS251120XXX",
    "status": "SCHEDULED",
    "shiftType": "MANUAL_ENTRY"
  }
}
```

---

**Test 4.2: Manager creates part-time shift**
```bash
POST /api/v1/shifts
Content-Type: application/json

{
  "employee_id": 4,
  "work_date": "2025-11-21",
  "work_shift_id": "WKS_AFTERNOON_02",
  "notes": "Ca part-time"
}
```
✅ Expected: `201 CREATED`

---

#### ❌ Error Cases

**Test 4.3: Ketoan lacks CREATE_SHIFTS permission**
```bash
POST /api/v1/shifts
Authorization: Bearer {ketoan_token}
Content-Type: application/json

{
  "employee_id": 5,
  "work_date": "2025-11-20",
  "work_shift_id": "WKS_MORNING_01"
}
```
❌ Expected: `403 FORBIDDEN`

---

**Test 4.4: Invalid employee_id**
```bash
POST /api/v1/shifts
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "employee_id": 99999,
  "work_date": "2025-11-20",
  "work_shift_id": "WKS_MORNING_01"
}
```
❌ Expected: `404 NOT_FOUND`
```json
{
  "statusCode": 404,
  "error": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Nhân viên không tồn tại"
}
```

---

**Test 4.5: Invalid work_shift_id**
```bash
POST /api/v1/shifts
Content-Type: application/json

{
  "employee_id": 2,
  "work_date": "2025-11-20",
  "work_shift_id": "WKS_INVALID"
}
```
❌ Expected: `404 NOT_FOUND`
```json
{
  "statusCode": 404,
  "error": "RELATED_RESOURCE_NOT_FOUND",
  "message": "Ca làm việc không tồn tại"
}
```

---

**Test 4.6: Duplicate shift (slot conflict)**
```bash
POST /api/v1/shifts
Content-Type: application/json

{
  "employee_id": 2,
  "work_date": "2025-11-03",
  "work_shift_id": "WKS_MORNING_01"
}
```
❌ Expected: `409 CONFLICT`
```json
{
  "statusCode": 409,
  "error": "SLOT_CONFLICT",
  "message": "Nhân viên đã có ca làm việc trong thời gian này."
}
```

---

**Test 4.7: Shift on holiday (Christmas)**
```bash
POST /api/v1/shifts
Content-Type: application/json

{
  "employee_id": 2,
  "work_date": "2025-12-25",
  "work_shift_id": "WKS_MORNING_01"
}
```
❌ Expected: `409 CONFLICT`
```json
{
  "statusCode": 409,
  "error": "HOLIDAY_CONFLICT",
  "message": "Không thể tạo ca làm việc vào ngày nghỉ lễ: Christmas"
}
```

---

### 5️⃣ PATCH /api/v1/shifts/{shift_id} - Update Shift

#### ✅ Happy Path Tests

**Test 5.1: Manager updates shift status to COMPLETED**
```bash
PATCH /api/v1/shifts/EMS251101001
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "status": "COMPLETED",
  "notes": "Ca đã hoàn thành đúng giờ"
}
```
✅ Expected: `200 OK`
```json
{
  "statusCode": 200,
  "message": "Cập nhật ca làm việc thành công",
  "data": {
    "employeeShiftId": "EMS251101001",
    "status": "COMPLETED",
    "notes": "Ca đã hoàn thành đúng giờ"
  }
}
```

---

**Test 5.2: Manager changes work_shift_id**
```bash
PATCH /api/v1/shifts/EMS251101002
Content-Type: application/json

{
  "work_shift_id": "WKS_AFTERNOON_02",
  "notes": "Đổi sang ca chiều part-time"
}
```
✅ Expected: `200 OK`

---

**Test 5.3: Manager updates notes only**
```bash
PATCH /api/v1/shifts/EMS251101001
Content-Type: application/json

{
  "notes": "Ghi chú cập nhật"
}
```
✅ Expected: `200 OK`

---

#### ❌ Error Cases

**Test 5.4: Ketoan lacks UPDATE_SHIFTS permission**
```bash
PATCH /api/v1/shifts/EMS251101008
Authorization: Bearer {ketoan_token}
Content-Type: application/json

{
  "notes": "Trying to update"
}
```
❌ Expected: `403 FORBIDDEN`

---

**Test 5.5: Update COMPLETED shift (finalized)**
```bash
PATCH /api/v1/shifts/EMS251101004
Authorization: Bearer {manager_token}
Content-Type: application/json

{
  "status": "SCHEDULED"
}
```
❌ Expected: `409 CONFLICT`
```json
{
  "statusCode": 409,
  "error": "SHIFT_FINALIZED",
  "message": "Không thể cập nhật ca làm đã hoàn thành hoặc đã bị hủy."
}
```

---

**Test 5.6: Update CANCELLED shift (finalized)**
```bash
PATCH /api/v1/shifts/EMS251101006
Content-Type: application/json

{
  "status": "SCHEDULED"
}
```
❌ Expected: `409 CONFLICT` (same as Test 5.5)

---

**Test 5.7: Try to manually set ON_LEAVE status**
```bash
PATCH /api/v1/shifts/EMS251101001
Content-Type: application/json

{
  "status": "ON_LEAVE",
  "notes": "Trying to set ON_LEAVE manually"
}
```
❌ Expected: `400 BAD_REQUEST`
```json
{
  "statusCode": 400,
  "error": "error.invalid.status.transition",
  "message": "Không thể cập nhật thủ công trạng thái thành ON_LEAVE. Vui lòng tạo yêu cầu nghỉ phép."
}
```

---

**Test 5.8: Shift not found**
```bash
PATCH /api/v1/shifts/EMS999999999
Content-Type: application/json

{
  "notes": "Update"
}
```
❌ Expected: `404 NOT_FOUND`

---

### 6️⃣ DELETE /api/v1/shifts/{shift_id} - Cancel Shift

#### ✅ Happy Path Tests

**Test 6.1: Manager cancels SCHEDULED shift**
```bash
DELETE /api/v1/shifts/EMS251101001
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK`
```json
{
  "statusCode": 200,
  "message": "Hủy ca làm việc thành công",
  "data": {
    "employeeShiftId": "EMS251101001",
    "status": "CANCELLED"
  }
}
```

---

**Test 6.2: Manager cancels MANUAL_ENTRY shift**
```bash
DELETE /api/v1/shifts/EMS251101002
Authorization: Bearer {manager_token}
```
✅ Expected: `200 OK`

---

#### ❌ Error Cases

**Test 6.3: Ketoan lacks DELETE_SHIFTS permission**
```bash
DELETE /api/v1/shifts/EMS251101008
Authorization: Bearer {ketoan_token}
```
❌ Expected: `403 FORBIDDEN`

---

**Test 6.4: Try to cancel BATCH_JOB shift**
```bash
DELETE /api/v1/shifts/EMS251101003
Authorization: Bearer {manager_token}
```
❌ Expected: `400 BAD_REQUEST`
```json
{
  "statusCode": 400,
  "error": "CANNOT_CANCEL_BATCH",
  "message": "Không thể hủy ca làm việc được tạo từ batch job. Vui lòng tạo yêu cầu nghỉ phép."
}
```

---

**Test 6.5: Try to cancel COMPLETED shift**
```bash
DELETE /api/v1/shifts/EMS251101004
Authorization: Bearer {manager_token}
```
❌ Expected: `400 BAD_REQUEST`
```json
{
  "statusCode": 400,
  "error": "CANNOT_CANCEL_COMPLETED",
  "message": "Không thể hủy ca làm việc đã hoàn thành."
}
```

---

**Test 6.6: Shift not found**
```bash
DELETE /api/v1/shifts/EMS999999999
Authorization: Bearer {manager_token}
```
❌ Expected: `404 NOT_FOUND`

---

## 📝 Complete Error Code Reference

| Error Code | HTTP Status | Scenario |
|------------|-------------|----------|
| `FORBIDDEN` | 403 | Missing permission or unauthorized access |
| `INVALID_DATE_RANGE` | 400 | Missing start_date or end_date |
| `INVALID_DATE_FORMAT` | 400 | Wrong date format (not YYYY-MM-DD) |
| `SHIFT_NOT_FOUND` | 404 | Shift doesn't exist or no access |
| `RELATED_RESOURCE_NOT_FOUND` | 404 | Employee or WorkShift not found |
| `HOLIDAY_CONFLICT` | 409 | Shift on holiday date |
| `SLOT_CONFLICT` | 409 | Duplicate shift (same employee + date + time) |
| `SHIFT_FINALIZED` | 409 | Update COMPLETED/CANCELLED shift |
| `error.invalid.status.transition` | 400 | Manual ON_LEAVE status change |
| `CANNOT_CANCEL_BATCH` | 400 | Delete BATCH_JOB shift |
| `CANNOT_CANCEL_COMPLETED` | 400 | Delete COMPLETED shift |

---

## 🚀 Quick Start

### 1. Login to get JWT token
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "manager",
  "password": "123456"
}
```

### 2. Use token in subsequent requests
```bash
GET /api/v1/shifts?start_date=2025-11-01&end_date=2025-11-30
Authorization: Bearer {your_access_token}
```

### 3. Test all 6 endpoints systematically
- ✅ Happy paths first
- ❌ Then error cases
- 🔄 Verify permission enforcement

---

## 📊 Testing Checklist

### For FE Developers:
- [ ] Test with `manager` user (full access)
- [ ] Test with `ketoan` user (VIEW_SHIFTS_OWN only)
- [ ] Verify date range filtering
- [ ] Verify status filtering
- [ ] Test all error messages display correctly
- [ ] Test permission-based UI hiding/showing
- [ ] Verify pagination (if implemented)
- [ ] Test Vietnamese error messages

### For BE Developers:
- [ ] All 31 test cases pass
- [ ] All 11 error codes working
- [ ] Permission enforcement correct
- [ ] Business logic validations work
- [ ] Database constraints enforced
- [ ] Transaction rollback on errors
- [ ] Logging captures all errors

---

## 🔗 Related Documentation
- **Task**: BE-307 Employee Shift Management API
- **Branch**: `feat/BE-307-manage-shift-registration-renewal-and-batch-job`
- **Database Schema**: `employee_shifts` table with 9 columns
- **Permissions**: 6 shift-related permissions in `SCHEDULE_MANAGEMENT` module

---

## 💡 Tips for Testing

1. **Use Postman Collections**: Import all test cases into Postman for easy execution
2. **Environment Variables**: Set `{{base_url}}` and `{{token}}` variables
3. **Pre-request Scripts**: Auto-refresh JWT tokens before expiration
4. **Test Data Reset**: Re-run seed data SQL if test data gets corrupted
5. **Sequential Testing**: Run tests in order (happy paths → error cases)
6. **Permission Testing**: Always test with both authorized and unauthorized users

---

**Last Updated**: October 28, 2025  
**API Version**: v1  
**Test Coverage**: 31 test cases, 11 error codes, 6 endpoints
