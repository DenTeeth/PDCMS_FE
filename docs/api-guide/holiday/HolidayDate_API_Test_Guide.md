# API Testing Guide - Holiday Date Management

## Overview

This guide provides comprehensive testing instructions for the Holiday Date Management API, used by the shift scheduling system to skip holidays when generating employee shifts.

---

## Base URL

```
http://localhost:8080/api/v1/holidays
```

---

## Authentication

All requests require JWT Bearer Token:

```
Authorization: Bearer <your_jwt_token>
```

---

## RBAC Permissions

| Permission       | Description           |
| ---------------- | --------------------- |
| `VIEW_HOLIDAY`   | Xem danh sách ngày lễ |
| `CREATE_HOLIDAY` | Tạo ngày lễ mới       |
| `UPDATE_HOLIDAY` | Cập nhật ngày lễ      |
| `DELETE_HOLIDAY` | Xóa ngày lễ           |

---

## Holiday Date Entity Structure

```json
{
  "holidayId": 1,
  "holidayDate": "2025-01-01",
  "holidayName": "Tết Dương lịch",
  "year": 2025,
  "description": "Ngày Tết Dương lịch 01/01/2025",
  "createdAt": "2025-01-01T00:00:00",
  "updatedAt": "2025-01-01T00:00:00"
}
```

---

## Test Cases

### STEP 1: View Holiday Dates

#### Test Case 1.1: Get All Holidays for Current Year

**Objective:** View all holidays for scheduling reference

**Request:**

```bash
GET /api/v1/holidays?year=2025&page=0&size=50&sort=holidayDate,asc
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "content": [
    {
      "holidayId": 1,
      "holidayDate": "2025-01-01",
      "holidayName": "Tết Dương lịch",
      "year": 2025,
      "description": "Ngày Tết Dương lịch 01/01/2025"
    },
    {
      "holidayId": 2,
      "holidayDate": "2025-01-28",
      "holidayName": "Tết Nguyên đán (30 Tết)",
      "year": 2025,
      "description": "Ngày 30 Tết Âm lịch năm 2025"
    },
    {
      "holidayId": 3,
      "holidayDate": "2025-01-29",
      "holidayName": "Tết Nguyên đán (Mùng 1)",
      "year": 2025,
      "description": "Mùng 1 Tết Nguyên đán năm 2025"
    },
    {
      "holidayId": 4,
      "holidayDate": "2025-01-30",
      "holidayName": "Tết Nguyên đán (Mùng 2)",
      "year": 2025,
      "description": "Mùng 2 Tết Nguyên đán năm 2025"
    },
    {
      "holidayId": 5,
      "holidayDate": "2025-01-31",
      "holidayName": "Tết Nguyên đán (Mùng 3)",
      "year": 2025,
      "description": "Mùng 3 Tết Nguyên đán năm 2025"
    },
    {
      "holidayId": 6,
      "holidayDate": "2025-02-01",
      "holidayName": "Tết Nguyên đán (Mùng 4)",
      "year": 2025,
      "description": "Mùng 4 Tết Nguyên đán năm 2025"
    },
    {
      "holidayId": 7,
      "holidayDate": "2025-04-07",
      "holidayName": "Giỗ Tổ Hùng Vương",
      "year": 2025,
      "description": "Giỗ Tổ Hùng Vương 10/3 Âm lịch năm 2025"
    },
    {
      "holidayId": 8,
      "holidayDate": "2025-04-30",
      "holidayName": "Ngày Giải phóng miền Nam",
      "year": 2025,
      "description": "Ngày Chiến thắng 30/04/1975"
    },
    {
      "holidayId": 9,
      "holidayDate": "2025-05-01",
      "holidayName": "Ngày Quốc tế Lao động",
      "year": 2025,
      "description": "Ngày Quốc tế Lao động 01/05"
    },
    {
      "holidayId": 10,
      "holidayDate": "2025-09-01",
      "holidayName": "Ngày nghỉ liền kề Quốc khánh",
      "year": 2025,
      "description": "Ngày nghỉ bù cho Quốc khánh"
    },
    {
      "holidayId": 11,
      "holidayDate": "2025-09-02",
      "holidayName": "Ngày Quốc khánh",
      "year": 2025,
      "description": "Quốc khánh nước Cộng hoà Xã hội chủ nghĩa Việt Nam"
    },
    {
      "holidayId": 12,
      "holidayDate": "2025-12-25",
      "holidayName": "Lễ Giáng sinh",
      "year": 2025,
      "description": "Ngày lễ Giáng sinh (Christmas)"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 50
  },
  "totalElements": 12,
  "totalPages": 1
}
```

**Validation:**

-  Returns all holidays for 2025
-  Sorted by holidayDate ascending
-  Includes Vietnamese national holidays

---

#### Test Case 1.2: Get Holidays by Date Range

**Objective:** Get holidays within specific date range for scheduling

**Request:**

```bash
GET /api/v1/holidays?startDate=2025-01-01&endDate=2025-02-28
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "content": [
    {
      "holidayId": 1,
      "holidayDate": "2025-01-01",
      "holidayName": "Tết Dương lịch",
      "year": 2025
    },
    {
      "holidayId": 2,
      "holidayDate": "2025-01-28",
      "holidayName": "Tết Nguyên đán (30 Tết)",
      "year": 2025
    },
    {
      "holidayId": 3,
      "holidayDate": "2025-01-29",
      "holidayName": "Tết Nguyên đán (Mùng 1)",
      "year": 2025
    },
    {
      "holidayId": 4,
      "holidayDate": "2025-01-30",
      "holidayName": "Tết Nguyên đán (Mùng 2)",
      "year": 2025
    },
    {
      "holidayId": 5,
      "holidayDate": "2025-01-31",
      "holidayName": "Tết Nguyên đán (Mùng 3)",
      "year": 2025
    },
    {
      "holidayId": 6,
      "holidayDate": "2025-02-01",
      "holidayName": "Tết Nguyên đán (Mùng 4)",
      "year": 2025
    }
  ],
  "totalElements": 6
}
```

**Validation:**

-  Returns only holidays between startDate and endDate
-  Useful for batch job date range queries

---

#### Test Case 1.3: Get Holiday by ID

**Objective:** View detailed information of specific holiday

**Request:**

```bash
GET /api/v1/holidays/1
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "holidayId": 1,
  "holidayDate": "2025-01-01",
  "holidayName": "Tết Dương lịch",
  "year": 2025,
  "description": "Ngày Tết Dương lịch 01/01/2025",
  "createdAt": "2025-01-01T00:00:00",
  "updatedAt": "2025-01-01T00:00:00"
}
```

---

#### Test Case 1.4: Check if Date is Holiday

**Objective:** Quick check if a specific date is a holiday

**Request:**

```bash
GET /api/v1/holidays/check?date=2025-01-29
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "isHoliday": true,
  "holidayDate": "2025-01-29",
  "holidayName": "Tết Nguyên đán (Mùng 1)",
  "year": 2025
}
```

---

#### Test Case 1.5: Check Non-Holiday Date

**Objective:** Verify non-holiday date returns false

**Request:**

```bash
GET /api/v1/holidays/check?date=2025-10-23
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "isHoliday": false,
  "holidayDate": "2025-10-23",
  "holidayName": null,
  "year": 2025
}
```

---

### STEP 2: Create Holiday Dates

#### Test Case 2.1: Successfully Create New Holiday

**Objective:** Admin creates a new holiday date

**Prerequisites:**

- Login as user with `CREATE_HOLIDAY` permission
- Date must not already exist

**Request:**

```bash
POST /api/v1/holidays
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-10-31",
  "holidayName": "Halloween Company Event",
  "year": 2025,
  "description": "Sự kiện Halloween của công ty - nghỉ 1 ngày"
}
```

**Expected Response:** `201 CREATED`

```json
{
  "holidayId": 13,
  "holidayDate": "2025-10-31",
  "holidayName": "Halloween Company Event",
  "year": 2025,
  "description": "Sự kiện Halloween của công ty - nghỉ 1 ngày",
  "createdAt": "2025-10-20T13:00:00",
  "updatedAt": "2025-10-20T13:00:00"
}
```

**Validation:**

-  Returns 201 Created
-  holidayId auto-generated
-  All fields saved correctly

---

#### Test Case 2.2: Create Multiple Holidays (Bulk Import)

**Objective:** Create multiple holidays in one request (for annual setup)

**Request:**

```bash
POST /api/v1/holidays/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidays": [
    {
      "holidayDate": "2026-01-01",
      "holidayName": "Tết Dương lịch 2026",
      "year": 2026,
      "description": "Ngày Tết Dương lịch năm 2026"
    },
    {
      "holidayDate": "2026-02-16",
      "holidayName": "Tết Nguyên đán 2026 (30 Tết)",
      "year": 2026,
      "description": "Ngày 30 Tết Âm lịch năm 2026"
    },
    {
      "holidayDate": "2026-02-17",
      "holidayName": "Tết Nguyên đán 2026 (Mùng 1)",
      "year": 2026,
      "description": "Mùng 1 Tết Nguyên đán năm 2026"
    }
  ]
}
```

**Expected Response:** `201 CREATED`

```json
{
  "createdCount": 3,
  "holidays": [
    {
      "holidayId": 14,
      "holidayDate": "2026-01-01",
      "holidayName": "Tết Dương lịch 2026",
      "year": 2026
    },
    {
      "holidayId": 15,
      "holidayDate": "2026-02-16",
      "holidayName": "Tết Nguyên đán 2026 (30 Tết)",
      "year": 2026
    },
    {
      "holidayId": 16,
      "holidayDate": "2026-02-17",
      "holidayName": "Tết Nguyên đán 2026 (Mùng 1)",
      "year": 2026
    }
  ]
}
```

**Validation:**

-  All holidays created in single transaction
-  Returns count and created records

---

#### Test Case 2.3: Validation Error - Duplicate Holiday Date

**Objective:** Test uniqueness constraint on holidayDate

**Request:**

```bash
POST /api/v1/holidays
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-01-01",
  "holidayName": "Duplicate New Year",
  "year": 2025,
  "description": "This will fail"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Holiday already exists for date: 2025-01-01",
  "timestamp": "2025-10-20T13:05:00"
}
```

---

#### Test Case 2.4: Validation Error - Missing Required Fields

**Objective:** Test validation for required fields

**Request:**

```bash
POST /api/v1/holidays
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "",
  "holidayName": "",
  "year": null
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "errors": [
    {
      "field": "holidayDate",
      "message": "holidayDate is required"
    },
    {
      "field": "holidayName",
      "message": "holidayName is required"
    },
    {
      "field": "year",
      "message": "year is required"
    }
  ],
  "timestamp": "2025-10-20T13:10:00"
}
```

---

#### Test Case 2.5: Validation Error - Year Mismatch

**Objective:** Test validation that year matches date's year

**Request:**

```bash
POST /api/v1/holidays
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-12-25",
  "holidayName": "Christmas",
  "year": 2026,
  "description": "Year mismatch test"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Year field (2026) does not match year in holidayDate (2025)",
  "timestamp": "2025-10-20T13:12:00"
}
```

---

#### Test Case 2.6: Forbidden - No CREATE Permission

**Objective:** Regular employee tries to create holiday

**Request:**

```bash
POST /api/v1/holidays
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "holidayDate": "2025-11-01",
  "holidayName": "Test Holiday",
  "year": 2025
}
```

**Expected Response:** `403 FORBIDDEN`

```json
{
  "status": 403,
  "message": "Access Denied",
  "timestamp": "2025-10-20T13:15:00"
}
```

---

### STEP 3: Update Holiday Dates

#### Test Case 3.1: Successfully Update Holiday

**Objective:** Admin updates existing holiday information

**Prerequisites:**

- Login as user with `UPDATE_HOLIDAY` permission

**Request:**

```bash
PUT /api/v1/holidays/13
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-10-31",
  "holidayName": "Halloween Company Event (Updated)",
  "year": 2025,
  "description": "Sự kiện Halloween của công ty - nghỉ cả ngày, có hoạt động team building"
}
```

**Expected Response:** `200 OK`

```json
{
  "holidayId": 13,
  "holidayDate": "2025-10-31",
  "holidayName": "Halloween Company Event (Updated)",
  "year": 2025,
  "description": "Sự kiện Halloween của công ty - nghỉ cả ngày, có hoạt động team building",
  "updatedAt": "2025-10-20T13:20:00"
}
```

**Validation:**

-  All fields updated
-  updatedAt timestamp changed
-  holidayId remains unchanged

---

#### Test Case 3.2: Update - Change Holiday Date

**Objective:** Change the actual date of a holiday

**Request:**

```bash
PUT /api/v1/holidays/7
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-04-08",
  "holidayName": "Giỗ Tổ Hùng Vương (Updated)",
  "year": 2025,
  "description": "Ngày Giỗ Tổ Hùng Vương được điều chỉnh"
}
```

**Expected Response:** `200 OK`

**Validation:**

-  holidayDate changed from 2025-04-07 to 2025-04-08
-  New date must not conflict with existing holidays

---

#### Test Case 3.3: Error - Update to Duplicate Date

**Objective:** Try to update holiday to a date that already exists

**Request:**

```bash
PUT /api/v1/holidays/13
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-01-01",
  "holidayName": "Test",
  "year": 2025,
  "description": "This will fail"
}
```

**Expected Response:** `400 BAD REQUEST`

```json
{
  "status": 400,
  "message": "Another holiday already exists for date: 2025-01-01",
  "timestamp": "2025-10-20T13:25:00"
}
```

---

#### Test Case 3.4: Error - Update Non-Existent Holiday

**Objective:** Try to update a holiday that doesn't exist

**Request:**

```bash
PUT /api/v1/holidays/999
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "holidayDate": "2025-11-15",
  "holidayName": "Test",
  "year": 2025
}
```

**Expected Response:** `404 NOT FOUND`

```json
{
  "status": 404,
  "message": "Holiday not found with ID: 999",
  "timestamp": "2025-10-20T13:30:00"
}
```

---

### STEP 4: Delete Holiday Dates

#### Test Case 4.1: Successfully Delete Holiday

**Objective:** Admin deletes a holiday (hard delete)

**Prerequisites:**

- Login as user with `DELETE_HOLIDAY` permission
- Holiday should not be referenced by existing employee shifts

**Request:**

```bash
DELETE /api/v1/holidays/13
Authorization: Bearer <admin_token>
```

**Expected Response:** `200 OK`

```json
{
  "message": "Holiday deleted successfully",
  "holidayId": 13,
  "holidayDate": "2025-10-31"
}
```

**Validation:**

-  Holiday permanently deleted from database
-  No longer appears in any queries

---

#### Test Case 4.2: Error - Delete Non-Existent Holiday

**Objective:** Try to delete a holiday that doesn't exist

**Request:**

```bash
DELETE /api/v1/holidays/999
Authorization: Bearer <admin_token>
```

**Expected Response:** `404 NOT FOUND`

```json
{
  "status": 404,
  "message": "Holiday not found with ID: 999",
  "timestamp": "2025-10-20T13:35:00"
}
```

---

#### Test Case 4.3: Forbidden - No DELETE Permission

**Objective:** Regular employee tries to delete holiday

**Request:**

```bash
DELETE /api/v1/holidays/13
Authorization: Bearer <employee_token>
```

**Expected Response:** `403 FORBIDDEN`

```json
{
  "status": 403,
  "message": "Access Denied",
  "timestamp": "2025-10-20T13:40:00"
}
```

---

### STEP 5: Integration with Scheduled Jobs

#### Test Case 5.1: Monthly Full-Time Schedule Job - Holiday Skip

**Objective:** Verify that MonthlyFullTimeScheduleJob skips holidays

**Scenario:**

1. Create holiday for 2025-11-20
2. Wait for monthly batch job to run (or trigger manually)
3. Check employee_shifts table

**Verification:**

```sql
SELECT * FROM employee_shifts
WHERE work_date = '2025-11-20'
AND source = 'BATCH_JOB';
```

**Expected Result:**

- No shifts created for 2025-11-20
- Job logs show "Skipped holiday: 2025-11-20"

---

#### Test Case 5.2: Weekly Part-Time Schedule Job - Holiday Skip

**Objective:** Verify that WeeklyPartTimeScheduleJob skips holidays

**Scenario:**

1. Employee has registration for Monday shifts
2. Create holiday for next Monday
3. Wait for weekly job to run

**Verification:**

```sql
SELECT * FROM employee_shifts
WHERE work_date = '<next_monday>'
AND source = 'REGISTRATION_JOB';
```

**Expected Result:**

- No shifts created for holiday Monday
- Other days in the week created normally

---

#### Test Case 5.3: Get Upcoming Holidays

**Objective:** Get holidays for the next N days (for UI warnings)

**Request:**

```bash
GET /api/v1/holidays/upcoming?days=30
Authorization: Bearer <token>
```

**Expected Response:** `200 OK`

```json
{
  "currentDate": "2025-10-20",
  "upcomingDays": 30,
  "holidays": [
    {
      "holidayId": 12,
      "holidayDate": "2025-12-25",
      "holidayName": "Lễ Giáng sinh",
      "daysUntil": 66
    }
  ]
}
```

**Validation:**

-  Returns holidays within next 30 days from current date
-  Includes daysUntil calculation

---

## Error Responses Reference

| Status Code | Message                           | Cause                         |
| ----------- | --------------------------------- | ----------------------------- |
| 400         | "holidayDate is required"         | Missing required field        |
| 400         | "Holiday already exists for date" | Duplicate holidayDate         |
| 400         | "Year mismatch"                   | year field doesn't match date |
| 403         | "Access Denied"                   | Missing required permission   |
| 404         | "Holiday not found"               | Invalid holidayId             |

---

## Business Rules

1. **Date Uniqueness:**

   - `holidayDate` must be unique across all holidays
   - Cannot have two holidays on the same date
   - System-wide constraint

2. **Year Consistency:**

   - `year` field must match the year in `holidayDate`
   - Validated on create and update
   - Used for efficient filtering

3. **Scheduling Impact:**

   - Holidays are automatically skipped by batch jobs
   - MonthlyFullTimeScheduleJob queries holidays for the next month
   - WeeklyPartTimeScheduleJob queries holidays for the next week
   - No manual intervention required

4. **Hard Delete:**

   - DELETE operation permanently removes holiday
   - No soft delete for holidays (unlike time off types)
   - Use with caution

5. **Vietnamese National Holidays:**
   - System pre-loaded with 12 Vietnamese holidays for 2025
   - Based on Vietnamese Labor Law
   - Admin can add company-specific holidays

---

## Integration Notes

1. **Scheduled Jobs:**

   - Jobs call `HolidayDateRepository.findHolidayDatesByRange(startDate, endDate)`
   - Returns `Set<LocalDate>` for efficient contains() checking
   - Holidays are cached during job execution

2. **UI Calendar:**

   - Use `GET /api/v1/holidays?year=YYYY` to populate calendar
   - Mark holiday dates with special styling
   - Show holiday name on hover/click

3. **Shift Creation:**

   - Before creating manual shift, check if date is holiday
   - Use `GET /api/v1/holidays/check?date=YYYY-MM-DD`
   - Show warning to user if creating shift on holiday

4. **Annual Setup:**
   - Use bulk import endpoint at year start
   - Import Vietnamese holidays from official sources
   - Can add company-specific holidays separately

---

## Test Execution Checklist

- [ ] Test VIEW operations (1.1 - 1.5)
- [ ] Test CREATE validations (2.1 - 2.6)
- [ ] Test bulk import (2.2)
- [ ] Test UPDATE operations (3.1 - 3.4)
- [ ] Test DELETE (4.1 - 4.3)
- [ ] Verify holiday skip in batch jobs (5.1 - 5.2)
- [ ] Test upcoming holidays (5.3)
- [ ] Verify all error responses
- [ ] Test date uniqueness constraint
- [ ] Test year consistency validation

---

**Last Updated:** October 22, 2025
**API Version:** v1
**Feature:** Holiday Date Management for Scheduling System
