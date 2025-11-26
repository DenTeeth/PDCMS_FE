# Work Shift API Test Guide

**Base URL:** `http://localhost:8080/api/v1/work-shifts`

**Authentication:** Required (JWT Token in Authorization header)

**Permissions:**
- `VIEW_WORK_SHIFTS` - Read operations
- `CREATE_WORK_SHIFTS` - Create operations
- `UPDATE_WORK_SHIFTS` - Update operations
- `DELETE_WORK_SHIFTS` - Delete operations

---

## Table of Contents
1. [CREATE Operations](#1-create-operations)
2. [READ Operations](#2-read-operations)
3. [UPDATE Operations](#3-update-operations)
4. [DELETE Operations](#4-delete-operations)
5. [REACTIVATE Operations](#5-reactivate-operations)
6. [Error Scenarios](#6-error-scenarios)
7. [Business Rules](#7-business-rules)
8. [Error Codes Reference](#8-error-codes-reference)

---

## 1. CREATE Operations

### Test Case 1.1: Create Morning Shift (NORMAL)
**Endpoint:** `POST /api/v1/work-shifts`

**Request Body:**
```json
{
  "shiftName": "Ca Sáng (4 giờ)",
  "startTime": "08:00",
  "endTime": "12:00"
}
```

**Expected Response:** `201 Created`
```json
{
  "statusCode": 201,
  "error": null,
  "message": "Work shift created successfully",
  "data": {
    "workShiftId": "WKS_MORNING_03",
    "shiftName": "Ca Sáng (4 giờ)",
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 4.0
  }
}
```

**Notes:**
- Category is auto-generated based on time (before 18:00 = NORMAL)
- Shift ID is auto-generated with format `WKS_{TIME_OF_DAY}_{SEQUENCE}`
- Duration excludes lunch break if shift spans 12:00-13:00

---

### Test Case 1.2: Create Night Shift (NIGHT)
**Endpoint:** `POST /api/v1/work-shifts`

**Request Body:**
```json
{
  "shiftName": "Ca Tối (3 giờ)",
  "startTime": "18:00",
  "endTime": "21:00"
}
```

**Expected Response:** `201 Created`
```json
{
  "statusCode": 201,
  "error": null,
  "message": "Work shift created successfully",
  "data": {
    "workShiftId": "WKS_EVENING_01",
    "shiftName": "Ca Tối (3 giờ)",
    "startTime": "18:00:00",
    "endTime": "21:00:00",
    "category": "NIGHT",
    "isActive": true,
    "durationHours": 3.0
  }
}
```

**Notes:**
- Shifts starting at or after 18:00 are automatically categorized as NIGHT
- Minimum duration: 3 hours, Maximum: 8 hours

---

### Test Case 1.3: Create Shift with Lunch Break
**Endpoint:** `POST /api/v1/work-shifts`

**Request Body:**
```json
{
  "shiftName": "Ca Ngày Dài (7 giờ)",
  "startTime": "08:00",
  "endTime": "16:00"
}
```

**Expected Response:** `201 Created`
```json
{
  "statusCode": 201,
  "error": null,
  "message": "Work shift created successfully",
  "data": {
    "workShiftId": "WKS_MORNING_04",
    "shiftName": "Ca Ngày Dài (7 giờ)",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 7.0
  }
}
```

**Notes:**
- Shift spans 08:00-16:00 (8 hours total)
- Lunch break 12:00-13:00 (1 hour) is automatically excluded
- Effective duration: 7.0 hours

---

## 2. READ Operations

### Test Case 2.1: Get All Active Shifts (Default)
**Endpoint:** `GET /api/v1/work-shifts`

**Query Parameters:** None (defaults to `isActive=true`)

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shifts retrieved successfully",
  "data": [
    {
      "workShiftId": "WKS_MORNING_01",
      "shiftName": "Ca Sáng (8h-16h)",
      "startTime": "08:00:00",
      "endTime": "16:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 7.0
    },
    {
      "workShiftId": "WKS_MORNING_02",
      "shiftName": "Ca Part-time Sáng (8h-12h)",
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 4.0
    },
    {
      "workShiftId": "WKS_AFTERNOON_01",
      "shiftName": "Ca Chiều (13h-20h)",
      "startTime": "13:00:00",
      "endTime": "20:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 7.0
    },
    {
      "workShiftId": "WKS_EVENING_01",
      "shiftName": "Ca Tối (3 giờ)",
      "startTime": "18:00:00",
      "endTime": "21:00:00",
      "category": "NIGHT",
      "isActive": true,
      "durationHours": 3.0
    }
  ]
}
```

**Notes:**
- Default sort: `startTime ASC`, then `category ASC` (NORMAL before NIGHT)
- Only returns active shifts (`isActive=true`)

---

### Test Case 2.2: Filter by Category (NORMAL)
**Endpoint:** `GET /api/v1/work-shifts?category=NORMAL`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shifts retrieved successfully",
  "data": [
    {
      "workShiftId": "WKS_MORNING_01",
      "shiftName": "Ca Sáng (8h-16h)",
      "startTime": "08:00:00",
      "endTime": "16:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 7.0
    },
    {
      "workShiftId": "WKS_AFTERNOON_01",
      "shiftName": "Ca Chiều (13h-20h)",
      "startTime": "13:00:00",
      "endTime": "20:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 7.0
    }
  ]
}
```

**Notes:**
- Returns only shifts with `category=NORMAL`
- Valid values: `NORMAL`, `NIGHT`

---

### Test Case 2.3: Filter by Category (NIGHT)
**Endpoint:** `GET /api/v1/work-shifts?category=NIGHT`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shifts retrieved successfully",
  "data": [
    {
      "workShiftId": "WKS_EVENING_01",
      "shiftName": "Ca Tối (3 giờ)",
      "startTime": "18:00:00",
      "endTime": "21:00:00",
      "category": "NIGHT",
      "isActive": true,
      "durationHours": 3.0
    }
  ]
}
```

---

### Test Case 2.4: Search by Shift Name
**Endpoint:** `GET /api/v1/work-shifts?search=sáng`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shifts retrieved successfully",
  "data": [
    {
      "workShiftId": "WKS_MORNING_01",
      "shiftName": "Ca Sáng (8h-16h)",
      "startTime": "08:00:00",
      "endTime": "16:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 7.0
    },
    {
      "workShiftId": "WKS_MORNING_02",
      "shiftName": "Ca Part-time Sáng (8h-12h)",
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 4.0
    }
  ]
}
```

**Notes:**
- Case-insensitive search
- Searches for keyword in shift name
- Can be combined with other filters

---

### Test Case 2.5: Sort by Category
**Endpoint:** `GET /api/v1/work-shifts?sortBy=category&sortDirection=ASC`

**Expected Response:** `200 OK`
- All NORMAL shifts listed first
- Then all NIGHT shifts
- Within same category, sorted by startTime

---

### Test Case 2.6: Sort by Start Time (Descending)
**Endpoint:** `GET /api/v1/work-shifts?sortBy=startTime&sortDirection=DESC`

**Expected Response:** `200 OK`
- Shifts sorted from latest start time to earliest
- Evening shifts appear first, morning shifts last

---

### Test Case 2.7: Combined Filters
**Endpoint:** `GET /api/v1/work-shifts?category=NORMAL&search=sáng&sortBy=startTime&sortDirection=DESC`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shifts retrieved successfully",
  "data": [
    {
      "workShiftId": "WKS_MORNING_01",
      "shiftName": "Ca Sáng (8h-16h)",
      "startTime": "08:00:00",
      "endTime": "16:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 7.0
    },
    {
      "workShiftId": "WKS_MORNING_02",
      "shiftName": "Ca Part-time Sáng (8h-12h)",
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "category": "NORMAL",
      "isActive": true,
      "durationHours": 4.0
    }
  ]
}
```

**Notes:**
- Filters by category=NORMAL
- Searches for "sáng" in name
- Sorts by startTime descending

---

### Test Case 2.8: Get Inactive Shifts
**Endpoint:** `GET /api/v1/work-shifts?isActive=false`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shifts retrieved successfully",
  "data": [
    {
      "workShiftId": "WKS_MORNING_03",
      "shiftName": "Ca Sáng (Đã Xóa)",
      "startTime": "08:00:00",
      "endTime": "12:00:00",
      "category": "NORMAL",
      "isActive": false,
      "durationHours": 4.0
    }
  ]
}
```

**Notes:**
- Returns soft-deleted shifts
- Useful for audit trail or reactivation

---

### Test Case 2.9: Get Single Shift by ID
**Endpoint:** `GET /api/v1/work-shifts/WKS_MORNING_01`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shift retrieved successfully",
  "data": {
    "workShiftId": "WKS_MORNING_01",
    "shiftName": "Ca Sáng (8h-16h)",
    "startTime": "08:00:00",
    "endTime": "16:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 7.0
  }
}
```

---

## 3. UPDATE Operations

### Test Case 3.1: Update Shift Name Only
**Endpoint:** `PATCH /api/v1/work-shifts/WKS_MORNING_03`

**Request Body:**
```json
{
  "shiftName": "Ca Sáng (Đã Cập Nhật)"
}
```

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shift updated successfully",
  "data": {
    "workShiftId": "WKS_MORNING_03",
    "shiftName": "Ca Sáng (Đã Cập Nhật)",
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 4.0
  }
}
```

**Notes:**
- Only name is updated
- Times and category remain unchanged
- No validation triggered for name-only updates

---

### Test Case 3.2: Update Time Within Same Category
**Endpoint:** `PATCH /api/v1/work-shifts/WKS_MORNING_03`

**Request Body:**
```json
{
  "startTime": "09:00",
  "endTime": "13:00"
}
```

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shift updated successfully",
  "data": {
    "workShiftId": "WKS_MORNING_03",
    "shiftName": "Ca Sáng (Đã Cập Nhật)",
    "startTime": "09:00:00",
    "endTime": "13:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 3.0
  }
}
```

**Notes:**
- Time updated from 08:00-12:00 to 09:00-13:00
- Category remains NORMAL (both times are before 18:00)
- Duration recalculated to 3.0 hours
- Lunch break 12:00-13:00 is excluded from duration

---

### Test Case 3.3: Update Time Within Same Time-of-Day
**Endpoint:** `PATCH /api/v1/work-shifts/WKS_MORNING_03`

**Request Body:**
```json
{
  "startTime": "08:30",
  "endTime": "12:30"
}
```

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shift updated successfully",
  "data": {
    "workShiftId": "WKS_MORNING_03",
    "shiftName": "Ca Sáng (Đã Cập Nhật)",
    "startTime": "08:30:00",
    "endTime": "12:30:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 3.5
  }
}
```

**Notes:**
- Start time 08:30 is still in MORNING range (08:00-11:59)
- Time-of-day semantic validation allows this update
- Duration calculated: 4 hours - 0.5 hour lunch break = 3.5 hours

---

## 4. DELETE Operations

### Test Case 4.1: Delete Unused Shift (Soft Delete)
**Endpoint:** `DELETE /api/v1/work-shifts/WKS_MORNING_03`

**Expected Response:** `204 No Content`

**Verification:**
```bash
# Shift should now have isActive=false
GET /api/v1/work-shifts?isActive=false
```

**Notes:**
- Soft delete: shifts are not permanently removed
- `isActive` flag set to `false`
- Shift can be reactivated later
- Only allowed if shift is not in use

---

### Test Case 4.2: Try to Delete Shift In Use
**Endpoint:** `DELETE /api/v1/work-shifts/WKS_MORNING_01`

**Expected Response:** `409 Conflict`
```json
{
  "statusCode": 409,
  "error": "SHIFT_IN_USE",
  "message": "Không thể thay đổi hoặc xóa ca làm việc 'WKS_MORNING_01' vì ca này đang được sử dụng bởi 11 lịch làm việc. Vui lòng xóa hoặc thay đổi các lịch làm việc/đăng ký liên quan trước.",
  "data": null
}
```

**Notes:**
- System checks both `employee_shifts` and `employee_shift_registrations`
- Shows exact count of schedules using this shift
- Prevents accidental deletion of active shifts

---

## 5. REACTIVATE Operations

### Test Case 5.1: Reactivate Deleted Shift
**Endpoint:** `PUT /api/v1/work-shifts/WKS_MORNING_03/reactivate`

**Expected Response:** `200 OK`
```json
{
  "statusCode": 200,
  "error": null,
  "message": "Work shift reactivated successfully",
  "data": {
    "workShiftId": "WKS_MORNING_03",
    "shiftName": "Ca Sáng (Đã Cập Nhật)",
    "startTime": "08:00:00",
    "endTime": "12:00:00",
    "category": "NORMAL",
    "isActive": true,
    "durationHours": 4.0
  }
}
```

**Notes:**
- Changes `isActive` from `false` to `true`
- Shift becomes available for scheduling again
- All other properties remain unchanged

---

## 6. ERROR SCENARIOS

### Test Case 6.1: Invalid Time Range - Spanning 18:00 Boundary
**Endpoint:** `POST /api/v1/work-shifts`

**Request Body:**
```json
{
  "shiftName": "Ca Chiều Kéo Dài",
  "startTime": "13:00",
  "endTime": "21:00"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "error": "INVALID_CATEGORY",
  "message": "Ca làm việc không được vượt qua ranh giới 18:00. Ca của bạn: 13:00 - 21:00. Vui lòng tạo ca THƯỜNG (kết thúc trước hoặc đúng 18:00) hoặc ca ĐÊM (bắt đầu từ 18:00 trở đi).",
  "data": null
}
```

**Notes:**
- Shifts cannot span across the 18:00 boundary
- Must be either fully NORMAL (ends ≤ 18:00) or fully NIGHT (starts ≥ 18:00)
- Prevents ambiguous shift categorization

---

### Test Case 6.2: Invalid Duration - Too Short
**Endpoint:** `POST /api/v1/work-shifts`

**Request Body:**
```json
{
  "shiftName": "Ca Ngắn",
  "startTime": "08:00",
  "endTime": "10:00"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "error": "INVALID_DURATION",
  "message": "Thời lượng ca làm việc phải từ 3 đến 8 giờ. Thực tế: 2.0 giờ",
  "data": null
}
```

**Notes:**
- Minimum duration: 3 hours
- Maximum duration: 8 hours
- Duration is calculated after excluding lunch break

---

### Test Case 6.3: Invalid Duration - Too Long
**Endpoint:** `POST /api/v1/work-shifts`

**Request Body:**
```json
{
  "shiftName": "Ca Dài Quá",
  "startTime": "08:00",
  "endTime": "18:00"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "error": "INVALID_DURATION",
  "message": "Thời lượng ca làm việc phải từ 3 đến 8 giờ. Thực tế: 9.0 giờ",
  "data": null
}
```

**Notes:**
- 08:00-18:00 = 10 hours - 1 hour lunch = 9 hours
- Exceeds maximum of 8 hours

---

### Test Case 6.4: Category Change Forbidden (NORMAL to NIGHT)
**Endpoint:** `PATCH /api/v1/work-shifts/WKS_MORNING_03`

**Request Body:**
```json
{
  "startTime": "18:00",
  "endTime": "21:00"
}
```

**Expected Response:** `409 Conflict`
```json
{
  "statusCode": 409,
  "error": "CATEGORY_CHANGE_FORBIDDEN",
  "message": "Không thể thay đổi ca từ NORMAL sang NIGHT vì sẽ không khớp với mã ca làm việc 'WKS_MORNING_03'. Vui lòng tạo ca làm việc mới thay vì cập nhật ca hiện tại.",
  "data": null
}
```

**Notes:**
- Prevents changing NORMAL shifts to NIGHT (and vice versa)
- Maintains semantic consistency with shift ID
- Suggests creating a new shift instead

---

### Test Case 6.5: Time-of-Day Mismatch (MORNING ID with Afternoon Time)
**Endpoint:** `PATCH /api/v1/work-shifts/WKS_MORNING_03`

**Request Body:**
```json
{
  "startTime": "13:00",
  "endTime": "16:00"
}
```

**Expected Response:** `409 Conflict`
```json
{
  "statusCode": 409,
  "error": "TIME_OF_DAY_MISMATCH",
  "message": "Không thể cập nhật ca làm việc 'WKS_MORNING_03' vì thời gian mới (AFTERNOON) không khớp với thời gian được định nghĩa trong mã ca (MORNING). Ví dụ: ca có mã WKS_MORNING_* chỉ được có giờ bắt đầu từ 08:00-11:59, WKS_AFTERNOON_* từ 12:00-17:59, WKS_EVENING_* từ 18:00-20:59.",
  "data": null
}
```

**Notes:**
- Prevents updating shift times that conflict with shift ID prefix
- WKS_MORNING_* must have start time 08:00-11:59
- WKS_AFTERNOON_* must have start time 12:00-17:59
- WKS_EVENING_* must have start time 18:00-20:59

---

### Test Case 6.6: Shift In Use - Cannot Update
**Endpoint:** `PATCH /api/v1/work-shifts/WKS_MORNING_01`

**Request Body:**
```json
{
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Expected Response:** `409 Conflict`
```json
{
  "statusCode": 409,
  "error": "SHIFT_IN_USE",
  "message": "Không thể thay đổi hoặc xóa ca làm việc 'WKS_MORNING_01' vì ca này đang được sử dụng bởi 11 lịch làm việc. Vui lòng xóa hoặc thay đổi các lịch làm việc/đăng ký liên quan trước.",
  "data": null
}
```

**Notes:**
- Prevents updating time range when shift is assigned to employees
- Name-only updates are still allowed
- Checks both `employee_shifts` and `employee_shift_registrations`

---

### Test Case 6.7: Work Shift Not Found
**Endpoint:** `GET /api/v1/work-shifts/INVALID_ID_123`

**Expected Response:** `404 Not Found`
```json
{
  "statusCode": 404,
  "error": "WORK_SHIFT_NOT_FOUND",
  "message": "Không tìm thấy ca làm việc với mã: 'INVALID_ID_123'. Vui lòng kiểm tra lại mã ca làm việc hoặc danh sách ca làm việc hiện có.",
  "data": null
}
```

**Notes:**
- Returned when shift ID doesn't exist
- Also applies to UPDATE, DELETE, and REACTIVATE operations

---

## 7. BUSINESS RULES

### 7.1 Shift ID Generation
- **Format:** `WKS_{TIME_OF_DAY}_{SEQUENCE}`
- **Examples:** `WKS_MORNING_01`, `WKS_AFTERNOON_02`, `WKS_EVENING_03`
- **Time-of-Day Categories:**
  - `MORNING`: Start time 08:00-11:59
  - `AFTERNOON`: Start time 12:00-17:59
  - `EVENING`: Start time 18:00-20:59
- **Sequence:** Auto-incremented per time-of-day category

### 7.2 Category Auto-Generation
- **NORMAL:** Start time < 18:00 AND end time ≤ 18:00
- **NIGHT:** Start time ≥ 18:00
- **Not Allowed:** Shifts spanning across 18:00 boundary

### 7.3 Duration Calculation
- **Formula:** `endTime - startTime - lunchBreakDuration`
- **Lunch Break:** 12:00-13:00 (1 hour)
- **Lunch Break Applied:** Only if shift spans 12:00-13:00
- **Minimum:** 3 hours (after lunch break deduction)
- **Maximum:** 8 hours (after lunch break deduction)

### 7.4 Time-of-Day Semantic Validation
- **WKS_MORNING_*:** Must have start time 08:00-11:59
- **WKS_AFTERNOON_*:** Must have start time 12:00-17:59
- **WKS_EVENING_*:** Must have start time 18:00-20:59
- **Purpose:** Maintains consistency between shift ID and actual shift hours

### 7.5 Category Change Prevention
- **NORMAL ↔ NIGHT:** Not allowed
- **Reason:** Would create semantic mismatch with shift ID
- **Solution:** Create a new shift instead of updating existing one

### 7.6 Clinic Operating Hours
- **Open:** 08:00
- **Close:** 21:00
- **All shifts must be within:** 08:00-21:00

### 7.7 In-Use Protection
- **Prevents:** Updating time range or deleting shifts that are in use
- **Checks:**
  - `employee_shifts` table (full-time schedules)
  - `employee_shift_registrations` table (part-time registrations)
- **Allowed When In Use:** Name-only updates
- **Not Allowed When In Use:** Time updates, deletions

### 7.8 Soft Delete
- **Method:** Set `isActive = false`
- **Benefits:** Preserves audit trail, allows reactivation
- **Recovery:** Use reactivate endpoint to restore

---

## 8. ERROR CODES REFERENCE

| Error Code | HTTP Status | Description | When It Occurs |
|-----------|-------------|-------------|----------------|
| `INVALID_TIME_RANGE` | 400 Bad Request | Shift spans 18:00 boundary | Creating/updating shift with startTime < 18:00 AND endTime > 18:00 |
| `INVALID_DURATION` | 400 Bad Request | Duration not between 3-8 hours | Creating/updating shift with duration < 3 or > 8 hours |
| `INVALID_CATEGORY` | 400 Bad Request | Invalid category value | Creating/updating shift with invalid category |
| `CATEGORY_CHANGE_FORBIDDEN` | 409 Conflict | Attempting to change NORMAL ↔ NIGHT | Updating shift time that changes category |
| `TIME_OF_DAY_MISMATCH` | 409 Conflict | Start time doesn't match shift ID prefix | Updating WKS_MORNING_* to afternoon/evening hours |
| `SHIFT_IN_USE` | 409 Conflict | Shift is assigned to employees | Updating/deleting shift with existing schedules |
| `WORK_SHIFT_NOT_FOUND` | 404 Not Found | Shift ID doesn't exist | Any operation with invalid shift ID |
| `DUPLICATE_SHIFT_CODE` | 409 Conflict | Shift ID already exists | Auto-generated IDs prevent this (rare) |

---

## 9. QUERY PARAMETERS REFERENCE

### GET /api/v1/work-shifts

| Parameter | Type | Valid Values | Default | Description |
|-----------|------|--------------|---------|-------------|
| `category` | String | `NORMAL`, `NIGHT` | None | Filter by shift category |
| `isActive` | Boolean | `true`, `false` | `true` | Filter by active status |
| `search` | String | Any text | None | Case-insensitive search in shift name |
| `sortBy` | String | `startTime`, `category` | `startTime` | Field to sort by |
| `sortDirection` | String | `ASC`, `DESC` | `ASC` | Sort direction |

### Combining Parameters
```
GET /api/v1/work-shifts?category=NORMAL&search=sáng&sortBy=startTime&sortDirection=DESC&isActive=true
```

---

## 10. TESTING CHECKLIST

###  CRUD Operations
- [ ] Create morning shift (NORMAL)
- [ ] Create night shift (NIGHT)
- [ ] Create shift with lunch break
- [ ] Get all active shifts
- [ ] Get single shift by ID
- [ ] Update shift name only
- [ ] Update shift times within same category
- [ ] Delete unused shift
- [ ] Reactivate deleted shift

###  Validations
- [ ] Boundary validation (18:00 spanning)
- [ ] Duration validation (too short)
- [ ] Duration validation (too long)
- [ ] Category change prevention (NORMAL → NIGHT)
- [ ] Category change prevention (NIGHT → NORMAL)
- [ ] Time-of-day mismatch (MORNING ID with afternoon time)
- [ ] Time-of-day mismatch (AFTERNOON ID with evening time)
- [ ] In-use protection (update)
- [ ] In-use protection (delete)
- [ ] Work shift not found (404)

###  Filtering & Sorting
- [ ] Filter by category (NORMAL)
- [ ] Filter by category (NIGHT)
- [ ] Filter by isActive (true)
- [ ] Filter by isActive (false)
- [ ] Search by shift name
- [ ] Sort by startTime (ASC)
- [ ] Sort by startTime (DESC)
- [ ] Sort by category
- [ ] Combined filters (category + search + sort)

###  Business Rules
- [ ] Lunch break deduction (12:00-13:00)
- [ ] Shift ID auto-generation
- [ ] Category auto-generation
- [ ] Duration calculation
- [ ] Time-of-day semantic consistency
- [ ] Soft delete functionality

---

## 11. PERFORMANCE NOTES

- **Response Time:** < 100ms for most operations
- **Pagination:** Not implemented (returns full result set)
- **Indexes:** Applied on `startTime` and `category` for fast filtering/sorting
- **Database Queries:** Optimized with Specifications for dynamic filtering

---

## 12. COMMON ISSUES & SOLUTIONS

### Issue 1: "Cannot update shift - already in use"
**Cause:** Shift is assigned to employee schedules  
**Solution:** Either:
- Remove employee schedules first
- Update only the shift name (allowed)
- Create a new shift instead

### Issue 2: "Time-of-day mismatch error"
**Cause:** Trying to update shift time to different time-of-day  
**Solution:** 
- Keep updates within same time-of-day range
- Or create a new shift with correct time-of-day prefix

### Issue 3: "Category change forbidden"
**Cause:** Update would change category from NORMAL to NIGHT  
**Solution:** Create a new shift instead of updating

### Issue 4: "Invalid duration"
**Cause:** Shift duration < 3 hours or > 8 hours after lunch break  
**Solution:** 
- Adjust time range to meet duration requirements
- Remember lunch break is deducted automatically

---

## 13. AUTHORIZATION & PERMISSIONS

### Required Permissions by Operation

| Operation | Required Permission |
|-----------|-------------------|
| GET /api/v1/work-shifts | `VIEW_WORK_SHIFTS` |
| GET /api/v1/work-shifts/{id} | `VIEW_WORK_SHIFTS` |
| POST /api/v1/work-shifts | `CREATE_WORK_SHIFTS` |
| PATCH /api/v1/work-shifts/{id} | `UPDATE_WORK_SHIFTS` |
| DELETE /api/v1/work-shifts/{id} | `DELETE_WORK_SHIFTS` |
| PUT /api/v1/work-shifts/{id}/reactivate | `UPDATE_WORK_SHIFTS` |

### Testing with Postman
```bash
# Add JWT token to Authorization header
Authorization: Bearer <your_jwt_token>
```

---

## 14. REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-29 | Initial version with comprehensive test cases |
| 1.1 | 2025-10-29 | Added category change prevention validation |
| 1.2 | 2025-10-29 | Added time-of-day semantic validation |
| 1.3 | 2025-10-29 | Updated error responses with standardized codes |

---

**End of Work Shift API Test Guide**

For questions or issues, contact the backend development team.
